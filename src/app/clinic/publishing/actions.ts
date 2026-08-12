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

async function resolveDoctorAttribution(
  supabase: Awaited<ReturnType<typeof requireClinicalPublisher>>["supabase"],
  userId: string,
  staffRole: string,
  requestedId: string,
) {
  if (!requestedId) return null;
  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select("id,staff_user_id,status")
    .eq("id", requestedId)
    .maybeSingle();
  if (!doctor || doctor.status === "archived") return null;
  if (["owner", "admin"].includes(staffRole)) return doctor.id;
  return doctor.staff_user_id === userId ? doctor.id : null;
}

export async function saveBlogPost(formData: FormData) {
  const { supabase, user, staff } = await requireClinicalPublisher();
  const title = String(formData.get("title") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const allowedStatuses = new Set(["draft", "review", "published"]);

  if (title.length < 5 || !allowedStatuses.has(status)) {
    redirect("/clinic/publishing?error=invalid");
  }

  const requestedDoctor = String(formData.get("doctor_profile_id") ?? "");
  const doctorProfileId = await resolveDoctorAttribution(supabase, user.id, staff.role, requestedDoctor);
  if (requestedDoctor && !doctorProfileId) redirect("/clinic/publishing?error=doctor");

  const slug = slugify(requestedSlug || title);
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const { error } = await supabase.from("blog_posts").insert({
    author_user_id: user.id,
    doctor_profile_id: doctorProfileId,
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content_markdown: String(formData.get("content") ?? "").trim(),
    seo_title: String(formData.get("seo_title") ?? "").trim() || null,
    seo_description: String(formData.get("seo_description") ?? "").trim() || null,
    status,
    published_at: publishedAt,
  });

  if (error) {
    redirect(`/clinic/publishing?error=${encodeURIComponent(error.code ?? "save")}`);
  }

  revalidatePath("/clinic/publishing");
  revalidatePath("/journal");
  if (doctorProfileId) {
    const { data: doctor } = await supabase.from("doctor_profiles").select("slug").eq("id", doctorProfileId).maybeSingle();
    if (doctor?.slug) revalidatePath(`/doctors/${doctor.slug}`);
  }
  redirect("/clinic/publishing?saved=1");
}

export async function setBlogStatus(formData: FormData) {
  const { supabase } = await requireClinicalPublisher();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (!id || !new Set(["draft", "review", "published", "archived"]).has(status)) {
    return;
  }

  await supabase
    .from("blog_posts")
    .update({ status, published_at: status === "published" ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/clinic/publishing");
  revalidatePath("/journal");
  revalidatePath("/doctors");
}
