import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Leaf, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PWAPrompt } from "@/components/layout/pwa-prompt";
import { StickyCartButton } from "@/components/cart/sticky-cart-button";
import { ProductCard } from "@/components/shop/product-card";
import { prisma } from "@/lib/prisma";

async function getHomeData() {
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return { categories, featuredProducts };
}

export default async function HomePage() {
  const { categories, featuredProducts } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-green-100 py-12 md:py-20">
          <div className="container">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                Fresh Produce from Local Zambian Farmers
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Order fresh vegetables, fruits, and everyday goods sourced directly from hardworking local farmers in Lusaka.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href="/shop">
                  <Button size="lg" className="gap-2">
                    Shop Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. Order Online</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Browse our selection and place your order. Minimum order is K200.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. We Source Fresh</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Perishables are sourced fresh after your order is confirmed.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Pickup Ready</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Send your rider or request us to book one. Rider fees paid separately.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 italic">
              We are not a delivery company. Pickup is via your rider or a rider booked at your cost.
            </p>

            <div className="mt-6 max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                <strong>Freshness guarantee:</strong> Order by 9:00 AM for same-day sourcing. Orders placed after 9:00 AM are sourced fresh the following day — because we never compromise on freshness.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="container">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Shop by Category</h2>
                <Link href="/shop" className="text-primary text-sm font-medium hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/shop?category=${category.slug}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative aspect-square bg-gray-100">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Leaf className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm text-center">{category.name}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-12 md:py-16 bg-gray-50">
            <div className="container">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Featured Products</h2>
                <Link href="/shop" className="text-primary text-sm font-medium hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      price: product.price.toNumber(),
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Ready to Order?</h2>
            <p className="mt-2 text-primary-foreground/80 max-w-md mx-auto">
              Support local farmers and enjoy fresh, quality produce delivered to your doorstep.
            </p>
            <Link href="/shop">
              <Button size="lg" variant="secondary" className="mt-6">
                Start Shopping
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <StickyCartButton />
      <PWAPrompt />
    </div>
  );
}
