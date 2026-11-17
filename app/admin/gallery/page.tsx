import type { Metadata } from "next";
import { GalleryAdmin } from "@/components/admin/gallery-admin";

export const metadata: Metadata = { title: "المعرض" };

export default function AdminGalleryPage() {
  return <GalleryAdmin />;
}
