import Link from "next/link";
import { redirect } from "next/navigation";
import DeploymentReadiness from "@/components/deployment-readiness";
import { requireStaff } from "@/lib/auth/guards";

type ErrorEvent = {
  id: string;
  surface: "patient" | "clinic";
  route: string;
  error_name: string | null;
  error_digest: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function SystemHealthPage() {
  const { supabase, staff } = await requireStaff();
  if (!["owner", "admin"].includes(staff.role)) redirect("/clinic");

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [
    errorsResult,
    registrationsResult,
    intakesResult,
    bookingsResult,
    confirmedBookingsResult,
    completedBookingsResult,
    acceptedPlansResult,
    paymentsResult,
    documentsResult,
    messagesResult,
    calendarResult,
    publishingResult,
    treatmentPaymentRequestsResult,
    treatmentPaymentsResult,
    bookingPaymentsResult,
    failedEmailsResult,
    overdueConsultationsResult,
  ] = await Promise.all([
    supabase
      .from("portal_error_events")
      .select("id,surface,route,error_name,error_digest,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_registered"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_intake_completed"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "booking_requested"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "booking_confirmed"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "booking_completed"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "treatment_plan_accepted"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "payment_confirmed"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_document_uploaded"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_message_sent"),
    supabase.from("calendar_integrations").select("id", { count: "exact", head: true }).eq("status", "connected"),
    supabase.from("publishing_integrations").select("id", { count: "exact", head: true }).eq("status", "connected"),
    supabase.from("payment_requests").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "succeeded"),
    supabase.from("booking_payments").select("id", { count: "exact", head: true }).eq("status", "succeeded"),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", dayAgo),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "scheduled").lte("starts_at", nowIso),
  ]);

  const recent = (errorsResult.data ?? []) as ErrorEvent[];
  const patientErrors = recent.filter((event) => event.surface === "patient").length;
  const clinicErrors = recent.filter((event) => event.surface === "clinic").length;
  const uniqueFingerprints = new Set(recent.map((event) => event.error_digest)).size;

  const registrations = registrationsResult.count ?? 0;
  const intakes = intakesResult.count ?? 0;
  const bookings = bookingsResult.count ?? 0;
  const confirmedBookings = confirmedBookingsResult.count ?? 0;
  const completedBookings = completedBookingsResult.count ?? 0;
  const acceptedPlans = acceptedPlansResult.count ?? 0;
  const confirmedPayments = paymentsResult.count ?? 0;
  const patientDocuments = documentsResult.count ?? 0;
  const patientMessages = messagesResult.count ?? 0;
  const connectedCalendars = calendarResult.count ?? 0;
  const connectedPublishers = publishingResult.count ?? 0;
  const treatmentPaymentRequests = treatmentPaymentRequestsResult.count ?? 0;
  const succeededTreatmentPayments = treatmentPaymentsResult.count ?? 0;
  const succeededBookingPayments = bookingPaymentsResult.count ?? 0;
  const failedEmails24h = failedEmailsResult.count ?? 0;
  const overdueConsultations = overdueConsultationsResult.count ?? 0;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="portal-overline">Administration</p>
          <h1 className="portal-title">System health</h1>
          <p className="portal-subtitle">Privacy-safe product funnel, patient activity, deployment readiness and operational error monitoring for JV Dental.</p>
        </div>
      </header>

      <section className="portal-main">
        <article className="portal-card">
          <div className="portal-card__header"><h2>Launch gates</h2><span className="status-pill">Live checks</span></div>
          <div className="portal-card__body">
            <div className="status-list">
              <div className="status-row"><strong>Google Calendar / Meet</strong><span>{connectedCalendars ? "Connected" : "Not connected"}</span><span>{connectedCalendars ? "Operational account present" : "Connect from Integrations"}</span></div>
              <div className="status-row"><strong>Blogger publishing</strong><span>{connectedPublishers ? "Connected" : "Not connected"}</span><span>{connectedPublishers ? "Publishing account present" : "Connect from Integrations"}</span></div>
              <div className="status-row"><strong>Treatment payment acceptance</strong><span>{succeededTreatmentPayments}</span><span>{treatmentPaymentRequests ? `${treatmentPaymentRequests} request(s) created` : "No real treatment payment request tested yet"}</span></div>
              <div className="status-row"><strong>Booking payment acceptance</strong><span>{succeededBookingPayments}</span><span>{succeededBookingPayments ? "Successful booking payment recorded" : "No successful booking payment recorded yet"}</span></div>
              <div className="status-row"><strong>Email delivery failures · 24h</strong><span>{failedEmails24h}</span><span>{failedEmails24h ? "Review notification delivery" : "No failed deliveries in the last 24 hours"}</span></div>
              <div className="status-row"><strong>Consultations needing outcome</strong><span>{overdueConsultations}</span><span>{overdueConsultations ? "Resolve completed / no-show status" : "No overdue scheduled consultations"}</span></div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <Link className="button button--ghost" href="/clinic/integrations">Open integrations →</Link>
              <Link className="button button--ghost" href="/clinic/commercial">Open consultations →</Link>
              <Link className="button button--ghost" href="/clinic/finance">Open finance →</Link>
            </div>
          </div>
        </article>

        <div className="portal-grid">
          <article className="portal-card">
            <div className="portal-card__header"><h2>Patient registrations</h2><span className="status-pill">{registrations}</span></div>
            <div className="portal-card__body"><p>Successful patient account creation events recorded by the server.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Completed intakes</h2><span className="status-pill">{intakes}</span></div>
            <div className="portal-card__body"><p>Patients who successfully completed the structured medical and dental intake workflow.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Booking requests</h2><span className="status-pill">{bookings}</span></div>
            <div className="portal-card__body"><p>Submitted clinic and video consultation booking requests.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Confirmed bookings</h2><span className="status-pill">{confirmedBookings}</span></div>
            <div className="portal-card__body"><p>Booking requests that successfully transitioned into a clinic-confirmed appointment.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Completed bookings</h2><span className="status-pill">{completedBookings}</span></div>
            <div className="portal-card__body"><p>Confirmed bookings marked complete by the clinic workflow.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Accepted plans</h2><span className="status-pill">{acceptedPlans}</span></div>
            <div className="portal-card__body"><p>Preliminary treatment plans explicitly accepted through the patient portal.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Confirmed payments</h2><span className="status-pill">{confirmedPayments}</span></div>
            <div className="portal-card__body"><p>Successful payment events recorded by the server reconciliation layer.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Patient uploads</h2><span className="status-pill">{patientDocuments}</span></div>
            <div className="portal-card__body"><p>Clinical records successfully attached to patient cases from the secure patient vault.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Patient messages</h2><span className="status-pill">{patientMessages}</span></div>
            <div className="portal-card__body"><p>Secure non-internal messages successfully sent by patients to the clinic.</p></div>
          </article>
        </div>

        <DeploymentReadiness />

        <div className="portal-grid" style={{ marginTop: 24 }}>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Recent errors</h2><span className="status-pill">{recent.length}</span></div>
            <div className="portal-card__body"><p>Up to the latest 50 authenticated portal failures are shown below.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Unique fingerprints</h2><span className="status-pill">{uniqueFingerprints}</span></div>
            <div className="portal-card__body"><p>Repeated fingerprints help identify recurring production regressions without storing raw errors.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Portal surfaces</h2><span className="status-pill">50 max</span></div>
            <div className="portal-card__body"><p>Patient: <strong>{patientErrors}</strong> · Clinic: <strong>{clinicErrors}</strong></p></div>
          </article>
        </div>

        <article className="portal-card" style={{ marginTop: 24 }}>
          <div className="portal-card__header">
            <h2>Recent portal errors</h2>
            <span className="status-pill">Privacy safe</span>
          </div>
          <div className="portal-card__body">
            {!recent.length ? (
              <p>No authenticated portal errors have been recorded yet.</p>
            ) : (
              <div className="status-list">
                {recent.map((event) => (
                  <div className="status-row" key={event.id}>
                    <strong>{event.surface === "patient" ? "Patient portal" : "Clinic portal"}</strong>
                    <span>{event.route}</span>
                    <span>
                      {event.error_name ?? "Error"} · {formatDate(event.created_at)} · {event.error_digest.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="form-note" style={{ marginTop: 20 }}>
              Product analytics and error monitoring intentionally exclude clinical content, form values, raw exception messages, stack traces and payment-card data.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
