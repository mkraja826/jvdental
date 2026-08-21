import Link from "next/link";
import { redirect } from "next/navigation";
import PatientNavigation from "@/components/patient-navigation";
import StripeCheckoutButton from "@/components/stripe-checkout-button";
import { createClient } from "@/lib/supabase/server";

type RefundRow = {
  id: string;
  payment_id: string;
  amount_minor: number | string;
  currency: string;
  status: string;
  reason: string | null;
  processed_at: string | null;
  created_at: string;
};

function formatMinor(amountMinor: number | string | null | undefined, currency: string) {
  const formatter = new Intl.NumberFormat("en", { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(Number(amountMinor ?? 0) / 10 ** digits);
}

export default async function PatientPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const showOlder = query.history === "older";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login?next=/patient/payments");

  const [{ data: requests, count: requestCount }, { data: payments, count: paymentCount }] = await Promise.all([
    supabase.from("payment_requests").select("id,request_number,title,description,request_type,amount_minor,currency,status,due_at,expires_at,created_at,provider_preference", { count: "exact" }).eq("patient_id", user.id).order("created_at", { ascending: false }).limit(showOlder ? 100 : 30),
    supabase.from("payments").select("id,payment_request_id,provider,amount_minor,currency,status,payment_method_summary,paid_at,receipt_url,created_at", { count: "exact" }).eq("patient_id", user.id).order("created_at", { ascending: false }).limit(showOlder ? 100 : 30),
  ]);

  const totalRequests = requestCount ?? requests?.length ?? 0;
  const totalPayments = paymentCount ?? payments?.length ?? 0;
  const requestIds = (requests ?? []).map((request) => request.id);
  const paymentIds = (payments ?? []).map((payment) => payment.id);

  const [{ data: balances }, { data: receipts }, { data: refunds }] = await Promise.all([
    requestIds.length
      ? supabase.from("payment_request_balances").select("payment_request_id,requested_minor,gross_paid_minor,refunded_minor,remaining_minor,currency").in("payment_request_id", requestIds)
      : Promise.resolve({ data: [] }),
    paymentIds.length
      ? supabase.from("payment_receipts").select("payment_id,receipt_number,issued_at").in("payment_id", paymentIds)
      : Promise.resolve({ data: [] }),
    paymentIds.length
      ? supabase.from("payment_refunds").select("id,payment_id,amount_minor,currency,status,reason,processed_at,created_at").in("payment_id", paymentIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const refundRows = (refunds ?? []) as RefundRow[];
  const balanceMap = new Map((balances ?? []).map((item) => [item.payment_request_id, item]));
  const receiptMap = new Map((receipts ?? []).map((item) => [item.payment_id, item]));
  const refundsByPayment = new Map<string, RefundRow[]>();
  for (const refund of refundRows) {
    const list = refundsByPayment.get(refund.payment_id) ?? [];
    list.push(refund);
    refundsByPayment.set(refund.payment_id, list);
  }
  const now = new Date().getTime();

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/patient"><span>JV</span><span>Dental</span></Link>
        <Link className="text-link" href="/patient">Back to journey</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation />
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Secure finance</p>
          <h1 className="portal-title">Payments & receipts</h1>
          <p className="portal-subtitle">Payment requests, receipts and refunds stay attached to your JV Dental case. Card details are entered only on the payment provider&apos;s secure checkout page and are not stored by JV Dental.</p>

          {query.payment === "success" ? <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__body"><strong>Payment submitted.</strong><p className="form-note">Your status changes to paid only after secure provider confirmation reaches JV Dental.</p></div></article> : null}
          {query.payment === "cancelled" ? <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__body"><strong>Checkout closed.</strong><p className="form-note">No payment is recorded just because the checkout page was opened.</p></div></article> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Payment requests</h2><span className="status-pill">{totalRequests ? `${requests?.length ?? 0} of ${totalRequests}` : "0"}</span></div>
            <div className="portal-card__body">
              {!requests?.length ? <p>No payment request has been sent yet.</p> : (
                <div style={{ display: "grid", gap: 18 }}>
                  {requests.map((request) => {
                    const balance = balanceMap.get(request.id);
                    const remaining = Number(balance?.remaining_minor ?? request.amount_minor);
                    const expiredByTime = Boolean(request.expires_at && new Date(request.expires_at).getTime() <= now);
                    const effectiveStatus = expiredByTime && ["sent", "partially_paid"].includes(request.status) ? "expired" : request.status;
                    const payable = ["sent", "partially_paid"].includes(request.status) && !expiredByTime && remaining > 0;
                    return (
                      <article className="portal-card" key={request.id} style={{ boxShadow: "none" }}>
                        <div className="portal-card__body" style={{ display: "grid", gap: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                            <div><strong>PAY-{request.request_number} · {request.title}</strong><p className="form-note" style={{ marginTop: 5 }}>{request.request_type.replaceAll("_", " ")}</p></div>
                            <span className="status-pill">{effectiveStatus.replaceAll("_", " ")}</span>
                          </div>
                          {request.description ? <p style={{ margin: 0 }}>{request.description}</p> : null}
                          <div className="status-list">
                            <div className="status-row"><strong>Requested</strong><span>—</span><span>{formatMinor(request.amount_minor, request.currency)}</span></div>
                            <div className="status-row"><strong>Paid</strong><span>—</span><span>{formatMinor(balance?.gross_paid_minor ?? 0, request.currency)}</span></div>
                            {Number(balance?.refunded_minor ?? 0) > 0 ? <div className="status-row"><strong>Refunded</strong><span>—</span><span>{formatMinor(balance?.refunded_minor ?? 0, request.currency)}</span></div> : null}
                            <div className="status-row"><strong>Remaining</strong><span>—</span><span>{formatMinor(remaining, request.currency)}</span></div>
                          </div>
                          {request.due_at ? <p className="form-note">Due {new Date(request.due_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p> : null}
                          {request.expires_at ? <p className="form-note">{expiredByTime ? "Expired" : "Available until"} {new Date(request.expires_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p> : null}
                          {payable && request.provider_preference === "stripe" ? <StripeCheckoutButton paymentRequestId={request.id} /> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {totalRequests > (requests?.length ?? 0) ? <p className="form-note">Showing the {requests?.length ?? 0} most recent requests. <Link className="text-link" href="/patient/payments?history=older">Show older finance history →</Link></p> : null}
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Payment history</h2><span className="status-pill">{totalPayments ? `${payments?.length ?? 0} of ${totalPayments}` : "0"}</span></div>
            <div className="portal-card__body">
              {!payments?.length ? <p>No confirmed payments yet.</p> : (
                <div style={{ display: "grid", gap: 14 }}>
                  {payments.map((payment) => {
                    const receipt = receiptMap.get(payment.id);
                    const paymentRefunds = refundsByPayment.get(payment.id) ?? [];
                    return (
                      <div className="status-list" key={payment.id}>
                        <div className="status-row"><strong>{formatMinor(payment.amount_minor, payment.currency)}</strong><span>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "Pending"}</span><span className="status-pill">{payment.status.replaceAll("_", " ")}</span></div>
                        <div className="status-row"><strong>{payment.provider === "stripe" ? "Stripe" : payment.provider}</strong><span>{payment.payment_method_summary ?? "Secure payment"}</span><span>{receipt ? `JV Receipt #${receipt.receipt_number}` : "—"}</span></div>
                        {payment.receipt_url ? <div style={{ padding: "4px 0 10px" }}><a className="text-link" href={payment.receipt_url} target="_blank" rel="noreferrer">Open provider receipt ↗</a></div> : null}
                        {paymentRefunds.map((refund) => <div className="status-row" key={refund.id}><strong>Refund · {formatMinor(refund.amount_minor, refund.currency)}</strong><span>{refund.reason || "Refund"}</span><span className="status-pill">{refund.status}</span></div>)}
                      </div>
                    );
                  })}
                </div>
              )}
              {totalPayments > (payments?.length ?? 0) ? <p className="form-note">Showing the {payments?.length ?? 0} most recent payments. <Link className="text-link" href="/patient/payments?history=older">Show older finance history →</Link></p> : showOlder && (totalRequests > 30 || totalPayments > 30) ? <p className="form-note"><Link className="text-link" href="/patient/payments">Show recent finance only</Link></p> : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
