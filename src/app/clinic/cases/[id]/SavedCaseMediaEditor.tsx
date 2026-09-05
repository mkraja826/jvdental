"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number | null;
};

export default function SavedCaseMediaEditor({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(() => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  const [busy, setBusy] = useState(false);
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

  async function saveChanges() {
    if (!complete) {
      setMessage("Add a short explanation to every photo before saving.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    for (let index = 0; index < photos.length; index += 1) {
      const item = photos[index];
      const summary = (item.caption ?? "").trim();
      const { error } = await supabase.from("signature_case_media").update({ caption: summary, alt_text: summary, sort_order: index }).eq("id", item.id);
      if (error) {
        setBusy(false);
        setMessage(`Could not save photo ${index + 1}. Please try again.`);
        return;
      }
    }
    setBusy(false);
    setMessage("Case photo story saved ✓");
    router.refresh();
  }

  return <div className="case-uploader">
    <div className="case-uploader__intro"><div><strong>Review your saved treatment story</strong><p>Edit any explanation or change the photo order. This is the exact order visitors will see.</p></div><span className="status-pill">{photos.length} photos</span></div>
    <div className="case-uploader__preview-grid">
      {photos.map((item, index) => {
        const src = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/public-content/${item.storage_path}` : "";
        return <article className="case-uploader__preview" key={item.id}>
          <div className="case-uploader__thumb">{src ? <img src={src} alt="" /> : <span>Photo</span>}<span className="case-uploader__order">{index + 1}</span></div>
          <label style={{ display: "grid", gap: 6 }}><span style={{ fontWeight: 650 }}>What does this photo show?</span><textarea rows={3} value={item.caption ?? ""} onChange={(e) => setCaption(index, e.target.value)} disabled={busy} /></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="button button--ghost" onClick={() => move(index, -1)} disabled={busy || index === 0}>← Earlier</button><button type="button" className="button button--ghost" onClick={() => move(index, 1)} disabled={busy || index === photos.length - 1}>Later →</button></div>
        </article>;
      })}
    </div>
    <div className="case-uploader__actions"><button className="button" type="button" onClick={saveChanges} disabled={busy || !complete}>{busy ? "Saving…" : complete ? "Save photo story" : "Explain every photo"}</button></div>
    {message ? <p role="status" className="case-uploader__message">{message}</p> : null}
  </div>;
}
