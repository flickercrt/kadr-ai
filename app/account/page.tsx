import { AccountPanel } from "@/components/account/account-panel";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "الحساب",
  description: "حالة العضوية وإدارة الدفع في كادر.",
  path: "/account",
});

export default function AccountPage() {
  return <AccountPanel />;
}
