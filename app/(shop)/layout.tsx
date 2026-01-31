import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PWAPrompt } from "@/components/layout/pwa-prompt";
import { StickyCartButton } from "@/components/cart/sticky-cart-button";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <StickyCartButton />
      <PWAPrompt />
    </div>
  );
}
