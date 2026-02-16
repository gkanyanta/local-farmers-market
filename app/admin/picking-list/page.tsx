"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface PickingItem {
  productId: string;
  name: string;
  unit: string;
  category: string;
  isPerishable: boolean;
  totalQty: number;
  orders: string[];
}

interface PickingListData {
  date: string;
  orderCount: number;
  items: PickingItem[];
}

export default function AdminPickingListPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<PickingListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPickingList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/picking-list?date=${date}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch picking list:", error);
      toast({ title: "Error", description: "Failed to load picking list", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPickingList();
  }, [date]);

  const handleExport = () => {
    window.open(`/api/admin/picking-list?date=${date}&export=csv`, "_blank");
  };

  const groupedItems = data?.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PickingItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Picking List</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 w-44"
            />
          </div>
          <Button onClick={handleExport} variant="outline" disabled={!data?.items.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No confirmed orders for {format(new Date(date), "MMMM d, yyyy")}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{data?.orderCount}</strong> confirmed orders for{" "}
              <strong>{format(new Date(date), "MMMM d, yyyy")}</strong>
            </p>
          </div>

          {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Product</th>
                        <th className="text-left py-2 font-medium">Quantity</th>
                        <th className="text-left py-2 font-medium">Unit</th>
                        <th className="text-left py-2 font-medium">Type</th>
                        <th className="text-left py-2 font-medium">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.productId} className="border-b last:border-0">
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className="py-3">
                            <span className="text-lg font-bold text-primary">
                              {item.totalQty}
                            </span>
                          </td>
                          <td className="py-3">{item.unit}</td>
                          <td className="py-3">
                            <Badge variant={item.isPerishable ? "fresh" : "secondary"}>
                              {item.isPerishable ? "Perishable" : "Non-perishable"}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {item.orders.map((order) => (
                                <a
                                  key={order}
                                  href={`/admin/orders?search=${order}`}
                                  className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                                >
                                  {order}
                                </a>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
