"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

async function requirePortfolioAdmin() {
  const context = await requireStaff();
  if (!["owner", "admin"].includes(context.staff.role)) redirect("/clinic");
  return context;
}

async function refresh(supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"], doctorId: string) {
  const { data: doctor } = await supabase.from("doctor_profiles").select("slug").eq("id", doctorId).maybeSingle();
  revalidatePath(`/clinic/doctors/${doctorId}`);
  revalidatePath("/doctors");
  revalidatePath("/cases");
  revalidatePath("/journal");
  if (doctor?.slug) revalidatePath(`/doctors/${doctor.slug}`);
}

export async function assignDoctorCase(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  if (!doctorId || !caseId) return;
  await supabase.from("signature_cases").update({ doctor_profile_id: doctorId }).eq("id", caseId);
  await refresh(supabase, doctorId);
}

export async function assignDoctorArticle(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const articleId = String(formData.get("article_id") ?? "");
  if (!doctorId || !articleId) return;
  await supabase.from("blog_posts").update({ doctor_profile_id: doctorId }).eq("id", articleId);
  await refresh(supabase, doctorId);
}

export async function unlinkDoctorContent(formData: FormData) {
  const { supabase } = await requirePortfolioAdmin();
  const doctorId = String(formData.get("doctor_profile_id") ?? "");
  const contentId = String(formData.get("content_id") ?? "");
  const type = String(formData.get("type") ?? "");
  if (!doctorId || !contentId) return;
  if (type === "case") await supabase.from("signature_cases").update({ doctor_profile_id: null }).eq("id", contentId).eq("doctor_profile_id", doctorId);
  if (type === "article") await supabase.from("blog_posts").update({ doctor_profile_id: null }).eq("id", contentId).eq("doctor_profile_id", doctorId);
  await refresh(supabase, doctorId);
}
