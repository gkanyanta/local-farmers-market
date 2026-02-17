"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, Shield, Eye, UserX } from "lucide-react";
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
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number };
  totalSpent: number;
}

const roles = [
  { value: "all", label: "All Roles" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (pageNum = 1, append = false) => {
    if (!append) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
      params.set("page", String(pageNum));

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => append ? [...prev, ...data.users] : data.users);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
        setPage(pageNum);
      } else if (res.status === 401) {
        toast({ title: "Access Denied", description: "Only admins can manage users", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      toast({ title: "Role Updated", description: `User role changed to ${newRole}.` });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "STAFF": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
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
              {users.length === 0 ? (
                <div className="py-12 text-center">
                  <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No users found matching your search.</p>
                </div>
              ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-left p-3 font-medium">Orders</th>
                    <th className="text-right p-3 font-medium">Total Spent</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{user.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-3 text-sm">{user.phone || "—"}</td>
                      <td className="p-3 text-sm">{formatDateTime(user.createdAt)}</td>
                      <td className="p-3 text-sm">{user._count.orders}</td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="p-3">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="icon" aria-label="View user details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">Customer</SelectItem>
                              <SelectItem value="STAFF">Staff</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && users.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {users.length} of {total} users
          </p>
          {page < totalPages && (
            <Button
              variant="outline"
              onClick={() => fetchUsers(page + 1, true)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
