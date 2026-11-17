"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";

const COOKIE = "kadr-maintenance=1";

export function MaintenanceBanner() {
  const { t } = useI18n();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setOn(document.cookie.split("; ").includes(COOKIE));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!on) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b border-[#FF6B4A]/50 bg-[#161B22] px-4 py-2 text-sm">
      <span className="font-semibold text-[#FF6B4A]">{t.maintenance.banner}</span>
      <Link href="/admin/maintenance" className="rounded-full bg-[#00D4B4] px-3 py-1 text-xs font-semibold text-[#0E1116]">
        {t.maintenance.bannerAction}
      </Link>
    </div>
  );
}
