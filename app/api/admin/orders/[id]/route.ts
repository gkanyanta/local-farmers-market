import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/validations";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Serialize Decimal fields
  const serializedOrder = {
    ...order,
    subtotal: order.subtotal.toString(),
    items: order.items.map((item) => ({
      ...item,
      priceSnapshot: item.priceSnapshot.toString(),
      product: item.product ? {
        ...item.product,
        price: item.product.price.toString(),
      } : null,
    })),
    payments: order.payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toString(),
    })),
  };

  return NextResponse.json(serializedOrder);
}

// PATCH /api/admin/orders/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status } = body;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["SOURCING", "CANCELLED"],
      SOURCING: ["READY_FOR_PICKUP"],
      READY_FOR_PICKUP: ["PICKED_UP"],
      PICKED_UP: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // Handle inventory for non-perishables when order is picked up
    if (status === "PICKED_UP") {
      for (const item of order.items) {
        if (!item.product.isPerishable && item.product.stockQty !== null) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQty: Math.max(0, item.product.stockQty - item.qty),
            },
          });
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        payments: true,
      },
    });

    // Serialize Decimal fields
    const serializedOrder = {
      ...updatedOrder,
      subtotal: updatedOrder.subtotal.toString(),
      items: updatedOrder.items.map((item) => ({
        ...item,
        priceSnapshot: item.priceSnapshot.toString(),
      })),
      payments: updatedOrder.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
      })),
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
