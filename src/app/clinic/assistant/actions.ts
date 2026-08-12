"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const MANAGER_ROLES = new Set(["owner", "admin"]);
const CATEGORIES = new Set([
  "clinic",
  "implants",
  "guided_implants",
  "international",
  "travel",
  "appointments",
  "pricing_policy",
  "dental_education",
  "safety",
]);

async function requireAssistantManager() {
  const context = await requireStaff();
  if (!MANAGER_ROLES.has(context.staff.role)) redirect("/clinic");
  return context;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function createKnowledgeEntry(formData: FormData) {
  const { supabase, user } = await requireAssistantManager();
  const title = text(formData, "title").slice(0, 180);
  const category = text(formData, "category");
  const content = text(formData, "content").slice(0, 6000);
  const slug = slugify(text(formData, "slug") || title);
  const keywords = text(formData, "keywords")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);

  if (!title || !slug || !content || !CATEGORIES.has(category)) {
    redirect("/clinic/assistant?error=invalid");
  }

  const { error } = await supabase.from("assistant_knowledge").insert({
    title,
    slug,
    category,
    content,
    keywords,
    is_verified: formData.get("is_verified") === "on",
    is_active: true,
    created_by: user.id,
  });

  if (error) redirect("/clinic/assistant?error=save");
  revalidatePath("/clinic/assistant");
}

export async function setKnowledgeState(formData: FormData) {
  const { supabase } = await requireAssistantManager();
  const id = text(formData, "id");
  const field = text(formData, "field");
  const value = text(formData, "value") === "true";
  if (!id || !["is_active", "is_verified"].includes(field)) redirect("/clinic/assistant?error=invalid");

  const { error } = await supabase.from("assistant_knowledge").update({ [field]: value }).eq("id", id);
  if (error) redirect("/clinic/assistant?error=save");
  revalidatePath("/clinic/assistant");
}
