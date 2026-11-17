import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { DEFAULT_REMINDER_DAYS, daysUntil, isRenewalDue } from "@/lib/reminder";
import { displayIdentity } from "@/lib/username";

const bodySchema = z.object({ daysBefore: z.number().int().min(1).max(60) });

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, daysBefore: DEFAULT_REMINDER_DAYS, students: [] });
  const settings = await gate.admin.from("reminder_settings").select("days_before").eq("id", 1).maybeSingle();
  if (settings.error && isMissingRelation(settings.error)) {
    return Response.json({ configured: true, ready: false, daysBefore: DEFAULT_REMINDER_DAYS, students: [] });
  }
  const daysBefore = settings.data ? Number(settings.data.days_before) || DEFAULT_REMINDER_DAYS : DEFAULT_REMINDER_DAYS;
  const { data: subscriptions, error } = await gate.admin
    .from("subscriptions")
    .select("user_id, status, current_period_end")
    .eq("status", "active")
    .not("current_period_end", "is", null);
  if (error) return jsonError(500, "failed");
  const due = (subscriptions ?? []).filter((row) => isRenewalDue(row.current_period_end, daysBefore));
  const ids = due.map((row) => row.user_id);
  const profiles = ids.length
    ? await gate.admin.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  return Response.json({
    configured: true,
    ready: !settings.error,
    daysBefore,
    students: due.map((row) => {
      const profile = byId.get(row.user_id);
      const identity = displayIdentity(profile?.email);
      return {
        id: row.user_id,
        name: profile?.full_name ?? "",
        email: identity.email,
        username: identity.username,
        endsAt: row.current_period_end,
        daysLeft: daysUntil(row.current_period_end),
      };
    }),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const { error } = await gate.admin.from("reminder_settings").upsert({
    id: 1,
    days_before: parsed.data.daysBefore,
    updated_at: new Date().toISOString(),
  });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true });
}
