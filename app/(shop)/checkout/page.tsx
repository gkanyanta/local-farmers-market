"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, AlertCircle, Truck, User, Smartphone, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, subtotal, clearCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState(200);
  const [pickupOption, setPickupOption] = useState<"OWN_RIDER" | "BOOK_RIDER">("OWN_RIDER");
  const [mobileOperator, setMobileOperator] = useState<"airtel" | "mtn">("airtel");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    riderName: "",
    riderPhone: "",
    pickupTime: "",
    pickupNotes: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        customerName: session.user.name || "",
        customerPhone: session.user.phone || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.minOrderValue) setMinOrderValue(data.minOrderValue);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  if (subtotal < minOrderValue) {
    router.push("/cart");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pickupOption,
          mobileOperator,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Clear cart
      await clearCart();

      // For mobile money, redirect to order page with payment pending message
      // Customer will authorize payment on their phone
      toast({
        title: "Payment Initiated",
        description: "Please check your phone to authorize the payment via " + (mobileOperator === "airtel" ? "Airtel Money" : "MTN Mobile Money"),
      });

      router.push(`/orders/${data.orderId}?paid=pending`);
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6 max-w-2xl">
      <Link
        href="/cart"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
        <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Orders placed before 9:00 AM are sourced and ready same day. Orders after 9:00 AM will be fulfilled the following day.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                placeholder="+260..."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Money Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select your mobile money provider. You will receive a prompt on your phone to authorize the payment.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  mobileOperator === "airtel"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id="operator-airtel"
                  type="radio"
                  name="mobileOperator"
                  checked={mobileOperator === "airtel"}
                  onChange={() => setMobileOperator("airtel")}
                  className="sr-only"
                />
                <span className="font-medium text-red-600">Airtel Money</span>
              </label>

              <label
                htmlFor="operator-mtn"
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  mobileOperator === "mtn"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id="operator-mtn"
                  type="radio"
                  name="mobileOperator"
                  checked={mobileOperator === "mtn"}
                  onChange={() => setMobileOperator("mtn")}
                  className="sr-only"
                />
                <span className="font-medium text-yellow-600">MTN MoMo</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Pickup Option
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  pickupOption === "OWN_RIDER"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id="pickup-own-rider"
                  type="radio"
                  name="pickupOption"
                  checked={pickupOption === "OWN_RIDER"}
                  onChange={() => setPickupOption("OWN_RIDER")}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">Send My Own Rider</span>
                  <p className="text-sm text-muted-foreground">
                    You will arrange pickup with your own rider
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  pickupOption === "BOOK_RIDER"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id="pickup-book-rider"
                  type="radio"
                  name="pickupOption"
                  checked={pickupOption === "BOOK_RIDER"}
                  onChange={() => setPickupOption("BOOK_RIDER")}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">Book a Rider for Me</span>
                  <p className="text-sm text-muted-foreground">
                    We will help arrange a rider (fees paid separately by you)
                  </p>
                </div>
              </label>
            </div>

            {pickupOption === "OWN_RIDER" && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="riderName">Rider Name (Optional)</Label>
                  <Input
                    id="riderName"
                    value={formData.riderName}
                    onChange={(e) =>
                      setFormData({ ...formData, riderName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="riderPhone">Rider Phone (Optional)</Label>
                  <Input
                    id="riderPhone"
                    type="tel"
                    value={formData.riderPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, riderPhone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTime">Expected Pickup Time (Optional)</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={formData.pickupTime}
                    onChange={(e) =>
                      setFormData({ ...formData, pickupTime: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {pickupOption === "BOOK_RIDER" && (
              <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Rider Fees</p>
                  <p>
                    Rider fees are paid separately by you directly to the rider.
                    We will contact you to confirm a rider after your order is ready.
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="pickupNotes">Special Instructions (Optional)</Label>
              <Textarea
                id="pickupNotes"
                value={formData.pickupNotes}
                onChange={(e) =>
                  setFormData({ ...formData, pickupNotes: e.target.value })
                }
                placeholder="Any special instructions for your order..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>
                    {item.name} x {item.qty}
                  </span>
                  <span>{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(subtotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Please Note:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              We are not a delivery company. Pickup is via your rider or a rider
              booked at your cost.
            </li>
            <li>
              Perishable items are freshly sourced from local hardworking Zambian
              farmers after your order is confirmed.
            </li>
          </ul>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : `Pay ${formatCurrency(subtotal)}`}
        </Button>
      </form>
    </div>
  );
}
