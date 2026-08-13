"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

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
