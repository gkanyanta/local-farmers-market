import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
      select: {
        minOrderValue: true,
        cutOffTime: true,
        pickupAddressText: true,
        contactPhone: true,
        supportWhatsApp: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        minOrderValue: 150,
        cutOffTime: "08:30",
      });
    }

    return NextResponse.json({
      ...settings,
      minOrderValue: Number(settings.minOrderValue),
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ minOrderValue: 150, cutOffTime: "08:30" });
  }
}
