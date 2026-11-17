import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { storeAvatar } from "@/lib/avatar-storage";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const form = await request.formData().catch(() => null);
  const userId = form?.get("userId");
  const file = form?.get("file");
  if (typeof userId !== "string" || !z.uuid().safeParse(userId).success || !(file instanceof File)) return jsonError(400, "invalid");
  const { data: profile } = await gate.admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) return jsonError(404, "not_found");
  const stored = await storeAvatar(gate.admin, userId, file);
  if ("error" in stored && stored.error) {
    if (stored.error === "invalid") return jsonError(400, "invalid");
    if (stored.error === "config") return jsonError(503, "config");
    return jsonError(500, "failed");
  }
  return Response.json({ ok: true, avatarUrl: stored.avatarUrl });
}
