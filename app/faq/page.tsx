import { FaqPage } from "@/components/faq/faq-page";
import { SiteFrame } from "@/components/site-frame";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "الأسئلة الشائعة",
  description: "أسئلة العضوية والإلغاء وما تتعلمه في كادر، والبوتات، والدعم عبر واتساب.",
  path: "/faq",
});

export default function Page() {
  return (
    <SiteFrame>
      <FaqPage />
    </SiteFrame>
  );
}
