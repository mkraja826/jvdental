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
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!stripeKey) return json({ error: "stripe_not_configured" }, 503);

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

  let input: { paymentId?: string; amountMinor?: number; reason?: string };
  try { input = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const paymentId = String(input.paymentId ?? "").trim();
  if (!paymentId) return json({ error: "payment_required" }, 400);

  const { data: payment } = await admin.from("payments")
    .select("id,payment_request_id,provider,provider_payment_id,amount_minor,currency,status")
    .eq("id", paymentId).maybeSingle();
  if (!payment || payment.provider !== "stripe" || !payment.provider_payment_id || !["succeeded", "partially_refunded"].includes(payment.status)) {
    return json({ error: "payment_not_refundable" }, 409);
  }

  const { data: priorRefunds } = await admin.from("payment_refunds").select("amount_minor").eq("payment_id", payment.id).eq("status", "succeeded");
  const alreadyRefunded = (priorRefunds ?? []).reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
  const refundable = Number(payment.amount_minor) - alreadyRefunded;
  const requested = input.amountMinor == null ? refundable : Number(input.amountMinor);
  if (!Number.isSafeInteger(requested) || requested <= 0 || requested > refundable) return json({ error: "invalid_refund_amount", refundableMinor: refundable }, 400);

  const params = new URLSearchParams();
  params.set("payment_intent", payment.provider_payment_id);
  params.set("amount", String(requested));
  params.set("reason", "requested_by_customer");
  params.set("metadata[payment_id]", payment.id);
  params.set("metadata[payment_request_id]", payment.payment_request_id);
  params.set("metadata[initiated_by]", actor.id);

  const stripeResponse = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const refund = await stripeResponse.json();
  if (!stripeResponse.ok || !refund?.id) return json({ error: "stripe_refund_failed", detail: refund?.error?.message ?? null }, 502);

  const status = refund.status === "succeeded" ? "succeeded" : refund.status === "failed" ? "failed" : refund.status === "canceled" ? "cancelled" : "pending";
  const reason = String(input.reason ?? "Patient refund").trim().slice(0, 500) || "Patient refund";
  const { data: localRefund, error } = await admin.from("payment_refunds").upsert({
    payment_id: payment.id,
    provider: "stripe",
    provider_refund_id: refund.id,
    amount_minor: requested,
    currency: String(payment.currency).toUpperCase(),
    status,
    reason,
    initiated_by: actor.id,
    processed_at: status === "succeeded" ? new Date().toISOString() : null,
  }, { onConflict: "provider,provider_refund_id" }).select("id").single();
  if (error || !localRefund) return json({ error: "refund_record_failed" }, 500);

  const newRefunded = alreadyRefunded + (status === "succeeded" ? requested : 0);
  if (status === "succeeded") {
    await admin.from("payments").update({ status: newRefunded >= Number(payment.amount_minor) ? "refunded" : "partially_refunded" }).eq("id", payment.id);
  }

  await admin.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "payment_refund_requested",
    entity_type: "payment",
    entity_id: payment.id,
    metadata: { refund_id: localRefund.id, amount_minor: requested, currency: payment.currency, provider: "stripe" },
  });

  return json({ ok: true, refundId: localRefund.id, status, amountMinor: requested });
});
