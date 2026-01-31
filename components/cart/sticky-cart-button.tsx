"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatCurrency } from "@/lib/utils";

export function StickyCartButton() {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  return (
    <Link href="/cart">
      <div className="fixed bottom-4 left-4 right-4 md:hidden z-40">
        <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-primary text-xs flex items-center justify-center font-bold">
                {itemCount}
              </span>
            </div>
            <span className="font-medium">View Cart</span>
          </div>
          <span className="font-bold">{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </Link>
  );
}
