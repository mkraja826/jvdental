import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { markBookingPaymentFailed, reconcileBookingPayment } from "@/lib/payments/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  status?: string;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

function validSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    if (!signature || !validSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    let event: RazorpayWebhook;
    try {
      event = JSON.parse(rawBody) as RazorpayWebhook;
    } catch {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }

    const eventName = String(event.event ?? "");
    if (!["payment.captured", "order.paid", "payment.failed"].includes(eventName)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const orderId = String(paymentEntity?.order_id ?? orderEntity?.id ?? "");
    const paymentId = String(paymentEntity?.id ?? "");
    if (!orderId) {
      return NextResponse.json({ received: true, ignored: true, reason: "missing_order_id" });
    }

    if (eventName === "payment.failed") {
      await markBookingPaymentFailed(orderId, paymentId || null);
      return NextResponse.json({ received: true, status: "failed" });
    }

    if (!paymentId) {
      return NextResponse.json({ received: true, ignored: true, reason: "missing_payment_id" });
    }

    const supabase = createAdminClient();
    const { data: bookingPayment } = await supabase
      .from("booking_payments")
      .select("appointment_request_id")
      .eq("provider", "razorpay")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (!bookingPayment?.appointment_request_id) {
      return NextResponse.json({ received: true, ignored: true, reason: "unknown_order" });
    }

    const reconciled = await reconcileBookingPayment(
      bookingPayment.appointment_request_id,
      orderId,
      paymentId,
    );

    if (!reconciled) {
      return NextResponse.json({ error: "Webhook payment could not be reconciled." }, { status: 409 });
    }

    return NextResponse.json({ received: true, status: "paid" });
  } catch (error) {
    console.error("razorpay webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
