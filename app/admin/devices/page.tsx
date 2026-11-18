import type { Metadata } from "next";
import { DevicesAdmin } from "@/components/admin/devices-admin";

export const metadata: Metadata = { title: "الأجهزة" };

export default function DevicesPage() {
  return <DevicesAdmin />;
}
