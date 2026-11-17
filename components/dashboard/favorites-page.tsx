"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { useMe } from "@/components/use-me";

type Payload = {
  ready?: boolean;
  courses?: { id: string; title: string }[];
  lessons?: { id: string; title: string; courseId: string }[];
  sessions?: { id: string; title: string; botSlug: string }[];
};

export function FavoritesPage() {
  const { t } = useI18n();
  const { me } = useMe();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch("/api/favorites")
        .then(async (response) => {
          if (response.ok) setData((await response.json()) as Payload);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.favorites.title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted">{t.favorites.lead}</p>
        {data && data.ready === false ? <p className="mt-4 text-sm text-muted">{t.favorites.schema}</p> : null}
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.favorites.courses}</h2>
          <ul className="mt-2 space-y-2">
            {(data?.courses ?? []).map((course) => (
              <li key={course.id}><Link className="text-primary" href={`/dashboard/courses/${course.id}`}>{course.title}</Link></li>
            ))}
          </ul>
        </section>
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.favorites.lessons}</h2>
          <ul className="mt-2 space-y-2">
            {(data?.lessons ?? []).map((lesson) => (
              <li key={lesson.id}><Link className="text-primary" href={`/dashboard/courses/${lesson.courseId}`}>{lesson.title}</Link></li>
            ))}
          </ul>
        </section>
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.favorites.sessions}</h2>
          <ul className="mt-2 space-y-2">
            {(data?.sessions ?? []).map((session) => (
              <li key={session.id}><Link className="text-primary" href={`/dashboard/${session.botSlug}`}>{session.title}</Link></li>
            ))}
          </ul>
        </section>
        {data?.ready !== false && (data?.courses?.length ?? 0) + (data?.lessons?.length ?? 0) + (data?.sessions?.length ?? 0) === 0 ? (
          <p className="mt-6 text-sm text-muted">{t.favorites.empty}</p>
        ) : null}
      </div>
    </div>
  );
}
