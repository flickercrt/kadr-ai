import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type ActivityInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Best-effort audit write. A missing table or a failed insert must not affect the caller. */
export async function logActivity(input: ActivityInput) {
  try {
    const admin = createAdminSupabase();
    if (!admin) return;
    await admin.from("activity_log").insert({
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      actor_role: input.actorRole ?? "system",
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Logging is optional.
  }
}
