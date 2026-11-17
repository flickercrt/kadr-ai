import { connection } from "next/server";
import { whatsappHref } from "@/config/site";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { DEFAULT_REMINDER_DAYS, daysUntil, isRenewalDue } from "@/lib/reminder";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription";

export async function GET(request: Request) {
  await connection();
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ar";
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return Response.json({ show: false, daysBefore: DEFAULT_REMINDER_DAYS });
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ show: false, daysBefore: DEFAULT_REMINDER_DAYS });

  const settings = await admin.from("reminder_settings").select("days_before").eq("id", 1).maybeSingle();
  const daysBefore = settings.error || !settings.data ? DEFAULT_REMINDER_DAYS : Number(settings.data.days_before) || DEFAULT_REMINDER_DAYS;
  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error && isMissingRelation(error)) return Response.json({ show: false, daysBefore });
  const end = subscription?.current_period_end ?? null;
  const active = isSubscriptionActive(subscription);
  const show = active && isRenewalDue(end, daysBefore);
  return Response.json({
    show,
    daysBefore,
    daysLeft: daysUntil(end),
    endsAt: end,
    whatsapp: whatsappHref(locale),
  });
}
