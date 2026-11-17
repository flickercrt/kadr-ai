import type { Metadata } from "next";
import { DirectChat } from "@/components/inbox/direct-chat";

export const metadata: Metadata = { title: "محادثة الإدارة" };

export default function DirectChatPage() {
  return <DirectChat />;
}
