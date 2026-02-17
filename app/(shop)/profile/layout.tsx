import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your account settings and profile.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
