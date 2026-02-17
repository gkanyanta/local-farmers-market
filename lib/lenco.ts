import crypto from "crypto";
import { env } from "@/lib/env";

export type MobileOperator = "airtel" | "mtn";

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  metadata: {
    orderId: string;
    orderNumber: string;
  };
  callbackUrl: string;
  mobileOperator?: MobileOperator;
}

export interface PaymentIntentResponse {
  success: boolean;
  transactionRef?: string;
  checkoutId?: string;
  paymentUrl?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  transactionRef: string;
  status: "success" | "failed" | "pending";
  amount: number;
  currency: string;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
  };
  timestamp: string;
}

/**
 * Create a mobile money collection with Lenco (Zambia)
 * Uses the /collections/mobile-money endpoint
 */
export async function createPaymentIntent(
  request: PaymentIntentRequest
): Promise<PaymentIntentResponse> {
  try {
    // Generate a unique transaction reference
    const transactionRef = `LFM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Clean phone number - remove spaces and ensure proper format
    let phone = request.customer.phone.replace(/\s+/g, "");
    // If starts with +260, remove the +
    if (phone.startsWith("+")) {
      phone = phone.substring(1);
    }
    // If starts with 0, replace with 260
    if (phone.startsWith("0")) {
      phone = "260" + phone.substring(1);
    }

    const payload = {
      amount: request.amount,
      reference: transactionRef,
      phone: phone,
      operator: request.mobileOperator || "airtel", // Default to airtel
      country: "zm", // Zambia
      bearer: "customer", // Customer pays the fees
    };

    console.log("Lenco payment request:", { reference: transactionRef, amount: payload.amount, operator: payload.operator });

    const response = await fetch(`${env.LENCO_BASE_URL}/collections/mobile-money`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LENCO_SECRET_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Lenco payment response:", { status: response.status, ref: data.data?.reference, paymentStatus: data.data?.status });

    if (!response.ok) {
      console.error("Lenco payment initiation failed:", { status: response.status, error: data.message || data.error });
      return {
        success: false,
        error: data.message || data.error || "Payment initiation failed",
      };
    }

    // For mobile money, the customer needs to authorize on their phone
    // Status will be "pay-offline" initially
    return {
      success: true,
      transactionRef: data.data?.reference || transactionRef,
      checkoutId: data.data?.id,
      status: data.data?.status || "pay-offline",
      message: "Please authorize the payment on your mobile phone",
    };
  } catch (error) {
    console.error("Lenco payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment initiation failed",
    };
  }
}

/**
 * Verify webhook signature from Lenco
 */
export function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): boolean {
  try {
    // Get signature from headers
    const signature = headers["x-lenco-signature"] || headers["lenco-signature"];

    if (!env.LENCO_WEBHOOK_SECRET) {
      console.error("env.LENCO_WEBHOOK_SECRET is not configured — rejecting webhook");
      return false;
    }

    if (!signature || typeof signature !== "string") {
      console.error("Missing webhook signature header");
      return false;
    }

    // Create HMAC signature using webhook secret
    const expectedSignature = crypto
      .createHmac("sha256", env.LENCO_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    // Compare signatures (timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Parse webhook event from raw body
 */
export function parseWebhookEvent(rawBody: string): WebhookEvent | null {
  try {
    const data = JSON.parse(rawBody);

    // Handle Lenco webhook structure
    const eventData = data.data || data;

    return {
      eventId: data.event_id || data.id || eventData.id || crypto.randomUUID(),
      eventType: data.event || data.type || "collection.completed",
      transactionRef: eventData.reference || data.reference,
      status: mapLencoStatus(eventData.status || data.status),
      amount: parseFloat(eventData.amount || data.amount || "0"),
      currency: eventData.currency || data.currency || "ZMW",
      metadata: eventData.metadata || data.metadata,
      timestamp: data.timestamp || data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to parse webhook event:", error);
    return null;
  }
}

function mapLencoStatus(status: string): "success" | "failed" | "pending" {
  const normalizedStatus = status?.toLowerCase();

  if (["success", "successful", "completed", "paid"].includes(normalizedStatus)) {
    return "success";
  }
  if (["failed", "failure", "declined", "cancelled", "expired"].includes(normalizedStatus)) {
    return "failed";
  }
  return "pending";
}

/**
 * Generate a hash of the raw body for idempotency checks
 */
export function generateBodyHash(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
