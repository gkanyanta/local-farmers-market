import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/payments
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where: Prisma.PaymentWhereInput = {};

  if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
    where.status = status as PaymentStatus;
  }

  if (search) {
    where.OR = [
      { lencoTransactionRef: { contains: search, mode: "insensitive" } },
      { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      { order: { customerPhone: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  // Serialize Decimal fields
  const serializedPayments = payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toString(),
  }));

  return NextResponse.json({
    payments: serializedPayments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
