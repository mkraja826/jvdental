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

export default function CaseMediaUploader({ caseId, stages }: { caseId: string; stages: Stage[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stageId, setStageId] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [caption, setCaption] = useState("");

  const completed = useMemo(() => files.filter((item) => item.status === "done").length, [files]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    const incoming = Array.from(event.target.files ?? []);
    if (!incoming.length) return;

    const accepted: SelectedFile[] = [];
    for (const file of incoming.slice(0, MAX_FILES)) {
      if (!ALLOWED.has(file.type)) continue;
      if (file.size > MAX_FILE_BYTES) continue;
      accepted.push({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        status: "ready",
      });
    }

    setFiles((current) => {
      current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      return accepted;
    });

    if (incoming.length > MAX_FILES) setMessage(`Only the first ${MAX_FILES} files were selected.`);
    else if (accepted.length !== incoming.length) setMessage("Some files were skipped. Use JPEG, PNG, WebP or MP4 and keep each file below 25 MB.");
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
    if (!files.length) {
      setMessage("Choose the case photos first.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    let successCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      if (item.status === "done") {
        successCount += 1;
        continue;
      }

      setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: "uploading", error: undefined } : entry));

      try {
        const path = `cases/${caseId}/${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}-${safeFileName(item.file.name)}`;
        const { error: uploadError } = await supabase.storage.from("public-content").upload(path, item.file, {
          contentType: item.file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const automaticAlt = `Clinical case image ${index + 1} of ${files.length}`;
        const { error: dbError } = await supabase.from("signature_case_media").insert({
          signature_case_id: caseId,
          stage_id: stageId || null,
          media_type: item.file.type === "video/mp4" ? "video" : mediaType,
          storage_path: path,
          alt_text: automaticAlt,
          caption: caption.trim() || null,
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
    setMessage(successCount === files.length
      ? `${successCount} files uploaded and saved to the case backend.`
      : `${successCount} of ${files.length} files uploaded. Retry the failed files.`);
    router.refresh();
  }

  function clearCompleted() {
    setFiles((current) => {
      current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      return [];
    });
    setMessage(null);
  }

  return (
    <div className="case-uploader">
      <div className="case-uploader__intro">
        <div>
          <strong>Upload the complete treatment journey</strong>
          <p>Select all clinical photos for this case together. They are stored in the same order you select them.</p>
        </div>
        <span className="status-pill">{files.length ? `${completed}/${files.length} saved` : "Batch upload"}</span>
      </div>

      <div className="case-uploader__controls">
        <label>Clinical stage
          <select value={stageId} onChange={(event) => setStageId(event.target.value)} disabled={busy}>
            <option value="">General / assign stages later</option>
            {stages.map((stage) => <option value={stage.id} key={stage.id}>{stage.title} · {stage.stage_type.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label>Default media type
          <select value={mediaType} onChange={(event) => setMediaType(event.target.value)} disabled={busy}>
            <option value="photo">Clinical photo</option>
            <option value="before">Before</option>
            <option value="after">After</option>
            <option value="xray">X-ray image</option>
            <option value="opg">OPG image</option>
            <option value="cbct">CBCT screenshot</option>
            <option value="planning_screenshot">Planning screenshot</option>
            <option value="surgical_guide">Surgical guide</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="case-uploader__dropzone">
        <span className="case-uploader__dropzone-title">Choose case photos</span>
        <span>JPEG, PNG, WebP or MP4 · up to 30 files · 25 MB each</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple onChange={selectFiles} disabled={busy} />
      </label>

      {files.length ? (
        <div className="case-uploader__preview-grid" aria-label="Selected case media">
          {files.map((item, index) => (
            <article className="case-uploader__preview" key={`${item.file.name}-${item.file.lastModified}-${index}`}>
              <div className="case-uploader__thumb">
                {item.preview ? <img src={item.preview} alt="" /> : <span>Video</span>}
                <span className="case-uploader__order">{index + 1}</span>
              </div>
              <div className="case-uploader__file-meta">
                <strong title={item.file.name}>{item.file.name}</strong>
                <small>{(item.file.size / (1024 * 1024)).toFixed(1)} MB · {item.status}</small>
                {item.error ? <small className="case-uploader__error">{item.error}</small> : null}
              </div>
              {!busy && item.status !== "done" ? <button type="button" className="text-link" onClick={() => removeFile(index)}>Remove</button> : null}
            </article>
          ))}
        </div>
      ) : null}

      <label>Shared caption / note <span style={{ color: "var(--muted)" }}>(optional)</span>
        <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} placeholder="Example: Guided implant placement workflow. Individual clinical captions can be refined after upload." disabled={busy} />
      </label>

      <div className="case-uploader__safety">
        <strong>Publication safety</strong>
        <span>Upload only consented, de-identified media. Crop or redact patient names, dates, IDs and radiology identifiers before publishing.</span>
      </div>

      <div className="case-uploader__actions">
        <button className="button" type="button" onClick={uploadAll} disabled={busy || !files.length}>
          {busy ? `Uploading ${completed + 1} of ${files.length}…` : `Upload ${files.length || ""} ${files.length === 1 ? "file" : "files"}`}
        </button>
        {files.length && !busy ? <button className="button button--ghost" type="button" onClick={clearCompleted}>Clear selection</button> : null}
      </div>
      {message ? <p role="status" className="case-uploader__message">{message}</p> : null}
    </div>
  );
}
