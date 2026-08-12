import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://jvdental.com").replace(/\/$/, "");
  const redirectUri = Deno.env.get("GOOGLE_BLOGGER_REDIRECT_URI") ?? `${siteUrl}/clinic/integrations/blogger/callback`;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!clientId) return json({ error: "google_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);

  const { data: staff } = await admin
    .from("staff_profiles")
    .select("role,is_active")
    .eq("user_id", actor.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff || !["owner", "admin"].includes(staff.role)) return json({ error: "forbidden" }, 403);

  const state = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const stateHash = await sha256Hex(state);
  const { error: stateError } = await admin.from("blogger_oauth_states").insert({
    state_hash: stateHash,
    requested_by: actor.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (stateError) return json({ error: "oauth_state_failed" }, 500);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: "openid email https://www.googleapis.com/auth/blogger",
    state,
  });

  return json({ authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});