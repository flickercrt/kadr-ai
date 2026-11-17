"use client";

import { useI18n } from "@/components/locale-provider";
import { formatMoney, type PricingView } from "@/lib/pricing";

export function PriceOffer({ pricing, large = false }: { pricing: PricingView; large?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-end gap-2">
      {pricing.discountActive ? (
        <span className="text-muted line-through">
          {pricing.currencySymbol}
          {formatMoney(pricing.listPrice)}
        </span>
      ) : null}
      <span className={large ? "text-4xl font-semibold text-primary" : "text-3xl font-semibold text-primary"}>
        {pricing.currencySymbol}
        {formatMoney(pricing.salePrice)}
      </span>
      <span className="pb-1 text-sm text-muted">{t.common.perMonth}</span>
      {pricing.discountActive && pricing.badge ? (
        <span className="mb-1 rounded-full bg-[#FF6B4A] px-2 py-1 text-xs font-semibold text-white">{pricing.badge}</span>
      ) : null}
    </div>
  );
}
