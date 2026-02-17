"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  unit: string;
  price: { toNumber?: () => number } | number;
  imageUrl: string | null;
  isPerishable: boolean;
  isActive: boolean;
  stockQty: number | null;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    unit: "kg",
    price: "",
    imageUrl: "",
    isPerishable: true,
    isActive: true,
    stockQty: "",
  });

  const fetchProducts = async (pageNum = 1, append = false) => {
    if (!append) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(pageNum));

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => append ? [...prev, ...data.products] : data.products);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      unit: "kg",
      price: "",
      imageUrl: "",
      isPerishable: true,
      isActive: true,
      stockQty: "",
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    const price = typeof product.price === "object" && product.price.toNumber
      ? product.price.toNumber()
      : product.price;
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId,
      unit: product.unit,
      price: String(price),
      imageUrl: product.imageUrl || "",
      isPerishable: product.isPerishable,
      isActive: product.isActive,
      stockQty: product.stockQty?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      unit: formData.unit,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl || undefined,
      isPerishable: formData.isPerishable,
      isActive: formData.isActive,
      stockQty: formData.isPerishable ? null : parseInt(formData.stockQty) || 0,
    };

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      toast({
        title: editingProduct ? "Product Updated" : "Product Created",
        description: `${formData.name} has been saved.`,
      });

      setDialogOpen(false);
      resetForm();
      fetchProducts(1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted.`,
      });

      fetchProducts(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (ZMW)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="bundle">bundle</SelectItem>
                      <SelectItem value="each">each</SelectItem>
                      <SelectItem value="tray">tray</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                      <SelectItem value="bottle">bottle</SelectItem>
                      <SelectItem value="bunch">bunch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Product Image</Label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                />
                <Input
                  type="url"
                  placeholder="Or paste image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPerishable}
                    onChange={(e) => setFormData({ ...formData, isPerishable: e.target.checked })}
                  />
                  <span className="text-sm">Perishable</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              {!formData.isPerishable && (
                <div>
                  <Label htmlFor="stockQty">Stock Quantity</Label>
                  <Input
                    id="stockQty"
                    type="number"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
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
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Price</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const price = typeof product.price === "object" && product.price.toNumber
                      ? product.price.toNumber()
                      : Number(product.price);
                    return (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="font-medium">{product.name}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {product.category?.name}
                        </td>
                        <td className="p-3">
                          {formatCurrency(price)} / {product.unit}
                        </td>
                        <td className="p-3">
                          <Badge variant={product.isPerishable ? "fresh" : "secondary"}>
                            {product.isPerishable ? "Perishable" : "Non-perishable"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={product.isActive ? "success" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            aria-label="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product)}
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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

      {!isLoading && products.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {products.length} of {total} products
          </p>
          {page < totalPages && (
            <Button
              variant="outline"
              onClick={() => fetchProducts(page + 1, true)}
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
