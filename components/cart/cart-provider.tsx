"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  imageUrl?: string;
  isPerishable: boolean;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (product: Omit<CartItem, "id" | "qty">, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const fetchCart = useCallback(async () => {
    if (status === "loading") return;

    if (!session?.user) {
      // Load from localStorage for non-authenticated users
      const saved = localStorage.getItem("cart");
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch {
          setItems([]);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, status]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Save to localStorage for non-authenticated users (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!session?.user && !isLoading) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem("cart", JSON.stringify(items));
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, session?.user, isLoading]);

  const addItem = async (product: Omit<CartItem, "id" | "qty">, qty = 1) => {
    if (!session?.user) {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === product.productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.productId
              ? { ...item, qty: item.qty + qty }
              : item
          );
        }
        return [...prev, { ...product, id: `local-${Date.now()}`, qty }];
      });
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, qty }),
      });
      if (res.ok) {
        await fetchCart();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Failed to add item", description: data.error || "Please try again", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({ title: "Failed to add item", description: "Please try again", variant: "destructive" });
    }
  };

  const updateQty = async (productId: string, qty: number) => {
    if (!session?.user) {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((item) => item.productId !== productId)
          : prev.map((item) =>
              item.productId === productId ? { ...item, qty } : item
            )
      );
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty }),
      });
      if (res.ok) {
        await fetchCart();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Failed to update quantity", description: data.error || "Please try again", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update qty:", error);
      toast({ title: "Failed to update quantity", description: "Please try again", variant: "destructive" });
    }
  };

  const removeItem = async (productId: string) => {
    if (!session?.user) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await fetchCart();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Failed to remove item", description: data.error || "Please try again", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast({ title: "Failed to remove item", description: "Please try again", variant: "destructive" });
    }
  };

  const clearCart = async () => {
    if (!session?.user) {
      setItems([]);
      localStorage.removeItem("cart");
      return;
    }

    try {
      const res = await fetch("/api/cart/clear", { method: "POST" });
      if (res.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        refresh: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
