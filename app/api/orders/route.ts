import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to strings for JSON serialization
    const serializedOrders = orders.map((order) => ({
      ...order,
      subtotal: order.subtotal.toString(),
      items: order.items.map((item) => ({
        ...item,
        priceSnapshot: item.priceSnapshot.toString(),
      })),
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
