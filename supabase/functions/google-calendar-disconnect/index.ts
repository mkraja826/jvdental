import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function key(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
}

async function decrypt(ciphertext: string, iv: string, secret: string) {
  const k = await key(secret);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, k, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plain);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const encryptionSecret = Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);
  const { data: staff } = await admin.from("staff_profiles").select("role,is_active").eq("user_id", actor.id).eq("is_active", true).maybeSingle();
  if (!staff || !["owner", "admin"].includes(staff.role)) return json({ error: "forbidden" }, 403);

  const { data: integration } = await admin
    .from("calendar_integrations")
    .select("id,account_email")
    .eq("provider", "google")
    .eq("status", "connected")
    .maybeSingle();
  if (!integration) return json({ ok: true, status: "already_disconnected" });

  const { data: secret } = await admin
    .from("calendar_integration_secrets")
    .select("refresh_token_ciphertext,refresh_token_iv")
    .eq("integration_id", integration.id)
    .maybeSingle();

  let revokeAttempted = false;
  let revokeSucceeded = false;
  if (secret && encryptionSecret) {
    try {
      const token = await decrypt(secret.refresh_token_ciphertext, secret.refresh_token_iv, encryptionSecret);
      revokeAttempted = true;
      const revoke = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });
      revokeSucceeded = revoke.ok;
    } catch {
      revokeAttempted = true;
    }
  }

  await admin.from("calendar_integration_secrets").delete().eq("integration_id", integration.id);
  await admin.from("calendar_integrations").update({
    status: "disconnected",
    disconnected_at: new Date().toISOString(),
    last_error: revokeAttempted && !revokeSucceeded ? "google_token_revoke_failed" : null,
  }).eq("id", integration.id);

  await admin.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "google_calendar_disconnected",
    entity_type: "calendar_integration",
    entity_id: integration.id,
    metadata: { account_email: integration.account_email, revoke_attempted: revokeAttempted, revoke_succeeded: revokeSucceeded },
  });

  return json({ ok: true, status: "disconnected", revokeAttempted, revokeSucceeded });
});