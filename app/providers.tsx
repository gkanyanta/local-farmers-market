"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart/cart-provider";
import { useCapacitorBackButton } from "@/lib/use-capacitor-back-button";
import { usePushNotifications } from "@/lib/use-push-notifications";

function CapacitorPlugins() {
  useCapacitorBackButton();
  usePushNotifications();

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !(window as unknown as Record<string, unknown>).__IS_CAPACITOR_NATIVE__
    ) {
      return;
    }

    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      StatusBar.setBackgroundColor({ color: "#16a34a" });
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setOverlaysWebView({ overlay: true });
    });
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <CapacitorPlugins />
        {children}
      </CartProvider>
    </SessionProvider>
  );
}
