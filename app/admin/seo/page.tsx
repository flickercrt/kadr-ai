import type { Metadata } from "next";
import { SeoAdmin } from "@/components/admin/seo-admin";

export const metadata: Metadata = { title: "تهيئة البحث" };

export default function AdminSeoPage() {
  return <SeoAdmin />;
}
