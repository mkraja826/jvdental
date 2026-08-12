import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))));
}

async function sha256Hex(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

async function verifyStripeSignature(raw: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false;
  const expected = await hmacHex(secret, `${timestamp}.${raw}`);
  return signatures.some((signature) => safeEqual(expected, signature));
}

function mapRefundStatus(status: string) {
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "canceled" || status === "cancelled") return "cancelled";
  return "pending";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !stripeKey || !webhookSecret) return json({ error: "server_not_configured" }, 503);

  const raw = await req.text();
  const signature = req.headers.get("Stripe-Signature") ?? "";
  if (!(await verifyStripeSignature(raw, signature, webhookSecret))) return json({ error: "invalid_signature" }, 400);

  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  if (!event?.id || !event?.type || !event?.data?.object) return json({ error: "invalid_event" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: prior } = await admin.from("payment_provider_events").select("event_id").eq("provider", "stripe").eq("event_id", event.id).maybeSingle();
  if (prior) return json({ ok: true, duplicate: true });

  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    const attemptId = object.metadata?.payment_attempt_id;
    if (attemptId) {
      await admin.from("payment_attempts").update({
        status: "completed",
        provider_session_id: object.id,
        provider_payment_intent_id: typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id ?? null,
        billing_country: object.customer_details?.address?.country ?? null,
      }).eq("id", attemptId);
    }
  } else if (event.type === "checkout.session.expired") {
    const attemptId = object.metadata?.payment_attempt_id;
    if (attemptId) await admin.from("payment_attempts").update({ status: "expired" }).eq("id", attemptId);
  } else if (event.type === "payment_intent.succeeded") {
    const requestId = object.metadata?.payment_request_id;
    const attemptId = object.metadata?.payment_attempt_id;
    if (requestId) {
      const { data: request } = await admin.from("payment_requests").select("id,patient_id,case_id,currency").eq("id", requestId).maybeSingle();
      if (!request) return json({ error: "unknown_payment_request" }, 400);

      let detail: any = object;
      try {
        const detailResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(object.id)}?expand[]=latest_charge`, { headers: { Authorization: `Bearer ${stripeKey}` } });
        if (detailResponse.ok) detail = await detailResponse.json();
      } catch { /* webhook can still reconcile from the event payload */ }

      const charge = typeof detail.latest_charge === "object" ? detail.latest_charge : null;
      const card = charge?.payment_method_details?.card;
      const methodSummary = card?.brand && card?.last4 ? `${String(card.brand).toUpperCase()} •••• ${card.last4}` : null;
      const amount = Number(detail.amount_received ?? detail.amount ?? 0);
      const currency = String(detail.currency ?? request.currency).toUpperCase();

      const { data: existing } = await admin.from("payments").select("id").eq("provider", "stripe").eq("provider_payment_id", object.id).maybeSingle();
      let paymentId = existing?.id as string | undefined;
      if (existing) {
        await admin.from("payments").update({
          provider_charge_id: charge?.id ?? null,
          amount_minor: amount,
          currency,
          status: "succeeded",
          payment_method_summary: methodSummary,
          paid_at: new Date((detail.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
          receipt_url: charge?.receipt_url ?? null,
        }).eq("id", existing.id);
      } else {
        const { data: inserted, error } = await admin.from("payments").insert({
          payment_request_id: request.id,
          patient_id: request.patient_id,
          case_id: request.case_id,
          provider: "stripe",
          provider_payment_id: object.id,
          provider_charge_id: charge?.id ?? null,
          amount_minor: amount,
          currency,
          status: "succeeded",
          payment_method_summary: methodSummary,
          paid_at: new Date((detail.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
          receipt_url: charge?.receipt_url ?? null,
        }).select("id").single();
        if (error || !inserted) return json({ error: "payment_record_failed" }, 500);
        paymentId = inserted.id;
      }
      if (paymentId) await admin.from("payment_receipts").upsert({ payment_id: paymentId }, { onConflict: "payment_id", ignoreDuplicates: true });
      if (attemptId) await admin.from("payment_attempts").update({ status: "completed", provider_payment_intent_id: object.id }).eq("id", attemptId);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const attemptId = object.metadata?.payment_attempt_id;
    if (attemptId) {
      await admin.from("payment_attempts").update({
        status: "failed",
        provider_payment_intent_id: object.id,
        failure_code: String(object.last_payment_error?.code ?? "payment_failed").slice(0, 120),
        failure_message: String(object.last_payment_error?.message ?? "Payment failed").slice(0, 500),
      }).eq("id", attemptId);
    }
  } else if (["refund.created", "refund.updated", "refund.failed"].includes(event.type)) {
    const refund = object;
    let paymentId = refund.metadata?.payment_id as string | undefined;
    if (!paymentId && refund.payment_intent) {
      const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent.id;
      const { data: payment } = await admin.from("payments").select("id").eq("provider", "stripe").eq("provider_payment_id", paymentIntentId).maybeSingle();
      paymentId = payment?.id;
    }
    if (paymentId) {
      const mapped = mapRefundStatus(String(refund.status ?? "pending"));
      const { data: existingRefund } = await admin.from("payment_refunds").select("id,initiated_by,reason").eq("provider", "stripe").eq("provider_refund_id", refund.id).maybeSingle();
      if (existingRefund) {
        await admin.from("payment_refunds").update({
          amount_minor: Number(refund.amount),
          currency: String(refund.currency).toUpperCase(),
          status: mapped,
          processed_at: mapped === "succeeded" ? new Date().toISOString() : null,
        }).eq("id", existingRefund.id);
      } else {
        await admin.from("payment_refunds").insert({
          payment_id: paymentId,
          provider: "stripe",
          provider_refund_id: refund.id,
          amount_minor: Number(refund.amount),
          currency: String(refund.currency).toUpperCase(),
          status: mapped,
          reason: refund.reason ?? null,
          processed_at: mapped === "succeeded" ? new Date().toISOString() : null,
        });
      }

      const { data: payment } = await admin.from("payments").select("id,amount_minor").eq("id", paymentId).maybeSingle();
      if (payment) {
        const { data: succeededRefunds } = await admin.from("payment_refunds").select("amount_minor").eq("payment_id", paymentId).eq("status", "succeeded");
        const refunded = (succeededRefunds ?? []).reduce((sum, row) => sum + Number(row.amount_minor ?? 0), 0);
        const paymentStatus = refunded >= Number(payment.amount_minor) ? "refunded" : refunded > 0 ? "partially_refunded" : "succeeded";
        await admin.from("payments").update({ status: paymentStatus }).eq("id", paymentId);
      }
    }
  }

  await admin.from("payment_provider_events").insert({
    provider: "stripe",
    event_id: event.id,
    event_type: event.type,
    payload_hash: await sha256Hex(raw),
  });

  return json({ ok: true });
});
