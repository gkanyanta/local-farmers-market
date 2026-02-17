import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Prisma.OrderWhereInput = { userId: session.user.id };

    if (status) {
      where.status = status as Prisma.EnumOrderStatusFilter;
    }

    if (search) {
      where.orderNumber = { contains: search, mode: "insensitive" };
    }

    const orders = await prisma.order.findMany({
      where,
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
