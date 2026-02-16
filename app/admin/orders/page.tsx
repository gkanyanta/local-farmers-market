"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  subtotal: { toNumber?: () => number } | number | string;
  status: string;
  pickupOption: string;
  createdAt: string;
  items: { qty: number }[];
}

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SOURCING", label: "Sourcing" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Order</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Pickup</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const subtotal = typeof order.subtotal === "object" && order.subtotal?.toNumber
                      ? order.subtotal.toNumber()
                      : Number(order.subtotal);
                    const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

                    return (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {totalItems} items
                          </div>
                        </td>
                        <td className="p-3">
                          <div>{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.customerPhone}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {order.pickupOption === "OWN_RIDER" ? "Own Rider" : "Book Rider"}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" aria-label="View order details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
