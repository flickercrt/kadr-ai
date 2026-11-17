const ID = /^[\w-]{11}$/;

/** Pull a YouTube id out of a watch, share, embed, or shorts URL. Returns null for other links. */
export function youtubeIdFromUrl(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (ID.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return ID.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const fromQuery = url.searchParams.get("v") ?? "";
      if (ID.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const head = parts[0];
      const id = head === "embed" || head === "shorts" || head === "live" ? (parts[1] ?? "") : "";
      return ID.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(input: string) {
  const id = youtubeIdFromUrl(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function isHttpUrl(input: string) {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
