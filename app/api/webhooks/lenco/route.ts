import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  generateBodyHash,
} from "@/lib/lenco";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get headers
    const headers: Record<string, string | string[] | undefined> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature
    const isValid = verifyWebhookSignature(headers, rawBody);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = parseWebhookEvent(rawBody);
    if (!event) {
      console.error("Failed to parse webhook event");
      return NextResponse.json(
        { error: "Invalid event format" },
        { status: 400 }
      );
    }

    // Generate body hash for idempotency
    const bodyHash = generateBodyHash(rawBody);

    // Check for duplicate event (idempotency)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.eventId },
    });

    if (existingEvent) {
      console.log(`Duplicate webhook event: ${event.eventId}`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Store webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: "LENCO",
        eventId: event.eventId,
        eventType: event.eventType,
        rawBodyHash: bodyHash,
      },
    });

    // Find payment by transaction reference
    const payment = await prisma.payment.findFirst({
      where: { lencoTransactionRef: event.transactionRef },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for ref: ${event.transactionRef}`);
      // Still acknowledge to prevent retries
      return NextResponse.json({ success: true, message: "Payment not found" });
    }

    // Update payment status
    const paymentStatus = event.status === "success" ? "SUCCEEDED" : "FAILED";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        rawEventJson: JSON.parse(rawBody),
      },
    });

    // Update order status based on payment result
    if (event.status === "success") {
      // Only update if still pending payment
      if (payment.order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
        console.log(`Order ${payment.order.orderNumber} confirmed`);
      }
    } else if (event.status === "failed") {
      // Mark order as cancelled if payment failed
      if (payment.order.status === "PENDING_PAYMENT") {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
        });
        console.log(`Order ${payment.order.orderNumber} cancelled due to failed payment`);
      }
    }

    // Mark webhook as processed
    await prisma.webhookEvent.update({
      where: { eventId: event.eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 to prevent retries for unhandled errors
    return NextResponse.json({ success: false, error: "Processing error" });
  }
}

// Lenco might also send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
