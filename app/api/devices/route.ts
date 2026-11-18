import { listOwnDevices } from "@/lib/devices";
import { jsonError } from "@/lib/http";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return jsonError(401, "unauthorized");
  try {
    return Response.json(await listOwnDevices(user.id));
  } catch {
    return jsonError(500, "failed");
  }
}
