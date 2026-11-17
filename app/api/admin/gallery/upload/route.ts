import { requireAdminCaller } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";

const types: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "invalid");
  const ext = types[file.type];
  if (!ext || file.size < 1 || file.size > 8_000_000) return jsonError(400, "invalid");
  const path = `items/${crypto.randomUUID()}.${ext}`;
  const { error } = await gate.admin.storage.from("gallery").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return /bucket|not found/i.test(error.message) ? jsonError(503, "config") : jsonError(500, "failed");
  const { data } = gate.admin.storage.from("gallery").getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
