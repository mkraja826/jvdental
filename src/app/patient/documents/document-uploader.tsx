"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

const MAX_PATIENT_DOCUMENT_BYTES = 50 * 1024 * 1024;
const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "pdf", "zip", "dcm"]);

const categories = [
  ["opg", "OPG / panoramic X-ray"],
  ["cbct", "CBCT archive"],
  ["xray", "Dental X-ray"],
  ["clinical_photo", "Clinical photograph"],
  ["medical_report", "Medical report"],
  ["prescription", "Prescription"],
  ["treatment_plan", "Previous treatment plan"],
  ["other", "Other clinical record"],
] as const;

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function fileExtension(name: string) {
  const lastDot = name.lastIndexOf(".");
  return lastDot > -1 ? name.slice(lastDot + 1).toLowerCase() : "";
}

export function DocumentUploader({ userId, caseId }: { userId: string; caseId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("opg");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadSelectedFile() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage("Choose a file first.");
      return;
    }

    if (file.size > MAX_PATIENT_DOCUMENT_BYTES) {
      setMessage("This file is larger than the current 50 MB secure-upload limit. Please contact JV Dental for a larger CBCT transfer.");
      return;
    }

    const extension = fileExtension(file.name);
    if (!allowedExtensions.has(extension)) {
      setMessage("Use JPEG, PNG, WebP, PDF, ZIP or DICOM (.dcm) records only.");
      return;
    }

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!accessToken || !projectUrl) {
      setMessage("Your session is no longer available. Sign in again and retry.");
      return;
    }

    const projectRef = new URL(projectUrl).hostname.split(".")[0];
    const objectPath = `${userId}/${caseId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

    setBusy(true);
    setProgress(0);
    setMessage("Uploading securely…");

    const upload = new Upload(file, {
      endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: "patient-documents",
        objectName: objectPath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError(error) {
        console.error(error);
        setBusy(false);
        setMessage("Upload failed. Your progress can be resumed when you retry.");
      },
      onProgress(bytesUploaded, bytesTotal) {
        setProgress(bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0);
      },
      async onSuccess() {
        const { error } = await supabase.from("patient_documents").insert({
          patient_id: userId,
          case_id: caseId,
          category,
          storage_path: objectPath,
          file_name: file.name,
          content_type: file.type || null,
          file_size_bytes: file.size,
          uploaded_by: userId,
        });

        if (error) {
          console.error(error);
          setBusy(false);
          setMessage("The file uploaded, but it could not be attached to your case. Please contact the clinic rather than uploading it again.");
          return;
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
        setBusy(false);
        setProgress(100);
        setMessage("Record received by JV Dental securely.");
        router.refresh();
      },
    });

    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
    upload.start();
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <label>
        Record type
        <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={busy}>
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Choose record
        <input
          ref={fileInputRef}
          type="file"
          disabled={busy}
          accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,application/x-zip-compressed,.zip,.dcm"
        />
      </label>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: ".86rem" }}>
        OPGs, X-rays, PDFs, clinical photos and compressed CBCT/DICOM records are stored in your private case vault. Large uploads are resumable. Current secure-upload limit: 50 MB per file.
      </p>
      {progress !== null ? (
        <div aria-label={`Upload progress ${progress}%`}>
          <div style={{ height: 6, background: "var(--line)", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--mineral)", transition: "width 160ms ease" }} />
          </div>
          <small>{progress}%</small>
        </div>
      ) : null}
      {message ? <p role="status" style={{ margin: 0 }}>{message}</p> : null}
      <button className="button" type="button" disabled={busy} onClick={uploadSelectedFile}>
        {busy ? "Uploading…" : "Upload clinical record"}
      </button>
    </div>
  );
}
