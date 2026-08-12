"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

export async function sendClinicMessage(formData: FormData) {
  const { supabase, user } = await requireStaff();
  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const body = String(formData.get("message") ?? "").trim().slice(0, 10000);

  if (!conversationId || !body) redirect("/clinic/inbox?error=invalid");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) redirect("/clinic/inbox?error=missing");

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    body,
    message_type: "text",
    is_internal: false,
  });

  if (error) redirect(`/clinic/inbox/${conversationId}?error=send`);
  revalidatePath(`/clinic/inbox/${conversationId}`);
  revalidatePath("/clinic/inbox");
}
