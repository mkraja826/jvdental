import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type StaffRole = "owner" | "admin" | "implantologist" | "doctor" | "coordinator" | "receptionist" | "dental_assistant";

const ALLOWED_ROLES = new Set<StaffRole>([
  "owner",
  "admin",
  "implantologist",
  "doctor",
  "coordinator",
  "receptionist",
  "dental_assistant",
]);

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return response({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return response({ error: "server_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return response({ error: "unauthorized" }, 401);

  const { data: actorStaff } = await adminClient
    .from("staff_profiles")
    .select("user_id,role,is_active")
    .eq("user_id", actor.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!actorStaff || !["owner", "admin"].includes(actorStaff.role)) return response({ error: "forbidden" }, 403);

  let input: {
    email?: string;
    fullName?: string;
    role?: StaffRole;
    jobTitle?: string;
    phone?: string;
    sendInvite?: boolean;
  };
  try {
    input = await req.json();
  } catch {
    return response({ error: "invalid_json" }, 400);
  }

  const email = String(input.email ?? "").trim().toLowerCase();
  const fullName = String(input.fullName ?? "").trim().slice(0, 160);
  const role = input.role;
  const jobTitle = String(input.jobTitle ?? "").trim().slice(0, 160) || null;
  const phone = String(input.phone ?? "").trim().slice(0, 60) || null;
  const sendInvite = input.sendInvite !== false;

  if (!validEmail(email) || fullName.length < 2 || !role || !ALLOWED_ROLES.has(role)) {
    return response({ error: "invalid_input" }, 400);
  }
  if (actorStaff.role === "admin" && ["owner", "admin"].includes(role)) {
    return response({ error: "owner_required_for_privileged_role" }, 403);
  }

  let targetUser = null as { id: string; email?: string | null } | null;
  for (let page = 1; page <= 10 && !targetUser; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return response({ error: "auth_lookup_failed" }, 500);
    targetUser = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (data.users.length < 1000) break;
  }

  let invited = false;
  if (!targetUser) {
    if (sendInvite) {
      const siteUrl = (Deno.env.get("SITE_URL") ?? "https://jvdental.com").replace(/\/$/, "");
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName, jv_staff_role: role },
        redirectTo: `${siteUrl}/clinic`,
      });
      if (error || !data.user) return response({ error: "invite_failed", detail: error?.message ?? null }, 400);
      targetUser = data.user;
      invited = true;
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, jv_staff_role: role },
      });
      if (error || !data.user) return response({ error: "user_create_failed", detail: error?.message ?? null }, 400);
      targetUser = data.user;
    }
  }

  const { error: staffError } = await adminClient.from("staff_profiles").upsert({
    user_id: targetUser.id,
    full_name: fullName,
    email,
    phone,
    job_title: jobTitle,
    role,
    is_active: true,
    invited_at: invited ? new Date().toISOString() : null,
    deactivated_at: null,
    created_by: actor.id,
  }, { onConflict: "user_id" });

  if (staffError) return response({ error: "staff_profile_failed", detail: staffError.message }, 400);

  await adminClient.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: invited ? "staff_invited" : "staff_access_granted",
    entity_type: "staff_profile",
    entity_id: targetUser.id,
    metadata: { email, role, job_title: jobTitle },
  });

  return response({
    ok: true,
    userId: targetUser.id,
    invited,
    existingAuthUser: !invited,
    email,
    role,
  });
});
