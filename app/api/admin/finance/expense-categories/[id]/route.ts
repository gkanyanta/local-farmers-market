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

// PATCH /api/admin/finance/expense-categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = expenseCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: { name: validation.data.name },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update expense category error:", error);
    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/finance/expense-categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { limit: 30, windowSeconds: 60 });
  if (limited) return limited;

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.type === "PRESET") {
      return NextResponse.json(
        { error: "Preset categories cannot be deleted" },
        { status: 400 }
      );
    }

    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with expenses. Reassign expenses first." },
        { status: 400 }
      );
    }

    await prisma.expenseCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense category error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense category" },
      { status: 500 }
    );
  }
}
