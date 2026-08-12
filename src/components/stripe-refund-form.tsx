"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function fractionDigits(currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
}

export default function StripeRefundForm({ paymentId, currency, refundableMinor }: { paymentId: string; currency: string; refundableMinor: number }) {
  const digits = fractionDigits(currency);
  const divisor = 10 ** digits;
  const [amount, setAmount] = useState((refundableMinor / divisor).toFixed(digits));
  const [reason, setReason] = useState("Patient refund");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    const numeric = Number(amount);
    const amountMinor = Math.round(numeric * divisor);
    if (!Number.isFinite(numeric) || amountMinor <= 0 || amountMinor > refundableMinor) {
      setState("error");
      setMessage("Enter a valid refundable amount.");
      return;
    }
    setState("loading");
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("stripe-refund", { body: { paymentId, amountMinor, reason } });
    if (error || !data?.ok) {
      setState("error");
      setMessage(data?.detail || "Refund could not be processed.");
      return;
    }
    setState("done");
    setMessage("Refund request submitted to Stripe. Refresh to view the reconciled status.");
  }

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <label>Refund amount ({currency})<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>
      <label>Internal reason<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></label>
      <button className="button button--ghost" type="button" onClick={submit} disabled={state === "loading" || state === "done"}>{state === "loading" ? "Processing…" : "Process refund"}</button>
      {message ? <p className="form-note" style={state === "error" ? { color: "var(--danger)" } : undefined}>{message}</p> : null}
    </div>
  );
}
