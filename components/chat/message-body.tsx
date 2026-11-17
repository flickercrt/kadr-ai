"use client";

import { useState } from "react";
import { useI18n } from "@/components/locale-provider";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function RichText({ value }: { value: string }) {
  const blocks = value.trim().split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-7">
      {blocks.map((block, index) => (
        <p key={index}>
          {block.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

export function MessageBody({ content }: { content: string }) {
  const { t } = useI18n();
  const parts: { kind: "text" | "code"; value: string }[] = [];
  const pattern = /```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g;
  let last = 0;
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: "text", value: content.slice(last, index) });
    parts.push({ kind: "code", value: match[1].replace(/^\n/, "").replace(/\n$/, "") });
    last = index + match[0].length;
  }
  if (last < content.length) parts.push({ kind: "text", value: content.slice(last) });
  if (parts.length === 0) parts.push({ kind: "text", value: content });

  return (
    <div className="space-y-3">
      {parts.map((part, index) =>
        part.kind === "code" ? (
          <CodeBlock key={index} value={part.value} copyLabel={t.common.copy} copiedLabel={t.common.copied} />
        ) : (
          <RichText key={index} value={part.value} />
        ),
      )}
    </div>
  );
}

function CodeBlock({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
        <span dir="ltr">prompt</span>
        <button
          type="button"
          className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
          onClick={async () => {
            await copyText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre dir="ltr" className="overflow-x-auto p-4 text-left text-sm leading-7 text-foreground">
        {value}
      </pre>
    </div>
  );
}
