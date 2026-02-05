import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "./add-to-cart-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product || !product.isActive) {
    return null;
  }

  return {
    ...product,
    price: product.price.toNumber(),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const isOutOfStock = !product.isPerishable && product.stockQty !== null && product.stockQty <= 0;

  return (
    <div className="container py-6">
      <Link
        href="/shop"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="h-24 w-24" />
            </div>
          )}
          {product.isPerishable && (
            <Badge
              variant="fresh"
              className="absolute top-4 left-4"
            >
              Freshly sourced from local Zambian farmers
            </Badge>
          )}
        </div>

        <div>
          <div className="mb-2">
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-sm text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <span className="text-muted-foreground">/ {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-muted-foreground mb-6">{product.description}</p>
          )}

          {isOutOfStock ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              This product is currently out of stock.
            </div>
          ) : (
            <AddToCartButton product={product} />
          )}

          {product.isPerishable && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Freshness Guarantee:</strong> This item is sourced fresh
                from local hardworking Zambian farmers after your order is confirmed.
              </p>
            </div>
          )}

          {!product.isPerishable && product.stockQty !== null && product.stockQty > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {product.stockQty} in stock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
