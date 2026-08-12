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
