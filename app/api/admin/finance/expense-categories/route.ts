import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/finance/expense-categories
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { expenses: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get expense categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/finance/expense-categories
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = expenseCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.expenseCategory.findUnique({
      where: { name: validation.data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.create({
      data: { name: validation.data.name, type: "CUSTOM" },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Create expense category error:", error);
    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 }
    );
  }
}
