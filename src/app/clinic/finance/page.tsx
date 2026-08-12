import Link from "next/link";
import StripeRefundForm from "@/components/stripe-refund-form";
import { requireStaff } from "@/lib/auth/guards";
import { cancelPaymentRequest, createPaymentRequest, sendPaymentRequest } from "./actions";

const FINANCE_ROLES = new Set(["owner", "admin", "coordinator", "receptionist"]);

function formatMinor(amountMinor: number | string | null | undefined, currency: string) {
  const formatter = new Intl.NumberFormat("en", { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(Number(amountMinor ?? 0) / 10 ** digits);
}

export default async function ClinicFinancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { staff, supabase } = await requireStaff();
  const canManage = FINANCE_ROLES.has(staff.role);
  const canRefund = staff.role === "owner" || staff.role === "admin";

  const [{ data: cases }, { data: plans }, { data: requests }, { data: balances }, { data: payments }] = await Promise.all([
    supabase.from("patient_cases").select("id,case_number,status,patient_profiles(full_name,country)").order("updated_at", { ascending: false }).limit(100),
    supabase.from("treatment_plans").select("id,case_id,version,title,status").order("created_at", { ascending: false }).limit(200),
    supabase.from("payment_requests").select("id,request_number,patient_id,case_id,treatment_plan_id,request_type,title,amount_minor,currency,status,due_at,created_at,patient_profiles(full_name,country),patient_cases(case_number)").order("created_at", { ascending: false }).limit(100),
    supabase.from("payment_request_balances").select("payment_request_id,requested_minor,gross_paid_minor,refunded_minor,remaining_minor,currency"),
    supabase.from("payments").select("id,payment_request_id,patient_id,case_id,provider,amount_minor,currency,status,payment_method_summary,paid_at,receipt_url,created_at,patient_profiles(full_name),patient_cases(case_number)").order("created_at", { ascending: false }).limit(100),
  ]);

  const paymentIds = (payments ?? []).map((payment) => payment.id);
  const { data: refunds } = paymentIds.length ? await supabase.from("payment_refunds").select("id,payment_id,amount_minor,status,reason,created_at").in("payment_id", paymentIds) : { data: [] };
  const balanceMap = new Map((balances ?? []).map((row) => [row.payment_request_id, row]));
  const refundsByPayment = new Map<string, typeof refunds>();
  for (const refund of refunds ?? []) {
    const list = refundsByPayment.get(refund.payment_id) ?? [];
    list.push(refund);
    refundsByPayment.set(refund.payment_id, list);
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">{staff.role}</span><Link className="text-link" href="/clinic">Back to clinic</Link></div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic finance navigation">
            <Link href="/clinic/finance">Payments & finance</Link>
            <Link href="/clinic/commercial">Estimates</Link>
            <Link href="/clinic/travel">International travel</Link>
            <Link href="/clinic/notifications">Notifications</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Payments & finance</p>
          <h1 className="portal-title">Treatment money without rewriting treatment history.</h1>
          <p className="portal-subtitle">Payment requests are separate from the clinical estimate. Stripe is the first payment gateway, while JV Dental keeps its own provider-neutral payment, refund and receipt ledger.</p>

          {query.created ? <p className="form-note">Draft payment request created. Review it below, then send it to the patient.</p> : null}
          {query.error ? <p className="form-note" style={{ color: "var(--danger)" }}>The finance action could not be completed ({String(query.error)}).</p> : null}

          {canManage ? (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__header"><h2>Create payment request</h2><span className="status-pill">Draft first</span></div>
              <div className="portal-card__body">
                <form action={createPaymentRequest} style={{ display: "grid", gap: 16 }}>
                  <label>Patient case<select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{(cases ?? []).map((item) => { const patient = Array.isArray(item.patient_profiles) ? item.patient_profiles[0] : item.patient_profiles; return <option key={item.id} value={item.id}>JV-{item.case_number} · {patient?.full_name ?? "Patient"} · {item.status.replaceAll("_", " ")}</option>; })}</select></label>
                  <label>Treatment plan (optional)<select name="treatment_plan_id" defaultValue=""><option value="">No linked plan</option>{(plans ?? []).map((plan) => <option key={plan.id} value={plan.id}>v{plan.version} · {plan.title || "Treatment plan"} · {plan.status.replaceAll("_", " ")}</option>)}</select></label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>Request type<select name="request_type" defaultValue="deposit"><option value="deposit">Deposit</option><option value="treatment_balance">Treatment balance</option><option value="installment">Installment</option><option value="custom">Custom</option></select></label>
                    <label>Currency<select name="currency" defaultValue="USD"><option>INR</option><option>USD</option><option>GBP</option><option>AUD</option><option>AED</option><option>EUR</option></select></label>
                  </div>
                  <label>Title<input name="title" defaultValue="JV Dental treatment payment" required /></label>
                  <label>Amount<input name="amount" inputMode="decimal" placeholder="500.00" required /></label>
                  <label>Patient-facing note<textarea name="description" rows={3} placeholder="Treatment deposit for the approved preliminary plan." /></label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><label>Due date<input name="due_date" type="date" /></label><label>Checkout expiry date<input name="expires_date" type="date" /></label></div>
                  <p className="form-note">For a linked treatment plan, the payment-request currency must match the plan currency. Requests are created as drafts and are not visible as payable until staff explicitly sends them.</p>
                  <button className="button" type="submit">Create draft request</button>
                </form>
              </div>
            </article>
          ) : null}

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Payment requests</h2><span className="status-pill">{requests?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {!requests?.length ? <p>No payment requests yet.</p> : <div style={{ display: "grid", gap: 16 }}>{requests.map((request) => {
                const patient = Array.isArray(request.patient_profiles) ? request.patient_profiles[0] : request.patient_profiles;
                const caseRecord = Array.isArray(request.patient_cases) ? request.patient_cases[0] : request.patient_cases;
                const balance = balanceMap.get(request.id);
                return <article className="portal-card" key={request.id} style={{ boxShadow: "none" }}><div className="portal-card__body" style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong>PAY-{request.request_number} · {patient?.full_name ?? "Patient"}</strong><p className="form-note" style={{ marginTop: 5 }}>JV-{caseRecord?.case_number ?? "—"} · {request.request_type.replaceAll("_", " ")}</p></div><span className="status-pill">{request.status.replaceAll("_", " ")}</span></div>
                  <div className="status-list"><div className="status-row"><strong>Requested</strong><span>{request.title}</span><span>{formatMinor(request.amount_minor, request.currency)}</span></div><div className="status-row"><strong>Net received</strong><span>after refunds</span><span>{formatMinor(Number(balance?.gross_paid_minor ?? 0) - Number(balance?.refunded_minor ?? 0), request.currency)}</span></div><div className="status-row"><strong>Remaining</strong><span>—</span><span>{formatMinor(balance?.remaining_minor ?? request.amount_minor, request.currency)}</span></div></div>
                  {canManage ? <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{request.status === "draft" ? <form action={sendPaymentRequest}><input type="hidden" name="payment_request_id" value={request.id} /><button className="button button--ghost" type="submit">Send to patient</button></form> : null}{["draft", "sent"].includes(request.status) ? <form action={cancelPaymentRequest}><input type="hidden" name="payment_request_id" value={request.id} /><button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Cancel request</button></form> : null}</div> : null}
                </div></article>;
              })}</div>}
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Confirmed payment ledger</h2><span className="status-pill">{payments?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {!payments?.length ? <p>No confirmed payments yet.</p> : <div style={{ display: "grid", gap: 16 }}>{payments.map((payment) => {
                const patient = Array.isArray(payment.patient_profiles) ? payment.patient_profiles[0] : payment.patient_profiles;
                const caseRecord = Array.isArray(payment.patient_cases) ? payment.patient_cases[0] : payment.patient_cases;
                const paymentRefunds = refundsByPayment.get(payment.id) ?? [];
                const refundedMinor = paymentRefunds.filter((r) => r.status === "succeeded").reduce((sum, r) => sum + Number(r.amount_minor), 0);
                const refundableMinor = Math.max(Number(payment.amount_minor) - refundedMinor, 0);
                return <article className="portal-card" key={payment.id} style={{ boxShadow: "none" }}><div className="portal-card__body" style={{ display: "grid", gap: 10 }}>
                  <div className="status-row"><strong>{patient?.full_name ?? "Patient"} · JV-{caseRecord?.case_number ?? "—"}</strong><span>{payment.payment_method_summary ?? payment.provider}</span><span className="status-pill">{payment.status.replaceAll("_", " ")}</span></div>
                  <div className="status-row"><strong>{formatMinor(payment.amount_minor, payment.currency)}</strong><span>{payment.paid_at ? new Date(payment.paid_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</span><span>{payment.provider}</span></div>
                  {payment.receipt_url ? <a className="text-link" href={payment.receipt_url} target="_blank" rel="noreferrer">Provider receipt ↗</a> : null}
                  {paymentRefunds.map((refund) => <div className="status-row" key={refund.id}><strong>Refund {formatMinor(refund.amount_minor, payment.currency)}</strong><span>{refund.reason || "Refund"}</span><span className="status-pill">{refund.status}</span></div>)}
                  {canRefund && payment.provider === "stripe" && refundableMinor > 0 && ["succeeded", "partially_refunded"].includes(payment.status) ? <StripeRefundForm paymentId={payment.id} currency={payment.currency} refundableMinor={refundableMinor} /> : null}
                </div></article>;
              })}</div>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
