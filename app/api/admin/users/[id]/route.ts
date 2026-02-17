import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalSpent = user.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.subtotal.toNumber(), 0);

  const serializedOrders = user.orders.map((order) => ({
    ...order,
    subtotal: order.subtotal.toString(),
    items: order.items.map((item) => ({
      ...item,
      priceSnapshot: item.priceSnapshot.toString(),
    })),
  }));

  return NextResponse.json({
    ...user,
    orders: serializedOrders,
    totalSpent,
  });
}
