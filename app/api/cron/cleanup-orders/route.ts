import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cancel orders stuck in PENDING_PAYMENT for over 1 hour.
 * Can be triggered by Vercel Cron or called manually by admin.
 *
 * To set up Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/cleanup-orders", "schedule": "0 * * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lt: oneHourAgo },
      },
      data: { status: "CANCELLED" },
    });

    console.log(`Cleaned up ${result.count} stale PENDING_PAYMENT orders`);

    return NextResponse.json({
      success: true,
      cancelledOrders: result.count,
    });
  } catch (error) {
    console.error("Order cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
