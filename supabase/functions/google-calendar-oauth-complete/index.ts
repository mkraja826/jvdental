import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function encryptionKey(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
}

async function encrypt(value: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  ));
  return { ciphertext: bytesToBase64(ciphertext), iv: bytesToBase64(iv) };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const tokenEncryptionKey = Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://jvdental.com").replace(/\/$/, "");
  const redirectUri = Deno.env.get("GOOGLE_CALENDAR_REDIRECT_URI") ?? `${siteUrl}/clinic/integrations/google-calendar/callback`;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!clientId || !clientSecret || !tokenEncryptionKey) return json({ error: "google_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);

  const { data: staff } = await adminClient
    .from("staff_profiles")
    .select("role,is_active")
    .eq("user_id", actor.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff || !["owner", "admin"].includes(staff.role)) return json({ error: "forbidden" }, 403);

  let input: { code?: string; state?: string };
  try {
    input = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const code = String(input.code ?? "").trim();
  const state = String(input.state ?? "").trim();
  if (!code || !state) return json({ error: "invalid_input" }, 400);

  const stateHash = await sha256Hex(state);
  const { data: oauthState } = await adminClient
    .from("google_oauth_states")
    .select("state_hash,requested_by,expires_at,used_at")
    .eq("state_hash", stateHash)
    .eq("requested_by", actor.id)
    .maybeSingle();

  if (!oauthState || oauthState.used_at || new Date(oauthState.expires_at).getTime() <= Date.now()) {
    return json({ error: "invalid_or_expired_state" }, 400);
  }

  await adminClient.from("google_oauth_states").update({ used_at: new Date().toISOString() }).eq("state_hash", stateHash);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    return json({ error: "google_token_exchange_failed", detail: tokenData.error ?? null }, 400);
  }
  if (!tokenData.refresh_token) {
    return json({ error: "google_refresh_token_missing", detail: "Reconnect with Google consent enabled." }, 400);
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = profileResponse.ok
    ? await profileResponse.json() as { email?: string; name?: string }
    : {} as { email?: string; name?: string };

  const encrypted = await encrypt(tokenData.refresh_token, tokenEncryptionKey);
  const scopes = String(tokenData.scope ?? "").split(/\s+/).filter(Boolean);

  await adminClient
    .from("calendar_integrations")
    .update({ status: "disconnected", disconnected_at: new Date().toISOString() })
    .eq("provider", "google")
    .eq("status", "connected");

  const { data: integration, error: integrationError } = await adminClient
    .from("calendar_integrations")
    .insert({
      provider: "google",
      connected_by: actor.id,
      calendar_id: "primary",
      account_email: profile.email ?? actor.email ?? null,
      calendar_summary: profile.name ?? "Google Calendar",
      scopes,
      status: "connected",
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
    })
    .select("id,account_email")
    .single();

  if (integrationError || !integration) return json({ error: "calendar_connection_failed" }, 500);

  const { error: secretError } = await adminClient.from("calendar_integration_secrets").insert({
    integration_id: integration.id,
    refresh_token_ciphertext: encrypted.ciphertext,
    refresh_token_iv: encrypted.iv,
  });
  if (secretError) {
    await adminClient.from("calendar_integrations").update({ status: "error", last_error: "token_storage_failed" }).eq("id", integration.id);
    return json({ error: "token_storage_failed" }, 500);
  }

  await adminClient.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "google_calendar_connected",
    entity_type: "calendar_integration",
    entity_id: integration.id,
    metadata: { provider: "google", account_email: integration.account_email },
  });

  return json({ ok: true, integrationId: integration.id, accountEmail: integration.account_email });
});