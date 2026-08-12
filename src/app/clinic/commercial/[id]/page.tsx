import Link from "next/link";
import { notFound } from "next/navigation";
import { createTreatmentPlan, scheduleVideoConsultation } from "@/app/clinic/commercial/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function CommercialCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireClinicalPublisher();

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,case_number,status,treatment_interest,country_snapshot,patient_id,patient_profiles(full_name,country)")
    .eq("id", id)
    .maybeSingle();
  if (!caseRecord) notFound();

  const [{ data: appointments }, { data: plans }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id,appointment_type,starts_at,ends_at,meeting_url,status,timezone")
      .eq("case_id", id)
      .order("starts_at", { ascending: false })
      .limit(10),
    supabase
      .from("treatment_plans")
      .select("id,version,title,status,created_at,sent_at,accepted_at")
      .eq("case_id", id)
      .order("version", { ascending: false }),
  ]);

  const patient = Array.isArray(caseRecord.patient_profiles) ? caseRecord.patient_profiles[0] : caseRecord.patient_profiles;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href={`/clinic/reviews/${id}`}>Clinical review</Link>
          <Link className="text-link" href="/clinic/commercial">Worklist</Link>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Case commercial navigation">
            <Link href={`/clinic/commercial/${id}`}>Consultation & estimate</Link>
            <Link href={`/clinic/reviews/${id}`}>Clinical review</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/travel">Travel</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">JV-{caseRecord.case_number} · {patient?.country ?? caseRecord.country_snapshot ?? "International patient"}</p>
          <h1 className="portal-title">{patient?.full_name ?? "Patient"}</h1>
          <p className="portal-subtitle">{caseRecord.treatment_interest || "Implant assessment"} · {caseRecord.status.replaceAll("_", " ")}</p>

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Schedule video consultation</h2><span className="status-pill">30 min</span></div>
              <div className="portal-card__body">
                <form action={scheduleVideoConsultation} style={{ display: "grid", gap: 16 }}>
                  <input type="hidden" name="case_id" value={caseRecord.id} />
                  <label>Clinic date & time (India)<input name="starts_at" type="datetime-local" min={`${tomorrow}T08:00`} required /></label>
                  <label>Meeting link<input name="meeting_url" type="url" placeholder="https://meet.google.com/..." /></label>
                  <label>Internal appointment note<textarea name="notes" rows={3} placeholder="Records to review before consultation" /></label>
                  <button className="button" type="submit">Schedule consultation</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Create preliminary plan</h2><span className="status-pill">Versioned</span></div>
              <div className="portal-card__body">
                <form action={createTreatmentPlan} style={{ display: "grid", gap: 16 }}>
                  <input type="hidden" name="case_id" value={caseRecord.id} />
                  <label>Plan title<input name="title" defaultValue="Preliminary implant treatment plan" required /></label>
                  <label>Clinical summary<textarea name="summary" rows={4} placeholder="Provisional plan based on records and consultation." /></label>
                  <label>Message to patient<textarea name="doctor_message" rows={3} placeholder="Explain the proposed approach in patient-friendly language." /></label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>Minimum stay (days)<input name="stay_min" type="number" min="0" /></label>
                    <label>Maximum stay (days)<input name="stay_max" type="number" min="0" /></label>
                  </div>
                  <label>Estimate valid until<input name="valid_until" type="date" /></label>
                  <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input name="second_visit_required" type="checkbox" /> Second visit expected</label>
                  <button className="button" type="submit">Create treatment plan</button>
                </form>
              </div>
            </article>
          </div>

          <div className="portal-grid" style={{ marginTop: 24 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Consultations</h2><span className="status-pill">{appointments?.length ?? 0}</span></div>
              <div className="portal-card__body">
                {!appointments?.length ? <p>No consultation scheduled yet.</p> : (
                  <div className="status-list">
                    {appointments.map((appointment) => (
                      <div className="status-row" key={appointment.id}>
                        <strong>{new Date(appointment.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</strong>
                        <span>{appointment.appointment_type.replaceAll("_", " ")}</span>
                        <span className="status-pill">{appointment.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Treatment-plan history</h2><span className="status-pill">{plans?.length ?? 0}</span></div>
              <div className="portal-card__body">
                {!plans?.length ? <p>No preliminary plan created yet.</p> : (
                  <div className="status-list">
                    {plans.map((plan) => (
                      <Link className="status-row" href={`/clinic/plans/${plan.id}`} key={plan.id}>
                        <strong>v{plan.version} · {plan.title || "Treatment plan"}</strong>
                        <span>{new Date(plan.created_at).toLocaleDateString("en-IN")}</span>
                        <span className="status-pill">{plan.status.replaceAll("_", " ")}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
