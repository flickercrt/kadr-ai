import "server-only";
import { isAdminEmail } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

type StaffRole = "admin" | "instructor" | "student";

async function staffRole(user: { id: string; email?: string | null }, supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>) {
  if (isAdminEmail(user.email)) return "admin" as const;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role === "admin" || data?.role === "instructor") return data.role;
  return "student" as const;
}

async function requireRoles(allowed: Array<Exclude<StaffRole, "student">>) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !supabase) return { user: null, admin: null, denied: jsonError(403, "forbidden") };
  const role = await staffRole(user, supabase);
  if (!allowed.includes(role as Exclude<StaffRole, "student">)) {
    return { user: null, admin: null, denied: jsonError(403, "forbidden") };
  }
  return { user, admin: createAdminSupabase(), denied: null };
}

/** Full admin: ADMIN_EMAILS or profiles.role = admin. */
export async function requireAdminCaller() {
  return requireRoles(["admin"]);
}

/** Course editors: admins and instructors. */
export async function requireCourseEditor() {
  return requireRoles(["admin", "instructor"]);
}
