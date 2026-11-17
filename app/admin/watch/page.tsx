import type { Metadata } from "next";
import { WatchAdmin } from "@/components/admin/watch-admin";

export const metadata: Metadata = { title: "شاهد هذا أولاً" };

export default function WatchAdminPage() {
  return <WatchAdmin />;
}
