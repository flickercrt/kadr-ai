import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import type { Metadata } from "next";
import { brand } from "@/config/site";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string;
};

const SEO_TAG = "seo";

export function defaultSeo(): SeoSettings {
  return {
    title: `${brand.nameAr} — ${brand.tagline.ar}`,
    description: brand.description.ar,
    keywords: "كادر, ذكاء اصطناعي, سينما, إعلان, برومبت",
  };
}

/** Drop the cached public SEO row after an admin save. */
export function clearSeoCache() {
  revalidateTag(SEO_TAG, "max");
}

/**
 * Public SEO row for metadata and JSON-LD.
 * Cached so generateMetadata never touches cookies, headers, or an uncached fetch.
 * A missing table or a failed read keeps the built-in Arabic copy.
 */
export async function readSeo(): Promise<SeoSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(SEO_TAG);
  const base = defaultSeo();
  if (!isSupabaseConfigured()) return base;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return base;
  try {
    const response = await fetch(`${url}/rest/v1/seo_settings?id=eq.1&select=title,description,keywords`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return base;
    const rows = (await response.json()) as { title?: string; description?: string; keywords?: string }[] | { message?: string };
    const row = Array.isArray(rows) ? rows[0] : undefined;
    return {
      title: row?.title?.trim() || base.title,
      description: row?.description?.trim() || base.description,
      keywords: row?.keywords?.trim() || base.keywords,
    };
  } catch {
    return base;
  }
}

export function absoluteUrl(path: string) {
  if (!path || path === "/") return siteUrl();
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(input: { title: string; description: string; path: string }): Metadata {
  const url = absoluteUrl(input.path);
  const fullTitle = `${input.title} · ${brand.nameAr}`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: brand.nameAr,
      locale: "ar_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
    },
  };
}
