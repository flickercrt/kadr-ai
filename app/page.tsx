import { HomePage } from "@/components/landing/home-page";
import { SiteFrame } from "@/components/site-frame";

export default function Page() {
  return (
    <SiteFrame showJoinToast>
      <HomePage />
    </SiteFrame>
  );
}
