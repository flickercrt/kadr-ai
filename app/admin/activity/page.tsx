import type { Metadata } from "next";
import { ActivityAdmin } from "@/components/admin/activity-admin";

export const metadata: Metadata = { title: "سجل النشاط" };

export default function ActivityPage() {
  return <ActivityAdmin />;
}
