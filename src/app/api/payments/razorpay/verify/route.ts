import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function reconcileBookingPayment(requestId: string, orderId: string, paymentId: string) {
  const supabase = createAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from("booking_payments")
    .select("id,appointment_request_id,status")
    .eq("provider", "razorpay")
    .eq("provider_order_id", orderId)
    .eq("appointment_request_id", requestId)
    .single();
  if (paymentError || !payment) return false;

  const { error: paymentUpdateError } = await supabase
    .from("booking_payments")
    .update({ provider_payment_id: paymentId, status: "paid" })
    .eq("id", payment.id);
  if (paymentUpdateError) return false;

  const { error: requestUpdateError } = await supabase
    .from("appointment_requests")
    .update({ status: "paid" })
    .eq("id", requestId)
    .in("status", ["requested", "payment_pending", "paid"]);
  return !requestUpdateError;
}

export async function POST(request: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const requestId = String(body.requestId ?? "");
    const orderId = String(body.razorpay_order_id ?? "");
    const paymentId = String(body.razorpay_payment_id ?? "");
    const signature = String(body.razorpay_signature ?? "");
    if (!requestId || !orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Payment verification details are incomplete." }, { status: 400 });
    }

    const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");
    const valid = expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
    if (!valid) {
      return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
    }

    const reconciled = await reconcileBookingPayment(requestId, orderId, paymentId);
    if (!reconciled) {
      return NextResponse.json({ error: "Payment record could not be reconciled." }, { status: 409 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("razorpay verification failed", error);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
