import { connection } from "next/server";
import { resolveWatch, type WatchDraft } from "@/lib/watch";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  await connection();
  const fallback = resolveWatch(null);
  const admin = createAdminSupabase();
  if (!admin) return Response.json(fallback);
  const { data, error } = await admin
    .from("watch_section")
    .select("enabled, kicker_ar, kicker_en, title_ar, title_en, lead_ar, lead_en, video_url")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  const draft: WatchDraft = {
    enabled: data.enabled,
    kickerAr: data.kicker_ar,
    kickerEn: data.kicker_en,
    titleAr: data.title_ar,
    titleEn: data.title_en,
    leadAr: data.lead_ar,
    leadEn: data.lead_en,
    videoUrl: data.video_url,
  };
  return Response.json(resolveWatch(draft), { headers: { "Cache-Control": "no-store" } });
}
