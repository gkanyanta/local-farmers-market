"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { toast } from "@/components/ui/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    unit: string;
    imageUrl?: string | null;
    isPerishable: boolean;
    isActive: boolean;
    stockQty?: number | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

  const handleAddToCart = async () => {
    await addItem({
      productId: product.id,
      name: product.name,
      price,
      unit: product.unit,
      imageUrl: product.imageUrl || undefined,
      isPerishable: product.isPerishable,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const isOutOfStock = !product.isPerishable && product.stockQty != null && product.stockQty <= 0;

  return (
    <Card className="overflow-hidden group">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          {product.isPerishable && (
            <Badge
              variant="fresh"
              className="absolute top-2 left-2 text-xs"
            >
              Freshly sourced
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-lg">{formatCurrency(price)}</span>
            <span className="text-sm text-muted-foreground ml-1">/ {product.unit}</span>
          </div>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
