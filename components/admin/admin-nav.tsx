"use client";

import Link from "next/link";
import { useI18n } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", id: "members" },
  { href: "/admin/courses", id: "courses" },
] as const;

export function AdminNav({ current }: { current: (typeof links)[number]["id"] }) {
  const { t } = useI18n();
  const label = {
    members: t.catalog.members,
    courses: t.catalog.nav,
  };
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            current === link.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground",
          )}
          aria-current={current === link.id ? "page" : undefined}
        >
          {label[link.id]}
        </Link>
      ))}
    </nav>
  );
}
