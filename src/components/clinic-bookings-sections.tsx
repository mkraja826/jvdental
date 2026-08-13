import { requireStaff } from "@/lib/auth/guards";
import {
  cancelBookingRequest,
  completeBookingRequest,
  confirmBookingRequest,
  updateBookingRequest,
} from "@/app/clinic/bookings/actions";

function localDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function displayDate(value: string | null) {
  if (!value) return "Not confirmed";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ClinicBookingsSections() {
  const { supabase } = await requireStaff();
  const [{ data: requests }, { data: clinicians }] = await Promise.all([
    supabase
      .from("appointment_requests")
      .select("id,booking_kind,full_name,phone,email,city,preferred_date,preferred_time_window,dental_concern,status,assigned_clinician,confirmed_starts_at,confirmed_ends_at,staff_notes,created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("staff_profiles")
      .select("user_id,full_name,role")
      .eq("is_active", true)
      .in("role", ["owner", "admin", "implantologist", "doctor"])
      .order("full_name"),
  ]);

  const requestIds = (requests ?? []).map((request) => request.id);
  const paymentsResult = requestIds.length
    ? await supabase
        .from("booking_payments")
        .select("appointment_request_id,provider,amount_subunits,currency,status,provider_payment_id,created_at")
        .in("appointment_request_id", requestIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const payments = paymentsResult.data ?? [];

  type BookingPayment = NonNullable<typeof payments>[number];
  const paymentByRequest = new Map<string, BookingPayment>();
  for (const payment of payments) {
    if (!paymentByRequest.has(payment.appointment_request_id)) paymentByRequest.set(payment.appointment_request_id, payment);
  }

  const clinicianById = new Map((clinicians ?? []).map((item) => [item.user_id, item.full_name ?? item.role]));
  const pending = (requests ?? []).filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  const confirmed = (requests ?? []).filter((item) => item.status === "confirmed").length;
  const paid = (requests ?? []).filter((item) => paymentByRequest.get(item.id)?.status === "paid").length;

  return (
    <>
      <div className="metric-grid">
        <article className="metric"><span>Open requests</span><strong>{pending}</strong></article>
        <article className="metric"><span>Confirmed</span><strong>{confirmed}</strong></article>
        <article className="metric"><span>Paid online</span><strong>{paid}</strong></article>
        <article className="metric"><span>Recent requests</span><strong>{requests?.length ?? 0}</strong></article>
      </div>

      <div className="portal-grid" style={{ gridTemplateColumns: "1fr" }}>
        {(requests ?? []).map((request) => {
          const payment = paymentByRequest.get(request.id);
          const isClosed = ["completed", "cancelled"].includes(request.status);
          return (
            <article className="portal-card" key={request.id}>
              <div className="portal-card__header">
                <div>
                  <p className="portal-overline">{request.booking_kind === "video_consultation" ? "Video consultation" : "Clinic consultation"}</p>
                  <h2>{request.full_name}</h2>
                </div>
                <span className="status-pill">{request.status.replaceAll("_", " ")}</span>
              </div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row"><strong>Contact</strong><span>{request.phone}</span><span>{request.email ?? "No email"}</span></div>
                  <div className="status-row"><strong>Requested</strong><span>{request.preferred_date} · {request.preferred_time_window}</span><span>{request.city ?? "City not provided"}</span></div>
                  <div className="status-row"><strong>Confirmed time</strong><span>{displayDate(request.confirmed_starts_at)}</span><span>{request.assigned_clinician ? clinicianById.get(request.assigned_clinician) ?? "Assigned dentist" : "Unassigned"}</span></div>
                  <div className="status-row"><strong>Payment</strong><span>{payment ? `${payment.currency} ${(payment.amount_subunits / 100).toFixed(2)}` : "No online payment"}</span><span className="status-pill">{payment?.status ?? "not started"}</span></div>
                </div>

                {request.dental_concern ? <p style={{ marginTop: 18 }}><strong>Dental concern:</strong> {request.dental_concern}</p> : null}

                {!isClosed ? (
                  <form action={request.status === "confirmed" ? updateBookingRequest : confirmBookingRequest} className="form-grid" style={{ marginTop: 22 }}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <label className="field">
                      <span>Confirmed appointment time</span>
                      <input name="starts_at" type="datetime-local" defaultValue={localDateTimeInput(request.confirmed_starts_at)} required={request.status !== "confirmed"} />
                    </label>
                    <label className="field">
                      <span>Assign dentist</span>
                      <select name="clinician_user_id" defaultValue={request.assigned_clinician ?? ""}>
                        <option value="">Unassigned</option>
                        {(clinicians ?? []).map((clinician) => <option value={clinician.user_id} key={clinician.user_id}>{clinician.full_name ?? clinician.role}</option>)}
                      </select>
                    </label>
                    <label className="field" style={{ gridColumn: "1 / -1" }}>
                      <span>Staff notes</span>
                      <textarea name="staff_notes" rows={3} defaultValue={request.staff_notes ?? ""} />
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", gridColumn: "1 / -1" }}>
                      <button className="button" type="submit">{request.status === "confirmed" ? "Save changes" : "Confirm appointment"}</button>
                    </div>
                  </form>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  {request.status === "confirmed" ? (
                    <form action={completeBookingRequest}><input type="hidden" name="request_id" value={request.id} /><button className="button button--ghost" type="submit">Mark completed</button></form>
                  ) : null}
                  {!isClosed ? (
                    <form action={cancelBookingRequest}><input type="hidden" name="request_id" value={request.id} /><button className="button button--ghost" type="submit">Cancel booking</button></form>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        {!requests?.length ? <article className="portal-card"><div className="portal-card__body"><p>No appointment requests have been received yet.</p></div></article> : null}
      </div>
    </>
  );
}
