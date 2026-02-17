"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Trash2, Pencil, Search, ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { DateRangePicker, DateRange, getThisMonth } from "@/components/finance/date-range-picker";

interface ExpenseCategory {
  id: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  receiptUrl: string | null;
  category: ExpenseCategory;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getThisMonth());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [page, setPage] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/finance/expense-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        from: dateRange.from,
        to: dateRange.to,
      });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);

      const res = await fetch(`/api/admin/finance/expenses?${params}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");

      const data = await res.json();
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, dateRange, search, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
  }, [dateRange, search, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;

    try {
      const res = await fetch(`/api/admin/finance/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast({ title: "Expense deleted" });
      fetchExpenses();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      from: dateRange.from,
      to: dateRange.to,
    });
    if (categoryFilter) params.set("categoryId", categoryFilter);
    window.open(`/api/admin/finance/expenses/export?${params}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Link href="/admin/finance/expenses/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Description</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(expense.date)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                          {expense.category.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-[300px] truncate">
                        {expense.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/finance/expenses/${expense.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
