import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse fresh vegetables, fruits, and everyday goods from local Zambian farmers.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
