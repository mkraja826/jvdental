"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { replaceCaseMedia } from "../actions";
import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number | null;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function SavedCaseMediaEditor({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(() => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const complete = useMemo(() => photos.every((item) => (item.caption ?? "").trim().length >= 3), [photos]);

  function move(index: number, direction: -1 | 1) {
    setPhotos((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function setCaption(index: number, caption: string) {
    setPhotos((current) => current.map((item, i) => i === index ? { ...item, caption } : item));
  }

  async function persistOrder(nextPhotos: MediaItem[]) {
    const supabase = createClient();
    for (let index = 0; index < nextPhotos.length; index += 1) {
      const { error } = await supabase.from("signature_case_media").update({ sort_order: index }).eq("id", nextPhotos[index].id);
      if (error) throw error;
    }
  }

  async function replacePhoto(item: MediaItem, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED.has(file.type) || file.size > MAX_FILE_BYTES) {
      setMessage("Choose a JPG, PNG or WebP image below 25 MB.");
      return;
    }

    setBusyId(item.id);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("case_id", item.storage_path.split("/")[1] ?? "");
      formData.set("media_id", item.id);
      formData.set("file", file);

      const result = await replaceCaseMedia(formData);
      if (!result.ok || !result.storagePath) {
        setMessage(result.error ?? "Could not replace this photo. The original photo was kept.");
        return;
      }

      setPhotos((current) => current.map((photo) => photo.id === item.id ? { ...photo, storage_path: result.storagePath! } : photo));
      setMessage(result.oldFileCleanupFailed ? "Photo replaced, but the old storage file could not be cleaned up." : "Photo replaced ✓");
      router.refresh();
    } catch {
      setMessage("Could not replace this photo. The original photo was kept.");
    } finally {
      setBusyId(null);
    }
  }

  async function deletePhoto(item: MediaItem) {
    if (!window.confirm("Delete this photo from the case? This cannot be undone.")) return;
    setBusyId(item.id);
    setMessage(null);
    const supabase = createClient();
    try {
      const { error: dbError } = await supabase.from("signature_case_media").delete().eq("id", item.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage.from("public-content").remove([item.storage_path]);
      const next = photos.filter((photo) => photo.id !== item.id);
      await persistOrder(next);
      setPhotos(next.map((photo, index) => ({ ...photo, sort_order: index })));
      setMessage(storageError ? "Photo removed from the case; old storage cleanup needs attention." : "Photo deleted ✓");
      router.refresh();
    } catch {
      setMessage("Could not delete this photo. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveChanges() {
    if (!complete) {
      setMessage("Add a short explanation to every photo before saving.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    for (let index = 0; index < photos.length; index += 1) {
      const item = photos[index];
      const summary = (item.caption ?? "").trim();
      const { error } = await supabase.from("signature_case_media").update({ caption: summary, alt_text: summary, sort_order: index }).eq("id", item.id);
      if (error) {
        setSaving(false);
        setMessage(`Could not save photo ${index + 1}. Please try again.`);
        return;
      }
    }
    setPhotos((current) => current.map((item, index) => ({ ...item, sort_order: index })));
    setSaving(false);
    setMessage("Case photo story saved ✓");
    router.refresh();
  }

  const busy = saving || busyId !== null;

  return <div className="case-uploader">
    <div className="case-uploader__intro"><div><strong>Review your saved treatment story</strong><p>Replace or delete a photo, edit its explanation, or change the order. This is the order visitors will see.</p></div><span className="status-pill">{photos.length} photos</span></div>
    <div className="case-uploader__preview-grid">
      {photos.map((item, index) => {
        const src = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/public-content/${item.storage_path}` : "";
        const itemBusy = busyId === item.id;
        return <article className="case-uploader__preview" key={`${item.id}-${item.storage_path}`}>
          <div className="case-uploader__thumb">{src ? <img src={src} alt="" /> : <span>Photo</span>}<span className="case-uploader__order">{index + 1}</span></div>
          <label style={{ display: "grid", gap: 6 }}><span style={{ fontWeight: 650 }}>What does this photo show?</span><textarea rows={3} value={item.caption ?? ""} onChange={(e) => setCaption(index, e.target.value)} disabled={busy} /></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label className="button button--ghost" style={{ cursor: busy ? "not-allowed" : "pointer" }}>{itemBusy ? "Replacing…" : "Replace photo"}<input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} disabled={busy} onChange={(event) => replacePhoto(item, event)} /></label>
            <button type="button" className="button button--ghost" onClick={() => move(index, -1)} disabled={busy || index === 0}>← Earlier</button>
            <button type="button" className="button button--ghost" onClick={() => move(index, 1)} disabled={busy || index === photos.length - 1}>Later →</button>
            <button type="button" className="text-link" onClick={() => deletePhoto(item)} disabled={busy}>{itemBusy ? "Working…" : "Delete photo"}</button>
          </div>
        </article>;
      })}
    </div>
    <div className="case-uploader__actions"><button className="button" type="button" onClick={saveChanges} disabled={busy || !complete}>{saving ? "Saving…" : complete ? "Save photo story" : "Explain every photo"}</button></div>
    {message ? <p role="status" className="case-uploader__message">{message}</p> : null}
  </div>;
}
