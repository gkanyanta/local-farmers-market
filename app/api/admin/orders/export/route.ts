import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
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

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const escapeCSV = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headers = [
    "Order Number",
    "Date",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Status",
    "Pickup Option",
    "Items",
    "Total (ZMW)",
  ];

  const rows = orders.map((order) => {
    const itemsList = order.items
      .map((item) => `${item.nameSnapshot} x${item.qty}`)
      .join("; ");

    return [
      order.orderNumber,
      new Date(order.createdAt).toISOString().split("T")[0],
      escapeCSV(order.customerName),
      order.customerPhone,
      order.user?.email || "",
      order.status,
      order.pickupOption === "OWN_RIDER" ? "Own Rider" : "Book Rider",
      escapeCSV(itemsList),
      order.subtotal.toNumber().toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
