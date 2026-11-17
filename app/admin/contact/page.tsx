import type { Metadata } from "next";
import { ContactAdmin } from "@/components/admin/contact-admin";

export const metadata: Metadata = { title: "رسائل التواصل" };

export default function AdminContactPage() {
  return <ContactAdmin />;
}
