"use client";

import { useEffect, useState } from "react";

export function useBotLinks() {
  const [links, setLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch("/api/bot-links")
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { links?: Record<string, string> };
          setLinks(data.links ?? {});
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  return links;
}
