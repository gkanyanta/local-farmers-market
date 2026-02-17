"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem } from "@/components/cart/cart-item";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, isLoading, updateQty, removeItem } = useCart();
  const [minOrderValue, setMinOrderValue] = useState(200);
  const [cutOffDisplay, setCutOffDisplay] = useState("9:00 AM");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.minOrderValue) setMinOrderValue(data.minOrderValue);
        if (data.cutOffTime) {
          const [h, m] = data.cutOffTime.split(":");
          const hour = parseInt(h);
          setCutOffDisplay(`${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`);
        }
      })
      .catch(() => {});
  }, []);

  const difference = minOrderValue - subtotal;
  const canCheckout = subtotal >= minOrderValue;

  const handleCheckout = () => {
    if (!session) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some fresh produce to get started!
        </p>
        <Link href="/shop">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Link
        href="/shop"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Continue Shopping
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Cart ({items.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {items.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {!canCheckout && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Minimum order is K{minOrderValue}. Add{" "}
                    <strong>{formatCurrency(difference)}</strong> more.
                  </div>
                )}
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Order by {cutOffDisplay} for same-day sourcing.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!canCheckout}
                onClick={handleCheckout}
              >
                {session ? "Proceed to Checkout" : "Login to Checkout"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                We are not a delivery company. Pickup via your rider or a rider
                booked at your cost.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
