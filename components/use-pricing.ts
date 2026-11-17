"use client";

import { useEffect, useState } from "react";
import { configPricing, type PricingView } from "@/lib/pricing";

export function usePricing() {
  const [pricing, setPricing] = useState<PricingView>(() => configPricing());

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetch("/api/pricing")
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as PricingView;
          if (typeof data.salePrice === "number" && typeof data.listPrice === "number") setPricing(data);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return pricing;
}
