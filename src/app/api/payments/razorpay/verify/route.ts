import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reconcileBookingPayment } from "@/lib/payments/razorpay";

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
