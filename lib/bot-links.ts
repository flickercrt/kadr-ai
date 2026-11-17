export function safeBotDestination(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    return null;
  }
  return null;
}

export function botCardHref(slug: string, enabled: boolean, links: Record<string, string>) {
  const custom = links[slug]?.trim();
  if (custom) return custom;
  return enabled ? `/dashboard/${slug}` : "";
}
