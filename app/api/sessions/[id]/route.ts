import { z } from "zod";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";


const titleSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

async function owned() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return { user: null, admin: null };
  const admin = createAdminSupabase();
  return { user, admin };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = titleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const { user, admin } = await owned();
  if (!user) return jsonError(401, "unauthorized");
  if (!admin) return jsonError(503, "config");

  const { data, error } = await admin
    .from("chat_sessions")
    .update({ title: parsed.data.title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return jsonError(500, "unavailable");
  if (!data) return jsonError(404, "not_found");
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, admin } = await owned();
  if (!user) return jsonError(401, "unauthorized");
  if (!admin) return jsonError(503, "config");

  const { data, error } = await admin
    .from("chat_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return jsonError(500, "unavailable");
  if (!data) return jsonError(404, "not_found");
  return Response.json({ ok: true });
}
