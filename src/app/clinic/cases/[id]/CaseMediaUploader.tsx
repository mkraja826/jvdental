"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = { id: string; title: string; stage_type: string };
type UploadState = "ready" | "uploading" | "done" | "error";
type SelectedFile = { file: File; preview: string; status: UploadState; error?: string };

const MAX_FILES = 30;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CaseMediaUploader({ caseId }: { caseId: string; stages: Stage[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const completed = useMemo(() => files.filter((item) => item.status === "done").length, [files]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    const incoming = Array.from(event.target.files ?? []);
    if (!incoming.length) return;
    const accepted: SelectedFile[] = [];
    for (const file of incoming.slice(0, MAX_FILES)) {
      if (!ALLOWED.has(file.type) || file.size > MAX_FILE_BYTES) continue;
      accepted.push({ file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "", status: "ready" });
    }
    setFiles((current) => {
      current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      return accepted;
    });
    if (accepted.length !== incoming.length) setMessage("Some photos could not be added. Choose JPG, PNG or WebP images below 25 MB.");
  }

  function move(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const copy = [...current];
      const [removed] = copy.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }

  async function uploadAll() {
    if (!files.length) return setMessage("Choose the treatment photos first.");
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    let successCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      if (item.status === "done") { successCount += 1; continue; }
      setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: "uploading", error: undefined } : entry));
      try {
        const path = `cases/${caseId}/${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}-${safeFileName(item.file.name)}`;
        const { error: uploadError } = await supabase.storage.from("public-content").upload(path, item.file, { contentType: item.file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: dbError } = await supabase.from("signature_case_media").insert({
          signature_case_id: caseId,
          stage_id: null,
          media_type: item.file.type === "video/mp4" ? "video" : "photo",
          storage_path: path,
          alt_text: `Treatment journey photo ${index + 1}`,
          caption: null,
          sort_order: index,
        });
        if (dbError) {
          await supabase.storage.from("public-content").remove([path]);
          throw dbError;
        }
        successCount += 1;
        setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: "done" } : entry));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: "error", error: errorMessage } : entry));
      }
    }
    setBusy(false);
    setMessage(successCount === files.length ? `All ${successCount} photos are saved. Continue to the treatment story below.` : `${successCount} of ${files.length} photos saved. Tap upload again to retry failed photos.`);
    router.refresh();
  }

  return (
    <div className="case-uploader">
      {!files.length ? (
        <label className="case-uploader__dropzone">
          <span className="case-uploader__dropzone-title">＋ Add treatment photos</span>
          <span>Select all photos together from your phone. You can put them in the right order before saving.</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={selectFiles} disabled={busy} />
        </label>
      ) : (
        <>
          <div className="case-uploader__intro">
            <div><strong>Put the photos in treatment order</strong><p>Photo 1 will appear first. Use the arrows to move a photo earlier or later.</p></div>
            <span className="status-pill">{files.length} selected</span>
          </div>
          <div className="case-uploader__preview-grid" aria-label="Treatment photos">
            {files.map((item, index) => (
              <article className="case-uploader__preview" key={`${item.file.name}-${item.file.lastModified}-${index}`}>
                <div className="case-uploader__thumb">
                  {item.preview ? <img src={item.preview} alt={`Selected treatment photo ${index + 1}`} /> : <span>Video</span>}
                  <span className="case-uploader__order">{index + 1}</span>
                </div>
                <div className="case-uploader__file-meta"><strong>Photo {index + 1}</strong><small>{item.status === "done" ? "Saved ✓" : item.status === "uploading" ? "Saving…" : item.status === "error" ? "Try again" : "Ready"}</small>{item.error ? <small className="case-uploader__error">{item.error}</small> : null}</div>
                {!busy && item.status !== "done" ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="button button--ghost" onClick={() => move(index, -1)} disabled={index === 0}>←</button><button type="button" className="button button--ghost" onClick={() => move(index, 1)} disabled={index === files.length - 1}>→</button><button type="button" className="text-link" onClick={() => removeFile(index)}>Remove</button></div> : null}
              </article>
            ))}
          </div>
          <div className="case-uploader__actions">
            <button className="button" type="button" onClick={uploadAll} disabled={busy}>{busy ? `Saving ${Math.min(completed + 1, files.length)} of ${files.length}…` : `Save ${files.length} photos →`}</button>
            {!busy && !completed ? <label className="button button--ghost">Choose different photos<input style={{ display: "none" }} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={selectFiles} /></label> : null}
          </div>
        </>
      )}
      {message ? <p role="status" className="case-uploader__message">{message}</p> : null}
    </div>
  );
}
