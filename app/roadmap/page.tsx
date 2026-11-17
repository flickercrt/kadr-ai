import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "خارطة الطريق",
  description: "ما هو متاح الآن في كادر، وما يأتي بعد البوتات الثلاثة والعضوية الشهرية.",
  path: "/roadmap",
});

export default function RoadmapPage() {
  return <RoadmapView />;
}
