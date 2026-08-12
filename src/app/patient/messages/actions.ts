"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function cleanMessage(formData: FormData) {
  const value = formData.get("message");
  return typeof value === "string" ? value.trim().slice(0, 10000) : "";
}

export async function sendPatientMessage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const body = cleanMessage(formData);
  if (!body) redirect("/patient/messages?error=empty");

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!caseRecord) redirect("/patient/intake");

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("patient_id", user.id)
    .eq("case_id", caseRecord.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    const result = await supabase
      .from("conversations")
      .insert({ patient_id: user.id, case_id: caseRecord.id, subject: "Implant assessment" })
      .select("id")
      .single();
    conversation = result.data;
  }

  if (!conversation) redirect("/patient/messages?error=conversation");

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_user_id: user.id,
    body,
    message_type: "text",
    is_internal: false,
  });

  if (error) redirect("/patient/messages?error=send");
  revalidatePath("/patient/messages");
  revalidatePath("/clinic/inbox");
}
