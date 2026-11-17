import type { Metadata } from "next";
import { ChatDesk } from "@/components/admin/chat-desk";

export const metadata: Metadata = { title: "المحادثات" };

export default function AdminChatPage() {
  return <ChatDesk />;
}
