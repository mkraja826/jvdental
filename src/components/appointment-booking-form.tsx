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

function indiaToday() {
  const now = new Date();
  const india = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return `${india.getUTCFullYear()}-${String(india.getUTCMonth() + 1).padStart(2, "0")}-${String(india.getUTCDate()).padStart(2, "0")}`;
}

export default function AppointmentBookingForm() {
  const [bookingKind, setBookingKind] = useState("clinic_consultation");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [minimumDate] = useState(indiaToday);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setSuccess(false);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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

    let bookingSaved = false;

    try {
      const bookingResponse = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const booking = await bookingResponse.json();
      if (!bookingResponse.ok) throw new Error(booking.error || "Booking could not be submitted.");
      bookingSaved = true;

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
      if (!orderResponse.ok) {
        setSuccess(true);
        setMessage("Your appointment request is saved. Secure payment could not be started right now; the clinic team can continue the booking with you without submitting another request.");
        formElement.reset();
        return;
      }

      if (!order.paymentRequired) {
        setSuccess(true);
        setMessage("Your booking request has been received. The clinic team will contact you to confirm the appointment time.");
        formElement.reset();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setSuccess(true);
        setMessage("Your appointment request is saved. Secure payment checkout could not be loaded; the clinic team can continue the booking with you without submitting another request.");
        formElement.reset();
        return;
      }

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
            setSuccess(true);
            setMessage(verification.error || "Your appointment request is saved and payment was received, but verification needs clinic review. Please do not submit another booking.");
            return;
          }
          setSuccess(true);
          setMessage("Payment received. Your consultation request is recorded and the clinic team will confirm the exact appointment time.");
          formElement.reset();
        },
        modal: {
          ondismiss: () => {
            setSuccess(true);
            setMessage("Your appointment request is saved. Payment was not completed; you can contact the clinic to continue the booking without submitting another request.");
            formElement.reset();
          },
        },
      });
      checkout.open();
    } catch (error) {
      if (bookingSaved) {
        setSuccess(true);
        setMessage("Your appointment request is saved. A payment step could not be completed; please do not submit another booking. The clinic team can continue it with you.");
        formElement.reset();
      } else {
        setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={submit} aria-busy={busy || undefined}>
      <div className="booking-type" role="group" aria-label="Consultation type">
        <button
          type="button"
          className={bookingKind === "clinic_consultation" ? "is-active" : ""}
          aria-pressed={bookingKind === "clinic_consultation"}
          onClick={() => setBookingKind("clinic_consultation")}
        >
          Clinic appointment
        </button>
        <button
          type="button"
          className={bookingKind === "video_consultation" ? "is-active" : ""}
          aria-pressed={bookingKind === "video_consultation"}
          onClick={() => setBookingKind("video_consultation")}
        >
          Video consultation
        </button>
      </div>

      <div className="booking-grid">
        <label className="field"><span>Full name *</span><input name="fullName" required autoComplete="name" maxLength={120} /></label>
        <label className="field"><span>Phone / WhatsApp *</span><input name="phone" required inputMode="tel" autoComplete="tel" maxLength={30} /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" maxLength={180} /></label>
        <label className="field"><span>City</span><input name="city" autoComplete="address-level2" maxLength={100} /></label>
        <label className="field"><span>Preferred date *</span><input name="preferredDate" type="date" min={minimumDate} required /></label>
        <label className="field"><span>Preferred time *</span><select name="preferredTimeWindow" defaultValue="morning" required><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
      </div>

      <label className="field"><span>What would you like the dentist to look at?</span><textarea name="dentalConcern" rows={5} maxLength={1500} placeholder="For example: missing tooth, implant consultation, pain, full-mouth treatment, second opinion..." /></label>

      <p className="booking-note">Submitting this form requests a preferred date/time. The clinic confirms the final appointment after reviewing availability. Online information does not replace a dental examination.</p>
      <button
        className="button booking-submit"
        disabled={busy}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        data-state={busy ? "pending" : "idle"}
        type="submit"
      >
        <span>{busy ? "Submitting…" : bookingKind === "video_consultation" ? "Book consultation →" : "Book appointment →"}</span>
      </button>
      {message ? (
        <p
          className={success ? "booking-message booking-message--success" : "booking-message"}
          role={success ? "status" : "alert"}
          aria-live={success ? "polite" : "assertive"}
          aria-atomic="true"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
