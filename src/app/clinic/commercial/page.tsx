import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const COMMERCIAL_ROLES = new Set(["owner", "admin", "implantologist", "doctor", "coordinator"]);
const CLINICAL_PLAN_ROLES = new Set(["owner", "admin", "implantologist", "doctor"]);

const relevantStatuses = [
  "doctor_review",
  "more_information_required",
  "consultation_scheduled",
  "preliminary_plan_ready",
  "estimate_sent",
  "patient_considering",
  "travel_confirmed",
];

export default async function CommercialWorklist() {
  const { supabase, staff } = await requireStaff();
  if (!COMMERCIAL_ROLES.has(staff.role)) redirect("/clinic");
  const canAuthorPlan = CLINICAL_PLAN_ROLES.has(staff.role);

  const { data: cases } = await supabase
    .from("patient_cases")
    .select("id,case_number,status,treatment_interest,country_snapshot,created_at,patient_profiles(full_name,country)")
    .in("status", relevantStatuses)
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
          <nav aria-label="Consultation and estimates navigation">
            <Link href="/clinic/commercial">Consultations & estimates</Link>
            {canAuthorPlan ? <Link href="/clinic/reviews">Doctor reviews</Link> : null}
            <Link href="/clinic/travel">International travel</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/notifications">Notifications</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Clinical-commercial handoff</p>
          <h1 className="portal-title">Consultation to confirmed treatment.</h1>
          <p className="portal-subtitle">
            {canAuthorPlan
              ? "Schedule the implant consultation, prepare a versioned preliminary plan and send an itemised estimate without losing earlier revisions."
              : "Coordinate video consultation timing and international-patient logistics while treatment planning remains controlled by the clinical team."}
          </p>

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header">
              <h2>Active cases</h2>
              <span className="status-pill">{cases?.length ?? 0}</span>
            </div>
            <div className="portal-card__body">
              {!cases?.length ? <p>No cases currently require consultation or estimate work.</p> : (
                <div className="status-list">
                  {cases.map((item) => {
                    const patient = Array.isArray(item.patient_profiles) ? item.patient_profiles[0] : item.patient_profiles;
                    return (
                      <Link className="status-row" href={`/clinic/commercial/${item.id}`} key={item.id}>
                        <strong>JV-{item.case_number} · {patient?.full_name ?? "Patient"}</strong>
                        <span>{patient?.country ?? item.country_snapshot ?? "—"}</span>
                        <span className="status-pill">{item.status.replaceAll("_", " ")}</span>
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
