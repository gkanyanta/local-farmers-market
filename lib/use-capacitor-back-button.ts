"use client";

import { useEffect } from "react";

export function useCapacitorBackButton() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !(window as unknown as Record<string, unknown>).__IS_CAPACITOR_NATIVE__
    ) {
      return;
    }

    let cleanup: (() => void) | undefined;

    import("@capacitor/app").then(({ App }) => {
      const listener = App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      });

      cleanup = () => {
        listener.then((handle) => handle.remove());
      };
    });

    return () => {
      cleanup?.();
    };
  }, []);
}
