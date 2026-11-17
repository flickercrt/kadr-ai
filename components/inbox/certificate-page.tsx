"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";

type Certificate = { studentName: string; courseTitle: string; issuedAt: string };

export function CertificatePage({ certificateId }: { certificateId: string }) {
  const { t } = useI18n();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch(`/api/certificates/${certificateId}`);
        const data = (await response.json()) as Certificate & { error?: { ar?: string } };
        if (!response.ok) {
          setError(data.error?.ar || t.common.error);
          return;
        }
        setCertificate(data);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [certificateId, t]);

  return (
    <div className="min-h-dvh bg-[#0E1116] px-4 py-10 text-[#F5F7FA] print:bg-white print:text-black">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href="/messages" className="text-sm text-[#00D4B4]">{t.inbox.back}</Link>
          <button type="button" className="rounded-lg bg-[#00D4B4] px-4 py-2 text-sm font-semibold text-[#0E1116]" onClick={() => window.print()}>
            {t.inbox.download}
          </button>
        </div>
        {error ? <p className="text-sm text-[#FF6B4A]">{error}</p> : null}
        {certificate ? (
          <article className="relative overflow-hidden rounded-lg border border-[#00D4B4] bg-[#161B22] p-10 print:border-black print:bg-white">
            <div className="absolute inset-3 border border-[#00D4B4]/40 print:border-black/30" />
            <div className="relative text-center">
              <p className="text-sm font-semibold tracking-[0.3em] text-[#00D4B4] print:text-black">KADR AI</p>
              <h1 className="mt-6 text-4xl font-semibold">{t.inbox.certificate}</h1>
              <p className="mt-8 text-sm text-[#8B949E] print:text-black">{t.inbox.awardedTo}</p>
              <p className="mt-2 text-3xl font-semibold">{certificate.studentName}</p>
              <p className="mt-8 text-sm text-[#8B949E] print:text-black">{t.inbox.forCourse}</p>
              <p className="mt-2 text-2xl">{certificate.courseTitle}</p>
              <p className="mt-10 text-sm" dir="ltr">{certificate.issuedAt.slice(0, 10)}</p>
              <p className="mt-6 text-xs text-[#FF6B4A] print:text-black">كادر AI</p>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
