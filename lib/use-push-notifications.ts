"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { isNativePlatform } from "./capacitor";

async function registerTokenOnServer(token: string, platform: string) {
  try {
    await fetch("/api/notifications/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform }),
    });
  } catch (error) {
    console.error("Failed to register push token:", error);
  }
}

async function setupWebPush() {
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import(
      "firebase/messaging"
    );

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Firebase config not set, skipping web push setup");
      return;
    }

    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    const messaging = getMessaging(app);

    // Register service worker
    const swRegistration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VAPID key not set, skipping web push setup");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      await registerTokenOnServer(token, "web");
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === "granted") {
        new Notification(title, {
          body: body || "",
          icon: "/icons/icon-192.png",
        });
      }
    });
  } catch (error) {
    console.error("Web push setup error:", error);
  }
}

async function setupNativePush() {
  try {
    const { PushNotifications } = await import(
      "@capacitor/push-notifications"
    );

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") {
      console.log("Push notification permission denied");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      const { Capacitor } = await import("@capacitor/core");
      const platform = Capacitor.getPlatform() as "android" | "ios";
      await registerTokenOnServer(token.value, platform);
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    // Handle foreground notifications on native
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Foreground push:", notification);
      }
    );

    // Handle notification tap
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const url = action.notification.data?.url;
        if (url) {
          window.location.href = url;
        }
      }
    );
  } catch (error) {
    console.error("Native push setup error:", error);
  }
}

export function usePushNotifications() {
  const { data: session } = useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || initialized.current) return;
    initialized.current = true;

    if (isNativePlatform()) {
      setupNativePush();
    } else if (typeof window !== "undefined" && "Notification" in window) {
      setupWebPush();
    }
  }, [session?.user?.id]);
}
