import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { configSettings, pricingFromSettings, type DiscountKind, type PricingSettings } from "@/lib/pricing";

const bodySchema = z.object({
  monthlyPrice: z.number().positive().max(100000),
  discountKind: z.enum(["none", "percent", "fixed"]),
  discountValue: z.number().min(0).max(100000),
  discountStartsAt: z.string().nullable(),
  discountEndsAt: z.string().nullable(),
});

function mapRow(row: {
  monthly_price: number | string;
  discount_kind: string;
  discount_value: number | string;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}): PricingSettings {
  return {
    monthlyPrice: Number(row.monthly_price),
    discountKind: (row.discount_kind as DiscountKind) || "none",
    discountValue: Number(row.discount_value),
    discountStartsAt: row.discount_starts_at,
    discountEndsAt: row.discount_ends_at,
  };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, settings: configSettings() });
  const { data, error } = await gate.admin
    .from("pricing_settings")
    .select("monthly_price, discount_kind, discount_value, discount_starts_at, discount_ends_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, settings: configSettings() });
    return jsonError(500, "failed");
  }
  const settings = data ? mapRow(data) : configSettings();
  return Response.json({ configured: true, ready: true, settings, preview: pricingFromSettings(settings, Date.now()) });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const body = parsed.data;
  if (body.discountKind === "percent" && body.discountValue > 100) return jsonError(400, "invalid");
  if (body.discountKind !== "none") {
    const start = body.discountStartsAt ? new Date(body.discountStartsAt).getTime() : NaN;
    const end = body.discountEndsAt ? new Date(body.discountEndsAt).getTime() : NaN;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return jsonError(400, "invalid");
  }
  const { error } = await gate.admin.from("pricing_settings").upsert({
    id: 1,
    monthly_price: body.monthlyPrice,
    discount_kind: body.discountKind,
    discount_value: body.discountValue,
    discount_starts_at: body.discountKind === "none" ? null : body.discountStartsAt,
    discount_ends_at: body.discountKind === "none" ? null : body.discountEndsAt,
    updated_at: new Date().toISOString(),
  });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true, preview: pricingFromSettings(body, Date.now()) });
}
