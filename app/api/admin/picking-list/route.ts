import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

// GET /api/admin/picking-list
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const exportCsv = searchParams.get("export") === "csv";

    const date = dateStr ? new Date(dateStr) : new Date();

    // Get all confirmed orders for the date
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "SOURCING"] },
        createdAt: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
                isPerishable: true,
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // Aggregate items by product
    const itemMap = new Map<
      string,
      {
        productId: string;
        name: string;
        unit: string;
        category: string;
        isPerishable: boolean;
        totalQty: number;
        orders: string[];
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        const existing = itemMap.get(key);

        if (existing) {
          existing.totalQty += item.qty;
          existing.orders.push(order.orderNumber);
        } else {
          itemMap.set(key, {
            productId: item.productId,
            name: item.nameSnapshot,
            unit: item.unitSnapshot,
            category: item.product.category?.name || "Uncategorized",
            isPerishable: item.product.isPerishable,
            totalQty: item.qty,
            orders: [order.orderNumber],
          });
        }
      }
    }

    const pickingList = Array.from(itemMap.values()).sort((a, b) => {
      // Sort by category, then name
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    if (exportCsv) {
      const csvRows = [
        ["Category", "Product", "Quantity", "Unit", "Type", "Orders"].join(","),
        ...pickingList.map((item) =>
          [
            `"${item.category}"`,
            `"${item.name}"`,
            item.totalQty,
            `"${item.unit}"`,
            item.isPerishable ? "Perishable" : "Non-perishable",
            `"${item.orders.join(", ")}"`,
          ].join(",")
        ),
      ];

      const csv = csvRows.join("\n");
      const filename = `picking-list-${format(date, "yyyy-MM-dd")}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      date: format(date, "yyyy-MM-dd"),
      orderCount: orders.length,
      items: pickingList,
    });
  } catch (error) {
    console.error("Get picking list error:", error);
    return NextResponse.json({ error: "Failed to fetch picking list" }, { status: 500 });
  }
}
