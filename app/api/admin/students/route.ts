import { z } from "zod";
import { requireAdminCaller } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";
import { displayIdentity, isValidUsername, normalizeUsername, STUDENT_PASSWORD_MAX, STUDENT_PASSWORD_MIN, studentEmailForUsername } from "@/lib/username";

const createSchema = z.object({
  username: z.string(),
  password: z.string(),
  name: z.string().optional(),
  activate: z.boolean().optional(),
});

function isDuplicateUser(error: { code?: string; message: string }) {
  return (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    /already (been )?registered|already exists/i.test(error.message)
  );
}

function isWeakPassword(error: { code?: string }) {
  return error.code === "weak_password";
}

export async function GET() {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return Response.json({ configured: false, students: [] });

  const fullProfiles = await gate.admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false });
  const profilesResult = fullProfiles.error
    ? await gate.admin.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false })
    : fullProfiles;
  if (profilesResult.error) return jsonError(500, "failed");
  const profiles = profilesResult.data;

  const { data: subscriptions, error: subscriptionError } = await gate.admin
    .from("subscriptions")
    .select("user_id, status, provider, current_period_end");
  if (subscriptionError) return jsonError(500, "failed");
  const byUser = new Map((subscriptions ?? []).map((row) => [row.user_id, row]));

  return Response.json({
    configured: true,
    students: (profiles ?? []).map((profile) => {
      const subscription = byUser.get(profile.id);
      const identity = displayIdentity(profile.email);
      return {
        id: profile.id,
        email: identity.email,
        username: identity.username,
        name: profile.full_name,
        avatar: "avatar_url" in profile ? (profile.avatar_url as string | null) : null,
        role: "role" in profile && typeof profile.role === "string" ? profile.role : "student",
        status: subscription?.status ?? "inactive",
        provider: subscription?.provider ?? null,
        currentPeriodEnd: subscription?.current_period_end ?? null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (gate.denied) return gate.denied;
  if (!gate.admin) return jsonError(503, "config");
  const admin = gate.admin;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid");

  const username = normalizeUsername(parsed.data.username);
  if (!isValidUsername(username)) return jsonError(400, "username_invalid");
  const password = parsed.data.password;
  if (password.length < STUDENT_PASSWORD_MIN) return jsonError(400, "password_short");
  if (password.length > STUDENT_PASSWORD_MAX) return jsonError(400, "invalid");
  const name = (parsed.data.name ?? "").trim();
  if (name.length > 80) return jsonError(400, "invalid");
  const activate = parsed.data.activate === true;
  const email = studentEmailForUsername(username);

  const { data: existing, error: existingError } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existingError) return jsonError(500, "failed");
  if (existing) return jsonError(409, "username_taken");

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: name },
    app_metadata: { student_account: true, username },
  });
  if (error || !data.user) {
    if (error && isDuplicateUser(error)) return jsonError(409, "username_taken");
    if (error && isWeakPassword(error)) return jsonError(400, "password_short");
    return jsonError(500, "failed");
  }

  const userId = data.user.id;
  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, email, full_name: name },
    { onConflict: "id" },
  );
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return jsonError(500, "failed");
  }

  const { error: subscriptionError } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status: activate ? "active" : "inactive",
      provider: "manual",
      current_period_end: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (subscriptionError) return jsonError(500, "membership_failed");

  return Response.json({ ok: true, id: userId, username });
}
