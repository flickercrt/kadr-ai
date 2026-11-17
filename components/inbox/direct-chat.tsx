"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";

type Message = { id: string; body: string; senderRole: string; createdAt: string };

export function DirectChat() {
  const { t } = useI18n();
  const { me } = useMe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/chat-thread");
    const data = (await response.json()) as { ready?: boolean; messages?: Message[] };
    if (!response.ok) return;
    setReady(data.ready !== false);
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => void load(), 0);
    const poll = window.setInterval(() => void load(), 8000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(poll);
    };
  }, [load]);

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-8">
        <Link href="/messages" className="text-sm text-primary">{t.inbox.back}</Link>
        <h1 className="mt-3 text-3xl font-semibold">{t.chatThread.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.chatThread.lead}</p>
        {!ready ? <p className="mt-4 text-sm text-muted">{t.chatThread.schema}</p> : null}
        <div className="mt-4 flex-1 space-y-2">
          {messages.map((message) => (
            <article key={message.id} className={message.senderRole === "student" ? "ms-8 rounded-lg bg-primary/10 p-3 text-sm" : "me-8 rounded-lg border border-border bg-surface p-3 text-sm"}>
              <p className="whitespace-pre-wrap leading-7">{message.body}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-muted">{t.chatThread.empty}</p> : null}
        </div>
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setPending(true);
              const response = await fetch("/api/chat-thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body }),
              });
              setPending(false);
              if (response.ok) {
                setBody("");
                await load();
              }
            })();
          }}
        >
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} placeholder={t.chatThread.placeholder} />
          <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.chatThread.send}</Button>
        </form>
      </div>
    </div>
  );
}
