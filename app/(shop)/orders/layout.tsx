import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View and track your order history.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
