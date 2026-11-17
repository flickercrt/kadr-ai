import { connection } from "next/server";
import { isMissingRelation } from "@/lib/db-errors";
import { parseHomepageVideo, type HomepageVideo } from "@/lib/homepage-videos";
import { createServerSupabase } from "@/lib/supabase/server";

type VideoRow = {
  id: string;
  title: string;
  youtube_url: string;
  position: number;
};

/** Public read. A missing table or an unconfigured project returns an empty shelf. */
export async function GET() {
  await connection();
  const supabase = await createServerSupabase();
  if (!supabase) return Response.json({ videos: [] as HomepageVideo[] });

  const { data, error } = await supabase
    .from("homepage_videos")
    .select("id, title, youtube_url, position")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingRelation(error)) return Response.json({ videos: [] as HomepageVideo[] });
    return Response.json({ videos: [] as HomepageVideo[] });
  }

  const videos: HomepageVideo[] = [];
  for (const row of (data ?? []) as VideoRow[]) {
    const parsed = parseHomepageVideo({ title: row.title, youtubeUrl: row.youtube_url });
    if (!parsed?.embedUrl) continue;
    videos.push({
      id: row.id,
      title: parsed.title,
      youtubeUrl: parsed.youtubeUrl,
      embedUrl: parsed.embedUrl,
      position: row.position,
    });
  }
  return Response.json({ videos });
}
