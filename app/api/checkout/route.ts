import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";
import { createPaymentIntent } from "@/lib/lenco";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerPhone,
      pickupOption,
      riderName,
      riderPhone,
      pickupTime,
      pickupNotes,
      mobileOperator,
    } = validation.data;

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate product availability and prices
    const unavailable: string[] = [];
    const priceChanges: string[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) {
        unavailable.push(item.product.name);
      } else if (
        item.product.stockQty !== null &&
        item.product.stockQty < item.qty
      ) {
        unavailable.push(
          `${item.product.name} (only ${item.product.stockQty} available)`
        );
      }

      if (item.priceSnapshot.toNumber() !== item.product.price.toNumber()) {
        priceChanges.push(item.product.name);
      }
    }

    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          error: `Some items are unavailable: ${unavailable.join(", ")}. Please update your cart.`,
        },
        { status: 400 }
      );
    }

    if (priceChanges.length > 0) {
      // Update cart prices to current values
      for (const item of cart.items) {
        if (item.priceSnapshot.toNumber() !== item.product.price.toNumber()) {
          await prisma.cartItem.update({
            where: { id: item.id },
            data: { priceSnapshot: item.product.price },
          });
        }
      }

      return NextResponse.json(
        {
          error: `Prices have changed for: ${priceChanges.join(", ")}. Your cart has been updated — please review and try again.`,
        },
        { status: 409 }
      );
    }

    // Get settings for minimum order validation
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    const minOrderValue = settings?.minOrderValue.toNumber() || 200;

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.priceSnapshot.toNumber() * item.qty,
      0
    );

    if (subtotal < minOrderValue) {
      return NextResponse.json(
        { error: `Minimum order value is K${minOrderValue}` },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with PENDING_PAYMENT status
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        customerName,
        customerPhone,
        subtotal,
        pickupOption,
        riderName,
        riderPhone,
        pickupTime,
        pickupNotes,
        status: "PENDING_PAYMENT",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            nameSnapshot: item.product.name,
            unitSnapshot: item.product.unit,
            priceSnapshot: item.priceSnapshot,
            qty: item.qty,
          })),
        },
      },
    });

    // Create payment intent with Lenco
    const callbackUrl = `${process.env.APP_BASE_URL}/api/webhooks/lenco`;

    const paymentResult = await createPaymentIntent({
      amount: subtotal,
      currency: "ZMW",
      customer: {
        name: customerName,
        email: session.user.email,
        phone: customerPhone,
      },
      metadata: {
        orderId: order.id,
        orderNumber,
      },
      callbackUrl,
      mobileOperator: mobileOperator || "airtel",
    });

    if (!paymentResult.success) {
      // Mark order as failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        { error: paymentResult.error || "Failed to initiate payment" },
        { status: 500 }
      );
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "LENCO",
        amount: subtotal,
        currency: "ZMW",
        status: "INITIATED",
        lencoTransactionRef: paymentResult.transactionRef,
        lencoCheckoutId: paymentResult.checkoutId,
        lencoPaymentUrl: paymentResult.paymentUrl,
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      paymentUrl: paymentResult.paymentUrl,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
