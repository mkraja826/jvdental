import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AiProviderRow = {
  id: string;
  provider_name: string;
  model_name: string;
  endpoint: string;
  api_key_env_name: string;
  priority: number;
  status: "active" | "cooldown" | "quota_exhausted" | "unhealthy" | "disabled";
  daily_request_limit: number | null;
  requests_today: number;
  quota_day: string;
  consecutive_failures: number;
  cooldown_until: string | null;
};

export type ProviderResult = {
  text: string;
  provider: string;
  model: string;
};

const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function cooldownFor(status: number, failures: number) {
  if (status === 429) return 60 * 60 * 1000;
  if (status >= 500) return Math.min(30 * 60 * 1000, Math.max(60_000, failures * 60_000));
  return 15 * 60 * 1000;
}

async function recordSuccess(supabase: SupabaseClient, provider: AiProviderRow) {
  await supabase.from("ai_provider_pool").update({
    status: "active",
    requests_today: (provider.requests_today ?? 0) + 1,
    consecutive_failures: 0,
    cooldown_until: null,
    last_http_status: 200,
    last_error: null,
    last_success_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", provider.id);
}

async function recordFailure(
  supabase: SupabaseClient,
  provider: AiProviderRow,
  status: number,
  message: string,
) {
  const failures = (provider.consecutive_failures ?? 0) + 1;
  const isQuota = status === 429 && provider.daily_request_limit !== null && provider.requests_today + 1 >= provider.daily_request_limit;
  const nextStatus = status === 401 || status === 403
    ? "disabled"
    : isQuota
    ? "quota_exhausted"
    : failures >= 3
    ? "unhealthy"
    : "cooldown";

  const cooldownUntil = nextStatus === "disabled" || nextStatus === "quota_exhausted"
    ? null
    : new Date(Date.now() + cooldownFor(status, failures)).toISOString();

  await supabase.from("ai_provider_pool").update({
    status: nextStatus,
    consecutive_failures: failures,
    cooldown_until: cooldownUntil,
    last_http_status: status,
    last_error: message.slice(0, 500),
    last_failure_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", provider.id);
}

async function callCompatibleProvider(args: {
  endpoint: string;
  apiKey: string;
  model: string;
  system: string;
  message: string;
  maxTokens: number;
}) {
  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.message },
      ],
      temperature: 0.2,
      max_tokens: args.maxTokens,
    }),
  });

  if (!response.ok) {
    return { ok: false as const, status: response.status, error: await response.text().catch(() => response.statusText) };
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false as const, status: 502, error: "Provider returned an empty or incompatible response" };
  }

  return { ok: true as const, text: content.trim().slice(0, 4000) };
}

async function generateFromLegacyProvider(system: string, message: string, maxTokens: number): Promise<ProviderResult | null> {
  const endpoint = Deno.env.get("AI_CHAT_COMPLETIONS_URL")?.trim();
  const apiKey = Deno.env.get("AI_API_KEY")?.trim();
  const model = Deno.env.get("AI_MODEL")?.trim();
  const provider = Deno.env.get("AI_PROVIDER_NAME")?.trim() || "legacy-compatible";
  if (!endpoint || !apiKey || !model) return null;

  try {
    const result = await callCompatibleProvider({ endpoint, apiKey, model, system, message, maxTokens });
    if (!result.ok) return null;
    return { text: result.text, provider, model };
  } catch {
    return null;
  }
}

export async function generateFromProviderPool(args: {
  supabase: SupabaseClient;
  system: string;
  message: string;
  maxTokens?: number;
}) : Promise<ProviderResult | null> {
  const { supabase, system, message, maxTokens = 550 } = args;

  await supabase.rpc("reset_ai_provider_daily_counters");

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("ai_provider_pool")
    .select("id,provider_name,model_name,endpoint,api_key_env_name,priority,status,daily_request_limit,requests_today,quota_day,consecutive_failures,cooldown_until")
    .eq("is_active", true)
    .neq("status", "disabled")
    .order("priority", { ascending: true })
    .limit(25);

  const providers = ((data ?? []) as AiProviderRow[]).filter((provider) => {
    if (provider.status === "quota_exhausted") return false;
    if (!provider.cooldown_until) return true;
    return provider.cooldown_until <= now;
  });

  for (const provider of providers) {
    if (provider.daily_request_limit !== null && provider.requests_today >= provider.daily_request_limit) {
      await supabase.from("ai_provider_pool").update({ status: "quota_exhausted", updated_at: now }).eq("id", provider.id);
      continue;
    }

    const apiKey = Deno.env.get(provider.api_key_env_name)?.trim();
    if (!apiKey) {
      await recordFailure(supabase, provider, 401, `Missing Edge Function secret: ${provider.api_key_env_name}`);
      continue;
    }

    try {
      const result = await callCompatibleProvider({
        endpoint: provider.endpoint,
        apiKey,
        model: provider.model_name,
        system,
        message,
        maxTokens,
      });

      if (!result.ok) {
        await recordFailure(supabase, provider, result.status, result.error || `HTTP ${result.status}`);
        if (RETRYABLE.has(result.status) || result.status === 401 || result.status === 403) continue;
        continue;
      }

      await recordSuccess(supabase, provider);
      return {
        text: result.text,
        provider: provider.provider_name,
        model: provider.model_name,
      };
    } catch (error) {
      await recordFailure(supabase, provider, 503, error instanceof Error ? error.message : "Provider request failed");
    }
  }

  return generateFromLegacyProvider(system, message, maxTokens);
}
