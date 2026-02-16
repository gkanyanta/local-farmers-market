"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    unit: string;
    qty: number;
    imageUrl?: string;
    isPerishable: boolean;
  };
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">
            {formatCurrency(item.price)} / {item.unit}
          </span>
          {item.isPerishable && (
            <Badge variant="fresh" className="text-xs">
              Fresh
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQty(item.productId, item.qty - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQty(item.productId, item.qty + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {formatCurrency(item.price * item.qty)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onRemove(item.productId)}
              aria-label="Remove from cart"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
