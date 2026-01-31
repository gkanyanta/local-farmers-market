import crypto from "crypto";

const LENCO_SECRET_KEY = process.env.LENCO_SECRET_KEY || "";
const LENCO_WEBHOOK_SECRET = process.env.LENCO_WEBHOOK_SECRET || "";
const LENCO_BASE_URL = process.env.LENCO_BASE_URL || "https://api.lenco.co";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

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
}

export interface PaymentIntentResponse {
  success: boolean;
  transactionRef?: string;
  checkoutId?: string;
  paymentUrl?: string;
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
 * Create a payment intent with Lenco
 * Adjust this function based on actual Lenco API documentation
 */
export async function createPaymentIntent(
  request: PaymentIntentRequest
): Promise<PaymentIntentResponse> {
  try {
    // Generate a unique transaction reference
    const transactionRef = `LFM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const payload = {
      amount: request.amount,
      currency: request.currency,
      reference: transactionRef,
      customer_name: request.customer.name,
      customer_email: request.customer.email,
      customer_phone: request.customer.phone,
      callback_url: request.callbackUrl,
      return_url: `${APP_BASE_URL}/orders/${request.metadata.orderId}?paid=pending`,
      metadata: request.metadata,
    };

    const response = await fetch(`${LENCO_BASE_URL}/v1/payments/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LENCO_SECRET_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lenco payment initiation failed:", data);
      return {
        success: false,
        error: data.message || "Payment initiation failed",
      };
    }

    // Adjust based on actual Lenco response structure
    return {
      success: true,
      transactionRef: data.reference || transactionRef,
      checkoutId: data.checkout_id || data.id,
      paymentUrl: data.payment_url || data.checkout_url,
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
 * Adjust the signature verification based on Lenco's documentation
 */
export function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): boolean {
  try {
    // Get signature from headers (adjust header name based on Lenco docs)
    const signature = headers["x-lenco-signature"] || headers["lenco-signature"];

    if (!signature || typeof signature !== "string") {
      console.error("Missing webhook signature header");
      return false;
    }

    // Create HMAC signature using webhook secret
    const expectedSignature = crypto
      .createHmac("sha256", LENCO_WEBHOOK_SECRET)
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
 * Adjust parsing based on actual Lenco webhook payload structure
 */
export function parseWebhookEvent(rawBody: string): WebhookEvent | null {
  try {
    const data = JSON.parse(rawBody);

    // Adjust field names based on actual Lenco webhook structure
    return {
      eventId: data.event_id || data.id || crypto.randomUUID(),
      eventType: data.event || data.type || "payment.completed",
      transactionRef: data.reference || data.transaction_ref || data.data?.reference,
      status: mapLencoStatus(data.status || data.data?.status),
      amount: parseFloat(data.amount || data.data?.amount || "0"),
      currency: data.currency || data.data?.currency || "ZMW",
      metadata: data.metadata || data.data?.metadata,
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
  if (["failed", "failure", "declined", "cancelled"].includes(normalizedStatus)) {
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
