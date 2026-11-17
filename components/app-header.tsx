"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { useI18n } from "@/components/locale-provider";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { MeResponse } from "@/lib/types";

export function AppHeader({ me }: { me: MeResponse | null }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

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
