"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/faq";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-surface">
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-start text-base font-semibold"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : item.id)}
              >
                <span>{item.question}</span>
                <span className="text-primary" aria-hidden>{expanded ? "−" : "+"}</span>
              </button>
            </h3>
            {expanded ? <p className="px-4 pb-4 text-sm leading-7 text-muted">{item.answer}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
