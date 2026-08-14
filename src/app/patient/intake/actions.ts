"use server";

import { redirect } from "next/navigation";
import { trackProductEvent } from "@/lib/product-analytics";
import { createClient } from "@/lib/supabase/server";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key);
  return value || null;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function savePatientIntake(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/patient/login");
  }

  const fullName = getText(formData, "full_name");
  const country = getText(formData, "country");
  const treatmentInterest = formData
    .getAll("treatment_interest")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!fullName || !country) {
    redirect("/patient/intake?error=required");
  }

  const preferredMonth = getNullableText(formData, "preferred_treatment_month");
  const preferredTreatmentDate = preferredMonth ? `${preferredMonth}-01` : null;

  const { error: profileError } = await supabase.from("patient_profiles").upsert(
    {
      user_id: user.id,
      full_name: fullName,
      date_of_birth: getNullableText(formData, "date_of_birth"),
      gender: getNullableText(formData, "gender"),
      country,
      city: getNullableText(formData, "city"),
      phone: getNullableText(formData, "phone"),
      whatsapp: getNullableText(formData, "whatsapp"),
      preferred_language: getText(formData, "preferred_language") || "en",
      preferred_contact_method: getNullableText(formData, "preferred_contact_method"),
      intake_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    redirect("/patient/intake?error=profile");
  }

  const { error: medicalError } = await supabase.from("medical_histories").upsert(
    {
      patient_id: user.id,
      diabetes: getBoolean(formData, "diabetes"),
      hypertension: getBoolean(formData, "hypertension"),
      heart_condition: getBoolean(formData, "heart_condition"),
      blood_thinners: getBoolean(formData, "blood_thinners"),
      allergies: getNullableText(formData, "allergies"),
      current_medications: getNullableText(formData, "current_medications"),
      smoking_status: getNullableText(formData, "smoking_status"),
      previous_surgeries: getNullableText(formData, "previous_surgeries"),
      other_conditions: getNullableText(formData, "other_conditions"),
    },
    { onConflict: "patient_id" },
  );

  if (medicalError) {
    redirect("/patient/intake?error=medical");
  }

  const { error: dentalError } = await supabase.from("dental_intakes").upsert(
    {
      patient_id: user.id,
      primary_concern: getNullableText(formData, "primary_concern"),
      missing_teeth: getNullableText(formData, "missing_teeth"),
      loose_teeth: getBoolean(formData, "loose_teeth"),
      existing_dentures: getBoolean(formData, "existing_dentures"),
      previous_implants: getNullableText(formData, "previous_implants"),
      pain_or_infection: getNullableText(formData, "pain_or_infection"),
      treatment_interest: treatmentInterest,
      preferred_treatment_month: preferredTreatmentDate,
      notes: getNullableText(formData, "notes"),
    },
    { onConflict: "patient_id" },
  );

  if (dentalError) {
    redirect("/patient/intake?error=dental");
  }

  const { data: existingCase } = await supabase
    .from("patient_cases")
    .select("id")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingCase) {
    await supabase.from("patient_cases").insert({
      patient_id: user.id,
      status: "new",
      country_snapshot: country,
      treatment_interest: treatmentInterest.join(", ") || null,
    });
  }

  await trackProductEvent({
    eventName: "patient_intake_completed",
    surface: "patient",
    actorType: "patient",
    actorUserId: user.id,
  });

  redirect("/patient?intake=complete");
}
