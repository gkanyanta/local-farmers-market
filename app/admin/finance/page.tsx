import type { Metadata } from "next";
import { FinanceDashboardClient } from "./finance-dashboard-client";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Track revenue, expenses, and profit for the market.",
};

export const dynamic = "force-dynamic";

export default function FinancePage() {
  return <FinanceDashboardClient />;
}
