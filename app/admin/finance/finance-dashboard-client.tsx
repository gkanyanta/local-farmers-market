"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Percent, Plus, List } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { DateRangePicker, DateRange, getThisMonth } from "@/components/finance/date-range-picker";
import {
  RevenueLineChart,
  ProfitLineChart,
  RevenueExpensesBarChart,
  ExpenseBreakdownPieChart,
} from "@/components/finance/finance-charts";

interface Summary {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  breakdown: Array<{ categoryName: string; total: number }>;
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export function FinanceDashboardClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getThisMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = `from=${dateRange.from}&to=${dateRange.to}`;

      const [summaryRes, revenueRes] = await Promise.all([
        fetch(`/api/admin/finance/summary?${params}`),
        fetch(`/api/admin/finance/revenue?${params}&granularity=daily`),
      ]);

      if (!summaryRes.ok || !revenueRes.ok) {
        throw new Error("Failed to fetch finance data");
      }

      const summaryData = await summaryRes.json();
      const revenueData = await revenueRes.json();

      setSummary(summaryData);
      setTimeSeries(revenueData.series);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load finance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Finance</h1>
        <div className="flex gap-2">
          <Link href="/admin/finance/expenses/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </Link>
          <Link href="/admin/finance/expenses">
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-1" />
              Expenses
            </Button>
          </Link>
        </div>
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrency(summary?.revenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatCurrency(summary?.expenses || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {loading ? "..." : formatCurrency(summary?.profit || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${summary?.margin || 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueLineChart data={timeSeries} />
          <ProfitLineChart data={timeSeries} />
          <RevenueExpensesBarChart data={timeSeries} />
          <ExpenseBreakdownPieChart data={summary?.breakdown || []} />
        </div>
      )}
    </div>
  );
}
