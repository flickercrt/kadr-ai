import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

type Admin = NonNullable<ReturnType<typeof createAdminSupabase>>;

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function storeAvatar(admin: Admin, userId: string, file: File) {
  const ext = types[file.type];
  if (!ext || file.size < 1 || file.size > 2_000_000) return { error: "invalid" as const };
  const path = `${userId}/avatar.${ext}`;
  const { error } = await admin.storage.from("avatars").upload(path, Buffer.from(await file.arrayBuffer()), {
    upsert: true,
    contentType: file.type,
  });
  if (error) return { error: /bucket|not found/i.test(error.message) ? ("config" as const) : ("failed" as const) };
  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const saved = await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (saved.error) return { error: /avatar_url/.test(saved.error.message) ? ("config" as const) : ("failed" as const) };
  return { avatarUrl };
}
