"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  doctorId: string;
  doctorName: string;
  currentPath?: string | null;
  currentUrl?: string | null;
};

const OUTPUT_WIDTH = 960;
const OUTPUT_HEIGHT = 1200;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function DoctorPortraitUploader({ doctorId, doctorName, currentPath, currentUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"success" | "error" | null>(null);

  function clearSource() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setSourceFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    setMessageKind(null);
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setMessage("Use a JPEG, PNG or WebP portrait.");
      setMessageKind("error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setMessage("Keep the source portrait below 15 MB.");
      setMessageKind("error");
      event.target.value = "";
      return;
    }

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceFile(file);
    setSourceUrl(URL.createObjectURL(file));
    setZoom(1);
    setX(50);
    setY(50);
  }

  async function cropToWebp() {
    if (!sourceUrl) throw new Error("Choose a portrait first.");

    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();

    const targetAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    let baseCropWidth: number;
    let baseCropHeight: number;

    if (imageAspect > targetAspect) {
      baseCropHeight = image.naturalHeight;
      baseCropWidth = baseCropHeight * targetAspect;
    } else {
      baseCropWidth = image.naturalWidth;
      baseCropHeight = baseCropWidth / targetAspect;
    }

    const cropWidth = baseCropWidth / zoom;
    const cropHeight = baseCropHeight / zoom;
    const maxX = Math.max(0, image.naturalWidth - cropWidth);
    const maxY = Math.max(0, image.naturalHeight - cropHeight);
    const sx = Math.max(0, Math.min(maxX, maxX * (x / 100)));
    const sy = Math.max(0, Math.min(maxY, maxY * (y / 100)));

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Your browser could not prepare the portrait.");

    context.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Could not prepare the portrait for upload.")),
        "image/webp",
        0.88,
      );
    });
  }

  async function publish() {
    setBusy(true);
    setMessage(null);
    setMessageKind(null);

    try {
      if (!sourceFile) throw new Error("Choose a portrait first.");
      const blob = await cropToWebp();
      const supabase = createClient();
      const path = `doctors/${doctorId}/${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage.from("public-content").upload(path, blob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("doctor_profiles")
        .update({ profile_image_path: path })
        .eq("id", doctorId);

      if (updateError) {
        await supabase.storage.from("public-content").remove([path]);
        throw updateError;
      }

      if (currentPath && currentPath !== path) {
        await supabase.storage.from("public-content").remove([currentPath]);
      }

      clearSource();
      setMessage("Published. The new doctor portrait is now the active website image.");
      setMessageKind("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Portrait upload failed.");
      setMessageKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function removePortrait() {
    if (!currentPath) return;
    if (!window.confirm(`Remove the public portrait for ${doctorName}?`)) return;

    setBusy(true);
    setMessage(null);
    setMessageKind(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("doctor_profiles")
        .update({ profile_image_path: null })
        .eq("id", doctorId);
      if (updateError) throw updateError;

      const { error: removeError } = await supabase.storage.from("public-content").remove([currentPath]);
      setMessage(removeError
        ? "Portrait removed from the website. The old storage object could not be deleted, but it is no longer referenced."
        : "Portrait removed from the website.");
      setMessageKind("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove the portrait.");
      setMessageKind("error");
    } finally {
      setBusy(false);
    }
  }

  const preview = sourceUrl ?? currentUrl ?? null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="doctor-admin-portrait" style={{ position: "relative", overflow: "hidden" }}>
        {preview ? (
          <img
            src={preview}
            alt={`${doctorName} portrait preview`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${x}% ${y}%`,
              transform: sourceUrl ? `scale(${zoom})` : undefined,
              transformOrigin: sourceUrl ? `${x}% ${y}%` : undefined,
            }}
          />
        ) : (
          <span>{doctorName.split(/\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J"}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={chooseFile}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="button button--ghost" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {currentPath ? "Replace portrait" : "Choose portrait"}
        </button>
        {currentPath && !sourceUrl ? (
          <button className="button button--ghost" type="button" onClick={removePortrait} disabled={busy}>Remove portrait</button>
        ) : null}
      </div>

      {sourceUrl ? (
        <div style={{ display: "grid", gap: 12, padding: 14, borderRadius: 12, background: "rgba(0,0,0,.035)" }}>
          <strong>Adjust portrait crop</strong>
          <label>Zoom<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={(event) => setX(Number(event.target.value))} /></label>
          <label>Vertical position<input type="range" min="0" max="100" value={y} onChange={(event) => setY(Number(event.target.value))} /></label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" type="button" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Crop & publish portrait"}</button>
            <button className="button button--ghost" type="button" onClick={clearSource} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : null}

      <p className="form-note">JPEG, PNG or WebP source up to 15 MB. The browser crops and compresses it to a consistent 4:5 WebP portrait before upload.</p>
      {message ? <p role="status" className={messageKind === "success" ? "booking-message booking-message--success" : "booking-message"}>{message}</p> : null}
    </div>
  );
}
