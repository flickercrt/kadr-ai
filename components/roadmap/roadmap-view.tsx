"use client";

import { roadmap } from "@/config/site";
import { SiteFrame } from "@/components/site-frame";
import { useI18n } from "@/components/locale-provider";

export function RoadmapView() {
  const { t, tx } = useI18n();
  return (
    <SiteFrame>
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-4xl font-semibold">{t.roadmap.title}</h1>
        <p className="mt-3 text-muted">{t.roadmap.lead}</p>
        <ol className="mt-8 space-y-4">
          {roadmap.map((phase) => (
            <li key={phase.numeral} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-primary">{phase.numeral}</span>
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                  {tx(phase.state)}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{tx(phase.title)}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{tx(phase.body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </SiteFrame>
  );
}
