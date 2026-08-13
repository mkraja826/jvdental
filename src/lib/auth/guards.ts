import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const getRequiredStaff = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff/login");
  }

  const { data: staff, error } = await supabase
    .from("staff_profiles")
    .select("user_id, full_name, role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !staff) {
    redirect("/patient");
  }

  return { supabase, user, staff };
});

export async function requireStaff() {
  return getRequiredStaff();
}
