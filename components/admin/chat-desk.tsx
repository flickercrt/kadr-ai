"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";

type Thread = { userId: string; name: string; preview: string; unread: number };
type Message = { id: string; body: string; senderRole: string };

export function ChatDesk({ userId }: { userId?: string }) {
  const { t } = useI18n();
  const { me } = useMe();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(true);

  const loadList = useCallback(async () => {
    const response = await fetch("/api/admin/chat");
    const data = (await response.json()) as { ready?: boolean; threads?: Thread[] };
    if (!response.ok) return;
    setReady(data.ready !== false);
    setThreads(data.threads ?? []);
  }, []);

  const loadThread = useCallback(async () => {
    if (!userId) return;
    const response = await fetch(`/api/admin/chat/${userId}`);
    const data = (await response.json()) as { messages?: Message[] };
    if (response.ok) setMessages(data.messages ?? []);
  }, [userId]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void loadList();
      void loadThread();
    }, 0);
    const poll = window.setInterval(() => {
      void loadList();
      void loadThread();
    }, 8000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(poll);
    };
  }, [loadList, loadThread]);

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[16rem_1fr]">
        <div>
          <AdminNav current="chat" />
          <h1 className="text-2xl font-semibold">{t.chatThread.adminTitle}</h1>
          {!ready ? <p className="mt-3 text-sm text-muted">{t.chatThread.schema}</p> : null}
          <ul className="mt-4 space-y-2">
            {threads.map((thread) => (
              <li key={thread.userId}>
                <Link href={`/admin/chat/${thread.userId}`} className="block rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="font-semibold">{thread.name}</span>
                  {thread.unread > 0 ? <span className="ms-2 rounded-full bg-[#FF6B4A] px-2 py-0.5 text-xs text-white">{thread.unread}</span> : null}
                  <p className="mt-1 text-muted">{thread.preview}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {userId ? (
          <section>
            <div className="space-y-2">
              {messages.map((message) => (
                <article key={message.id} className={message.senderRole === "admin" ? "ms-8 rounded-lg bg-primary/10 p-3 text-sm" : "me-8 rounded-lg border border-border bg-surface p-3 text-sm"}>
                  <p className="whitespace-pre-wrap leading-7">{message.body}</p>
                </article>
              ))}
            </div>
            <form
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  const response = await fetch(`/api/admin/chat/${userId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body }),
                  });
                  if (response.ok) {
                    setBody("");
                    await loadThread();
                    await loadList();
                  }
                })();
              }}
            >
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} />
              <Button type="submit">{t.chatThread.send}</Button>
            </form>
          </section>
        ) : (
          <p className="text-sm text-muted">{t.chatThread.pick}</p>
        )}
      </div>
    </div>
  );
}
