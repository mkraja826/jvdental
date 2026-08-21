import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createTreatmentPlan } from "@/app/clinic/commercial/actions";
import {
  cancelConsultation,
  completeConsultation,
  markConsultationNoShow,
  rescheduleConsultation,
  retryCalendarSync,
  scheduleVideoConsultation,
} from "@/app/clinic/commercial/consultation-actions";
import { requireStaff } from "@/lib/auth/guards";

const COMMERCIAL_ROLES = new Set(["owner", "admin", "implantologist", "doctor", "coordinator"]);
const CLINICAL_PLAN_ROLES = new Set(["owner", "admin", "implantologist", "doctor"]);

export default async function CommercialCasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, staff } = await requireStaff();
  if (!COMMERCIAL_ROLES.has(staff.role)) redirect("/clinic");
  const canAuthorPlan = CLINICAL_PLAN_ROLES.has(staff.role);

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,case_number,status,treatment_interest,country_snapshot,patient_id,assigned_clinician,patient_profiles(full_name,country)")
    .eq("id", id)
    .maybeSingle();
  if (!caseRecord) notFound();

  const [{ data: appointments }, { data: plans }, { data: assignedClinician }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id,appointment_type,starts_at,ends_at,meeting_url,status,timezone,conference_provider,external_sync_status,external_sync_error,external_event_html_url,external_event_id")
      .eq("case_id", id)
      .order("starts_at", { ascending: false })
      .limit(10),
    supabase
      .from("treatment_plans")
      .select("id,version,title,status,created_at,sent_at,accepted_at")
      .eq("case_id", id)
      .order("version", { ascending: false }),
    caseRecord.assigned_clinician
      ? supabase.from("staff_profiles").select("full_name,job_title").eq("user_id", caseRecord.assigned_clinician).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const patient = Array.isArray(caseRecord.patient_profiles) ? caseRecord.patient_profiles[0] : caseRecord.patient_profiles;
  const now = new Date().getTime();

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          {canAuthorPlan ? <Link className="text-link" href={`/clinic/reviews/${id}`}>Clinical review</Link> : null}
          <Link className="text-link" href="/clinic/commercial">Worklist</Link>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Case commercial navigation">
            <Link href={`/clinic/commercial/${id}`}>Consultation & estimate</Link>
            {canAuthorPlan ? <Link href={`/clinic/reviews/${id}`}>Clinical review</Link> : null}
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/travel">Travel</Link>
            <Link href="/clinic/notifications">Notifications</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">JV-{caseRecord.case_number} · {patient?.country ?? caseRecord.country_snapshot ?? "International patient"}</p>
          <h1 className="portal-title">{patient?.full_name ?? "Patient"}</h1>
          <p className="portal-subtitle">{caseRecord.treatment_interest || "Implant assessment"} · {caseRecord.status.replaceAll("_", " ")}</p>

          {query.error === "consultation_time" ? <p style={{ color: "var(--danger)" }}>Choose a future consultation time.</p> : null}
          {query.error === "consultation" ? <p style={{ color: "var(--danger)" }}>The consultation could not be scheduled.</p> : null}
          {query.error === "appointment_disposition" ? <p style={{ color: "var(--danger)" }}>Only a consultation whose scheduled time has passed can be marked completed or no-show.</p> : null}
          {query.scheduled ? <p className="form-note">Consultation scheduled. Google Calendar sync was attempted automatically.</p> : null}
          {query.rescheduled ? <p className="form-note">Consultation rescheduled. The existing Calendar event was updated when available.</p> : null}
          {query.cancelled ? <p className="form-note">Consultation cancelled.</p> : null}
          {query.completed ? <p className="form-note">Consultation marked completed. The clinical workflow can continue from the current case stage.</p> : null}
          {query.no_show ? <p className="form-note">Consultation marked no-show. Schedule a new consultation if the patient needs another time.</p> : null}
          {query.calendar_sync ? <p className="form-note">Calendar sync retried.</p> : null}

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Schedule video consultation</h2><span className="status-pill">30 min</span></div>
              <div className="portal-card__body">
                <p className="form-note">Treating clinician: {assignedClinician?.full_name ?? (caseRecord.assigned_clinician ? "Assigned clinician" : "Not assigned yet")}{assignedClinician?.job_title ? ` · ${assignedClinician.job_title}` : ""}</p>
                <form action={scheduleVideoConsultation} style={{ display: "grid", gap: 16 }}>
                  <input type="hidden" name="case_id" value={caseRecord.id} />
                  <label>Clinic date & time (India)<input name="starts_at" type="datetime-local" required /></label>
                  <label>Manual meeting link · fallback only<input name="meeting_url" type="url" placeholder="https://meet.google.com/..." /></label>
                  <label>Internal appointment note<textarea name="notes" rows={3} placeholder="Records to review before consultation" /></label>
                  <p className="form-note">If Google Calendar is connected, JV Dental requests a unique Google Meet automatically and sends Calendar attendee updates. A coordinator scheduling the appointment does not become the treating clinician.</p>
                  <button className="button" type="submit">Schedule consultation</button>
                </form>
              </div>
            </article>

            {canAuthorPlan ? (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Create preliminary plan</h2><span className="status-pill">Clinical · Versioned</span></div>
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
            ) : (
              <article className="portal-card">
                <div className="portal-card__header"><h2>Clinical plan</h2><span className="status-pill">Doctor controlled</span></div>
                <div className="portal-card__body">
                  <p>Coordinators can manage consultation timing and international logistics, but clinical findings, treatment recommendations and estimates remain under the clinical team.</p>
                  <p className="form-note">Existing plan status can still be followed below for coordination purposes.</p>
                </div>
              </article>
            )}
          </div>

          <div className="portal-grid" style={{ marginTop: 24 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Consultations</h2><span className="status-pill">{appointments?.length ?? 0}</span></div>
              <div className="portal-card__body">
                {!appointments?.length ? <p>No consultation scheduled yet.</p> : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {appointments.map((appointment) => {
                      const isOverdue = appointment.status === "scheduled" && new Date(appointment.starts_at).getTime() <= now;
                      const syncLabel = appointment.external_sync_status === "synced"
                        ? appointment.conference_provider === "google_meet" ? "Google Meet ready" : "Calendar synced"
                        : appointment.external_sync_status === "failed" ? "Calendar sync failed"
                        : appointment.external_sync_status === "cancelled" ? "Calendar cancelled"
                        : appointment.conference_provider === "manual" ? "Manual link" : "Calendar not connected";
                      return (
                        <div className="portal-card" key={appointment.id} style={{ boxShadow: "none" }}>
                          <div className="portal-card__body" style={{ display: "grid", gap: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                              <div>
                                <strong>{new Date(appointment.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</strong>
                                <p className="form-note" style={{ margin: "6px 0 0" }}>{appointment.appointment_type.replaceAll("_", " ")} · {appointment.timezone}</p>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span className="status-pill">{isOverdue ? "needs outcome" : appointment.status}</span>
                                <span className="status-pill">{syncLabel}</span>
                              </div>
                            </div>

                            {isOverdue ? <p className="form-note" style={{ color: "var(--danger)", margin: 0 }}>This consultation time has passed. Record whether it was completed or a no-show, or reschedule it to a new future time.</p> : null}

                            {appointment.meeting_url ? (
                              <div><a className="button button--ghost" href={appointment.meeting_url} target="_blank" rel="noreferrer">Open meeting →</a></div>
                            ) : appointment.status === "scheduled" && !isOverdue ? <p className="form-note">No meeting URL is available yet. Retry Calendar sync after Google Calendar is connected.</p> : null}

                            {appointment.external_event_html_url ? (
                              <a className="text-link" href={appointment.external_event_html_url} target="_blank" rel="noreferrer">Open Google Calendar event ↗</a>
                            ) : null}
                            {appointment.external_sync_error ? <p className="form-note">Sync detail: {appointment.external_sync_error}</p> : null}

                            {appointment.status === "scheduled" ? (
                              <div style={{ display: "grid", gap: 12 }}>
                                <form action={rescheduleConsultation} style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
                                  <input type="hidden" name="appointment_id" value={appointment.id} />
                                  <input type="hidden" name="case_id" value={caseRecord.id} />
                                  <label style={{ flex: "1 1 230px" }}>Reschedule<input name="starts_at" type="datetime-local" required /></label>
                                  <button className="button button--ghost" type="submit">Update time</button>
                                </form>
                                {isOverdue ? (
                                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <form action={completeConsultation}>
                                      <input type="hidden" name="appointment_id" value={appointment.id} />
                                      <input type="hidden" name="case_id" value={caseRecord.id} />
                                      <button className="button" type="submit">Mark completed</button>
                                    </form>
                                    <form action={markConsultationNoShow}>
                                      <input type="hidden" name="appointment_id" value={appointment.id} />
                                      <input type="hidden" name="case_id" value={caseRecord.id} />
                                      <button className="button button--ghost" type="submit">Mark no-show</button>
                                    </form>
                                  </div>
                                ) : null}
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  {!isOverdue ? (
                                    <form action={retryCalendarSync}>
                                      <input type="hidden" name="appointment_id" value={appointment.id} />
                                      <input type="hidden" name="case_id" value={caseRecord.id} />
                                      <button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Retry Calendar / Meet sync</button>
                                    </form>
                                  ) : null}
                                  <form action={cancelConsultation}>
                                    <input type="hidden" name="appointment_id" value={appointment.id} />
                                    <input type="hidden" name="case_id" value={caseRecord.id} />
                                    <button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Cancel consultation</button>
                                  </form>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
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
                      canAuthorPlan ? (
                        <Link className="status-row" href={`/clinic/plans/${plan.id}`} key={plan.id}>
                          <strong>v{plan.version} · {plan.title || "Treatment plan"}</strong>
                          <span>{new Date(plan.created_at).toLocaleDateString("en-IN")}</span>
                          <span className="status-pill">{plan.status.replaceAll("_", " ")}</span>
                        </Link>
                      ) : (
                        <div className="status-row" key={plan.id}>
                          <strong>v{plan.version} · {plan.title || "Treatment plan"}</strong>
                          <span>{new Date(plan.created_at).toLocaleDateString("en-IN")}</span>
                          <span className="status-pill">{plan.status.replaceAll("_", " ")}</span>
                        </div>
                      )
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
