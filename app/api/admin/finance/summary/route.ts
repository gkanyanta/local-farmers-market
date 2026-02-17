import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/finance/summary?from=...&to=...
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [revenueResult, expenseResult, expenseByCategory] = await Promise.all([
      prisma.order.aggregate({
        where: {
          status: { in: ["CONFIRMED", "SOURCING", "READY_FOR_PICKUP", "PICKED_UP"] },
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { subtotal: true },
      }),
      prisma.expense.aggregate({
        where: {
          date: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          date: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const revenue = revenueResult._sum.subtotal?.toNumber() || 0;
    const expenses = expenseResult._sum.amount?.toNumber() || 0;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Resolve category names for breakdown
    const categoryIds = expenseByCategory.map((g) => g.categoryId);
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const breakdown = expenseByCategory.map((g) => ({
      categoryId: g.categoryId,
      categoryName: categoryMap.get(g.categoryId) || "Unknown",
      total: g._sum.amount?.toNumber() || 0,
    }));

    return NextResponse.json({
      revenue,
      expenses,
      profit,
      margin: Math.round(margin * 100) / 100,
      breakdown,
    });
  } catch (error) {
    console.error("Finance summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance summary" },
      { status: 500 }
    );
  }
}
