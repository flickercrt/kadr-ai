import { connection } from "next/server";
import { isMissingRelation } from "@/lib/db-errors";
import { configPricing, pricingFromSettings, type DiscountKind, type PricingSettings } from "@/lib/pricing";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  await connection();
  const fallback = configPricing();
  const admin = createAdminSupabase();
  if (!admin) return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  const { data, error } = await admin
    .from("pricing_settings")
    .select("monthly_price, discount_kind, discount_value, discount_starts_at, discount_ends_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
    return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  }
  if (!data) return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  const settings: PricingSettings = {
    monthlyPrice: Number(data.monthly_price),
    discountKind: (data.discount_kind as DiscountKind) || "none",
    discountValue: Number(data.discount_value),
    discountStartsAt: data.discount_starts_at,
    discountEndsAt: data.discount_ends_at,
  };
  return Response.json(pricingFromSettings(settings, Date.now()), { headers: { "Cache-Control": "no-store" } });
}
