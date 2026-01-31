import { Leaf, Users, Truck, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>

      <div className="prose prose-green max-w-none mb-12">
        <p className="text-lg text-muted-foreground">
          Local Farmers Market connects you directly with fresh produce sourced
          from local hardworking Zambian farmers. We believe in supporting our
          local farming community while bringing you the freshest vegetables,
          fruits, and everyday goods.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Fresh & Local</h3>
            </div>
            <p className="text-muted-foreground">
              Our perishable items are sourced fresh after your order is
              confirmed, ensuring you receive the highest quality produce
              directly from local farmers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Supporting Farmers</h3>
            </div>
            <p className="text-muted-foreground">
              Every order supports local Zambian farmers. We work directly with
              farming communities to ensure fair prices and sustainable
              practices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">Flexible Pickup</h3>
            </div>
            <p className="text-muted-foreground">
              We are not a delivery company. You can send your own rider or
              request us to help book one. Rider fees are paid separately by
              you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold">Community First</h3>
            </div>
            <p className="text-muted-foreground">
              We&apos;re building a community that values quality, freshness,
              and supporting local businesses. Join us in making a difference.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Our Promise</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We are committed to bringing you fresh, quality produce sourced from
          local hardworking Zambian farmers. Your satisfaction and the
          well-being of our farming community are at the heart of everything we
          do.
        </p>
      </div>
    </div>
  );
}
