import type { Metadata } from "next";
import { TimelinePage } from "@/components/dashboard/timeline-page";

export const metadata: Metadata = { title: "مسار التعلم" };

export default function Page() {
  return <TimelinePage />;
}
