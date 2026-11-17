import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { isMissingRelation } from "@/lib/db-errors";
import { parseHomepageVideo, type HomepageVideo } from "@/lib/homepage-videos";
import { jsonError } from "@/lib/http";
import { youtubeEmbedUrl } from "@/lib/youtube";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), title: z.string(), youtubeUrl: z.string() }),
  z.object({ action: z.literal("update"), id: z.uuid(), title: z.string(), youtubeUrl: z.string() }),
  z.object({ action: z.literal("delete"), id: z.uuid() }),
  z.object({ action: z.literal("reorder"), ids: z.array(z.uuid()).min(1) }),
]);

type VideoRow = {
  id: string;
  title: string;
  youtube_url: string;
  position: number;
  created_at: string;
};

function mapRow(row: VideoRow): HomepageVideo {
  const parsed = parseHomepageVideo({ title: row.title, youtubeUrl: row.youtube_url });
  return {
    id: row.id,
    title: row.title,
    youtubeUrl: row.youtube_url,
    embedUrl: parsed?.embedUrl ?? youtubeEmbedUrl(row.youtube_url),
    position: row.position,
  };
}

async function loadVideos(admin: NonNullable<Awaited<ReturnType<typeof requireAdminCaller>>["admin"]>) {
  const { data, error } = await admin
    .from("homepage_videos")
    .select("id, title, youtube_url, position, created_at")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error, videos: [] as HomepageVideo[] };
  return { error: null, videos: ((data ?? []) as VideoRow[]).map(mapRow) };
}

function relationOrFailed(error: { code?: string; message?: string }) {
  return isMissingRelation(error) ? jsonError(503, "config") : jsonError(500, "failed");
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, ready: false, videos: [] });
  const loaded = await loadVideos(gate.admin);
  if (loaded.error) {
    if (isMissingRelation(loaded.error)) return Response.json({ configured: true, ready: false, videos: [] });
    return jsonError(500, "failed");
  }
  return Response.json({ configured: true, ready: true, videos: loaded.videos });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");
  const body = parsed.data;
  const now = new Date().toISOString();
  const done = async () => {
    await logActivity({
      actorId: gate.user.id,
      actorEmail: gate.user.email,
      actorRole: "admin",
      action: "video.updated",
      targetType: "homepage_video",
      metadata: { op: body.action },
    });
    return Response.json({ ok: true });
  };

  if (body.action === "create" || body.action === "update") {
    const content = parseHomepageVideo(body);
    if (!content) return jsonError(400, "invalid");
    if (body.action === "create") {
      const { data: last } = await admin.from("homepage_videos").select("position").order("position", { ascending: false }).limit(1);
      const position = (last?.[0]?.position ?? -1) + 1;
      const { error } = await admin.from("homepage_videos").insert({
        title: content.title,
        youtube_url: content.youtubeUrl,
        position,
        updated_at: now,
      });
      if (error) return relationOrFailed(error);
    } else {
      const { error } = await admin
        .from("homepage_videos")
        .update({ title: content.title, youtube_url: content.youtubeUrl, updated_at: now })
        .eq("id", body.id);
      if (error) return relationOrFailed(error);
    }
    return done();
  }

  if (body.action === "delete") {
    const { error } = await admin.from("homepage_videos").delete().eq("id", body.id);
    if (error) return relationOrFailed(error);
    return done();
  }

  const results = await Promise.all(
    body.ids.map((id, index) => admin.from("homepage_videos").update({ position: index, updated_at: now }).eq("id", id)),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) return relationOrFailed(failure.error);
  return done();
}
