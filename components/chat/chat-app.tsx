"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BotConfig } from "@/config/bots";
import { offer, whatsappHref } from "@/config/site";
import { buildDemoReply } from "@/lib/demo-reply";
import type { MeResponse, MessageRecord, SessionRecord } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { MessageBody } from "@/components/chat/message-body";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { cn } from "@/lib/utils";

type LocalMessage = MessageRecord & { sessionId: string };
type Store = { sessions: SessionRecord[]; messages: LocalMessage[] };

const STORE_KEY = "kadr-demo-store-v1";

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { sessions: [], messages: [] };
    return JSON.parse(raw) as Store;
  } catch {
    return { sessions: [], messages: [] };
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function seedStore(): Store {
  const store = readStore();
  if (store.sessions.some((session) => session.id === "demo-scenes")) return store;
  const now = new Date().toISOString();
  const content =
    "أمينة أرشيف في مبنى حجري، ليلة ممطرة. أريد ورقة شخصية ولقطة قريبة لوجهها.";
  store.sessions.unshift({
    id: "demo-scenes",
    botSlug: "scenes",
    title: "أرشيف تحت المطر",
    updatedAt: now,
  });
  store.messages.push(
    { id: "demo-user", sessionId: "demo-scenes", role: "user", content, createdAt: now },
    {
      id: "demo-assistant",
      sessionId: "demo-scenes",
      role: "assistant",
      content: buildDemoReply("scenes", content, "ar"),
      createdAt: now,
    },
  );
  writeStore(store);
  return store;
}

async function readSse(response: Response, onDelta: (text: string) => void) {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((item) => item.startsWith("data:"));
      if (!line) continue;
      const payload = JSON.parse(line.slice(5).trim()) as { type?: string; text?: string };
      if (payload.type === "delta" && payload.text) onDelta(payload.text);
      if (payload.type === "error") throw new Error("model");
    }
  }
}

export function ChatApp({ bot }: { bot: BotConfig }) {
  const { t, tx, locale } = useI18n();
  const { me, failed, reload } = useMe();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [rename, setRename] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const local = Boolean(me && !me.user && me.mode === "demo");

  useEffect(() => {
    if (!me) return;
    const id = window.setTimeout(() => {
      if (local) {
        const store = bot.slug === "scenes" ? seedStore() : readStore();
        const list = store.sessions.filter((session) => session.botSlug === bot.slug);
        setSessions(list);
        const first = list[0] ?? null;
        setActiveId(first?.id ?? null);
        setMessages(first ? store.messages.filter((message) => message.sessionId === first.id) : []);
        return;
      }
      if (!me.user) return;
      void fetch(`/api/sessions?bot=${bot.slug}`)
        .then((response) => response.json())
        .then(async (data: { sessions?: SessionRecord[] }) => {
          const list = data.sessions ?? [];
          setSessions(list);
          const first = list[0];
          if (!first) return;
          setActiveId(first.id);
          const messageResponse = await fetch(`/api/sessions/${first.id}/messages`);
          const messageData = (await messageResponse.json()) as { messages?: MessageRecord[] };
          setMessages(messageData.messages ?? []);
        });
    }, 0);
    return () => window.clearTimeout(id);
  }, [me, local, bot.slug]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, streaming]);

  async function openSession(id: string) {
    setActiveId(id);
    setMenu(false);
    setError("");
    if (local) {
      const store = readStore();
      setMessages(store.messages.filter((message) => message.sessionId === id));
      return;
    }
    const response = await fetch(`/api/sessions/${id}/messages`);
    const data = (await response.json()) as { messages?: MessageRecord[] };
    setMessages(data.messages ?? []);
  }

  async function createSession(title?: string) {
    if (local) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        botSlug: bot.slug,
        title: title || t.chat.untitled,
        updatedAt: new Date().toISOString(),
      };
      const store = readStore();
      store.sessions.unshift(session);
      writeStore(store);
      setSessions(store.sessions.filter((item) => item.botSlug === bot.slug));
      setActiveId(session.id);
      setMessages([]);
      return session;
    }
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botSlug: bot.slug, title: title || t.chat.untitled }),
    });
    const data = (await response.json()) as { session?: SessionRecord };
    if (!data.session) throw new Error("create");
    setSessions((current) => [data.session!, ...current]);
    setActiveId(data.session.id);
    setMessages([]);
    return data.session;
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setError("");
    setDraft("");
    setStreaming(true);
    try {
      let sessionId = activeId;
      if (!sessionId) {
        const created = await createSession(content.slice(0, 72));
        sessionId = created.id;
      }
      const userMessage: MessageRecord = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const assistantId = crypto.randomUUID();
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botSlug: bot.slug, content, locale, sessionId: local ? undefined : sessionId }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: { ar?: string; en?: string } };
        const message = locale === "ar" ? data.error?.ar : data.error?.en;
        setError(message || t.common.error);
        setMessages((current) => current.filter((item) => item.id !== assistantId));
        return;
      }
      let assembled = "";
      await readSse(response, (delta) => {
        assembled += delta;
        setMessages((current) =>
          current.map((item) => (item.id === assistantId ? { ...item, content: item.content + delta } : item)),
        );
      });
      if (local && sessionId) {
        const store = readStore();
        store.messages.push({ ...userMessage, sessionId });
        store.messages.push({
          id: assistantId,
          sessionId,
          role: "assistant",
          content: assembled,
          createdAt: new Date().toISOString(),
        });
        store.sessions = store.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                title: session.title === t.chat.untitled ? content.slice(0, 72) : session.title,
                updatedAt: new Date().toISOString(),
              }
            : session,
        );
        writeStore(store);
        setSessions(store.sessions.filter((session) => session.botSlug === bot.slug));
      } else {
        void reload();
      }
    } catch {
      setError(t.chat.unavailable);
    } finally {
      setStreaming(false);
    }
  }

  async function saveTitle() {
    if (!activeId || !rename.trim()) return;
    const title = rename.trim().slice(0, 80);
    if (local) {
      const store = readStore();
      store.sessions = store.sessions.map((session) => (session.id === activeId ? { ...session, title } : session));
      writeStore(store);
      setSessions(store.sessions.filter((session) => session.botSlug === bot.slug));
    } else {
      await fetch(`/api/sessions/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setSessions((current) => current.map((session) => (session.id === activeId ? { ...session, title } : session)));
    }
    setRename("");
  }

  async function removeSession() {
    if (!activeId) return;
    if (local) {
      const store = readStore();
      store.sessions = store.sessions.filter((session) => session.id !== activeId);
      store.messages = store.messages.filter((message) => message.sessionId !== activeId);
      writeStore(store);
      const list = store.sessions.filter((session) => session.botSlug === bot.slug);
      setSessions(list);
      setActiveId(list[0]?.id ?? null);
      setMessages(list[0] ? store.messages.filter((message) => message.sessionId === list[0].id) : []);
    } else {
      await fetch(`/api/sessions/${activeId}`, { method: "DELETE" });
      const list = sessions.filter((session) => session.id !== activeId);
      setSessions(list);
      setActiveId(list[0]?.id ?? null);
      setMessages([]);
      if (list[0]) await openSession(list[0].id);
    }
    setConfirmDelete(false);
  }

  const locked = Boolean(me && !me.subscription.active);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppHeader me={me} />
      <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[280px_1fr]">
        <aside className={cn("border-border bg-surface md:border-e", menu ? "fixed inset-x-0 top-16 bottom-0 z-30 md:static" : "hidden md:block")}>
          <div className="flex items-center justify-between p-3">
            <p className="text-sm font-semibold">{t.chat.sessions}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void createSession();
                setMenu(false);
              }}
            >
              {t.chat.new}
            </Button>
          </div>
          <ul className="max-h-[calc(100dvh-8rem)] space-y-1 overflow-auto px-2 pb-4">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => void openSession(session.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-start text-sm",
                    session.id === activeId ? "bg-primary/15 text-foreground" : "text-muted hover:bg-white/5",
                  )}
                >
                  {session.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
            <div>
              <button type="button" className="text-xs text-primary md:hidden" onClick={() => setMenu(true)}>
                {t.chat.sessions}
              </button>
              <h1 className="text-lg font-semibold">{tx(bot.name)}</h1>
            </div>
            {activeId ? (
              <div className="flex items-center gap-2">
                <input
                  value={rename}
                  onChange={(event) => setRename(event.target.value)}
                  placeholder={t.common.rename}
                  className="hidden h-9 w-36 rounded-lg border border-border bg-background px-2 text-sm md:block"
                />
                <button type="button" className="text-xs text-muted" onClick={() => void saveTitle()}>
                  {t.common.save}
                </button>
                <button type="button" className="text-xs text-secondary" onClick={() => setConfirmDelete(true)}>
                  {t.common.delete}
                </button>
              </div>
            ) : null}
          </div>
          <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-auto px-3 py-4 md:px-6">
            {failed ? <p className="text-sm text-secondary">{t.common.error}</p> : null}
            {!me ? <p className="text-sm text-muted">{t.common.loading}</p> : null}
            {me?.mode === "demo" && !me.user ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">{t.dash.demoBody}</p>
            ) : null}
            {messages.length === 0 && !streaming ? (
              <div>
                <p className="text-muted">{t.chat.empty}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {bot.starters.map((starter) => (
                    <button
                      key={starter.en}
                      type="button"
                      className="rounded-lg border border-border bg-surface px-3 py-3 text-start text-sm hover:border-primary/40"
                      onClick={() => void send(tx(starter))}
                    >
                      {tx(starter)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn(
                  "max-w-3xl rounded-lg px-4 py-3",
                  message.role === "user" ? "ms-auto bg-surface border border-border" : "border border-transparent",
                )}
              >
                {message.role === "assistant" ? (
                  message.content ? <MessageBody content={message.content} /> : <p className="text-sm text-muted">{t.chat.thinking}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                )}
              </article>
            ))}
          </div>
          <div className="border-t border-border p-3">
            {error ? <p className="mb-2 text-sm text-secondary">{error}</p> : null}
            {locked ? (
              <Paywall me={me} />
            ) : (
              <form
                className="mx-auto flex max-w-3xl items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(draft);
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t.chat.placeholder}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send(draft);
                    }
                  }}
                />
                <Button type="submit" disabled={streaming || !draft.trim()}>
                  {streaming ? t.chat.thinking : t.chat.send}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
      <Modal open={confirmDelete} onOpenChange={setConfirmDelete} title={t.chat.deleteTitle}>
        <p className="text-sm text-muted">{t.chat.deleteBody}</p>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" onClick={() => void removeSession()}>
            {t.common.delete}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
            {t.common.cancel}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Paywall({ me }: { me: MeResponse | null }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");

  async function checkout() {
    if (!me?.user) {
      router.push("/signup?next=/account");
      return;
    }
    const response = await fetch("/api/billing/checkout", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: { ar?: string; en?: string } };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(locale === "ar" ? data.error?.ar || t.billing.missing : data.error?.en || t.billing.missing);
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-5">
      <h2 className="text-xl font-semibold">{t.chat.paywallTitle}</h2>
      <p className="mt-2 text-sm leading-7 text-muted">{t.chat.paywallBody}</p>
      <p className="mt-3 text-2xl font-semibold text-primary">
        <span className="me-2 text-base text-muted line-through">
          {offer.currencySymbol}
          {offer.compareAt}
        </span>
        {offer.currencySymbol}
        {offer.price}
        <span className="text-sm text-muted">{t.common.perMonth}</span>
      </p>
      {error ? <p className="mt-2 text-sm text-secondary">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void checkout()}>
          {me?.user ? t.chat.subscribe : t.chat.loginToSubscribe}
        </Button>
        <a href={whatsappHref(locale)} className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm" target="_blank" rel="noreferrer">
          {t.common.whatsapp}
        </a>
      </div>
    </div>
  );
}

export function MissingBot() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="text-2xl font-semibold">{t.chat.missing}</h1>
      <Link href="/dashboard" className="mt-4 inline-block text-primary">
        {t.nav.dashboard}
      </Link>
    </div>
  );
}

export function SoonBot({ bot }: { bot: BotConfig }) {
  const { t, tx } = useI18n();
  const { me } = useMe();
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader me={me} />
      <div className="mx-auto max-w-xl px-4 py-16">
        <p className="font-mono text-sm text-secondary">{bot.numeral}</p>
        <h1 className="mt-2 text-3xl font-semibold">{tx(bot.name)}</h1>
        <p className="mt-3 text-muted">{t.chat.soonTitle}</p>
        <p className="mt-2 text-sm leading-7 text-muted">{t.chat.soonBody}</p>
        <Link href="/dashboard" className="mt-6 inline-block text-primary">
          {t.nav.dashboard}
        </Link>
      </div>
    </div>
  );
}
