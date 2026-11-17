import { storeAvatar } from "@/lib/avatar-storage";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "invalid");
  const stored = await storeAvatar(admin, user.id, file);
  if ("error" in stored && stored.error) {
    if (stored.error === "invalid") return jsonError(400, "invalid");
    if (stored.error === "config") return jsonError(503, "config");
    return jsonError(500, "failed");
  }
  return Response.json({ ok: true, avatarUrl: stored.avatarUrl });
}
