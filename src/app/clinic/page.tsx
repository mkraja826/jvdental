import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicDashboard() {
  const { staff, supabase } = await requireStaff();
  const canManageAssistant = staff.role === "owner" || staff.role === "admin";
  const canManageDoctors = staff.role === "owner" || staff.role === "admin";
  const canManageStaff = staff.role === "owner" || staff.role === "admin";
  const canManageIntegrations = staff.role === "owner" || staff.role === "admin";

  const { data: summaryData } = await supabase.rpc("clinic_dashboard_summary");
  const summary = (summaryData ?? {}) as Record<string, number | string | null>;
  const enquiries = Number(summary.international_enquiries ?? 0);
  const awaitingReview = Number(summary.awaiting_doctor_review ?? 0);
  const scheduledConsultations = Number(summary.scheduled_consultations ?? 0);
  const requestedChanges = Number(summary.requested_changes ?? 0);
  const travelAwaitingConfirmation = Number(summary.travel_awaiting_confirmation ?? 0);
  const unreadNotifications = Number(summary.unread_notifications ?? 0);
  const lowStock = Number(summary.low_stock_items ?? 0);

  const metrics = [
    { label: "International enquiries", value: String(enquiries) },
    { label: "Awaiting doctor review", value: String(awaitingReview) },
    { label: "Scheduled consultations", value: String(scheduledConsultations) },
    { label: "Unread notifications", value: String(unreadNotifications) },
    { label: "Low-stock items", value: String(lowStock) },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href="/clinic/notifications">Notifications{unreadNotifications ? ` · ${unreadNotifications}` : ""}</Link>
          <span>{staff.full_name ?? "JV Dental staff"}</span>
          <span className="status-pill">{staff.role}</span>
          <form action={signOut}>
            <button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Sign out</button>
          </form>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic portal navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/notifications">Notifications{unreadNotifications ? ` (${unreadNotifications})` : ""}</Link>
            <Link href="/clinic/reviews">Doctor review</Link>
            <Link href="/clinic/commercial">Consultations & estimates</Link>
            <Link href="/clinic/finance">Payments & finance</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/travel">International travel</Link>
            {canManageStaff ? <Link href="/clinic/staff">Staff access</Link> : null}
            {canManageIntegrations ? <Link href="/clinic/integrations">Integrations</Link> : null}
            {canManageDoctors ? <Link href="/clinic/doctors">Doctor portfolios</Link> : null}
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic/publishing">Publishing</Link>
            {canManageAssistant ? <Link href="/clinic/assistant">Public AI assistant</Link> : null}
            <Link href="/clinic/inventory">Inventory</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinic operations</p>
          <h1 className="portal-title">A precise view of today.</h1>
          <p className="portal-subtitle">Clinical, international-patient, publishing, calendar, finance and inventory workflows meet here without exposing private patient data to the public website.</p>

          <div className="metric-grid">
            {metrics.map((metric) => <article className="metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}
          </div>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>International patient workflow</h2><span className="status-pill">Live</span></div>
              <div className="portal-card__body">
                <p>Uploaded records enter the protected review queue, then move through consultation, preliminary plan, patient response and travel confirmation.</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link className="button" href="/clinic/reviews">Doctor review →</Link>
                  <Link className="button button--ghost" href="/clinic/commercial">Consultations & estimates →</Link>
                  <Link className="button button--ghost" href="/clinic/finance">Payments & finance →</Link>
                  <Link className="button button--ghost" href="/clinic/inbox">Patient inbox →</Link>
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Decisions needing attention</h2><span className="status-pill">Action</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row"><strong>Unread operational notifications</strong><span>{unreadNotifications}</span><span className="status-pill">Inbox</span></div>
                  <div className="status-row"><strong>Estimate changes requested</strong><span>{requestedChanges}</span><span className="status-pill">Clinical</span></div>
                  <div className="status-row"><strong>Travel details awaiting confirmation</strong><span>{travelAwaitingConfirmation}</span><span className="status-pill">Coordinator</span></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                  <Link className="button button--ghost" href="/clinic/notifications">Open notifications →</Link>
                  <Link className="button button--ghost" href="/clinic/commercial">Open estimates →</Link>
                  <Link className="button button--ghost" href="/clinic/travel">Open travel →</Link>
                </div>
              </div>
            </article>

            {canManageIntegrations ? (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Calendar & Meet</h2><span className="status-pill">Integration</span></div>
                <div className="portal-card__body">
                  <p>Connect one clinic Google Calendar so video consultations can create a unique Meet link, attendee invitations and synchronized reschedule/cancellation updates.</p>
                  <Link className="button button--ghost" href="/clinic/integrations">Manage integrations →</Link>
                </div>
              </article>
            ) : null}

            {canManageStaff ? (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Staff access</h2><span className="status-pill">Governed</span></div>
                <div className="portal-card__body">
                  <p>Provision staff by email, assign the minimum required role, deactivate access without deleting clinical history, and keep every access change auditable.</p>
                  <Link className="button button--ghost" href="/clinic/staff">Manage staff access →</Link>
                </div>
              </article>
            ) : null}

            {canManageAssistant ? (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Public AI assistant</h2><span className="status-pill">Controlled</span></div>
                <div className="portal-card__body">
                  <p>Review approved clinic knowledge, implant-lead handoffs and chatbot safety signals without mixing public conversations with secure patient-doctor messages.</p>
                  <Link className="button button--ghost" href="/clinic/assistant">Open assistant control room →</Link>
                </div>
              </article>
            ) : null}

            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinical publishing</h2><span className="status-pill">CMS</span></div>
              <div className="portal-card__body">
                <p>Curate DIOnavi-guided implant cases and publish doctor-authored clinical articles from the same portal.</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link className="button button--ghost" href="/clinic/cases">Signature cases →</Link>
                  <Link className="button button--ghost" href="/clinic/publishing">Publishing →</Link>
                </div>
              </div>
            </article>

            {canManageDoctors ? (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Doctor portfolios</h2><span className="status-pill">Reusable CMS</span></div>
                <div className="portal-card__body">
                  <p>Manage each clinician&apos;s public professional profile, verified experience, qualifications, technologies, authored articles and selected cases.</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link className="button button--ghost" href="/clinic/doctors">Manage doctors →</Link>
                    <Link className="button button--ghost" href="/clinic/doctors/content">Content attribution →</Link>
                  </div>
                </div>
              </article>
            ) : null}

            <article className="portal-card">
              <div className="portal-card__header"><h2>Inventory attention</h2><span className="status-pill">{lowStock} low stock</span></div>
              <div className="portal-card__body">
                <p>Implant systems, components, batches and expiry dates remain connected to the operational portal.</p>
                <Link className="button button--ghost" href="/clinic/inventory">Open inventory →</Link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
