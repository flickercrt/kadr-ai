"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";

type Message = { id: string; body: string; kind: string; senderRole: string; createdAt: string };

export function ThreadView({ threadId }: { threadId: string }) {
  const { t } = useI18n();
  const { me } = useMe();
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch(`/api/inbox/${threadId}`);
        const data = (await response.json()) as { subject?: string; messages?: Message[] };
        if (!response.ok) {
          setFailed(true);
          return;
        }
        setSubject(data.subject ?? "");
        setMessages(data.messages ?? []);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [threadId]);

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/messages" className="text-sm text-primary">{t.inbox.back}</Link>
        <h1 className="mt-4 text-3xl font-semibold">{subject || t.inbox.title}</h1>
        {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
        <div className="mt-6 space-y-3">
          {messages.map((message) =>
            message.kind === "certificate" ? (
              <article key={message.id} className="rounded-lg border border-[#FF6B4A]/50 bg-surface p-5">
                <p className="text-xs font-semibold text-[#FF6B4A]">{t.inbox.certificate}</p>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7">{message.body.replace(/\/certificates\/[0-9a-f-]{36}/i, "").trim()}</pre>
                {message.body.match(/\/certificates\/[0-9a-f-]{36}/i) ? (
                  <Link href={message.body.match(/\/certificates\/[0-9a-f-]{36}/i)?.[0] ?? "/messages"} className="mt-3 inline-block text-sm text-primary">
                    {t.inbox.download}
                  </Link>
                ) : (
                  <button type="button" className="mt-3 text-sm text-primary" onClick={() => window.print()}>{t.inbox.print}</button>
                )}
              </article>
            ) : (
              <article key={message.id} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs text-muted">{message.senderRole}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.body}</p>
              </article>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
