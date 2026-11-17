"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { useI18n } from "@/components/locale-provider";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { MeResponse } from "@/lib/types";

export function AppHeader({ me }: { me: MeResponse | null }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!me?.user) return;
    const load = () => {
      void fetch("/api/chat-thread?peek=1")
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { unread?: number };
          setUnread(data.unread ?? 0);
        })
        .catch(() => undefined);
    };
    const start = window.setTimeout(load, 0);
    const poll = window.setInterval(load, 15000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(poll);
    };
  }, [me?.user]);

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border px-3 md:px-5">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="Kadr AI">
          <Logo locale={locale} />
        </Link>
        <Link href="/dashboard" className="hidden text-sm text-muted hover:text-foreground sm:inline">
          {t.nav.dashboard}
        </Link>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {me ? (
          <span className="hidden text-muted sm:inline">
            {me.usage.used}/{me.usage.limit}
          </span>
        ) : null}
        {me?.user ? (
          <Link href="/messages/chat" className="text-muted hover:text-foreground">
            {t.inbox.title}
            {unread > 0 ? <span className="ms-1 rounded-full bg-[#FF6B4A] px-1.5 text-xs text-white">{unread}</span> : null}
          </Link>
        ) : null}
        <Link href="/account" className="inline-flex items-center gap-2 text-muted hover:text-foreground">
          {me?.user ? <Avatar name={me.user.name} src={me.user.avatar} size={28} /> : null}
          {t.nav.account}
        </Link>
        <button
          type="button"
          className="h-9 rounded-full border border-border px-3 text-xs font-semibold"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          aria-label={t.lang.label}
        >
          {t.lang.short}
        </button>
        {me?.user ? (
          <button type="button" onClick={logout} className="text-muted hover:text-foreground">
            {t.common.logout}
          </button>
        ) : null}
      </div>
    </header>
  );
}
