import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireClinicalPublisher } from "@/lib/content/permissions";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const { supabase } = await requireClinicalPublisher();
  const formData = await request.formData();
  const caseId = String(formData.get("case_id") ?? "");
  const mediaId = String(formData.get("media_id") ?? "");
  const fileEntry = formData.get("file");

  if (!caseId || !mediaId || typeof fileEntry === "string" || !fileEntry || !ALLOWED.has(fileEntry.type) || fileEntry.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Choose a JPG, PNG or WebP image below 25 MB." }, { status: 400 });
  }

  const { data: media } = await supabase.from("signature_case_media").select("id,storage_path").eq("id", mediaId).eq("signature_case_id", caseId).maybeSingle();
  if (!media) return NextResponse.json({ ok: false, error: "This case photo could not be found." }, { status: 404 });

  const newPath = `cases/${caseId}/${crypto.randomUUID()}-${safeFileName(fileEntry.name)}`;
  const fileBytes = await fileEntry.arrayBuffer();
  const fileBlob = new Blob([fileBytes], { type: fileEntry.type });
  const { error: uploadError } = await supabase.storage.from("public-content").upload(newPath, fileBlob, { contentType: fileEntry.type, upsert: false });
  if (uploadError) return NextResponse.json({ ok: false, error: "The replacement image could not be uploaded." }, { status: 400 });

  const { error: updateError } = await supabase.from("signature_case_media").update({ storage_path: newPath, media_type: "photo" }).eq("id", mediaId).eq("signature_case_id", caseId);
  if (updateError) {
    await supabase.storage.from("public-content").remove([newPath]);
    return NextResponse.json({ ok: false, error: "The replacement image could not be saved." }, { status: 400 });
  }

  const { error: removeError } = await supabase.storage.from("public-content").remove([media.storage_path]);
  revalidatePath(`/clinic/cases/${caseId}`);
  revalidatePath("/cases");
  return NextResponse.json({ ok: true, storagePath: newPath, oldFileCleanupFailed: Boolean(removeError) });
}
