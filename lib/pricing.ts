import { offer } from "@/config/site";

export type DiscountKind = "none" | "percent" | "fixed";

export type PricingSettings = {
  monthlyPrice: number;
  discountKind: DiscountKind;
  discountValue: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
};

export type PricingView = {
  currencySymbol: string;
  listPrice: number;
  salePrice: number;
  discountActive: boolean;
  badge: string | null;
  countdownEndsAt: string | null;
  source: "config" | "database";
};

export function formatMoney(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function configPricing(now?: number): PricingView {
  const listPrice = offer.compareAt;
  const salePrice = offer.price;
  const ends = new Date(offer.countdownEndsAt).getTime();
  const discountActive = salePrice < listPrice && (now === undefined || ends > now);
  return {
    currencySymbol: offer.currencySymbol,
    listPrice,
    salePrice,
    discountActive,
    badge: discountActive ? `-${offer.discountPercent}%` : null,
    countdownEndsAt: discountActive ? offer.countdownEndsAt : null,
    source: "config",
  };
}

export function pricingFromSettings(settings: PricingSettings, now: number): PricingView {
  const listPrice = roundMoney(settings.monthlyPrice);
  const start = settings.discountStartsAt ? new Date(settings.discountStartsAt).getTime() : NaN;
  const end = settings.discountEndsAt ? new Date(settings.discountEndsAt).getTime() : NaN;
  const scheduled = Number.isFinite(start) && Number.isFinite(end) && end >= start && now >= start && now <= end;
  let salePrice = listPrice;
  let badge: string | null = null;
  if (scheduled && settings.discountKind === "percent" && settings.discountValue > 0) {
    const percent = Math.min(100, settings.discountValue);
    salePrice = roundMoney(listPrice * (1 - percent / 100));
    badge = `-${formatMoney(percent)}%`;
  } else if (scheduled && settings.discountKind === "fixed" && settings.discountValue > 0) {
    salePrice = roundMoney(Math.max(0, listPrice - settings.discountValue));
    badge = `-${offer.currencySymbol}${formatMoney(settings.discountValue)}`;
  }
  const discountActive = scheduled && salePrice < listPrice && badge !== null;
  return {
    currencySymbol: offer.currencySymbol,
    listPrice,
    salePrice,
    discountActive,
    badge: discountActive ? badge : null,
    countdownEndsAt: discountActive ? settings.discountEndsAt : null,
    source: "database",
  };
}

export function configSettings(): PricingSettings {
  return {
    monthlyPrice: offer.compareAt,
    discountKind: "percent",
    discountValue: offer.discountPercent,
    discountStartsAt: new Date().toISOString(),
    discountEndsAt: offer.countdownEndsAt,
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function promoText(pricing: PricingView, locale: "ar" | "en") {
  const sale = `${pricing.currencySymbol}${formatMoney(pricing.salePrice)}`;
  const list = `${pricing.currencySymbol}${formatMoney(pricing.listPrice)}`;
  if (!pricing.discountActive) {
    return locale === "ar" ? `العضوية الشهرية ${sale}` : `Monthly membership ${sale}`;
  }
  return locale === "ar"
    ? `خصم ${pricing.badge} لفترة محدودة — العضوية الشهرية بـ ${sale} بدل ${list}`
    : `${pricing.badge} off for a limited time — monthly membership ${sale} instead of ${list}`;
}
