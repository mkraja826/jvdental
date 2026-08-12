"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinicalPublisher } from "@/lib/content/permissions";

const allowedStatuses = new Set([
  "records_received",
  "doctor_review",
  "more_information_required",
  "consultation_scheduled",
  "preliminary_plan_ready",
  "estimate_sent",
  "patient_considering",
  "travel_confirmed",
  "in_treatment",
  "follow_up",
  "completed",
  "closed",
]);

export async function updateClinicalCaseStatus(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const caseId = String(formData.get("case_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!caseId || !allowedStatuses.has(status)) redirect("/clinic/reviews?error=invalid");

  const { error } = await supabase
    .from("patient_cases")
    .update({ status })
    .eq("id", caseId);

  if (error) redirect(`/clinic/reviews/${caseId}?error=status`);
  revalidatePath(`/clinic/reviews/${caseId}`);
  revalidatePath("/clinic/reviews");
  revalidatePath("/patient");
}

export async function addInternalClinicalNote(formData: FormData) {
  const { supabase, user } = await requireClinicalPublisher();
  const caseId = String(formData.get("case_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 10000);

  if (!caseId || !note) redirect(`/clinic/reviews/${caseId}?error=note`);

  const { error } = await supabase.from("case_notes").insert({
    case_id: caseId,
    author_user_id: user.id,
    note,
  });

  if (error) redirect(`/clinic/reviews/${caseId}?error=note`);
  revalidatePath(`/clinic/reviews/${caseId}`);
}
