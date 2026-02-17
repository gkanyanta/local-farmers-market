import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/finance/expenses
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const categoryId = searchParams.get("categoryId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const search = searchParams.get("search") || "";

    const where: Prisma.ExpenseWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    const serialized = expenses.map((e) => ({
      ...e,
      amount: e.amount.toString(),
    }));

    return NextResponse.json({
      expenses: serialized,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/admin/finance/expenses
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = expenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount: validation.data.amount,
        categoryId: validation.data.categoryId,
        date: new Date(validation.data.date),
        description: validation.data.description || null,
        receiptUrl: validation.data.receiptUrl || null,
      },
      include: { category: true },
    });

    return NextResponse.json({
      ...expense,
      amount: expense.amount.toString(),
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
