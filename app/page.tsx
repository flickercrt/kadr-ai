import { HomePage } from "@/components/landing/home-page";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFrame } from "@/components/site-frame";

export default function Page() {
  return (
    <SiteFrame showJoinToast>
      <JsonLd />
      <HomePage />
    </SiteFrame>
  );
}
