"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  slotKey: string;
  label: string;
  description: string;
  width: number;
  height: number;
  currentPath?: string | null;
  currentUrl?: string | null;
  currentAlt?: string | null;
};

export default function WebsiteMediaUploader({ slotKey, label, description, width, height, currentPath, currentUrl, currentAlt }: Props) {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [altText, setAltText] = useState(currentAlt ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const aspect = useMemo(() => `${width} / ${height}`, [width, height]);

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

      setMessage("Published. The website will use this image automatically.");
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

  return (
    <article className="portal-card" style={{ overflow: "hidden" }}>
      <div className="portal-card__header"><div><p className="portal-overline">Website photo</p><h3>{label}</h3></div><span>{width} × {height}</span></div>
      <div className="portal-card__body" style={{ display: "grid", gap: 16 }}>
        <p>{description}</p>
        <div style={{ width: "100%", aspectRatio: aspect, overflow: "hidden", borderRadius: 16, background: "#e8eceb", position: "relative" }}>
          {sourceUrl ? <img src={sourceUrl} alt="Crop preview" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }} /> : currentUrl ? <img src={currentUrl} alt={currentAlt ?? label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)" }}>No custom image published</div>}
        </div>
        <label>Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /></label>
        {sourceUrl ? <>
          <label>Zoom<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
          <label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
          <label>Vertical position<input type="range" min="0" max="100" value={y} onChange={(e) => setY(Number(e.target.value))} /></label>
        </> : null}
        <label>Image description<input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder={`${label} at JV Dental`} /></label>
        <button className="button" type="button" disabled={busy || !sourceFile} onClick={save}>{busy ? "Publishing…" : "Crop & publish"}</button>
        {message ? <p role="status" style={{ margin: 0 }}>{message}</p> : null}
      </div>
    </article>
  );
}
