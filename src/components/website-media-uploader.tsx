"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  slotKey: string;
  label: string;
  description: string;
  width: number;
  height: number;
  previewHref: string;
  currentPath?: string | null;
  currentUrl?: string | null;
  currentAlt?: string | null;
};

export default function WebsiteMediaUploader({ slotKey, label, description, width, height, previewHref, currentPath, currentUrl, currentAlt }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [altText, setAltText] = useState(currentAlt ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const aspect = useMemo(() => `${width} / ${height}`, [width, height]);
  const hasCustomImage = Boolean(currentPath && currentUrl);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setMessage("Use JPEG, PNG or WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMessage("Keep the source image below 15 MB.");
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

  async function cropToWebp(): Promise<Blob> {
    if (!sourceUrl) throw new Error("Choose a photo first.");
    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();

    const targetAspect = width / height;
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
    const maxX = image.naturalWidth - cropWidth;
    const maxY = image.naturalHeight - cropHeight;
    const sx = Math.max(0, Math.min(maxX, maxX * (x / 100)));
    const sy = Math.max(0, Math.min(maxY, maxY * (y / 100)));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Your browser could not prepare this image.");
    ctx.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, width, height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the cropped image.")), "image/webp", 0.86);
    });
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      if (!sourceFile) throw new Error("Choose a photo first.");
      if (!altText.trim()) throw new Error("Add a short image description for accessibility and SEO.");

      const blob = await cropToWebp();
      const supabase = createClient();
      const path = `website/${slotKey}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from("public-content").upload(path, blob, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000",
      });
      if (uploadError) throw uploadError;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: dbError } = await supabase.from("website_media").upsert({
        slot_key: slotKey,
        storage_path: path,
        alt_text: altText.trim(),
        output_width: width,
        output_height: height,
        updated_by: userData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "slot_key" });

      if (dbError) {
        await supabase.storage.from("public-content").remove([path]);
        throw dbError;
      }

      if (currentPath && currentPath !== path) {
        await supabase.storage.from("public-content").remove([currentPath]);
      }

      setMessage("Published. The website now uses this image.");
      setSourceFile(null);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceUrl(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function restoreDefault() {
    if (!currentPath) return;
    const confirmed = window.confirm(`Restore the default image for ${label}? The current custom image will be removed.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error: deleteRowError } = await supabase.from("website_media").delete().eq("slot_key", slotKey);
      if (deleteRowError) throw deleteRowError;

      const { error: removeError } = await supabase.storage.from("public-content").remove([currentPath]);
      if (removeError) setMessage("Default restored. The old file could not be removed from storage, but it is no longer used.");
      else setMessage("Default image restored.");

      setAltText("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore the default image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="portal-card" style={{ overflow: "hidden" }}>
      <div className="portal-card__header">
        <div><p className="portal-overline">{hasCustomImage ? "Custom image live" : "Using website default"}</p><h3>{label}</h3></div>
        <span>{width} × {height}</span>
      </div>
      <div className="portal-card__body" style={{ display: "grid", gap: 16 }}>
        <p>{description}</p>

        <div style={{ width: "100%", aspectRatio: aspect, overflow: "hidden", borderRadius: 16, background: "#e8eceb", position: "relative" }}>
          {sourceUrl ? <img src={sourceUrl} alt="Crop preview" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }} /> : currentUrl ? <img src={currentUrl} alt={currentAlt ?? label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "var(--muted)" }}>The website is currently using its built-in default image.</div>}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button className="button" type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>{hasCustomImage ? "Replace photo" : "Choose photo"}</button>
          <Link className="button button--ghost" href={previewHref} target="_blank">Preview on website ↗</Link>
          {hasCustomImage ? <button className="button button--ghost" type="button" onClick={restoreDefault} disabled={busy}>Restore default</button> : null}
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} style={{ display: "none" }} />

        {sourceUrl ? <>
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,.035)", display: "grid", gap: 12 }}>
            <strong>Adjust crop</strong>
            <label>Zoom<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
            <label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
            <label>Vertical position<input type="range" min="0" max="100" value={y} onChange={(e) => setY(Number(e.target.value))} /></label>
          </div>
          <label>Image description<input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder={`${label} at JV Dental`} /></label>
          <button className="button" type="button" disabled={busy || !sourceFile} onClick={save}>{busy ? "Publishing…" : "Crop & publish"}</button>
        </> : hasCustomImage ? <p style={{ margin: 0, color: "var(--muted)", fontSize: ".85rem" }}>Current description: {currentAlt || "No description saved"}</p> : null}

        {message ? <p role="status" style={{ margin: 0 }}>{message}</p> : null}
      </div>
    </article>
  );
}
