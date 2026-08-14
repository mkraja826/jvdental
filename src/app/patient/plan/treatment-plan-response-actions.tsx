"use client";

import { useFormStatus } from "react-dom";

export default function TreatmentPlanResponseActions() {
  const { pending } = useFormStatus();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <button className="button" type="submit" name="response" value="accepted" disabled={pending}>
        {pending ? "Submitting…" : "Accept this preliminary plan"}
      </button>
      <button className="button button--ghost" type="submit" name="response" value="request_changes" disabled={pending}>
        {pending ? "Please wait…" : "Request changes"}
      </button>
    </div>
  );
}
