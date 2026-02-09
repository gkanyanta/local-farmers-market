import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deviceTokenSchema } from "@/lib/validations";

// POST /api/notifications/register -- register/upsert a device token
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deviceTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, platform } = parsed.data;

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: session.user.id,
        token,
        platform,
      },
      update: {
        userId: session.user.id,
        platform,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token registration error:", error);
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/register -- remove a device token
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await prisma.deviceToken.deleteMany({
      where: {
        token,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove token" },
      { status: 500 }
    );
  }
}
