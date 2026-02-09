import admin from "firebase-admin";
import { prisma } from "./prisma";

// Initialize Firebase Admin SDK (singleton, matching lib/prisma.ts pattern)
declare global {
  var firebaseAdmin: admin.app.App | undefined;
}

function getFirebaseAdmin(): admin.app.App {
  if (globalThis.firebaseAdmin) {
    return globalThis.firebaseAdmin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDK credentials not configured");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.firebaseAdmin = app;
  }

  return app;
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  CONFIRMED: {
    title: "Order Confirmed!",
    body: "Your order #{orderNumber} has been confirmed and is being processed.",
  },
  SOURCING: {
    title: "Order Being Sourced",
    body: "We're sourcing fresh produce for your order #{orderNumber}.",
  },
  READY_FOR_PICKUP: {
    title: "Ready for Pickup!",
    body: "Your order #{orderNumber} is ready for pickup.",
  },
  PICKED_UP: {
    title: "Order Picked Up",
    body: "Your order #{orderNumber} has been picked up. Enjoy!",
  },
  CANCELLED: {
    title: "Order Cancelled",
    body: "Your order #{orderNumber} has been cancelled.",
  },
};

export function sendOrderStatusNotification(
  userId: string,
  orderNumber: string,
  newStatus: string
) {
  // Fire-and-forget: run async but don't block the caller
  _sendNotification(userId, orderNumber, newStatus).catch((error) => {
    console.error("Push notification error:", error);
  });
}

async function _sendNotification(
  userId: string,
  orderNumber: string,
  newStatus: string
) {
  const template = STATUS_MESSAGES[newStatus];
  if (!template) return;

  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true, platform: true },
  });

  if (tokens.length === 0) return;

  let app: admin.app.App;
  try {
    app = getFirebaseAdmin();
  } catch {
    console.warn("Firebase Admin not configured, skipping push notification");
    return;
  }

  const title = template.title;
  const body = template.body.replace("#{orderNumber}", orderNumber);

  const messages: admin.messaging.Message[] = tokens.map((t) => ({
    token: t.token,
    notification: { title, body },
    data: {
      type: "order_status",
      orderNumber,
      status: newStatus,
      url: `/orders`,
    },
    ...(t.platform === "web"
      ? {
          webpush: {
            fcmOptions: { link: `/orders` },
          },
        }
      : {
          android: {
            priority: "high" as const,
            notification: {
              channelId: "orders",
              icon: "ic_notification",
            },
          },
        }),
  }));

  const messaging = app.messaging();
  const response = await messaging.sendEach(messages);

  // Clean up stale tokens
  const tokensToRemove: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (
      resp.error &&
      (resp.error.code === "messaging/registration-token-not-registered" ||
        resp.error.code === "messaging/invalid-registration-token")
    ) {
      tokensToRemove.push(tokens[idx].token);
    }
  });

  if (tokensToRemove.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: tokensToRemove } },
    });
    console.log(`Cleaned up ${tokensToRemove.length} stale device tokens`);
  }
}
