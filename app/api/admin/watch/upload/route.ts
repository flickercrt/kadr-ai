import { requireAdminCaller } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";

const types: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "invalid");
  const ext = types[file.type];
  if (!ext || file.size < 1 || file.size > 40_000_000) return jsonError(400, "invalid");
  const path = `intro.${ext}`;
  const { error } = await gate.admin.storage.from("watch-media").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: true,
  });
  if (error) return /bucket|not found/i.test(error.message) ? jsonError(503, "config") : jsonError(500, "failed");
  const { data } = gate.admin.storage.from("watch-media").getPublicUrl(path);
  return Response.json({ url: `${data.publicUrl}?v=${Date.now()}` });
}
