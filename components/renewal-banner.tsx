"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";

type Reminder = { show?: boolean; daysLeft?: number | null; whatsapp?: string };

export function RenewalBanner() {
  const { t, locale } = useI18n();
  const [reminder, setReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch(`/api/reminder?locale=${locale}`)
        .then(async (response) => {
          if (!response.ok) return;
          setReminder((await response.json()) as Reminder);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, [locale]);

  if (!reminder?.show) return null;
  return (
    <div className="mt-4 rounded-lg border border-[#FF6B4A]/50 bg-[#FF6B4A]/10 p-4 text-sm">
      <p className="font-semibold text-[#FF6B4A]">{t.reminder.title}</p>
      <p className="mt-1 leading-7">{t.reminder.body.replace("{days}", String(reminder.daysLeft ?? ""))}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/account" className="font-semibold text-primary">{t.reminder.renew}</Link>
        {reminder.whatsapp ? (
          <a href={reminder.whatsapp} className="font-semibold text-primary" target="_blank" rel="noreferrer">{t.reminder.whatsapp}</a>
        ) : null}
      </div>
    </div>
  );
}
