"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  subtotal: string;
  status: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?redirect=/orders");
    }
  }, [sessionStatus, router]);

  const fetchOrders = async () => {
    if (!session?.user) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({ title: "Error", description: "Failed to load your orders", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session, statusFilter]);

  useEffect(() => {
    if (!session?.user) return;
    const timeout = setTimeout(() => fetchOrders(), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  if (sessionStatus === "loading") {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number..."
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
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {search || statusFilter !== "all" ? "No Orders Found" : "No Orders Yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Start shopping to see your orders here."}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/shop">
              <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
                Start Shopping
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{order.orderNumber}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)} • {totalItems} items
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">
                          {formatCurrency(parseFloat(order.subtotal))}
                        </span>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
