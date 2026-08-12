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
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://jvdental.com").replace(/\/$/, "");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!stripeKey) return json({ error: "stripe_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: "unauthorized" }, 401);

  let input: { paymentRequestId?: string };
  try { input = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const paymentRequestId = String(input.paymentRequestId ?? "").trim();
  if (!paymentRequestId) return json({ error: "payment_request_required" }, 400);

  const { data: request } = await admin
    .from("payment_requests")
    .select("id,patient_id,case_id,amount_minor,currency,status,provider_preference,expires_at")
    .eq("id", paymentRequestId)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (!request) return json({ error: "payment_request_not_found" }, 404);
  if (!["sent", "partially_paid"].includes(request.status)) return json({ error: "payment_request_not_payable" }, 409);
  if (request.provider_preference !== "stripe") return json({ error: "provider_not_supported" }, 409);
  if (request.expires_at && new Date(request.expires_at).getTime() <= Date.now()) {
    await admin.from("payment_requests").update({ status: "expired" }).eq("id", request.id);
    return json({ error: "payment_request_expired" }, 409);
  }

  const { data: balance } = await admin
    .from("payment_request_balances")
    .select("remaining_minor")
    .eq("payment_request_id", request.id)
    .maybeSingle();
  const remainingMinor = Number(balance?.remaining_minor ?? request.amount_minor);
  if (!Number.isSafeInteger(remainingMinor) || remainingMinor <= 0) return json({ error: "nothing_due" }, 409);

  const { data: attempt, error: attemptError } = await admin.from("payment_attempts").insert({
    payment_request_id: request.id,
    patient_id: user.id,
    provider: "stripe",
    amount_minor: remainingMinor,
    currency: request.currency,
    status: "created",
    initiated_by: user.id,
  }).select("id").single();
  if (attemptError || !attempt) return json({ error: "attempt_create_failed" }, 500);

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${siteUrl}/patient/payments?payment=success&request=${encodeURIComponent(request.id)}`);
  params.set("cancel_url", `${siteUrl}/patient/payments?payment=cancelled&request=${encodeURIComponent(request.id)}`);
  params.set("client_reference_id", request.id);
  params.set("customer_creation", "always");
  if (user.email) params.set("customer_email", user.email);
  params.set("billing_address_collection", "required");
  params.set("name_collection[individual][enabled]", "true");
  params.set("payment_method_types[0]", "card");
  params.set("line_items[0][price_data][currency]", request.currency.toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(remainingMinor));
  params.set("line_items[0][price_data][product_data][name]", "JV Dental treatment payment");
  params.set("line_items[0][price_data][product_data][description]", "Secure payment toward your JV Dental treatment plan.");
  params.set("line_items[0][quantity]", "1");
  params.set("payment_intent_data[description]", "JV Dental treatment payment");
  if (user.email) params.set("payment_intent_data[receipt_email]", user.email);
  params.set("metadata[payment_request_id]", request.id);
  params.set("metadata[payment_attempt_id]", attempt.id);
  params.set("payment_intent_data[metadata][payment_request_id]", request.id);
  params.set("payment_intent_data[metadata][payment_attempt_id]", attempt.id);
  params.set("payment_intent_data[metadata][case_id]", request.case_id);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const stripe = await stripeResponse.json();
  if (!stripeResponse.ok || !stripe?.id || !stripe?.url) {
    await admin.from("payment_attempts").update({
      status: "failed",
      failure_code: String(stripe?.error?.code ?? "stripe_error").slice(0, 120),
      failure_message: String(stripe?.error?.message ?? "Unable to create Stripe Checkout session").slice(0, 500),
    }).eq("id", attempt.id);
    return json({ error: "stripe_checkout_failed" }, 502);
  }

  await admin.from("payment_attempts").update({
    status: "redirected",
    provider_session_id: stripe.id,
    checkout_url: stripe.url,
  }).eq("id", attempt.id);

  return json({ ok: true, checkoutUrl: stripe.url, attemptId: attempt.id });
});
