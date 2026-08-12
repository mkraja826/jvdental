"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinicalPublisher } from "@/lib/content/permissions";
import { requireStaff } from "@/lib/auth/guards";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function positiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function scheduleVideoConsultation(formData: FormData) {
  const { supabase, user } = await requireClinicalPublisher();
  const caseId = text(formData, "case_id");
  const rawStart = text(formData, "starts_at");
  const meetingUrl = nullableText(formData, "meeting_url");
  const notes = nullableText(formData, "notes");

  if (!caseId || !rawStart) redirect(`/clinic/reviews/${caseId}?error=consultation`);

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,patient_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) redirect("/clinic/reviews?error=case");

  // Consultation times are entered in clinic-local India time.
  const startsAt = new Date(`${rawStart}:00+05:30`);
  if (Number.isNaN(startsAt.getTime())) redirect(`/clinic/reviews/${caseId}?error=consultation`);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

  const { error } = await supabase.from("appointments").insert({
    patient_id: caseRecord.patient_id,
    case_id: caseRecord.id,
    clinician_user_id: user.id,
    appointment_type: "video_consultation",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    meeting_url: meetingUrl,
    timezone: "Asia/Kolkata",
    notes,
    status: "scheduled",
  });
  if (error) redirect(`/clinic/reviews/${caseId}?error=consultation`);

  await supabase.from("patient_cases").update({ status: "consultation_scheduled" }).eq("id", caseId);
  revalidatePath(`/clinic/reviews/${caseId}`);
  revalidatePath("/clinic/commercial");
  revalidatePath("/patient");
  revalidatePath("/patient/plan");
}

export async function createTreatmentPlan(formData: FormData) {
  const { supabase, user } = await requireClinicalPublisher();
  const caseId = text(formData, "case_id");
  if (!caseId) redirect("/clinic/reviews?error=case");

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,patient_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) redirect("/clinic/reviews?error=case");

  const { data: latest } = await supabase
    .from("treatment_plans")
    .select("version")
    .eq("case_id", caseId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  const { data: plan, error } = await supabase
    .from("treatment_plans")
    .insert({
      patient_id: caseRecord.patient_id,
      case_id: caseId,
      version,
      status: "draft",
      title: text(formData, "title") || "Preliminary implant treatment plan",
      summary: nullableText(formData, "summary"),
      doctor_message: nullableText(formData, "doctor_message"),
      estimated_stay_days_min: positiveInteger(text(formData, "stay_min")),
      estimated_stay_days_max: positiveInteger(text(formData, "stay_max")),
      second_visit_required: formData.get("second_visit_required") === "on",
      valid_until: nullableText(formData, "valid_until"),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !plan) redirect(`/clinic/reviews/${caseId}?error=plan`);

  await supabase.from("patient_cases").update({ status: "preliminary_plan_ready" }).eq("id", caseId);
  redirect(`/clinic/plans/${plan.id}`);
}

export async function addTreatmentPlanItem(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const planId = text(formData, "plan_id");
  const description = text(formData, "description");
  const quantity = Number(text(formData, "quantity") || "1");
  const unitPrice = Number(text(formData, "unit_price"));
  const currency = text(formData, "currency") || "INR";

  if (!planId || !description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    redirect(`/clinic/plans/${planId}?error=item`);
  }

  const { count } = await supabase
    .from("treatment_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("treatment_plan_id", planId);

  const { error } = await supabase.from("treatment_plan_items").insert({
    treatment_plan_id: planId,
    description,
    quantity,
    unit_price: unitPrice,
    currency,
    sort_order: count ?? 0,
  });
  if (error) redirect(`/clinic/plans/${planId}?error=item`);
  revalidatePath(`/clinic/plans/${planId}`);
}

export async function sendTreatmentPlan(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const planId = text(formData, "plan_id");
  if (!planId) redirect("/clinic/commercial?error=plan");

  const { data: plan } = await supabase
    .from("treatment_plans")
    .select("id,case_id,version")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) redirect("/clinic/commercial?error=plan");

  const { count } = await supabase
    .from("treatment_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("treatment_plan_id", planId);
  if (!count) redirect(`/clinic/plans/${planId}?error=empty`);

  await supabase
    .from("treatment_plans")
    .update({ status: "superseded" })
    .eq("case_id", plan.case_id)
    .neq("id", planId)
    .in("status", ["sent", "requested_changes"]);

  const { error } = await supabase
    .from("treatment_plans")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", planId);
  if (error) redirect(`/clinic/plans/${planId}?error=send`);

  await supabase.from("patient_cases").update({ status: "estimate_sent" }).eq("id", plan.case_id);
  revalidatePath(`/clinic/plans/${planId}`);
  revalidatePath("/clinic/commercial");
  revalidatePath("/patient");
  revalidatePath("/patient/plan");
}

export async function createPlanRevision(formData: FormData) {
  const { supabase, user } = await requireClinicalPublisher();
  const sourceId = text(formData, "plan_id");
  if (!sourceId) redirect("/clinic/commercial?error=plan");

  const { data: source } = await supabase
    .from("treatment_plans")
    .select("id,patient_id,case_id,version,title,summary,doctor_message,estimated_stay_days_min,estimated_stay_days_max,second_visit_required,valid_until")
    .eq("id", sourceId)
    .maybeSingle();
  if (!source) redirect("/clinic/commercial?error=plan");

  const { data: latest } = await supabase
    .from("treatment_plans")
    .select("version")
    .eq("case_id", source.case_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? source.version) + 1;

  const { data: revision, error } = await supabase
    .from("treatment_plans")
    .insert({
      patient_id: source.patient_id,
      case_id: source.case_id,
      version,
      status: "draft",
      title: source.title,
      summary: source.summary,
      doctor_message: source.doctor_message,
      estimated_stay_days_min: source.estimated_stay_days_min,
      estimated_stay_days_max: source.estimated_stay_days_max,
      second_visit_required: source.second_visit_required,
      valid_until: source.valid_until,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !revision) redirect(`/clinic/plans/${sourceId}?error=revision`);

  const { data: items } = await supabase
    .from("treatment_plan_items")
    .select("description,quantity,unit_price,currency,sort_order")
    .eq("treatment_plan_id", sourceId)
    .order("sort_order");
  if (items?.length) {
    await supabase.from("treatment_plan_items").insert(
      items.map((item) => ({ ...item, treatment_plan_id: revision.id })),
    );
  }

  await supabase.from("treatment_plans").update({ status: "superseded" }).eq("id", sourceId);
  redirect(`/clinic/plans/${revision.id}`);
}

export async function confirmTravelPlan(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const travelId = text(formData, "travel_id");
  const caseId = text(formData, "case_id");
  if (!travelId || !caseId) redirect("/clinic/travel?error=travel");

  const { error } = await supabase
    .from("travel_plans")
    .update({
      status: "confirmed",
      coordinator_notes: nullableText(formData, "coordinator_notes"),
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", travelId);
  if (error) redirect(`/clinic/travel/${travelId}?error=confirm`);

  await supabase.from("patient_cases").update({ status: "travel_confirmed" }).eq("id", caseId);
  revalidatePath("/clinic/travel");
  revalidatePath(`/clinic/travel/${travelId}`);
  revalidatePath("/patient");
  revalidatePath("/patient/travel");
}
