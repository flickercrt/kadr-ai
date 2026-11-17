import { connection } from "next/server";
import { isMissingRelation } from "@/lib/db-errors";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  await connection();
  const admin = createAdminSupabase();
  if (!admin) return Response.json({ links: {} });
  const { data, error } = await admin.from("bot_links").select("slug, url");
  if (error) {
    if (isMissingRelation(error)) return Response.json({ links: {} });
    return Response.json({ links: {} });
  }
  const links: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.url) links[row.slug] = row.url;
  }
  return Response.json({ links }, { headers: { "Cache-Control": "no-store" } });
}
