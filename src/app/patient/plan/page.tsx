import Link from "next/link";
import { redirect } from "next/navigation";
import { respondToTreatmentPlan } from "@/app/patient/plan/actions";
import PatientNavigation from "@/components/patient-navigation";
import { createClient } from "@/lib/supabase/server";
import TreatmentPlanResponseActions from "./treatment-plan-response-actions";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default async function PatientPlanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: plan } = await supabase
    .from("treatment_plans")
    .select("id,case_id,version,title,status,summary,doctor_message,estimated_stay_days_min,estimated_stay_days_max,second_visit_required,valid_until,sent_at,accepted_at,created_at")
    .eq("patient_id", user.id)
    .in("status", ["sent", "requested_changes", "accepted"])
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: appointments }, { data: feedback }] = plan ? await Promise.all([
    supabase
      .from("patient_upcoming_appointments")
      .select("id,starts_at,ends_at,meeting_url,status,appointment_type,timezone")
      .eq("case_id", plan.case_id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("treatment_plan_feedback")
      .select("response,message,created_at")
      .eq("treatment_plan_id", plan.id)
      .maybeSingle(),
  ]) : [{ data: [] }, { data: null }];

  const { data: items } = plan ? await supabase
    .from("treatment_plan_items")
    .select("id,description,quantity,unit_price,currency,sort_order")
    .eq("treatment_plan_id", plan.id)
    .order("sort_order") : { data: [] };

  const currency = items?.[0]?.currency || "INR";
  const total = (items ?? []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price ?? 0), 0);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/"><span>JV</span><span>Dental</span></Link>
        <Link className="text-link" href="/patient">Back to portal</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation />
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Preliminary treatment planning</p>
          <h1 className="portal-title">Your treatment plan & estimate</h1>
          <p className="portal-subtitle">This preliminary plan is based on the records and consultation available to the JV Dental clinical team. Final treatment can change after appropriate in-person clinical and radiographic assessment.</p>

          {params.response === "accepted" ? <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__body"><strong>Your acceptance has been recorded.</strong><p>Next, add or confirm your travel details when you are ready.</p></div></article> : null}
          {params.response === "request_changes" ? <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__body"><strong>Your request has been sent to the clinic.</strong><p>The clinical team can prepare a revised version without replacing this one.</p></div></article> : null}

          {!plan ? (
            <article className="portal-card" style={{ marginTop: 28 }}><div className="portal-card__body"><p>No treatment plan has been sent to you yet. Your clinic team will publish it here after review and consultation.</p></div></article>
          ) : <>
            <div className="portal-grid" style={{ marginTop: 28 }}>
              <article className="portal-card">
                <div className="portal-card__header"><h2>{plan.title || "Preliminary treatment plan"}</h2><span className="status-pill">v{plan.version} · {plan.status.replaceAll("_", " ")}</span></div>
                <div className="portal-card__body">
                  <p>{plan.summary || "Your clinician has prepared an itemised preliminary plan."}</p>
                  {plan.doctor_message ? <p><strong>From your clinician</strong><br />{plan.doctor_message}</p> : null}
                  <div className="status-list">
                    <div className="status-row"><strong>Estimated stay</strong><span>{plan.estimated_stay_days_min ?? "—"}–{plan.estimated_stay_days_max ?? "—"} days</span><span /></div>
                    <div className="status-row"><strong>Second visit</strong><span>{plan.second_visit_required ? "Expected" : "Not currently expected"}</span><span /></div>
                    <div className="status-row"><strong>Estimate valid until</strong><span>{plan.valid_until ? new Date(`${plan.valid_until}T00:00:00`).toLocaleDateString("en-IN") : "Not specified"}</span><span /></div>
                  </div>
                </div>
              </article>

              <article className="portal-card">
                <div className="portal-card__header"><h2>Consultation</h2><span className="status-pill">{appointments?.length ?? 0}</span></div>
                <div className="portal-card__body">
                  {!appointments?.length ? <p>No upcoming consultation is currently scheduled.</p> : appointments.map((appointment) => {
                    const isVideo = appointment.appointment_type === "video_consultation";
                    return (
                      <div key={appointment.id}>
                        <p><strong>{new Date(appointment.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</strong></p>
                        {isVideo ? (
                          appointment.meeting_url ? <a className="button button--ghost" href={appointment.meeting_url} target="_blank" rel="noreferrer">Join video consultation →</a> : <p>Your video consultation is scheduled. The joining link will appear here when it is ready.</p>
                        ) : <p>Your in-clinic consultation is scheduled. Please arrive a little early for reception check-in.</p>}
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>

            <article className="portal-card" style={{ marginTop: 24 }}>
              <div className="portal-card__header"><h2>Itemised estimate</h2><strong>{money(total, currency)}</strong></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(items ?? []).map((item) => (
                    <div className="status-row" key={item.id}>
                      <strong>{item.description}</strong>
                      <span>{Number(item.quantity)} × {money(Number(item.unit_price ?? 0), item.currency)}</span>
                      <strong>{money(Number(item.quantity) * Number(item.unit_price ?? 0), item.currency)}</strong>
                    </div>
                  ))}
                </div>
                <p style={{ color: "var(--muted)", marginTop: 24 }}>This is a preliminary estimate, not a guarantee of final treatment requirements or final cost. Additional clinical findings may require changes.</p>
              </div>
            </article>

            <article className="portal-card" style={{ marginTop: 24 }}>
              <div className="portal-card__header"><h2>Your response</h2><span className="status-pill">{feedback?.response?.replaceAll("_", " ") ?? "Action available"}</span></div>
              <div className="portal-card__body">
                {feedback ? <><p><strong>{feedback.response === "accepted" ? "Plan accepted" : "Changes requested"}</strong></p>{feedback.message ? <p>{feedback.message}</p> : null}</> : (
                  <form action={respondToTreatmentPlan} style={{ display: "grid", gap: 16 }}>
                    <input type="hidden" name="plan_id" value={plan.id} />
                    <label>Optional note to the clinic<textarea name="message" rows={4} placeholder="Ask for clarification or describe what you would like reviewed." /></label>
                    <TreatmentPlanResponseActions />
                  </form>
                )}
              </div>
            </article>
          </>}
        </section>
      </div>
    </main>
  );
}
