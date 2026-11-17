import type { Metadata } from "next";
import { GalleryView } from "@/components/gallery/gallery-view";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "المعرض" };

export default function GalleryPage() {
  return (
    <SiteFrame>
      <GalleryView />
    </SiteFrame>
  );
}
