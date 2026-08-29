"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinicalPublisher } from "@/lib/content/permissions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function createSignatureCase(formData: FormData) {
  const { supabase, user } = await requireClinicalPublisher();
  const title = String(formData.get("title") ?? "").trim();
  const treatmentType = String(formData.get("treatment_type") ?? "").trim();
  const requestedStatus = String(formData.get("publication_status") ?? "draft");
  const websiteConsent = formData.get("consent_for_website") === "on";
  const publicationStatus = requestedStatus === "published" && !websiteConsent ? "review" : requestedStatus;

  if (title.length < 5 || treatmentType.length < 3) {
    redirect("/clinic/cases?error=invalid");
  }

  const { data: created, error } = await supabase
    .from("signature_cases")
    .insert({
      created_by: user.id,
      title,
      slug: slugify(String(formData.get("slug") ?? "").trim() || title),
      case_code: String(formData.get("case_code") ?? "").trim() || null,
      treatment_type: treatmentType,
      short_summary: String(formData.get("short_summary") ?? "").trim() || null,
      diagnosis_summary: String(formData.get("diagnosis_summary") ?? "").trim() || null,
      challenge_summary: String(formData.get("challenge_summary") ?? "").trim() || null,
      treatment_plan_summary: String(formData.get("treatment_plan_summary") ?? "").trim() || null,
      final_outcome_summary: String(formData.get("final_outcome_summary") ?? "").trim() || null,
      guided_implant: formData.get("guided_implant") === "on",
      dionavi_used: formData.get("dionavi_used") === "on",
      full_arch: formData.get("full_arch") === "on",
      featured: formData.get("featured") === "on",
      publication_status: publicationStatus,
      patient_age_band: String(formData.get("patient_age_band") ?? "").trim() || null,
      patient_country: String(formData.get("patient_country") ?? "").trim() || null,
      consent_for_website: websiteConsent,
      consent_for_social: formData.get("consent_for_social") === "on",
      anonymised: true,
      published_at: publicationStatus === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !created) {
    redirect(`/clinic/cases?error=${encodeURIComponent(error?.code ?? "save")}`);
  }

  revalidatePath("/clinic/cases");
  revalidatePath("/cases");
  redirect(`/clinic/cases/${created.id}`);
}

export async function addCaseStage(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const caseId = String(formData.get("case_id") ?? "");
  const stageType = String(formData.get("stage_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const allowed = new Set(["presentation","diagnosis","cbct","intraoral_scan","digital_planning","dionavi_planning","surgical_guide","implant_placement","temporary_prosthesis","prosthetic_phase","final_result","follow_up"]);

  if (!caseId || !allowed.has(stageType) || !title) return;

  const { count } = await supabase
    .from("signature_case_stages")
    .select("id", { count: "exact", head: true })
    .eq("signature_case_id", caseId);

  await supabase.from("signature_case_stages").insert({
    signature_case_id: caseId,
    stage_type: stageType,
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    sort_order: count ?? 0,
  });

  revalidatePath(`/clinic/cases/${caseId}`);
  revalidatePath("/cases");
}

export async function setCasePublication(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const caseId = String(formData.get("case_id") ?? "");
  const status = String(formData.get("publication_status") ?? "draft");

  if (!caseId || !new Set(["draft", "review", "published", "archived"]).has(status)) return;

  const { data: item } = await supabase
    .from("signature_cases")
    .select("consent_for_website")
    .eq("id", caseId)
    .single();

  if (status === "published" && !item?.consent_for_website) {
    redirect(`/clinic/cases/${caseId}?error=consent_required`);
  }

  await supabase
    .from("signature_cases")
    .update({ publication_status: status, published_at: status === "published" ? new Date().toISOString() : null })
    .eq("id", caseId);

  revalidatePath(`/clinic/cases/${caseId}`);
  revalidatePath("/cases");
}

export async function deleteDraftCase(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const caseId = String(formData.get("case_id") ?? "");
  if (!caseId) return;

  const { data: item } = await supabase
    .from("signature_cases")
    .select("id,publication_status")
    .eq("id", caseId)
    .maybeSingle();

  if (!item || item.publication_status !== "draft") {
    redirect(`/clinic/cases/${caseId}?error=delete_not_allowed`);
  }

  const { data: media } = await supabase
    .from("signature_case_media")
    .select("storage_path")
    .eq("signature_case_id", caseId);

  const paths = (media ?? []).map((asset) => asset.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("public-content").remove(paths);
    if (storageError) {
      redirect(`/clinic/cases/${caseId}?error=delete_storage_failed`);
    }
  }

  const { error } = await supabase
    .from("signature_cases")
    .delete()
    .eq("id", caseId)
    .eq("publication_status", "draft");

  if (error) {
    redirect(`/clinic/cases/${caseId}?error=delete_failed`);
  }

  revalidatePath("/clinic/cases");
  revalidatePath("/cases");
  redirect("/clinic/cases?deleted=1");
}
