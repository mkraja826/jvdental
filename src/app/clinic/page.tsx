import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicDashboard() {
  const { staff, supabase } = await requireStaff();
  const canManageAssistant = staff.role === "owner" || staff.role === "admin";

  const [enquiriesResult, reviewResult, consultationResult, inventoryResult, changesResult, travelResult] = await Promise.all([
    supabase.from("patient_cases").select("id", { count: "exact", head: true }),
    supabase.from("patient_cases").select("id", { count: "exact", head: true }).in("status", ["records_received", "doctor_review", "more_information_required"]),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("inventory_items").select("id,min_stock,inventory_batches(quantity_on_hand)").eq("is_active", true),
    supabase.from("treatment_plans").select("id", { count: "exact", head: true }).eq("status", "requested_changes"),
    supabase.from("travel_plans").select("id", { count: "exact", head: true }).eq("status", "details_submitted"),
  ]);

  const lowStock = (inventoryResult.data ?? []).filter((item) => {
    const total = (item.inventory_batches ?? []).reduce((sum, batch) => sum + (batch.quantity_on_hand ?? 0), 0);
    return total <= item.min_stock;
  }).length;

  const metrics = [
    { label: "International enquiries", value: String(enquiriesResult.count ?? 0) },
    { label: "Awaiting doctor review", value: String(reviewResult.count ?? 0) },
    { label: "Scheduled consultations", value: String(consultationResult.count ?? 0) },
    { label: "Low-stock items", value: String(lowStock) },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
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
            <Link href="/clinic/reviews">Doctor review</Link>
            <Link href="/clinic/commercial">Consultations & estimates</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/travel">International travel</Link>
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic/publishing">Publishing</Link>
            {canManageAssistant ? <Link href="/clinic/assistant">Public AI assistant</Link> : null}
            <Link href="/clinic/inventory">Inventory</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinic operations</p>
          <h1 className="portal-title">A precise view of today.</h1>
          <p className="portal-subtitle">Clinical, international-patient, publishing and inventory workflows meet here without exposing private patient data to the public website.</p>

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
                  <Link className="button button--ghost" href="/clinic/inbox">Patient inbox →</Link>
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Decisions needing attention</h2><span className="status-pill">Action</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row"><strong>Estimate changes requested</strong><span>{changesResult.count ?? 0}</span><span className="status-pill">Clinical</span></div>
                  <div className="status-row"><strong>Travel details awaiting confirmation</strong><span>{travelResult.count ?? 0}</span><span className="status-pill">Coordinator</span></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                  <Link className="button button--ghost" href="/clinic/commercial">Open estimates →</Link>
                  <Link className="button button--ghost" href="/clinic/travel">Open travel →</Link>
                </div>
              </div>
            </article>

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
