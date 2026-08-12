import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);
  const { data: staff } = await admin.from("staff_profiles").select("role,is_active").eq("user_id", actor.id).eq("is_active", true).maybeSingle();
  if (!staff || !["owner", "admin"].includes(staff.role)) return json({ error: "forbidden" }, 403);

  const { data: integration } = await admin.from("publishing_integrations").select("id").eq("provider", "blogger").in("status", ["connected", "needs_selection", "error"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!integration) return json({ ok: true, alreadyDisconnected: true });

  await admin.from("publishing_integrations").update({ status: "disconnected", disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", integration.id);
  await admin.from("audit_logs").insert({ actor_user_id: actor.id, action: "blogger_disconnected", entity_type: "publishing_integration", entity_id: integration.id, metadata: { provider: "blogger" } });
  return json({ ok: true });
});