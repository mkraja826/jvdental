"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const FINANCE_ROLES = new Set(["owner", "admin", "coordinator", "receptionist"]);
const CURRENCIES = new Set(["INR", "USD", "GBP", "AUD", "AED", "EUR"]);
const REQUEST_TYPES = new Set(["deposit", "treatment_balance", "installment", "custom"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireFinanceStaff() {
  const context = await requireStaff();
  if (!FINANCE_ROLES.has(context.staff.role)) redirect("/clinic");
  return context;
}

function parseMinor(value: string) {
  const match = value.match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + fraction;
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

function nullableDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function createPaymentRequest(formData: FormData) {
  const { supabase, user } = await requireFinanceStaff();
  const caseId = text(formData, "case_id");
  const treatmentPlanId = text(formData, "treatment_plan_id") || null;
  const requestType = text(formData, "request_type");
  const title = text(formData, "title") || "JV Dental treatment payment";
  const description = text(formData, "description") || null;
  const currency = text(formData, "currency").toUpperCase();
  const amountMinor = parseMinor(text(formData, "amount"));
  const dueAt = nullableDateTime(text(formData, "due_date"));
  const expiresAt = nullableDateTime(text(formData, "expires_date"));

  if (!caseId || !amountMinor || !CURRENCIES.has(currency) || !REQUEST_TYPES.has(requestType)) redirect("/clinic/finance?error=request");

  const now = Date.now();
  const dueMs = dueAt ? new Date(dueAt).getTime() : null;
  const expiresMs = expiresAt ? new Date(expiresAt).getTime() : null;
  if (
    (dueMs != null && dueMs <= now)
    || (expiresMs != null && expiresMs <= now)
    || (dueMs != null && expiresMs != null && expiresMs < dueMs)
  ) {
    redirect("/clinic/finance?error=date");
  }

  const { data: caseRecord } = await supabase.from("patient_cases").select("id,patient_id").eq("id", caseId).maybeSingle();
  if (!caseRecord) redirect("/clinic/finance?error=case");

  if (treatmentPlanId) {
    const { data: plan } = await supabase.from("treatment_plans").select("id,case_id").eq("id", treatmentPlanId).eq("case_id", caseId).maybeSingle();
    if (!plan) redirect("/clinic/finance?error=plan");
    const { data: firstItem } = await supabase.from("treatment_plan_items").select("currency").eq("treatment_plan_id", treatmentPlanId).limit(1).maybeSingle();
    if (firstItem?.currency && firstItem.currency !== currency) redirect("/clinic/finance?error=currency");
  }

  const { error } = await supabase.from("payment_requests").insert({
    patient_id: caseRecord.patient_id,
    case_id: caseRecord.id,
    treatment_plan_id: treatmentPlanId,
    request_type: requestType,
    title: title.slice(0, 180),
    description: description?.slice(0, 1000) ?? null,
    amount_minor: amountMinor,
    currency,
    status: "draft",
    provider_preference: "stripe",
    due_at: dueAt,
    expires_at: expiresAt,
    created_by: user.id,
  });
  if (error) redirect("/clinic/finance?error=request");
  revalidatePath("/clinic/finance");
  redirect("/clinic/finance?created=1");
}

export async function sendPaymentRequest(formData: FormData) {
  const { supabase } = await requireFinanceStaff();
  const requestId = text(formData, "payment_request_id");
  if (!requestId) return;

  const { data: request } = await supabase
    .from("payment_requests")
    .select("id,status,expires_at")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status !== "draft") return;
  if (request.expires_at && new Date(request.expires_at).getTime() <= Date.now()) {
    redirect("/clinic/finance?error=expired");
  }

  const { error } = await supabase.from("payment_requests").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", requestId).eq("status", "draft");
  if (error) redirect("/clinic/finance?error=send");
  revalidatePath("/clinic/finance");
  revalidatePath("/patient/payments");
  revalidatePath("/patient/notifications");
}

export async function cancelPaymentRequest(formData: FormData) {
  const { supabase } = await requireFinanceStaff();
  const requestId = text(formData, "payment_request_id");
  if (!requestId) return;
  const { count } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("payment_request_id", requestId).in("status", ["succeeded", "partially_refunded", "refunded"]);
  if (count) redirect("/clinic/finance?error=paid_request");
  const { error } = await supabase.from("payment_requests").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", requestId).in("status", ["draft", "sent"]);
  if (error) redirect("/clinic/finance?error=cancel");
  revalidatePath("/clinic/finance");
  revalidatePath("/patient/payments");
}
