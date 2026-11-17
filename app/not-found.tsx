"use client";

import Link from "next/link";
import { useI18n } from "@/components/locale-provider";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center px-4">
      <p className="font-mono text-sm text-secondary">404</p>
      <h1 className="mt-2 text-3xl font-semibold">{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{t.notFound.body}</p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        {t.common.backHome}
      </Link>
    </div>
  );
}
