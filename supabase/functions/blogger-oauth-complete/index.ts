import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
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
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value)));
  return { ciphertext: bytesToBase64(ciphertext), iv: bytesToBase64(iv) };
}

type BloggerBlog = { id?: string; name?: string; url?: string };

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
  const redirectUri = Deno.env.get("GOOGLE_BLOGGER_REDIRECT_URI") ?? `${siteUrl}/clinic/integrations/blogger/callback`;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!clientId || !clientSecret || !tokenEncryptionKey) return json({ error: "google_not_configured" }, 503);

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

  let input: { code?: string; state?: string };
  try { input = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const code = String(input.code ?? "").trim();
  const state = String(input.state ?? "").trim();
  if (!code || !state) return json({ error: "invalid_input" }, 400);

  const stateHash = await sha256Hex(state);
  const { data: oauthState } = await admin.from("blogger_oauth_states").select("state_hash,requested_by,expires_at,used_at").eq("state_hash", stateHash).eq("requested_by", actor.id).maybeSingle();
  if (!oauthState || oauthState.used_at || new Date(oauthState.expires_at).getTime() <= Date.now()) return json({ error: "invalid_or_expired_state" }, 400);
  await admin.from("blogger_oauth_states").update({ used_at: new Date().toISOString() }).eq("state_hash", stateHash);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokenData = await tokenResponse.json() as { access_token?: string; refresh_token?: string; scope?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) return json({ error: "google_token_exchange_failed", detail: tokenData.error ?? null }, 400);
  if (!tokenData.refresh_token) return json({ error: "google_refresh_token_missing" }, 400);

  const [profileResponse, blogsResponse] = await Promise.all([
    fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
    fetch("https://www.googleapis.com/blogger/v3/users/self/blogs?view=ADMIN", { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
  ]);
  const profile = profileResponse.ok ? await profileResponse.json() as { email?: string } : {} as { email?: string };
  const blogList = blogsResponse.ok ? await blogsResponse.json() as { items?: BloggerBlog[] } : {} as { items?: BloggerBlog[] };
  const blogs = (blogList.items ?? []).filter((blog): blog is Required<Pick<BloggerBlog, "id" | "name">> & BloggerBlog => Boolean(blog.id && blog.name));
  if (!blogsResponse.ok || !blogs.length) return json({ error: "no_blogger_blog_available" }, 409);

  const encrypted = await encrypt(tokenData.refresh_token, tokenEncryptionKey);
  const scopes = String(tokenData.scope ?? "").split(/\s+/).filter(Boolean);
  await admin.from("publishing_integrations").update({ status: "disconnected", disconnected_at: new Date().toISOString() }).eq("provider", "blogger").in("status", ["connected", "needs_selection"]);

  const oneBlog = blogs.length === 1 ? blogs[0] : null;
  const { data: integration, error: integrationError } = await admin.from("publishing_integrations").insert({
    provider: "blogger",
    connected_by: actor.id,
    account_email: profile.email ?? actor.email ?? null,
    external_blog_id: oneBlog?.id ?? null,
    external_blog_name: oneBlog?.name ?? null,
    external_blog_url: oneBlog?.url ?? null,
    scopes,
    status: oneBlog ? "connected" : "needs_selection",
    connected_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
  }).select("id,status,account_email").single();
  if (integrationError || !integration) return json({ error: "blogger_connection_failed" }, 500);

  const { error: secretError } = await admin.from("publishing_integration_secrets").insert({
    integration_id: integration.id,
    refresh_token_ciphertext: encrypted.ciphertext,
    refresh_token_iv: encrypted.iv,
  });
  if (secretError) {
    await admin.from("publishing_integrations").update({ status: "error", last_error: "token_storage_failed" }).eq("id", integration.id);
    return json({ error: "token_storage_failed" }, 500);
  }

  const { error: blogsInsertError } = await admin.from("publishing_integration_blogs").insert(blogs.map((blog) => ({
    integration_id: integration.id,
    external_blog_id: blog.id,
    name: blog.name,
    url: blog.url ?? null,
    is_selected: oneBlog?.id === blog.id,
  })));
  if (blogsInsertError) {
    await admin.from("publishing_integrations").update({ status: "error", last_error: "blog_list_storage_failed" }).eq("id", integration.id);
    return json({ error: "blog_list_storage_failed" }, 500);
  }

  await admin.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "blogger_connected",
    entity_type: "publishing_integration",
    entity_id: integration.id,
    metadata: { account_email: integration.account_email, blog_count: blogs.length },
  });

  return json({ ok: true, integrationId: integration.id, status: integration.status, blogCount: blogs.length });
});