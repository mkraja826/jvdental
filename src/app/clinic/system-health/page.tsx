import { redirect } from "next/navigation";
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

  const [errorsResult, registrationsResult, intakesResult, bookingsResult, acceptedPlansResult, paymentsResult] = await Promise.all([
    supabase
      .from("portal_error_events")
      .select("id,surface,route,error_name,error_digest,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_registered"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "patient_intake_completed"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "booking_requested"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "treatment_plan_accepted"),
    supabase.from("product_events").select("id", { count: "exact", head: true }).eq("event_name", "payment_confirmed"),
  ]);

  const recent = (errorsResult.data ?? []) as ErrorEvent[];
  const patientErrors = recent.filter((event) => event.surface === "patient").length;
  const clinicErrors = recent.filter((event) => event.surface === "clinic").length;
  const uniqueFingerprints = new Set(recent.map((event) => event.error_digest)).size;

  const registrations = registrationsResult.count ?? 0;
  const intakes = intakesResult.count ?? 0;
  const bookings = bookingsResult.count ?? 0;
  const acceptedPlans = acceptedPlansResult.count ?? 0;
  const confirmedPayments = paymentsResult.count ?? 0;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="portal-overline">Administration</p>
          <h1 className="portal-title">System health</h1>
          <p className="portal-subtitle">Privacy-safe product funnel and operational error monitoring for JV Dental.</p>
        </div>
      </header>

      <section className="portal-main">
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
            <div className="portal-card__header"><h2>Accepted plans</h2><span className="status-pill">{acceptedPlans}</span></div>
            <div className="portal-card__body"><p>Preliminary treatment plans explicitly accepted through the patient portal.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Confirmed payments</h2><span className="status-pill">{confirmedPayments}</span></div>
            <div className="portal-card__body"><p>Successful booking payments confirmed by the server reconciliation layer.</p></div>
          </article>
        </div>

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
