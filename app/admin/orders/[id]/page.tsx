"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";

interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitSnapshot: string;
  priceSnapshot: { toNumber?: () => number } | number | string;
  qty: number;
}

interface Payment {
  id: string;
  status: string;
  amount: { toNumber?: () => number } | number | string;
  lencoTransactionRef: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  subtotal: { toNumber?: () => number } | number | string;
  status: string;
  pickupOption: string;
  riderName: string | null;
  riderPhone: string | null;
  pickupTime: string | null;
  pickupNotes: string | null;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  user: { name: string | null; email: string; phone: string | null };
}

const statusTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SOURCING", "CANCELLED"],
  SOURCING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: [],
  CANCELLED: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        router.push("/admin/orders");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update order");
      }

      toast({
        title: "Order Updated",
        description: `Status changed to ${getStatusLabel(newStatus)}`,
      });

      fetchOrder();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  const subtotal = typeof order.subtotal === "object" && order.subtotal?.toNumber
    ? order.subtotal.toNumber()
    : Number(order.subtotal);

  const allowedTransitions = statusTransitions[order.status] || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
            {getStatusLabel(order.status)}
          </Badge>
          {allowedTransitions.length > 0 && (
            <Select
              onValueChange={handleStatusUpdate}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                {allowedTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pickup Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pickup Option</p>
              <p className="font-medium">
                {order.pickupOption === "OWN_RIDER" ? "Sending Own Rider" : "Request Rider Booking"}
              </p>
            </div>
            {order.riderName && (
              <div>
                <p className="text-sm text-muted-foreground">Rider Name</p>
                <p className="font-medium">{order.riderName}</p>
              </div>
            )}
            {order.riderPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Rider Phone</p>
                <p className="font-medium">{order.riderPhone}</p>
              </div>
            )}
            {order.pickupTime && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Pickup</p>
                <p className="font-medium">{order.pickupTime}</p>
              </div>
            )}
            {order.pickupNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{order.pickupNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => {
              const price = typeof item.priceSnapshot === "object" && item.priceSnapshot?.toNumber
                ? item.priceSnapshot.toNumber()
                : Number(item.priceSnapshot);
              return (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.nameSnapshot}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(price)} x {item.qty} {item.unitSnapshot}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(price * item.qty)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      {order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.payments.map((payment) => {
                const amount = typeof payment.amount === "object" && payment.amount?.toNumber
                  ? payment.amount.toNumber()
                  : Number(payment.amount);
                return (
                  <div key={payment.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatCurrency(amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.lencoTransactionRef || "No ref"} • {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.status === "SUCCEEDED"
                          ? "success"
                          : payment.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
