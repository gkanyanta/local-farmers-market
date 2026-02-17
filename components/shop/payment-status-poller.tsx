"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "PENDING_PAYMENT") {
            clearInterval(interval);
            router.refresh();
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  return null;
}
