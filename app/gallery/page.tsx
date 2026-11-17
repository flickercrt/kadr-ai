import { GalleryView } from "@/components/gallery/gallery-view";
import { SiteFrame } from "@/components/site-frame";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "المعرض",
  description: "إطارات من كادر للتدريب على العين: مشاهد، بوسترات، وحركة.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <SiteFrame>
      <GalleryView />
    </SiteFrame>
  );
}
