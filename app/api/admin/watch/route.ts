import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { isMissingRelation } from "@/lib/db-errors";
import { jsonError } from "@/lib/http";
import { resolveWatch, type WatchDraft } from "@/lib/watch";
import { isHttpUrl } from "@/lib/youtube";

const bodySchema = z.object({
  enabled: z.boolean(),
  kickerAr: z.string().max(120),
  kickerEn: z.string().max(120),
  titleAr: z.string().max(160),
  titleEn: z.string().max(160),
  leadAr: z.string().max(600),
  leadEn: z.string().max(600),
  videoUrl: z.string().max(500),
});

function fromRow(row: {
  enabled: boolean;
  kicker_ar: string;
  kicker_en: string;
  title_ar: string;
  title_en: string;
  lead_ar: string;
  lead_en: string;
  video_url: string;
}): WatchDraft {
  return {
    enabled: row.enabled,
    kickerAr: row.kicker_ar,
    kickerEn: row.kicker_en,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    leadAr: row.lead_ar,
    leadEn: row.lead_en,
    videoUrl: row.video_url,
  };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, draft: null });
  const { data, error } = await gate.admin.from("watch_section").select("enabled, kicker_ar, kicker_en, title_ar, title_en, lead_ar, lead_en, video_url").eq("id", 1).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return Response.json({ configured: true, ready: false, draft: null });
    return jsonError(500, "failed");
  }
  return Response.json({ configured: true, ready: true, draft: data ? fromRow(data) : null });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const videoUrl = parsed.data.videoUrl.trim();
  if (videoUrl && !isHttpUrl(videoUrl)) return jsonError(400, "invalid");
  const { error } = await gate.admin.from("watch_section").upsert({
    id: 1,
    enabled: parsed.data.enabled,
    kicker_ar: parsed.data.kickerAr.trim(),
    kicker_en: parsed.data.kickerEn.trim(),
    title_ar: parsed.data.titleAr.trim(),
    title_en: parsed.data.titleEn.trim(),
    lead_ar: parsed.data.leadAr.trim(),
    lead_en: parsed.data.leadEn.trim(),
    video_url: videoUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
  return Response.json({ ok: true, preview: resolveWatch(parsed.data) });
}
