import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/orders
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where: Prisma.OrderWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumOrderStatusFilter;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  // Serialize Decimal fields for JSON
  const serializedOrders = orders.map((order) => ({
    ...order,
    subtotal: order.subtotal.toString(),
    items: order.items.map((item) => ({
      ...item,
      priceSnapshot: item.priceSnapshot.toString(),
    })),
    payments: order.payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toString(),
    })),
  }));

  return NextResponse.json({
    orders: serializedOrders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
