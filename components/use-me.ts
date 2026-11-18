"use client";

import { useCallback, useEffect, useState } from "react";
import type { MeResponse } from "@/lib/types";

export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) {
        setMe(null);
        setFailed(response.status !== 401 && response.status !== 403);
        return null;
      }
      const data = (await response.json()) as MeResponse;
      setMe(data);
      setFailed(false);
      return data;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(id);
  }, [reload]);

  return { me, failed, ready, reload };
}
