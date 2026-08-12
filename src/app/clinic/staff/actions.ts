"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const ALLOWED_ROLES = new Set([
  "owner",
  "admin",
  "implantologist",
  "doctor",
  "coordinator",
  "receptionist",
  "dental_assistant",
]);

async function requireStaffManager() {
  const context = await requireStaff();
  if (!["owner", "admin"].includes(context.staff.role)) redirect("/clinic");
  return context;
}

export async function updateStaffMember(formData: FormData) {
  const { supabase, user, staff } = await requireStaffManager();
  const targetUserId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 160);
  const jobTitle = String(formData.get("job_title") ?? "").trim().slice(0, 160) || null;
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 60) || null;
  const isActive = formData.get("is_active") === "on";

  if (!targetUserId || !ALLOWED_ROLES.has(role) || fullName.length < 2) {
    redirect("/clinic/staff?error=invalid");
  }

  if (staff.role === "admin" && ["owner", "admin"].includes(role)) {
    redirect("/clinic/staff?error=owner_required");
  }

  const { data: before } = await supabase
    .from("staff_profiles")
    .select("role,is_active,full_name,job_title,phone")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!before) redirect("/clinic/staff?error=not_found");

  const { error } = await supabase
    .from("staff_profiles")
    .update({ full_name: fullName, role, job_title: jobTitle, phone, is_active: isActive })
    .eq("user_id", targetUserId);

  if (error) redirect(`/clinic/staff?error=${encodeURIComponent(error.message.slice(0, 120))}`);

  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "staff_access_updated",
    entity_type: "staff_profile",
    entity_id: targetUserId,
    metadata: {
      previous_role: before.role,
      new_role: role,
      previous_active: before.is_active,
      new_active: isActive,
      self_update: targetUserId === user.id,
    },
  });

  revalidatePath("/clinic/staff");
  revalidatePath("/clinic");
  redirect("/clinic/staff?saved=1");
}
