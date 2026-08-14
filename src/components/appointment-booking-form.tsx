"use client";

import { FormEvent, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function AppointmentBookingForm() {
  const [bookingKind, setBookingKind] = useState("clinic_consultation");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const payload = {
      bookingKind,
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      email: form.get("email"),
      city: form.get("city"),
      preferredDate: form.get("preferredDate"),
      preferredTimeWindow: form.get("preferredTimeWindow"),
      dentalConcern: form.get("dentalConcern"),
    };

    try {
      const bookingResponse = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const booking = await bookingResponse.json();
      if (!bookingResponse.ok) throw new Error(booking.error || "Booking could not be submitted.");

      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: booking.requestId,
          bookingKind,
          paymentAccessToken: booking.paymentAccessToken,
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Payment could not be started.");

      if (!order.paymentRequired) {
        setSuccess(true);
        setMessage("Your booking request has been received. The clinic team will contact you to confirm the appointment time.");
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Secure payment checkout could not be loaded.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: "#102D4D" },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId: booking.requestId, ...response }),
          });
          const verification = await verifyResponse.json();
          if (!verifyResponse.ok) {
            setSuccess(false);
            setMessage(verification.error || "Payment was received but verification needs clinic review.");
            return;
          }
          setSuccess(true);
          setMessage("Payment received. Your consultation request is recorded and the clinic team will confirm the exact appointment time.");
        },
        modal: {
          ondismiss: () => {
            setSuccess(true);
            setMessage("Your appointment request is saved. Payment was not completed; you can contact the clinic to continue the booking.");
          },
        },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={submit}>
      <div className="booking-type" role="group" aria-label="Consultation type">
        <button type="button" className={bookingKind === "clinic_consultation" ? "is-active" : ""} onClick={() => setBookingKind("clinic_consultation")}>Clinic appointment</button>
        <button type="button" className={bookingKind === "video_consultation" ? "is-active" : ""} onClick={() => setBookingKind("video_consultation")}>Video consultation</button>
      </div>

      <div className="booking-grid">
        <label className="field"><span>Full name *</span><input name="fullName" required autoComplete="name" /></label>
        <label className="field"><span>Phone / WhatsApp *</span><input name="phone" required inputMode="tel" autoComplete="tel" /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" /></label>
        <label className="field"><span>City</span><input name="city" autoComplete="address-level2" /></label>
        <label className="field"><span>Preferred date *</span><input name="preferredDate" type="date" required /></label>
        <label className="field"><span>Preferred time *</span><select name="preferredTimeWindow" defaultValue="morning" required><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
      </div>

      <label className="field"><span>What would you like the dentist to look at?</span><textarea name="dentalConcern" rows={5} placeholder="For example: missing tooth, implant consultation, pain, full-mouth treatment, second opinion..." /></label>

      <p className="booking-note">Submitting this form requests a preferred date/time. The clinic confirms the final appointment after reviewing availability. Online information does not replace a dental examination.</p>
      <button className="button booking-submit" disabled={busy} type="submit">{busy ? "Submitting…" : bookingKind === "video_consultation" ? "Book consultation →" : "Book appointment →"}</button>
      {message ? <p className={success ? "booking-message booking-message--success" : "booking-message"} role="status">{message}</p> : null}
    </form>
  );
}
