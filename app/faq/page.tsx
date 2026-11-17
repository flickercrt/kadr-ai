import type { Metadata } from "next";
import { FaqPage } from "@/components/faq/faq-page";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "أسئلة العضوية والإلغاء وما تتعلمه في كادر، والبوتات، والدعم عبر واتساب.",
};

export default function Page() {
  return (
    <SiteFrame>
      <FaqPage />
    </SiteFrame>
  );
}
