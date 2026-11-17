import { Suspense } from "react";
import { getBot } from "@/config/bots";
import { ChatApp, MissingBot, SoonBot } from "@/components/chat/chat-app";

export default function BotPage({ params }: { params: Promise<{ bot: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <BotRoute params={params} />
    </Suspense>
  );
}

async function BotRoute({ params }: { params: Promise<{ bot: string }> }) {
  const { bot: slug } = await params;
  const bot = getBot(slug);
  if (!bot) return <MissingBot />;
  if (!bot.enabled) return <SoonBot bot={bot} />;
  return <ChatApp bot={bot} />;
}
