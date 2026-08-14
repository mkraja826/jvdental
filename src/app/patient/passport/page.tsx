import Link from "next/link";
import { redirect } from "next/navigation";
import PatientNavigation from "@/components/patient-navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ImplantPassportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: records } = await supabase
    .from("implant_records")
    .select("id,tooth_site,placement_date,lot_number_snapshot,implant_name_snapshot,brand_snapshot,system_snapshot,diameter_mm_snapshot,length_mm_snapshot,connection_snapshot,created_at")
    .eq("patient_id", user.id)
    .order("placement_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/patient"><span>JV</span><span>Dental</span></Link>
        <div className="portal-header__right"><span className="status-pill">Implant passport</span></div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation />
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Permanent implant traceability</p>
          <h1 className="portal-title">Your implant passport.</h1>
          <p className="portal-subtitle">A secure record of implants placed at JV Dental. Product details are captured at the time of placement so later catalogue changes do not alter your historical record.</p>

          {records?.length ? (
            <div className="portal-grid" style={{ marginTop: 28 }}>
              {records.map((record) => {
                const dimensions = [record.diameter_mm_snapshot, record.length_mm_snapshot].filter((value) => value != null).join(" × ");
                return (
                  <article className="portal-card" key={record.id}>
                    <div className="portal-card__header"><h2>Site {record.tooth_site}</h2><span className="status-pill">Placed {record.placement_date}</span></div>
                    <div className="portal-card__body">
                      <dl className="passport-list">
                        <div><dt>Implant</dt><dd>{record.implant_name_snapshot ?? "Implant"}</dd></div>
                        <div><dt>Brand</dt><dd>{record.brand_snapshot ?? "—"}</dd></div>
                        <div><dt>System</dt><dd>{record.system_snapshot ?? "—"}</dd></div>
                        <div><dt>Dimensions</dt><dd>{dimensions ? `${dimensions} mm` : "—"}</dd></div>
                        <div><dt>Connection</dt><dd>{record.connection_snapshot ?? "—"}</dd></div>
                        <div><dt>Lot / batch</dt><dd>{record.lot_number_snapshot ?? "—"}</dd></div>
                      </dl>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__body"><strong>No implant placements are recorded yet.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>Your implant passport will populate automatically when the clinical team records an implant from a traced inventory batch.</p></div>
            </article>
          )}

          <p className="form-note" style={{ marginTop: 24 }}>This passport is a traceability record, not a substitute for operative notes, radiographs, prescriptions or clinical follow-up documentation.</p>
        </section>
      </div>
    </main>
  );
}
