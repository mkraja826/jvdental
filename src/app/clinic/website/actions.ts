"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 15 * 1024 * 1024;

export async function publishWebsiteMedia(formData: FormData) {
  const { staff } = await requireStaff();
  if (staff.role !== "owner" && staff.role !== "admin") {
    return { ok: false, error: "You do not have permission to update website photos." };
  }

  const slotKey = String(formData.get("slot_key") ?? "").trim();
  const altText = String(formData.get("alt_text") ?? "").trim();
  const currentPath = String(formData.get("current_path") ?? "").trim();
  const outputWidth = Number(formData.get("output_width") ?? 0);
  const outputHeight = Number(formData.get("output_height") ?? 0);
  const fileEntry = formData.get("file");

  if (!/^[a-z0-9-]+$/.test(slotKey) || !altText || !outputWidth || !outputHeight || typeof fileEntry === "string" || !fileEntry || !ALLOWED_IMAGE_TYPES.has(fileEntry.type) || fileEntry.size > MAX_BYTES) {
    return { ok: false, error: "Choose a valid image and add a description." };
  }

  const supabase = await createClient();
  const path = `website/${slotKey}/${crypto.randomUUID()}.webp`;
  const fileBytes = await fileEntry.arrayBuffer();
  const fileBlob = new Blob([fileBytes], { type: fileEntry.type });
  const { error: uploadError } = await supabase.storage.from("public-content").upload(path, fileBlob, {
    contentType: fileEntry.type,
    upsert: false,
    cacheControl: "31536000",
  });

  if (uploadError) {
    return { ok: false, error: "The website image could not be uploaded." };
  }

  const { error: dbError } = await supabase.from("website_media").upsert({
    slot_key: slotKey,
    storage_path: path,
    alt_text: altText,
    output_width: outputWidth,
    output_height: outputHeight,
    updated_by: staff.user_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "slot_key" });

  if (dbError) {
    await supabase.storage.from("public-content").remove([path]);
    return { ok: false, error: "The website image could not be saved." };
  }

  if (currentPath && currentPath !== path) {
    await supabase.storage.from("public-content").remove([currentPath]);
  }

  revalidatePath("/clinic/website");
  revalidatePath("/");
  return { ok: true, path };
}
