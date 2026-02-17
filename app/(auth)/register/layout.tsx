import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account to order fresh produce from Local Farmers Market.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
