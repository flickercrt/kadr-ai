import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "invalid");
  const ext = types[file.type];
  if (!ext || file.size < 1 || file.size > 2_000_000) return jsonError(400, "invalid");

  const path = `${user.id}/avatar.${ext}`;
  const { error } = await admin.storage.from("avatars").upload(path, Buffer.from(await file.arrayBuffer()), {
    upsert: true,
    contentType: file.type,
  });
  if (error) return /bucket|not found/i.test(error.message) ? jsonError(503, "config") : jsonError(500, "failed");

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const saved = await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  if (saved.error) return /avatar_url/.test(saved.error.message) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true, avatarUrl });
}
