import { z } from "zod";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { cleanAvatarUrl, cleanDisplayName } from "@/lib/profile";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string(),
  avatarUrl: z.string(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const name = cleanDisplayName(parsed.data.name);
  const avatarUrl = cleanAvatarUrl(parsed.data.avatarUrl);
  if (name === null || avatarUrl === null) return jsonError(400, "invalid");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const withAvatar = await admin
    .from("profiles")
    .update({ full_name: name, avatar_url: avatarUrl || null })
    .eq("id", user.id);
  if (withAvatar.error && /avatar_url/.test(withAvatar.error.message)) {
    const nameOnly = await admin.from("profiles").update({ full_name: name }).eq("id", user.id);
    if (nameOnly.error) return isMissingRelation(nameOnly.error) ? jsonError(503, "config") : jsonError(500, "failed");
    if (avatarUrl) return jsonError(503, "config");
    return Response.json({ ok: true, avatarSaved: false });
  }
  if (withAvatar.error) return isMissingRelation(withAvatar.error) ? jsonError(503, "config") : jsonError(500, "failed");

  await admin.auth.admin.updateUserById(user.id, { user_metadata: { full_name: name } }).catch(() => undefined);
  return Response.json({ ok: true, avatarSaved: true });
}
