import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";

export const metadata: Metadata = { title: "الحساب" };

export default function AccountPage() {
  return <AccountPanel />;
}
