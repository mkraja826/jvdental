"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = { id: string; title: string; stage_type: string };

export default function CaseMediaUploader({ caseId, stages }: { caseId: string; stages: Stage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const file = formData.get("file");
      const stageId = String(formData.get("stage_id") ?? "") || null;
      const mediaType = String(formData.get("media_type") ?? "photo");
      const altText = String(formData.get("alt_text") ?? "").trim();
      const caption = String(formData.get("caption") ?? "").trim();

      if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file.");
      if (!altText) throw new Error("Add meaningful alt text before upload.");
      if (file.size > 25 * 1024 * 1024) throw new Error("Keep public case media below 25 MB per file.");

      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
      if (!allowed.has(file.type)) throw new Error("Use JPEG, PNG, WebP or MP4 for public case media.");

      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
      const path = `cases/${caseId}/${crypto.randomUUID()}-${safeName}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage.from("public-content").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("signature_case_media").insert({
        signature_case_id: caseId,
        stage_id: stageId,
        media_type: mediaType,
        storage_path: path,
        alt_text: altText,
        caption: caption || null,
      });

      if (dbError) {
        await supabase.storage.from("public-content").remove([path]);
        throw dbError;
      }

      setMessage("Media uploaded.");
      const form = document.getElementById("case-media-form") as HTMLFormElement | null;
      form?.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form id="case-media-form" action={upload} style={{ display: "grid", gap: 14 }}>
      <label>Clinical stage
        <select name="stage_id" defaultValue="">
          <option value="">General case media</option>
          {stages.map((stage) => <option value={stage.id} key={stage.id}>{stage.title} · {stage.stage_type.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      <label>Media type
        <select name="media_type" defaultValue="photo">
          <option value="before">Before</option>
          <option value="after">After</option>
          <option value="photo">Clinical photo</option>
          <option value="xray">X-ray image</option>
          <option value="opg">OPG image</option>
          <option value="cbct">CBCT screenshot</option>
          <option value="planning_screenshot">Planning screenshot</option>
          <option value="surgical_guide">Surgical guide</option>
          <option value="video">Video</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>File<input name="file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4" required /></label>
      <label>Alt text<input name="alt_text" required placeholder="DIOnavi virtual implant planning view" /></label>
      <label>Caption<textarea name="caption" rows={3} /></label>
      <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>Only publish de-identified, consented media. Raw DICOM/CBCT datasets belong in the private patient-document vault, not this public-content bucket.</p>
      <button className="button" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload case media"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
