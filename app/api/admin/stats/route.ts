import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { configPricing, pricingFromSettings, type DiscountKind, type PricingSettings } from "@/lib/pricing";

async function countOf(
  query: PromiseLike<{ count: number | null; error: { message?: string; code?: string } | null }>,
) {
  const { count, error } = await query;
  if (error && isMissingRelation(error)) return null;
  if (error) return null;
  return count ?? 0;
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) {
    return Response.json({ configured: false, students: 0, active: 0, newThisWeek: 0, lessonsCompleted: 0, revenueEstimate: 0, currencySymbol: "$" });
  }
  const admin = gate.admin;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [students, active, fresh, lessons, pricingRow] = await Promise.all([
    countOf(admin.from("profiles").select("id", { count: "exact", head: true })),
    countOf(admin.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("status", "active")),
    countOf(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)),
    countOf(admin.from("lesson_progress").select("user_id", { count: "exact", head: true })),
    admin.from("pricing_settings").select("monthly_price, discount_kind, discount_value, discount_starts_at, discount_ends_at").eq("id", 1).maybeSingle(),
  ]);
  let pricing = configPricing();
  if (pricingRow.data && !pricingRow.error) {
    const settings: PricingSettings = {
      monthlyPrice: Number(pricingRow.data.monthly_price),
      discountKind: (pricingRow.data.discount_kind as DiscountKind) || "none",
      discountValue: Number(pricingRow.data.discount_value),
      discountStartsAt: pricingRow.data.discount_starts_at,
      discountEndsAt: pricingRow.data.discount_ends_at,
    };
    pricing = pricingFromSettings(settings, Date.now());
  }
  const activeCount = active ?? 0;
  return Response.json({
    configured: true,
    students: students ?? 0,
    active: activeCount,
    newThisWeek: fresh ?? 0,
    lessonsCompleted: lessons ?? 0,
    revenueEstimate: Math.round(activeCount * pricing.salePrice),
    currencySymbol: pricing.currencySymbol,
  });
}
