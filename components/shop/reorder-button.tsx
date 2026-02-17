"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/components/cart/cart-provider";

interface ReorderItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  imageUrl?: string;
  isPerishable: boolean;
}

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();

  const handleReorder = async () => {
    setIsLoading(true);
    let addedCount = 0;

    try {
      for (const item of items) {
        await addItem(
          {
            productId: item.productId,
            name: item.name,
            price: item.price,
            unit: item.unit,
            imageUrl: item.imageUrl,
            isPerishable: item.isPerishable,
          },
          item.qty
        );
        addedCount++;
      }

      toast({
        title: "Added to Cart",
        description: `${addedCount} item${addedCount !== 1 ? "s" : ""} added to your cart.`,
      });
      router.push("/cart");
    } catch {
      toast({
        title: "Error",
        description: "Some items could not be added. They may no longer be available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleReorder} disabled={isLoading} variant="outline" className="gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Reorder
    </Button>
  );
}
