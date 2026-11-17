import type { Metadata } from "next";
import { InboxList } from "@/components/inbox/inbox-list";

export const metadata: Metadata = { title: "الرسائل" };

export default function MessagesPage() {
  return <InboxList />;
}
