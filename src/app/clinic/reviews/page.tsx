import Link from "next/link";
import { requireClinicalPublisher } from "@/lib/content/permissions";

const reviewStatuses = ["records_received", "doctor_review", "more_information_required"];

export default async function DoctorReviewQueue() {
  const { supabase } = await requireClinicalPublisher();
  const { data: cases } = await supabase
    .from("patient_cases")
    .select("id,patient_id,case_number,status,treatment_interest,country_snapshot,updated_at")
    .in("status", reviewStatuses)
    .order("updated_at", { ascending: false })
    .limit(100);

  const patientIds = [...new Set((cases ?? []).map((item) => item.patient_id))];
  const { data: profiles } = patientIds.length
    ? await supabase.from("patient_profiles").select("user_id,full_name,country").in("user_id", patientIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic">Back to overview</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Doctor review navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/reviews">Doctor review</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/cases">Signature cases</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Clinical review queue</p>
          <h1 className="portal-title">Cases waiting for clinical judgement.</h1>
          <p className="portal-subtitle">
            Review structured medical/dental intake, private records and prior communication before deciding what the patient needs next.
          </p>

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Review queue</h2><span className="status-pill">{cases?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {(cases ?? []).length ? (
                <div className="status-list">
                  {(cases ?? []).map((caseRecord) => {
                    const profile = profileMap.get(caseRecord.patient_id);
                    return (
                      <Link className="status-row" href={`/clinic/reviews/${caseRecord.id}`} key={caseRecord.id}>
                        <strong>{profile?.full_name ?? "Patient"}<br /><small>{profile?.country ?? caseRecord.country_snapshot ?? "Country not recorded"}</small></strong>
                        <span>JV-{caseRecord.case_number}<br /><small>{caseRecord.treatment_interest ?? "Implant assessment"}</small></span>
                        <span className="status-pill">{caseRecord.status.replaceAll("_", " ")}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : <p>No cases are waiting for doctor review.</p>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
