import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create an account at Local Farmers Market.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container h-14 flex items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Local Farmers Market
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-8">
        {children}
      </main>
    </div>
  );
}
