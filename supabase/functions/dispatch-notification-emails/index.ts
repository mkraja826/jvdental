import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type RecipientType = "patient" | "staff";
type Delivery = { id: string; recipient_user_id: string; recipient_type: RecipientType; event_type: string; attempt_count: number };
type EmailTemplate = { subject: string; heading: string; body: string; path: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const PATIENT_TEMPLATES: Record<string, EmailTemplate> = {
  consultation_scheduled: { subject: "Your JV Dental consultation is scheduled", heading: "Consultation scheduled", body: "Your video consultation has been scheduled. Open your secure patient portal for the date, time and joining information.", path: "/patient#appointments" },
  consultation_rescheduled: { subject: "Your JV Dental consultation time changed", heading: "Consultation rescheduled", body: "Your video consultation time has changed. Open your secure patient portal for the updated schedule and joining information.", path: "/patient#appointments" },
  consultation_cancelled: { subject: "Your JV Dental consultation was cancelled", heading: "Consultation cancelled", body: "Your scheduled video consultation has been cancelled. Open your secure portal for the latest case updates.", path: "/patient/notifications" },
  consultation_reminder_24h: { subject: "JV Dental consultation reminder", heading: "Your consultation is approaching", body: "Your JV Dental video consultation is approximately 24 hours away. Open your secure portal for the joining information.", path: "/patient#appointments" },
  consultation_reminder_2h: { subject: "JV Dental consultation reminder", heading: "Your consultation is approaching", body: "Your JV Dental video consultation is approximately 2 hours away. Open your secure portal for the joining information.", path: "/patient#appointments" },
  new_staff_message: { subject: "New secure message from JV Dental", heading: "You have a new secure message", body: "The JV Dental team sent you a message. Sign in to your patient portal to read it securely.", path: "/patient/messages" },
  treatment_plan_sent: { subject: "Your JV Dental treatment plan is ready", heading: "Treatment plan ready", body: "A treatment plan is available in your secure patient portal. Sign in to review the current version and respond.", path: "/patient/plan" },
  travel_update: { subject: "JV Dental travel-plan update", heading: "Travel-plan update", body: "There is an update to your JV Dental travel coordination. Open your secure portal for the latest information.", path: "/patient/travel" },
  payment_request: { subject: "JV Dental payment request ready", heading: "Payment request ready", body: "A payment request is available in your secure JV Dental portal. Sign in to review the amount, balance and secure payment options.", path: "/patient/payments" },
  payment_received: { subject: "JV Dental payment received", heading: "Payment received", body: "Your payment has been securely recorded. Open your patient portal for the updated balance and receipt information.", path: "/patient/payments" },
  payment_refund: { subject: "JV Dental refund update", heading: "Refund processed", body: "A refund has been processed for one of your JV Dental payments. Open your patient portal for the updated payment history.", path: "/patient/payments" },
};

const STAFF_TEMPLATES: Record<string, EmailTemplate> = {
  consultation_scheduled: { subject: "JV Dental consultation scheduled", heading: "Consultation scheduled", body: "A patient video consultation has been scheduled. Open the clinic portal for the schedule and case workspace.", path: "/clinic/commercial" },
  consultation_rescheduled: { subject: "JV Dental consultation rescheduled", heading: "Consultation rescheduled", body: "A patient video consultation time has changed. Open the clinic portal for the updated schedule.", path: "/clinic/commercial" },
  consultation_cancelled: { subject: "JV Dental consultation cancelled", heading: "Consultation cancelled", body: "A patient video consultation has been cancelled. Open the clinic portal for the current case status.", path: "/clinic/commercial" },
  consultation_reminder_2h: { subject: "JV Dental consultation reminder", heading: "Consultation approaching", body: "A patient video consultation is approximately 2 hours away. Open the clinic portal for details.", path: "/clinic/commercial" },
  new_patient_message: { subject: "New secure patient message · JV Dental", heading: "New patient message", body: "A patient sent a secure message. Open the JV Dental clinic inbox to read and respond.", path: "/clinic/inbox" },
  new_patient_document: { subject: "New patient record uploaded · JV Dental", heading: "New patient record", body: "A patient uploaded a new record. Open the protected clinical review workspace to view it.", path: "/clinic/reviews" },
  treatment_plan_response: { subject: "Treatment-plan response · JV Dental", heading: "Treatment-plan response", body: "A patient responded to a treatment plan. Open the clinic portal to review the current response and next action.", path: "/clinic/commercial" },
  travel_update: { subject: "International travel update · JV Dental", heading: "Travel coordination update", body: "There is a new international-patient travel update. Open the travel workspace to review it.", path: "/clinic/travel" },
  inventory_low_stock: { subject: "JV Dental inventory below minimum", heading: "Inventory attention needed", body: "An inventory item is at or below its configured minimum level. Open Inventory for the exact item and quantity.", path: "/clinic/inventory" },
  inventory_expiry_30d: { subject: "JV Dental inventory expiry approaching", heading: "Inventory expiry approaching", body: "An inventory batch is approaching expiry. Open Inventory for the exact batch, expiry date and FEFO details.", path: "/clinic/inventory" },
};

function templateFor(eventType: string, recipientType: RecipientType) {
  return (recipientType === "patient" ? PATIENT_TEMPLATES : STAFF_TEMPLATES)[eventType] ?? null;
}

function emailHtml(template: EmailTemplate, siteUrl: string) {
  const href = `${siteUrl}${template.path}`;
  return `<!doctype html><html><body style="margin:0;background:#f4f1eb;color:#171918;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:40px 24px"><div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:28px">JV Dental · Hyderabad</div><h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">${escapeHtml(template.heading)}</h1><p style="font-size:16px;line-height:1.7;margin:0 0 26px">${escapeHtml(template.body)}</p><a href="${escapeHtml(href)}" style="display:inline-block;background:#171918;color:#fff;text-decoration:none;padding:13px 18px;border-radius:4px">Open secure JV Dental portal</a><p style="font-size:12px;line-height:1.6;color:#666;margin-top:34px">For privacy, this email does not contain clinical records, diagnoses, treatment details, scan content or secure-message text. Sign in to the JV Dental portal to view protected information.</p></div></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const dispatchSecret = Deno.env.get("EMAIL_DISPATCH_SECRET");
  if (!dispatchSecret) return json({ error: "dispatcher_not_configured" }, 503);
  if (req.headers.get("X-JV-Dispatch-Key") !== dispatchSecret) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "resend").toLowerCase();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");
  const replyTo = Deno.env.get("EMAIL_REPLY_TO");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://jvdental.com").replace(/\/$/, "");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (provider !== "resend" || !resendApiKey || !emailFrom) return json({ error: "email_provider_not_configured" }, 503);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const now = new Date().toISOString();
  const { data: due, error: dueError } = await admin
    .from("email_deliveries")
    .select("id,recipient_user_id,recipient_type,event_type,attempt_count")
    .in("status", ["queued", "retry"])
    .lte("scheduled_for", now)
    .lte("next_attempt_at", now)
    .order("created_at", { ascending: true })
    .limit(20);
  if (dueError) return json({ error: "queue_read_failed" }, 500);

  let sent = 0;
  let failed = 0;
  let suppressed = 0;

  for (const candidate of (due ?? []) as Delivery[]) {
    const claimedAt = new Date().toISOString();
    const { data: claimed } = await admin
      .from("email_deliveries")
      .update({ status: "processing", claimed_at: claimedAt, updated_at: claimedAt })
      .eq("id", candidate.id)
      .in("status", ["queued", "retry"])
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const template = templateFor(candidate.event_type, candidate.recipient_type);
    if (!template) {
      await admin.from("email_deliveries").update({ status: "suppressed", last_error: "no_safe_template", updated_at: new Date().toISOString() }).eq("id", candidate.id);
      suppressed += 1;
      continue;
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(candidate.recipient_user_id);
    const email = userData.user?.email;
    if (userError || !email) {
      await admin.from("email_deliveries").update({ status: "suppressed", last_error: "recipient_email_unavailable", updated_at: new Date().toISOString() }).eq("id", candidate.id);
      suppressed += 1;
      continue;
    }

    const payload: Record<string, unknown> = {
      from: emailFrom,
      to: [email],
      subject: template.subject,
      html: emailHtml(template, siteUrl),
      text: `${template.heading}\n\n${template.body}\n\nOpen your secure JV Dental portal: ${siteUrl}${template.path}`,
      tags: [
        { name: "product", value: "jv_dental" },
        { name: "event", value: candidate.event_type.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256) },
      ],
    };
    if (replyTo) payload.reply_to = replyTo;

    let response: Response;
    let responseBody: { id?: string; message?: string; name?: string } = {};
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "JV-Dental/1.0",
          "Idempotency-Key": `jvdental-${candidate.id}`,
        },
        body: JSON.stringify(payload),
      });
      responseBody = await response.json() as { id?: string; message?: string; name?: string };
    } catch {
      response = new Response(null, { status: 503 });
    }

    const attemptCount = Number(candidate.attempt_count ?? 0) + 1;
    if (response.ok && responseBody.id) {
      const sentAt = new Date().toISOString();
      await admin.from("email_deliveries").update({ status: "sent", attempt_count: attemptCount, provider: "resend", provider_message_id: responseBody.id, last_error: null, sent_at: sentAt, updated_at: sentAt }).eq("id", candidate.id);
      sent += 1;
      continue;
    }

    const retryable = response.status === 429 || response.status >= 500;
    const shouldRetry = retryable && attemptCount < 5;
    const retryMinutes = Math.min(60, 5 * 2 ** Math.max(0, attemptCount - 1));
    await admin.from("email_deliveries").update({
      status: shouldRetry ? "retry" : "failed",
      attempt_count: attemptCount,
      provider: "resend",
      last_error: String(responseBody.message ?? responseBody.name ?? `email_provider_${response.status}`).slice(0, 500),
      next_attempt_at: shouldRetry ? new Date(Date.now() + retryMinutes * 60_000).toISOString() : now,
      updated_at: new Date().toISOString(),
    }).eq("id", candidate.id);
    failed += 1;
  }

  return json({ ok: true, processed: (due ?? []).length, sent, failed, suppressed });
});
