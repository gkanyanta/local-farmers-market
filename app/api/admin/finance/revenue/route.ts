import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/finance/revenue?from=...&to=...&granularity=daily|weekly|monthly
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const granularity = searchParams.get("granularity") || "daily";

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Validate granularity
    const truncUnit = granularity === "monthly" ? "month" : granularity === "weekly" ? "week" : "day";

    // Revenue time series using DATE_TRUNC
    const revenueData: Array<{ period: Date; total: number }> = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${truncUnit}, "createdAt") as period,
        COALESCE(SUM("subtotal"), 0) as total
      FROM "Order"
      WHERE status IN ('CONFIRMED', 'SOURCING', 'READY_FOR_PICKUP', 'PICKED_UP')
        AND "createdAt" >= ${fromDate}
        AND "createdAt" <= ${toDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Expense time series using DATE_TRUNC
    const expenseData: Array<{ period: Date; total: number }> = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${truncUnit}, "date") as period,
        COALESCE(SUM("amount"), 0) as total
      FROM "Expense"
      WHERE "date" >= ${fromDate}
        AND "date" <= ${toDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Merge revenue and expense data into a unified time series
    const periodMap = new Map<string, { revenue: number; expenses: number }>();

    for (const row of revenueData) {
      const key = new Date(row.period).toISOString().split("T")[0];
      const entry = periodMap.get(key) || { revenue: 0, expenses: 0 };
      entry.revenue = Number(row.total);
      periodMap.set(key, entry);
    }

    for (const row of expenseData) {
      const key = new Date(row.period).toISOString().split("T")[0];
      const entry = periodMap.get(key) || { revenue: 0, expenses: 0 };
      entry.expenses = Number(row.total);
      periodMap.set(key, entry);
    }

    // Sort by date
    const series = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));

    return NextResponse.json({ series, granularity });
  } catch (error) {
    console.error("Revenue time series error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
