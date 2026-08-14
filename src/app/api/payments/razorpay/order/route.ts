import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getAmount(kind: string) {
  const raw = kind === "video_consultation"
    ? process.env.RAZORPAY_VIDEO_CONSULTATION_FEE_PAISE
    : process.env.RAZORPAY_CLINIC_CONSULTATION_FEE_PAISE;
  const amount = Number(raw);
  return Number.isInteger(amount) && amount > 100 ? amount : null;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ paymentRequired: false, reason: "gateway_not_configured" });
    }

    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const bookingKind = String(body.bookingKind ?? "");
    const paymentAccessToken = String(body.paymentAccessToken ?? "");
    const amount = getAmount(bookingKind);
    if (!requestId || !amount || !paymentAccessToken) {
      return NextResponse.json({ error: "Booking checkout authorization is missing." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: booking, error: bookingError } = await supabase
      .from("appointment_requests")
      .select("id,booking_kind,full_name,email,phone,status,payment_access_token_hash,payment_access_token_expires_at")
      .eq("id", requestId)
      .single();
    if (bookingError || !booking || booking.booking_kind !== bookingKind) {
      return NextResponse.json({ error: "Booking request was not found." }, { status: 404 });
    }
    if (booking.status !== "requested") {
      return NextResponse.json({ error: "Payment checkout has already been started for this booking." }, { status: 409 });
    }

    const suppliedTokenHash = await sha256(paymentAccessToken);
    const tokenExpired = !booking.payment_access_token_expires_at || new Date(booking.payment_access_token_expires_at).getTime() <= Date.now();
    if (!booking.payment_access_token_hash || suppliedTokenHash !== booking.payment_access_token_hash || tokenExpired) {
      return NextResponse.json({ error: "Booking checkout authorization is invalid or expired." }, { status: 403 });
    }

    const receipt = `jv-${requestId.replaceAll("-", "").slice(0, 24)}`;
    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        notes: { appointment_request_id: requestId, booking_kind: bookingKind },
      }),
    });

    const order = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      console.error("razorpay order failed", order);
      return NextResponse.json({ error: "Payment could not be started." }, { status: 502 });
    }

    await supabase.from("booking_payments").insert({
      appointment_request_id: requestId,
      provider: "razorpay",
      provider_order_id: order.id,
      amount_subunits: amount,
      currency: "INR",
      status: "created",
    });
    await supabase
      .from("appointment_requests")
      .update({
        status: "payment_pending",
        payment_access_token_hash: null,
        payment_access_token_expires_at: null,
      })
      .eq("id", requestId)
      .eq("status", "requested");

    return NextResponse.json({
      paymentRequired: true,
      keyId,
      orderId: order.id,
      amount,
      currency: "INR",
      name: "JV Dental & Implant Centre",
      description: bookingKind === "video_consultation" ? "Video consultation booking" : "Clinic consultation booking",
      prefill: { name: booking.full_name, email: booking.email ?? "", contact: booking.phone },
    });
  } catch (error) {
    console.error("razorpay order exception", error);
    return NextResponse.json({ error: "Payment could not be started." }, { status: 500 });
  }
}
