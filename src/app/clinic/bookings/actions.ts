"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
      const { error: appointmentError } = await admin
        .from("appointments")
        .update(appointment)
        .eq("id", booking.converted_appointment_id)
        .eq("patient_id", booking.patient_id);
      if (appointmentError) redirect("/clinic/bookings?error=convert");
    } else {
      const { data: createdAppointment, error: appointmentError } = await admin
        .from("appointments")
        .insert(appointment)
        .select("id")
        .single();
      if (appointmentError || !createdAppointment) redirect("/clinic/bookings?error=convert");

      const { error: linkError } = await admin
        .from("appointment_requests")
        .update({ converted_appointment_id: createdAppointment.id })
        .eq("id", requestId)
        .is("converted_appointment_id", null);
      if (linkError) redirect("/clinic/bookings?error=convert");
    }

    revalidatePath("/patient");
    revalidatePath("/patient/plan");
  }

  revalidatePath("/clinic/bookings");
  revalidatePath("/clinic");
}

export async function updateBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  const clinicianId = text(formData, "clinician_user_id") || null;
  const rawStart = text(formData, "starts_at");
  const notes = text(formData, "staff_notes") || null;
  if (!requestId) redirect("/clinic/bookings?error=missing");

  const update: Record<string, string | null> = {
    assigned_clinician: clinicianId,
    staff_notes: notes,
    managed_by: user.id,
  };
  if (rawStart) {
    const startsAt = new Date(`${rawStart}:00+05:30`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      redirect("/clinic/bookings?error=time");
    }
    update.confirmed_starts_at = startsAt.toISOString();
    update.confirmed_ends_at = new Date(startsAt.getTime() + 30 * 60 * 1000).toISOString();
  }

  const { error } = await supabase.from("appointment_requests").update(update).eq("id", requestId);
  if (error) redirect("/clinic/bookings?error=update");
  revalidatePath("/clinic/bookings");
}

export async function cancelBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  if (!requestId) redirect("/clinic/bookings?error=missing");
  const { error } = await supabase
    .from("appointment_requests")
    .update({ status: "cancelled", managed_by: user.id })
    .eq("id", requestId)
    .neq("status", "completed");
  if (error) redirect("/clinic/bookings?error=cancel");
  revalidatePath("/clinic/bookings");
  revalidatePath("/clinic");
}

export async function completeBookingRequest(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const requestId = text(formData, "request_id");
  if (!requestId) redirect("/clinic/bookings?error=missing");
  const { error } = await supabase
    .from("appointment_requests")
    .update({ status: "completed", managed_by: user.id })
    .eq("id", requestId)
    .eq("status", "confirmed");
  if (error) redirect("/clinic/bookings?error=complete");
  revalidatePath("/clinic/bookings");
  revalidatePath("/clinic");
}
