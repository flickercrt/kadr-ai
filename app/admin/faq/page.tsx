import type { Metadata } from "next";
import { FaqAdmin } from "@/components/admin/faq-admin";

export const metadata: Metadata = { title: "الأسئلة الشائعة" };

export default function AdminFaqPage() {
  return <FaqAdmin />;
}
