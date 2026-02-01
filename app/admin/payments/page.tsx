"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Payment {
  id: string;
  orderId: string;
  provider: string;
  amount: { toNumber?: () => number } | number | string;
  currency: string;
  status: string;
  lencoTransactionRef: string | null;
  lencoCheckoutId: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    status: string;
  };
}

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "INITIATED", label: "Initiated" },
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "FAILED", label: "Failed" },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment Reconciliation</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, phone, or transaction ref..."
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
                    <th className="text-left p-3 font-medium">Transaction Ref</th>
                    <th className="text-left p-3 font-medium">Order</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Payment Status</th>
                    <th className="text-left p-3 font-medium">Order Status</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const amount = typeof payment.amount === "object" && payment.amount?.toNumber
                      ? payment.amount.toNumber()
                      : Number(payment.amount);

                    return (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="font-mono text-sm">
                            {payment.lencoTransactionRef || "-"}
                          </div>
                        </td>
                        <td className="p-3">
                          <a
                            href={`/admin/orders/${payment.orderId}`}
                            className="text-primary hover:underline"
                          >
                            {payment.order.orderNumber}
                          </a>
                        </td>
                        <td className="p-3">
                          <div>{payment.order.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.order.customerPhone}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {formatDateTime(payment.createdAt)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              payment.status === "SUCCEEDED"
                                ? "success"
                                : payment.status === "FAILED"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">
                            {payment.order.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(amount)}
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
