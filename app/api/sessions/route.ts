import { z } from "zod";
import { getBot } from "@/config/bots";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";


export async function GET(request: Request) {
  const botSlug = new URL(request.url).searchParams.get("bot") ?? "";
  const bot = getBot(botSlug);
  if (!bot) return jsonError(404, "not_found");

  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  const { data, error } = await admin
    .from("chat_sessions")
    .select("id, bot_slug, title, updated_at")
    .eq("user_id", user.id)
    .eq("bot_slug", bot.slug)
    .order("updated_at", { ascending: false });
  if (error) return jsonError(500, "unavailable");

  return Response.json({
    sessions: (data ?? []).map((row) => ({
      id: row.id,
      botSlug: row.bot_slug,
      title: row.title,
      updatedAt: row.updated_at,
    })),
  });
}

const createSchema = z.object({
  botSlug: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const bot = getBot(parsed.data.botSlug);
  if (!bot || !bot.enabled) return jsonError(404, "not_found");

  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  const admin = createAdminSupabase();
  if (!admin) return jsonError(503, "config");

  await admin.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const title = parsed.data.title || "محادثة جديدة";
  const { data, error } = await admin
    .from("chat_sessions")
    .insert({ user_id: user.id, bot_slug: bot.slug, title })
    .select("id, bot_slug, title, updated_at")
    .single();
  if (error || !data) return jsonError(500, "unavailable");

  return Response.json({
    session: { id: data.id, botSlug: data.bot_slug, title: data.title, updatedAt: data.updated_at },
  });
}
