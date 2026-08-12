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

  let input: { blogChoiceId?: string };
  try { input = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const blogChoiceId = String(input.blogChoiceId ?? "").trim();
  if (!blogChoiceId) return json({ error: "blog_choice_required" }, 400);

  const { data: choice } = await admin.from("publishing_integration_blogs").select("id,integration_id,external_blog_id,name,url,publishing_integrations(provider,status)").eq("id", blogChoiceId).maybeSingle();
  if (!choice) return json({ error: "blog_choice_not_found" }, 404);
  const integration = Array.isArray(choice.publishing_integrations) ? choice.publishing_integrations[0] : choice.publishing_integrations;
  if (!integration || integration.provider !== "blogger" || !["connected", "needs_selection"].includes(integration.status)) return json({ error: "integration_not_available" }, 409);

  await admin.from("publishing_integration_blogs").update({ is_selected: false, updated_at: new Date().toISOString() }).eq("integration_id", choice.integration_id);
  const { error: selectedError } = await admin.from("publishing_integration_blogs").update({ is_selected: true, updated_at: new Date().toISOString() }).eq("id", choice.id);
  if (selectedError) return json({ error: "selection_failed" }, 500);

  await admin.from("publishing_integrations").update({
    external_blog_id: choice.external_blog_id,
    external_blog_name: choice.name,
    external_blog_url: choice.url,
    status: "connected",
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", choice.integration_id);

  await admin.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "blogger_blog_selected",
    entity_type: "publishing_integration",
    entity_id: choice.integration_id,
    metadata: { external_blog_id: choice.external_blog_id, external_blog_name: choice.name },
  });

  return json({ ok: true, blogId: choice.external_blog_id, blogName: choice.name });
});