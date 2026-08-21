"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const SCHEDULER_ROLES = new Set(["owner", "admin", "implantologist", "doctor", "coordinator"]);
const EARLY_CASE_STATUSES = new Set(["new", "records_requested", "records_received", "doctor_review", "more_information_required"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

async function requireConsultationScheduler() {
  const context = await requireStaff();
  if (!SCHEDULER_ROLES.has(context.staff.role)) redirect("/clinic");
  return context;
}

function parseIndiaDateTime(value: string) {
  const parsed = new Date(`${value}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function syncGoogleCalendar(
  supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"],
  appointmentId: string,
  action: "create" | "update" | "cancel" | "refresh",
) {
  try {
    await supabase.functions.invoke("google-calendar-event", {
      body: { appointmentId, action },
    });
  } catch {
    // JV Dental remains the source of truth when the external calendar is unavailable.
  }
}

function refreshCase(caseId: string) {
  revalidatePath(`/clinic/reviews/${caseId}`);
  revalidatePath(`/clinic/commercial/${caseId}`);
  revalidatePath("/clinic/commercial");
  revalidatePath("/clinic/notifications");
  revalidatePath("/patient");
  revalidatePath("/patient/plan");
  revalidatePath("/patient/notifications");
}

export async function scheduleVideoConsultation(formData: FormData) {
  const { supabase, user, staff } = await requireConsultationScheduler();
  const caseId = text(formData, "case_id");
  const rawStart = text(formData, "starts_at");
  const meetingUrl = nullableText(formData, "meeting_url");
  const notes = nullableText(formData, "notes");

  if (!caseId || !rawStart) redirect(`/clinic/commercial/${caseId}?error=consultation`);

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,patient_id,assigned_clinician,status")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRecord) redirect("/clinic/commercial?error=case");

  const startsAt = parseIndiaDateTime(rawStart);
  if (!startsAt || startsAt.getTime() <= Date.now()) {
    redirect(`/clinic/commercial/${caseId}?error=consultation_time`);
  }
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
  const clinicianUserId = staff.role === "coordinator" ? caseRecord.assigned_clinician : user.id;

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: caseRecord.patient_id,
      case_id: caseRecord.id,
      clinician_user_id: clinicianUserId,
      appointment_type: "video_consultation",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      meeting_url: meetingUrl,
      timezone: "Asia/Kolkata",
      notes,
      status: "scheduled",
      conference_provider: meetingUrl ? "manual" : null,
    })
    .select("id")
    .single();
  if (error || !appointment) redirect(`/clinic/commercial/${caseId}?error=consultation`);

  if (EARLY_CASE_STATUSES.has(caseRecord.status)) {
    await supabase
      .from("patient_cases")
      .update({ status: "consultation_scheduled" })
      .eq("id", caseId)
      .eq("status", caseRecord.status);
  }

  await syncGoogleCalendar(supabase, appointment.id, "create");
  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?scheduled=1`);
}

export async function rescheduleConsultation(formData: FormData) {
  const { supabase } = await requireConsultationScheduler();
  const appointmentId = text(formData, "appointment_id");
  const caseId = text(formData, "case_id");
  const rawStart = text(formData, "starts_at");
  if (!appointmentId || !caseId || !rawStart) redirect(`/clinic/commercial/${caseId}?error=appointment`);

  const startsAt = parseIndiaDateTime(rawStart);
  if (!startsAt || startsAt.getTime() <= Date.now()) redirect(`/clinic/commercial/${caseId}?error=consultation_time`);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .eq("status", "scheduled")
    .select("id,external_event_id")
    .maybeSingle();
  if (error || !appointment) redirect(`/clinic/commercial/${caseId}?error=appointment`);

  await syncGoogleCalendar(supabase, appointment.id, appointment.external_event_id ? "update" : "create");
  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?rescheduled=1`);
}

export async function completeConsultation(formData: FormData) {
  const { supabase } = await requireConsultationScheduler();
  const appointmentId = text(formData, "appointment_id");
  const caseId = text(formData, "case_id");
  if (!appointmentId || !caseId) redirect("/clinic/commercial?error=appointment");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .eq("status", "scheduled")
    .lte("starts_at", new Date().toISOString())
    .select("id")
    .maybeSingle();
  if (error || !appointment) redirect(`/clinic/commercial/${caseId}?error=appointment_disposition`);

  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?completed=1`);
}

export async function markConsultationNoShow(formData: FormData) {
  const { supabase } = await requireConsultationScheduler();
  const appointmentId = text(formData, "appointment_id");
  const caseId = text(formData, "case_id");
  if (!appointmentId || !caseId) redirect("/clinic/commercial?error=appointment");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "no_show" })
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .eq("status", "scheduled")
    .lte("starts_at", new Date().toISOString())
    .select("id")
    .maybeSingle();
  if (error || !appointment) redirect(`/clinic/commercial/${caseId}?error=appointment_disposition`);

  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?no_show=1`);
}

export async function cancelConsultation(formData: FormData) {
  const { supabase } = await requireConsultationScheduler();
  const appointmentId = text(formData, "appointment_id");
  const caseId = text(formData, "case_id");
  if (!appointmentId || !caseId) redirect("/clinic/commercial?error=appointment");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .eq("status", "scheduled")
    .select("id")
    .maybeSingle();
  if (error || !appointment) redirect(`/clinic/commercial/${caseId}?error=appointment`);

  await syncGoogleCalendar(supabase, appointment.id, "cancel");
  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?cancelled=1`);
}

export async function retryCalendarSync(formData: FormData) {
  const { supabase } = await requireConsultationScheduler();
  const appointmentId = text(formData, "appointment_id");
  const caseId = text(formData, "case_id");
  if (!appointmentId || !caseId) return;

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id,external_event_id,status")
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!appointment) return;

  if (appointment.status === "cancelled") {
    await syncGoogleCalendar(supabase, appointment.id, "cancel");
  } else if (appointment.external_event_id) {
    await syncGoogleCalendar(supabase, appointment.id, "refresh");
  } else if (appointment.status === "scheduled") {
    await syncGoogleCalendar(supabase, appointment.id, "create");
  }

  refreshCase(caseId);
  redirect(`/clinic/commercial/${caseId}?calendar_sync=1`);
}
