import type { Metadata } from "next";
import { MaintenanceAdmin } from "@/components/admin/maintenance-admin";

export const metadata: Metadata = { title: "الصيانة" };

export default function MaintenancePage() {
  return <MaintenanceAdmin />;
}
