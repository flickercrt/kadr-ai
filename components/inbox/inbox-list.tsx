"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";

type Thread = { id: string; subject: string; updatedAt: string; preview: string; kind: string };
type Certificate = { id: string; courseTitle: string; studentName: string; issuedAt: string };

export function InboxList() {
  const { t } = useI18n();
  const { me } = useMe();
  const [ready, setReady] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/inbox");
        const data = (await response.json()) as { ready?: boolean; threads?: Thread[]; certificates?: Certificate[] };
        if (!response.ok) {
          setFailed(true);
          return;
        }
        setReady(data.ready !== false);
        setThreads(data.threads ?? []);
        setCertificates(data.certificates ?? []);
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.inbox.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.inbox.lead}</p>
        {failed ? <p className="mt-4 text-sm text-secondary">{t.common.error}</p> : null}
        {!ready ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.inbox.schema}</p> : null}
        {certificates.length > 0 ? (
          <section className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">{t.inbox.certificates}</h2>
            {certificates.map((certificate) => (
              <article key={certificate.id} className="rounded-lg border border-[#FF6B4A]/40 bg-surface p-4">
                <p className="text-xs font-semibold text-[#FF6B4A]">{t.inbox.certificate}</p>
                <h3 className="mt-2 text-xl font-semibold">{certificate.courseTitle}</h3>
                <p className="mt-1 text-sm text-muted">{certificate.studentName}</p>
                <p className="mt-1 text-xs text-muted" dir="ltr">{certificate.issuedAt.slice(0, 10)}</p>
              </article>
            ))}
          </section>
        ) : null}
        <ul className="mt-6 space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link href={`/messages/${thread.id}`} className="block rounded-lg border border-border bg-surface p-4 hover:border-primary/50">
                <p className="font-semibold">{thread.subject}</p>
                <p className="mt-1 text-sm text-muted">{thread.preview}</p>
              </Link>
            </li>
          ))}
        </ul>
        {ready && threads.length === 0 && certificates.length === 0 ? <p className="mt-6 text-sm text-muted">{t.inbox.empty}</p> : null}
      </div>
    </div>
  );
}
