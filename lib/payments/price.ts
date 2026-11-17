import "server-only";
import { configPricing, pricingFromSettings, type DiscountKind, type PricingSettings } from "@/lib/pricing";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Exact subscribe fallback. No pre-filled message. */
export const WHATSAPP_SUBSCRIBE_URL = "https://wa.me/972569737472";

const MIN_CENTS = 50;

export function stripeBillingReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/** Sale price in cents from pricing_settings, including an active discount. Config price is the fallback. */
export async function currentSaleCents() {
  const now = Date.now();
  let sale = configPricing(now).salePrice;
  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from("pricing_settings")
      .select("monthly_price, discount_kind, discount_value, discount_starts_at, discount_ends_at")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) {
      const kind = data.discount_kind === "percent" || data.discount_kind === "fixed" ? data.discount_kind : "none";
      const settings: PricingSettings = {
        monthlyPrice: Number(data.monthly_price),
        discountKind: kind as DiscountKind,
        discountValue: Number(data.discount_value),
        discountStartsAt: data.discount_starts_at,
        discountEndsAt: data.discount_ends_at,
      };
      const view = pricingFromSettings(settings, now);
      if (Number.isFinite(view.salePrice)) sale = view.salePrice;
    }
  }
  if (!Number.isFinite(sale) || sale <= 0) return null;
  const cents = Math.round(sale * 100);
  if (cents < MIN_CENTS || cents > 99_999_999) return null;
  return cents;
}
