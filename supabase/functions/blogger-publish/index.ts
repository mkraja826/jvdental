import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function decryptionKey(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
}

async function decrypt(ciphertext: string, iv: string, secret: string) {
  const key = await decryptionKey(secret);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plaintext);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function inlineMarkdown(value: string) {
  let safe = escapeHtml(value);
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  return safe;
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let listOpen = false;
  const closeList = () => { if (listOpen) { output.push("</ul>"); listOpen = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (line.startsWith("### ")) { closeList(); output.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("## ")) { closeList(); output.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("# ")) { closeList(); output.push(`<h2>${inlineMarkdown(line.slice(2))}</h2>`); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!listOpen) { output.push("<ul>"); listOpen = true; }
      output.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    closeList();
    output.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  return output.join("\n");
}

type Publication = { id: string; external_post_id?: string | null; external_url?: string | null };

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
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!clientId || !clientSecret || !tokenEncryptionKey) return json({ error: "google_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);
  const { data: staff } = await admin.from("staff_profiles").select("role,is_active").eq("user_id", actor.id).eq("is_active", true).maybeSingle();
  if (!staff || !["owner", "admin", "implantologist", "doctor"].includes(staff.role)) return json({ error: "forbidden" }, 403);

  let input: { blogPostId?: string };
  try { input = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const blogPostId = String(input.blogPostId ?? "").trim();
  if (!blogPostId) return json({ error: "blog_post_required" }, 400);

  const { data: post } = await admin.from("blog_posts").select("id,author_user_id,title,slug,excerpt,content_markdown,status,published_at").eq("id", blogPostId).maybeSingle();
  if (!post) return json({ error: "article_not_found" }, 404);
  if (post.status !== "published" || !post.published_at) return json({ error: "publish_jvdental_first" }, 409);
  if (!["owner", "admin"].includes(staff.role) && post.author_user_id !== actor.id) return json({ error: "forbidden_article" }, 403);

  const { data: integration } = await admin.from("publishing_integrations").select("id,external_blog_id,external_blog_name,external_blog_url,status").eq("provider", "blogger").eq("status", "connected").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!integration?.external_blog_id || !integration.external_blog_name) return json({ error: "blogger_not_ready" }, 409);
  const { data: secret } = await admin.from("publishing_integration_secrets").select("refresh_token_ciphertext,refresh_token_iv").eq("integration_id", integration.id).maybeSingle();
  if (!secret) return json({ error: "blogger_token_unavailable" }, 503);

  let refreshToken: string;
  try { refreshToken = await decrypt(secret.refresh_token_ciphertext, secret.refresh_token_iv, tokenEncryptionKey); } catch { return json({ error: "blogger_token_decrypt_failed" }, 500); }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    await admin.from("publishing_integrations").update({ status: "error", last_error: `token_refresh:${tokenData.error ?? "failed"}`, updated_at: new Date().toISOString() }).eq("id", integration.id);
    return json({ error: "blogger_token_refresh_failed" }, 502);
  }

  const canonicalUrl = `${siteUrl}/journal/${post.slug}`;
  const content = `${markdownToHtml(post.content_markdown)}\n<hr><p><small>Originally published by JV Dental. <a href="${escapeHtml(canonicalUrl)}">Read the current article on JV Dental</a>.</small></p>`;
  const body = { kind: "blogger#post", title: post.title, content };

  const { data: existing } = await admin.from("blog_publications").select("id,external_post_id,external_url").eq("blog_post_id", post.id).eq("channel", "blogger").eq("external_blog_id", integration.external_blog_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const prior = existing as Publication | null;

  let bloggerResponse: Response;
  if (prior?.external_post_id) {
    bloggerResponse = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(integration.external_blog_id)}/posts/${encodeURIComponent(prior.external_post_id)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, id: prior.external_post_id }),
    });
  } else {
    bloggerResponse = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(integration.external_blog_id)}/posts?isDraft=false`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const bloggerPost = await bloggerResponse.json() as { id?: string; url?: string; published?: string; error?: { message?: string } };
  const now = new Date().toISOString();
  if (!bloggerResponse.ok || !bloggerPost.id) {
    if (prior?.id) {
      await admin.from("blog_publications").update({ publish_status: "failed", last_error: String(bloggerPost.error?.message ?? `blogger_${bloggerResponse.status}`).slice(0, 500), updated_at: now }).eq("id", prior.id);
    } else {
      await admin.from("blog_publications").insert({ blog_post_id: post.id, channel: "blogger", integration_id: integration.id, external_blog_id: integration.external_blog_id, external_blog_name: integration.external_blog_name, publish_status: "failed", last_error: String(bloggerPost.error?.message ?? `blogger_${bloggerResponse.status}`).slice(0, 500) });
    }
    await admin.from("publishing_integrations").update({ last_error: String(bloggerPost.error?.message ?? `blogger_${bloggerResponse.status}`).slice(0, 500), updated_at: now }).eq("id", integration.id);
    return json({ error: "blogger_publish_failed" }, 502);
  }

  const publicationValues = {
    integration_id: integration.id,
    external_blog_id: integration.external_blog_id,
    external_blog_name: integration.external_blog_name,
    external_post_id: bloggerPost.id,
    external_url: bloggerPost.url ?? prior?.external_url ?? null,
    publish_status: "published",
    last_error: null,
    published_at: bloggerPost.published ?? now,
    last_synced_at: now,
    updated_at: now,
  };
  if (prior?.id) await admin.from("blog_publications").update(publicationValues).eq("id", prior.id);
  else await admin.from("blog_publications").insert({ blog_post_id: post.id, channel: "blogger", ...publicationValues });

  await admin.from("publishing_integrations").update({ last_sync_at: now, last_error: null, updated_at: now }).eq("id", integration.id);
  await admin.from("audit_logs").insert({ actor_user_id: actor.id, action: prior?.external_post_id ? "blogger_post_synced" : "blogger_post_published", entity_type: "blog_post", entity_id: post.id, metadata: { external_blog_id: integration.external_blog_id, external_post_id: bloggerPost.id, external_url: bloggerPost.url ?? null } });
  return json({ ok: true, action: prior?.external_post_id ? "updated" : "published", externalPostId: bloggerPost.id, externalUrl: bloggerPost.url ?? null });
});