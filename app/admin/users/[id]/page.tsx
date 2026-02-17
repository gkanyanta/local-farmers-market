"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";

interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitSnapshot: string;
  priceSnapshot: string;
  qty: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  pickupOption: string;
  createdAt: string;
  items: OrderItem[];
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  orders: Order[];
  totalSpent: number;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/admin/users/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          toast({ title: "Error", description: "Failed to load user", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Failed to load user", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [params.id]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "STAFF": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found.</p>
        <Link href="/admin/users">
          <Button variant="outline" className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const completedOrders = user.orders.filter((o) => o.status !== "CANCELLED");
  const cancelledOrders = user.orders.filter((o) => o.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Users
      </Link>

      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{user.name || "Unnamed User"}</CardTitle>
            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDateTime(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span>{user.orders.length} orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{formatCurrency(user.totalSpent)}</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{completedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Completed Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{cancelledOrders.length}</p>
            <p className="text-sm text-muted-foreground">Cancelled Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.orders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              This user has no orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Order</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Items</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {user.orders.map((order) => {
                    const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);
                    return (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{order.orderNumber}</td>
                        <td className="p-3 text-sm">{formatDateTime(order.createdAt)}</td>
                        <td className="p-3 text-sm">{totalItems} items</td>
                        <td className="p-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(Number(order.subtotal))}
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
