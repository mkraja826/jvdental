"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function saveTravelPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: acceptedPlan } = await supabase
    .from("treatment_plans")
    .select("case_id")
    .eq("patient_id", user.id)
    .eq("status", "accepted")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!acceptedPlan) redirect("/patient/plan?error=accept_required");

  const arrivalDate = value(formData, "arrival_date") || null;
  const departureDate = value(formData, "departure_date") || null;
  if (arrivalDate && departureDate && departureDate < arrivalDate) redirect("/patient/travel?error=dates");

  const payload = {
    patient_id: user.id,
    case_id: acceptedPlan.case_id,
    status: "details_submitted",
    arrival_date: arrivalDate,
    departure_date: departureDate,
    arrival_flight: value(formData, "arrival_flight") || null,
    departure_flight: value(formData, "departure_flight") || null,
    accommodation_name: value(formData, "accommodation_name") || null,
    accommodation_address: value(formData, "accommodation_address") || null,
    airport_pickup_required: formData.get("airport_pickup_required") === "on",
    companion_name: value(formData, "companion_name") || null,
    companion_phone: value(formData, "companion_phone") || null,
    patient_notes: value(formData, "patient_notes") || null,
  };

  const { error } = await supabase.from("travel_plans").upsert(payload, { onConflict: "case_id" });
  if (error) redirect("/patient/travel?error=save");

  revalidatePath("/patient/travel");
  revalidatePath("/clinic/travel");
  redirect("/patient/travel?saved=1");
}
