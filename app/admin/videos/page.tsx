import type { Metadata } from "next";
import { VideosAdmin } from "@/components/admin/videos-admin";

export const metadata: Metadata = { title: "فيديوهات الصفحة" };

export default function AdminVideosPage() {
  return <VideosAdmin />;
}
