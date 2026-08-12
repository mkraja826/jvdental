"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const OWNER_ROLES = new Set(["owner", "admin"]);
const ALLOWED_STATUSES = new Set(["draft", "published", "archived"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function optionalInt(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function safeHttpsUrl(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function requirePortfolioAdmin() {
  const context = await requireStaff();
  if (!OWNER_ROLES.has(context.staff.role)) redirect("/clinic");
  return context;
}

function refreshDoctor(slug?: string, id?: string) {
  revalidatePath("/clinic/doctors");
  revalidatePath("/doctors");
  if (id) revalidatePath(`/clinic/doctors/${id}`);
  if (slug) revalidatePath(`/doctors/${slug}`);
}

export async function createDoctorProfile(formData: FormData) {
  const { supabase, user } = await requirePortfolioAdmin();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const title = String(formData.get("professional_title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "").trim() || fullName);

  if (fullName.length < 3 || !slug) redirect("/clinic/doctors?error=invalid");

  const { data, error } = await supabase
    .from("doctor_profiles")
    .insert({
      full_name: fullName,
      slug,
      professional_title: title || null,
      overall_experience_years: optionalInt(formData.get("overall_experience_years")),
      specialist_experience_years: optionalInt(formData.get("specialist_experience_years")),
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) redirect(`/clinic/doctors?error=${encodeURIComponent(error?.code ?? "save")}`);
  redirect(`/clinic/doctors/${data.id}`);
}

export async function updateDoctorProfile(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "").trim() || fullName);
  const status = String(formData.get("status") ?? "draft");

  if (!id || fullName.length < 3 || !slug || !ALLOWED_STATUSES.has(status)) return;

  const staffUserId = String(formData.get("staff_user_id") ?? "").trim() || null;
  const practoInput = String(formData.get("practo_url") ?? "").trim();
  const practoUrl = practoInput ? safeHttpsUrl(practoInput) : null;
  if (practoInput && !practoUrl) redirect(`/clinic/doctors/${id}?error=invalid_url`);

  const { data: current } = await supabase.from("doctor_profiles").select("slug,published_at").eq("id", id).single();
  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      staff_user_id: staffUserId,
      full_name: fullName,
      slug,
      professional_title: String(formData.get("professional_title") ?? "").trim() || null,
      short_intro: String(formData.get("short_intro") ?? "").trim() || null,
      biography: String(formData.get("biography") ?? "").trim() || null,
      treatment_philosophy: String(formData.get("treatment_philosophy") ?? "").trim() || null,
      overall_experience_years: optionalInt(formData.get("overall_experience_years")),
      specialist_experience_years: optionalInt(formData.get("specialist_experience_years")),
      registration_number: String(formData.get("registration_number") ?? "").trim() || null,
      registration_council: String(formData.get("registration_council") ?? "").trim() || null,
      languages: parseList(formData.get("languages")),
      specialties: parseList(formData.get("specialties")),
      technologies: parseList(formData.get("technologies")),
      practo_url: practoUrl,
      status,
      featured: formData.get("featured") === "on",
      display_order: optionalInt(formData.get("display_order")) ?? 0,
      seo_title: String(formData.get("seo_title") ?? "").trim() || null,
      seo_description: String(formData.get("seo_description") ?? "").trim() || null,
      published_at: status === "published" ? current?.published_at ?? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) redirect(`/clinic/doctors/${id}?error=${encodeURIComponent(error.code ?? "save")}`);
  refreshDoctor(current?.slug, id);
  refreshDoctor(slug, id);
  redirect(`/clinic/doctors/${id}?saved=1`);
}

export async function uploadDoctorProfileImage(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("profile_image");
  if (!id || !(file instanceof File) || file.size === 0) return;

  const allowed = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);
  const extension = allowed.get(file.type);
  if (!extension || file.size > 8 * 1024 * 1024) redirect(`/clinic/doctors/${id}?error=image`);

  const { data: profile } = await supabase.from("doctor_profiles").select("slug,profile_image_path").eq("id", id).single();
  if (!profile) return;

  const path = `doctors/${id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("public-content").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) redirect(`/clinic/doctors/${id}?error=image_upload`);

  const { error: updateError } = await supabase.from("doctor_profiles").update({ profile_image_path: path }).eq("id", id);
  if (updateError) {
    await supabase.storage.from("public-content").remove([path]);
    redirect(`/clinic/doctors/${id}?error=image_save`);
  }

  if (profile.profile_image_path) await supabase.storage.from("public-content").remove([profile.profile_image_path]);
  refreshDoctor(profile.slug, id);
  redirect(`/clinic/doctors/${id}?image=1`);
}

export async function addDoctorQualification(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const qualification = String(formData.get("qualification") ?? "").trim();
  if (!doctorId || !qualification) return;

  await supabase.from("doctor_qualifications").insert({
    doctor_profile_id: doctorId,
    qualification,
    institution: String(formData.get("institution") ?? "").trim() || null,
    completion_year: optionalInt(formData.get("completion_year")),
  });
  refreshDoctor(undefined, doctorId);
}

export async function addDoctorMembership(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const organisation = String(formData.get("organisation") ?? "").trim();
  if (!doctorId || !organisation) return;

  await supabase.from("doctor_memberships").insert({
    doctor_profile_id: doctorId,
    organisation,
    membership_number: String(formData.get("membership_number") ?? "").trim() || null,
  });
  refreshDoctor(undefined, doctorId);
}

export async function addDoctorExternalLink(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const url = safeHttpsUrl(formData.get("url"));
  if (!doctorId || !label || !url) redirect(`/clinic/doctors/${doctorId}?error=invalid_url`);

  await supabase.from("doctor_external_links").insert({ doctor_profile_id: doctorId, label, url });
  refreshDoctor(undefined, doctorId);
}

export async function deleteDoctorDetail(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "");
  const tables: Record<string, "doctor_qualifications" | "doctor_memberships" | "doctor_external_links"> = {
    qualification: "doctor_qualifications",
    membership: "doctor_memberships",
    link: "doctor_external_links",
  };
  const table = tables[type];
  if (!doctorId || !id || !table) return;
  await supabase.from(table).delete().eq("id", id).eq("doctor_profile_id", doctorId);
  refreshDoctor(undefined, doctorId);
}
