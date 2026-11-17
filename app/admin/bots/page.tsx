import type { Metadata } from "next";
import { BotLinksAdmin } from "@/components/admin/bot-links-admin";

export const metadata: Metadata = { title: "روابط البوتات" };

export default function BotLinksPage() {
  return <BotLinksAdmin />;
}
