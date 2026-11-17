"use client";

import { useEffect, useState } from "react";
import { offer } from "@/config/site";
import { useI18n } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

function parts(target: string, now: number) {
  const diff = Math.max(0, new Date(target).getTime() - now);
  const total = Math.floor(diff / 1000);
  return {
    done: diff <= 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function useCountdown(target: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const start = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, []);
  if (!target || now === null) return null;
  return parts(target, now);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function Countdown({
  endsAt,
  compact = false,
  onCoral = false,
}: {
  endsAt?: string | null;
  compact?: boolean;
  onCoral?: boolean;
}) {
  const { t } = useI18n();
  const target = endsAt === undefined ? offer.countdownEndsAt : endsAt;
  const left = useCountdown(target);
  if (!target) return null;
  if (!left) {
    return <div className={compact ? "h-6 w-28" : "h-16"} aria-hidden />;
  }
  if (left.done) {
    return <p className={cn("text-sm", onCoral ? "text-white" : "text-secondary")}>{t.countdown.ended}</p>;
  }
  const cells = [
    [t.countdown.days, String(left.days)],
    [t.countdown.hours, pad(left.hours)],
    [t.countdown.minutes, pad(left.minutes)],
    [t.countdown.seconds, pad(left.seconds)],
  ] as const;

  if (compact) {
    return (
      <span className={cn("tabular-nums font-semibold", onCoral ? "text-white" : "text-secondary")}>
        {left.days}d {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cells.map(([label, value]) => (
        <div key={label} className="min-w-16 rounded-lg border border-border bg-surface px-3 py-2 text-center">
          <div className="text-xl font-semibold tabular-nums text-secondary">{value}</div>
          <div className="text-[11px] text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
