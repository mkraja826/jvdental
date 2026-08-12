"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function StripeCheckoutButton({ paymentRequestId }: { paymentRequestId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setState("loading");
    setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: { paymentRequestId },
    });
    if (error || !data?.checkoutUrl) {
      setState("error");
      setMessage(data?.error === "stripe_not_configured" ? "Online card payment is not activated yet. Please contact JV Dental." : "Checkout could not be opened. Please try again or contact JV Dental.");
      return;
    }
    window.location.assign(data.checkoutUrl);
  }

  return (
    <div>
      <button className="button" type="button" onClick={startCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Opening secure checkout…" : "Pay securely with Stripe →"}
      </button>
      {state === "error" ? <p className="form-note" style={{ color: "var(--danger)", marginTop: 10 }}>{message}</p> : null}
    </div>
  );
}
