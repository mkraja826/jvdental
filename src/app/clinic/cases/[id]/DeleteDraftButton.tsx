"use client";

import { useState } from "react";
import { deleteDraftCase } from "@/app/clinic/cases/actions";

export default function DeleteDraftButton({ caseId, caseTitle }: { caseId: string; caseTitle: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <button className="button button--ghost" type="button" onClick={() => setConfirming(true)}>Delete draft</button>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ margin: 0 }}><strong>Delete “{caseTitle}”?</strong></p>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: ".86rem" }}>This permanently removes the draft and its uploaded photos. This cannot be undone.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <form action={deleteDraftCase}>
          <input type="hidden" name="case_id" value={caseId} />
          <button className="button" type="submit" style={{ background: "var(--danger)", borderColor: "var(--danger)" }}>Yes, delete draft</button>
        </form>
        <button className="button button--ghost" type="button" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    </div>
  );
}
