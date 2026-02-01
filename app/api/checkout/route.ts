import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";
import { createPaymentIntent } from "@/lib/lenco";

export async function POST(request: NextRequest) {
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

    // Get settings for minimum order validation
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    const minOrderValue = settings?.minOrderValue.toNumber() || 150;

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
