"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
    // JV Dental remains the source of truth if Google Calendar is unavailable.
  }
}

function revalidateBookingViews() {
  revalidatePath("/clinic/bookings");
  revalidatePath("/clinic");
  revalidatePath("/patient");
  revalidatePath("/patient/plan");
  revalidatePath("/patient/notifications");
}

export async function confirmBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  const clinicianId = text(formData, "clinician_user_id") || null;
  const rawStart = text(formData, "starts_at");
  const notes = text(formData, "staff_notes") || null;
  if (!requestId || !rawStart) redirect("/clinic/bookings?error=missing");

  const startsAt = new Date(`${rawStart}:00+05:30`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    redirect("/clinic/bookings?error=time");
  }
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

  const { data: booking, error: bookingReadError } = await supabase
    .from("appointment_requests")
    .select("id,booking_kind,patient_id,converted_appointment_id")
    .eq("id", requestId)
    .maybeSingle();
  if (bookingReadError || !booking) redirect("/clinic/bookings?error=missing");

  const { error } = await supabase
    .from("appointment_requests")
    .update({
      assigned_clinician: clinicianId,
      confirmed_starts_at: startsAt.toISOString(),
      confirmed_ends_at: endsAt.toISOString(),
      staff_notes: notes,
      managed_by: user.id,
      confirmed_at: new Date().toISOString(),
      status: "confirmed",
    })
    .eq("id", requestId)
    .in("status", ["requested", "payment_pending", "paid", "confirmed"]);

  if (error) redirect("/clinic/bookings?error=confirm");

  let appointmentId: string | null = null;
  if (booking.patient_id) {
    const admin = createAdminClient();
    const { data: caseRecord } = await admin
      .from("patient_cases")
      .select("id")
      .eq("patient_id", booking.patient_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const appointment = {
      patient_id: booking.patient_id,
      case_id: caseRecord?.id ?? null,
      clinician_user_id: clinicianId,
      appointment_type: booking.booking_kind,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "scheduled",
      timezone: "Asia/Kolkata",
      notes,
    };

    if (booking.converted_appointment_id) {
      const { data: updatedAppointment, error: appointmentError } = await admin
        .from("appointments")
        .update(appointment)
        .eq("id", booking.converted_appointment_id)
        .eq("patient_id", booking.patient_id)
        .select("id")
        .maybeSingle();
      if (appointmentError || !updatedAppointment) redirect("/clinic/bookings?error=convert");
      appointmentId = updatedAppointment.id;
    } else {
      const { data: createdAppointment, error: appointmentError } = await admin
        .from("appointments")
        .insert(appointment)
        .select("id")
        .single();
      if (appointmentError || !createdAppointment) redirect("/clinic/bookings?error=convert");
      appointmentId = createdAppointment.id;

      const { error: linkError } = await admin
        .from("appointment_requests")
        .update({ converted_appointment_id: createdAppointment.id })
        .eq("id", requestId)
        .is("converted_appointment_id", null);
      if (linkError) redirect("/clinic/bookings?error=convert");
    }
  }

  if (appointmentId) await syncGoogleCalendar(supabase, appointmentId, "create");
  revalidateBookingViews();
}

export async function updateBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  const clinicianId = text(formData, "clinician_user_id") || null;
  const rawStart = text(formData, "starts_at");
  const notes = text(formData, "staff_notes") || null;
  if (!requestId) redirect("/clinic/bookings?error=missing");

  const { data: booking } = await supabase
    .from("appointment_requests")
    .select("converted_appointment_id,patient_id")
    .eq("id", requestId)
    .maybeSingle();

  const update: Record<string, string | null> = {
    assigned_clinician: clinicianId,
    staff_notes: notes,
    managed_by: user.id,
  };
  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (rawStart) {
    startsAt = new Date(`${rawStart}:00+05:30`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      redirect("/clinic/bookings?error=time");
    }
    endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    update.confirmed_starts_at = startsAt.toISOString();
    update.confirmed_ends_at = endsAt.toISOString();
  }

  const { error } = await supabase.from("appointment_requests").update(update).eq("id", requestId);
  if (error) redirect("/clinic/bookings?error=update");

  if (booking?.converted_appointment_id && booking.patient_id) {
    const appointmentUpdate: Record<string, string | null> = {
      clinician_user_id: clinicianId,
      notes,
    };
    if (startsAt && endsAt) {
      appointmentUpdate.starts_at = startsAt.toISOString();
      appointmentUpdate.ends_at = endsAt.toISOString();
    }
    const admin = createAdminClient();
    const { data: appointmentRecord, error: appointmentError } = await admin
      .from("appointments")
      .update(appointmentUpdate)
      .eq("id", booking.converted_appointment_id)
      .eq("patient_id", booking.patient_id)
      .select("id,external_event_id")
      .maybeSingle();
    if (appointmentError || !appointmentRecord) redirect("/clinic/bookings?error=convert");

    await syncGoogleCalendar(
      supabase,
      appointmentRecord.id,
      appointmentRecord.external_event_id ? "update" : "create",
    );
  }

  revalidateBookingViews();
}

export async function cancelBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  if (!requestId) redirect("/clinic/bookings?error=missing");

  const { data: booking } = await supabase
    .from("appointment_requests")
    .select("converted_appointment_id,patient_id")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("appointment_requests")
    .update({ status: "cancelled", managed_by: user.id })
    .eq("id", requestId)
    .neq("status", "completed");
  if (error) redirect("/clinic/bookings?error=cancel");

  if (booking?.converted_appointment_id && booking.patient_id) {
    const admin = createAdminClient();
    const { data: appointmentRecord, error: appointmentError } = await admin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", booking.converted_appointment_id)
      .eq("patient_id", booking.patient_id)
      .neq("status", "completed")
      .select("id")
      .maybeSingle();
    if (appointmentError) redirect("/clinic/bookings?error=convert");
    if (appointmentRecord) await syncGoogleCalendar(supabase, appointmentRecord.id, "cancel");
  }

  revalidateBookingViews();
}

export async function completeBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  if (!requestId) redirect("/clinic/bookings?error=missing");

  const { data: booking } = await supabase
    .from("appointment_requests")
    .select("converted_appointment_id,patient_id")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("appointment_requests")
    .update({ status: "completed", managed_by: user.id })
    .eq("id", requestId)
    .eq("status", "confirmed");
  if (error) redirect("/clinic/bookings?error=complete");

  if (booking?.converted_appointment_id && booking.patient_id) {
    const admin = createAdminClient();
    const { error: appointmentError } = await admin
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", booking.converted_appointment_id)
      .eq("patient_id", booking.patient_id)
      .eq("status", "scheduled");
    if (appointmentError) redirect("/clinic/bookings?error=convert");
  }

  revalidateBookingViews();
}
