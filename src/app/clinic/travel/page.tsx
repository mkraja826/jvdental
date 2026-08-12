import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicTravelPage() {
  const { supabase } = await requireStaff();

  const { data: plans } = await supabase
    .from("travel_plans")
    .select("id,status,arrival_date,departure_date,airport_pickup_required,updated_at,patient_profiles(full_name,country),patient_cases(case_number,status)")
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic">Back to clinic</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Travel coordination navigation">
            <Link href="/clinic/travel">International travel</Link>
            <Link href="/clinic/commercial">Consultations & estimates</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/reviews">Doctor reviews</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">International patient coordination</p>
          <h1 className="portal-title">Arrivals, stays and clinic confirmation.</h1>
          <p className="portal-subtitle">Patient-submitted travel details stay separate from clinical notes while remaining linked to the same implant case.</p>

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Travel worklist</h2><span className="status-pill">{plans?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {!plans?.length ? <p>No patient travel plans have been submitted yet.</p> : (
                <div className="status-list">
                  {plans.map((travel) => {
                    const patient = Array.isArray(travel.patient_profiles) ? travel.patient_profiles[0] : travel.patient_profiles;
                    const caseRecord = Array.isArray(travel.patient_cases) ? travel.patient_cases[0] : travel.patient_cases;
                    return (
                      <Link className="status-row" href={`/clinic/travel/${travel.id}`} key={travel.id}>
                        <strong>JV-{caseRecord?.case_number ?? "—"} · {patient?.full_name ?? "Patient"}</strong>
                        <span>{travel.arrival_date ? `Arrives ${travel.arrival_date}` : patient?.country ?? "—"}</span>
                        <span className="status-pill">{travel.status.replaceAll("_", " ")}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
