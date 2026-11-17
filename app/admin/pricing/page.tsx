import type { Metadata } from "next";
import { PricingAdmin } from "@/components/admin/pricing-admin";

export const metadata: Metadata = { title: "السعر" };

export default function PricingPage() {
  return <PricingAdmin />;
}
