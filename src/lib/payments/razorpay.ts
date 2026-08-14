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

export async function markBookingPaymentFailed(orderId: string, paymentId: string | null) {
  const supabase = createAdminClient();
  const update: Record<string, string> = { status: "failed" };
  if (paymentId) update.provider_payment_id = paymentId;
  const { error } = await supabase
    .from("booking_payments")
    .update(update)
    .eq("provider", "razorpay")
    .eq("provider_order_id", orderId)
    .neq("status", "paid");
  return !error;
}
