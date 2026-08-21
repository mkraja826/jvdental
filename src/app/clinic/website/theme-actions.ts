"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { websiteThemes } from "@/content/website-themes";

export async function publishWebsiteTheme(formData: FormData) {
  const { supabase, user, staff } = await requireStaff();
  if (staff.role !== "owner" && staff.role !== "admin") redirect("/clinic");

  const themeKey = String(formData.get("theme_key") ?? "").trim();
  if (!websiteThemes.some((theme) => theme.key === themeKey)) {
    redirect("/clinic/website?theme=invalid");
  }

  const { error } = await supabase
    .from("website_theme_settings")
    .upsert(
      {
        id: true,
        theme_key: themeKey,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) redirect(`/clinic/website?theme=${encodeURIComponent(error.code ?? "save")}`);

  revalidatePath("/", "layout");
  revalidatePath("/clinic/website");
  redirect(`/clinic/website?theme=saved&selected=${encodeURIComponent(themeKey)}`);
}
