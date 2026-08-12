"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

async function requireIntegrationAdmin() {
  const context = await requireStaff();
  if (!new Set(["owner", "admin"]).has(context.staff.role)) redirect("/clinic");
  return context;
}

export async function startGoogleCalendarConnection() {
  const { supabase } = await requireIntegrationAdmin();
  const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", { body: {} });
  const authorizationUrl = (data as { authorizationUrl?: string } | null)?.authorizationUrl;
  if (error || !authorizationUrl) redirect("/clinic/integrations?error=google_not_configured");
  redirect(authorizationUrl);
}

export async function disconnectGoogleCalendar() {
  const { supabase } = await requireIntegrationAdmin();
  const { error } = await supabase.functions.invoke("google-calendar-disconnect", { body: {} });
  revalidatePath("/clinic/integrations");
  if (error) redirect("/clinic/integrations?error=disconnect");
  redirect("/clinic/integrations?disconnected=1");
}

export async function startBloggerConnection() {
  const { supabase } = await requireIntegrationAdmin();
  const { data, error } = await supabase.functions.invoke("blogger-oauth-start", { body: {} });
  const authorizationUrl = (data as { authorizationUrl?: string } | null)?.authorizationUrl;
  if (error || !authorizationUrl) redirect("/clinic/integrations?error=blogger_not_configured");
  redirect(authorizationUrl);
}

export async function disconnectBlogger() {
  const { supabase } = await requireIntegrationAdmin();
  const { data, error } = await supabase.functions.invoke("blogger-disconnect", { body: {} });
  revalidatePath("/clinic/integrations");
  revalidatePath("/clinic/publishing");
  if (error || !(data as { ok?: boolean } | null)?.ok) redirect("/clinic/integrations?error=blogger_disconnect");
  redirect("/clinic/integrations?blogger_disconnected=1");
}

export async function selectBloggerBlog(formData: FormData) {
  const { supabase } = await requireIntegrationAdmin();
  const blogChoiceId = String(formData.get("blog_choice_id") ?? "").trim();
  if (!blogChoiceId) redirect("/clinic/integrations?error=blog_selection");
  const { data, error } = await supabase.functions.invoke("blogger-select-blog", { body: { blogChoiceId } });
  revalidatePath("/clinic/integrations");
  revalidatePath("/clinic/publishing");
  if (error || !(data as { ok?: boolean } | null)?.ok) redirect("/clinic/integrations?error=blog_selection");
  redirect("/clinic/integrations?blogger_selected=1");
}
