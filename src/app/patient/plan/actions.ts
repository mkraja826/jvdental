"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function respondToTreatmentPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const planId = String(formData.get("plan_id") ?? "").trim();
  const response = String(formData.get("response") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000) || null;

  if (!planId || !["accepted", "request_changes"].includes(response)) {
    redirect("/patient/plan?error=invalid");
  }

  const { error } = await supabase.from("treatment_plan_feedback").insert({
    treatment_plan_id: planId,
    patient_id: user.id,
    response,
    message,
  });
  if (error) redirect("/patient/plan?error=response");

  revalidatePath("/patient/plan");
  revalidatePath("/patient");
  redirect(`/patient/plan?response=${response}`);
}
