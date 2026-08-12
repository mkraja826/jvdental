"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function refreshNotificationViews() {
  revalidatePath("/patient");
  revalidatePath("/patient/notifications");
  revalidatePath("/clinic");
  revalidatePath("/clinic/notifications");
}

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get("notification_id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  refreshNotificationViews();
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  refreshNotificationViews();
}
