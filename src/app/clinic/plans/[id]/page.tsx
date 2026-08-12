import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addTreatmentPlanItem,
  createPlanRevision,
  removeTreatmentPlanItem,
  sendTreatmentPlan,
  updateTreatmentPlanDetails,
} from "@/app/clinic/commercial/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default async function TreatmentPlanEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireClinicalPublisher();

  const { data: plan } = await supabase
    .from("treatment_plans")
    .select("id,patient_id,case_id,version,title,status,summary,doctor_message,estimated_stay_days_min,estimated_stay_days_max,second_visit_required,valid_until,sent_at,accepted_at,patient_profiles(full_name,country),patient_cases(case_number,status)")
    .eq("id", id)
    .maybeSingle();
  if (!plan) notFound();

  const [{ data: items }, { data: feedback }] = await Promise.all([
    supabase
      .from("treatment_plan_items")
      .select("id,description,quantity,unit_price,currency,sort_order")
      .eq("treatment_plan_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("treatment_plan_feedback")
      .select("response,message,created_at")
      .eq("treatment_plan_id", id)
      .maybeSingle(),
  ]);

  const patient = Array.isArray(plan.patient_profiles) ? plan.patient_profiles[0] : plan.patient_profiles;
  const caseRecord = Array.isArray(plan.patient_cases) ? plan.patient_cases[0] : plan.patient_cases;
  const currency = items?.[0]?.currency || "INR";
  const total = (items ?? []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price ?? 0), 0);
  const editable = plan.status === "draft" || plan.status === "preliminary";

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href={`/clinic/commercial/${plan.case_id}`}>Back to case</Link>
          <span className="status-pill">{plan.status.replaceAll("_", " ")}</span>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Treatment plan navigation">
            <Link href={`/clinic/plans/${plan.id}`}>Estimate editor</Link>
            <Link href={`/clinic/reviews/${plan.case_id}`}>Clinical review</Link>
            <Link href={`/clinic/commercial/${plan.case_id}`}>Consultation</Link>
            <Link href="/clinic/inbox">Inbox</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">JV-{caseRecord?.case_number ?? "—"} · Treatment plan v{plan.version}</p>
          <h1 className="portal-title">{plan.title || "Preliminary treatment plan"}</h1>
          <p className="portal-subtitle">{patient?.full_name ?? "Patient"} · {patient?.country ?? "—"}</p>

          {query.error === "empty" ? <p style={{ color: "var(--danger)" }}>Add at least one priced item before sending the estimate.</p> : null}
          {query.error === "locked" ? <p style={{ color: "var(--danger)" }}>This version is locked. Create a revision instead of editing a sent or accepted plan.</p> : null}
          {query.error === "currency" ? <p style={{ color: "var(--danger)" }}>Use one currency per treatment-plan version.</p> : null}

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinical summary</h2><span className="status-pill">v{plan.version}</span></div>
              <div className="portal-card__body">
                {editable ? (
                  <form action={updateTreatmentPlanDetails} style={{ display: "grid", gap: 14 }}>
                    <input type="hidden" name="plan_id" value={plan.id} />
                    <label>Plan title<input name="title" defaultValue={plan.title ?? ""} required /></label>
                    <label>Clinical summary<textarea name="summary" rows={4} defaultValue={plan.summary ?? ""} /></label>
                    <label>Message to patient<textarea name="doctor_message" rows={4} defaultValue={plan.doctor_message ?? ""} /></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label>Minimum stay (days)<input name="stay_min" type="number" min="0" defaultValue={plan.estimated_stay_days_min ?? ""} /></label>
                      <label>Maximum stay (days)<input name="stay_max" type="number" min="0" defaultValue={plan.estimated_stay_days_max ?? ""} /></label>
                    </div>
                    <label>Estimate valid until<input name="valid_until" type="date" defaultValue={plan.valid_until ?? ""} /></label>
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input name="second_visit_required" type="checkbox" defaultChecked={plan.second_visit_required ?? false} /> Second visit expected</label>
                    <button className="button button--ghost" type="submit">Save plan details</button>
                  </form>
                ) : <>
                  <p>{plan.summary || "No summary added."}</p>
                  {plan.doctor_message ? <p><strong>Doctor message</strong><br />{plan.doctor_message}</p> : null}
                  <div className="status-list">
                    <div className="status-row"><strong>Estimated stay</strong><span>{plan.estimated_stay_days_min ?? "—"}–{plan.estimated_stay_days_max ?? "—"} days</span><span /></div>
                    <div className="status-row"><strong>Second visit</strong><span>{plan.second_visit_required ? "Expected" : "Not currently expected"}</span><span /></div>
                    <div className="status-row"><strong>Estimate validity</strong><span>{plan.valid_until ? new Date(`${plan.valid_until}T00:00:00`).toLocaleDateString("en-IN") : "Not specified"}</span><span /></div>
                  </div>
                </>}
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Patient response</h2><span className="status-pill">{feedback?.response?.replaceAll("_", " ") ?? "Waiting"}</span></div>
              <div className="portal-card__body">
                {feedback ? <>
                  <p><strong>{feedback.response === "accepted" ? "Accepted" : "Changes requested"}</strong></p>
                  {feedback.message ? <p>{feedback.message}</p> : null}
                  <p style={{ color: "var(--muted)" }}>{new Date(feedback.created_at).toLocaleString("en-IN")}</p>
                </> : <p>No response has been submitted for this version.</p>}
                {plan.status === "requested_changes" ? (
                  <form action={createPlanRevision}>
                    <input type="hidden" name="plan_id" value={plan.id} />
                    <button className="button button--ghost" type="submit">Create revised version →</button>
                  </form>
                ) : null}
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
                    <span style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
                      <strong>{money(Number(item.quantity) * Number(item.unit_price ?? 0), item.currency)}</strong>
                      {editable ? <form action={removeTreatmentPlanItem}><input type="hidden" name="plan_id" value={plan.id} /><input type="hidden" name="item_id" value={item.id} /><button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Remove</button></form> : null}
                    </span>
                  </div>
                ))}
                {!items?.length ? <p>No priced treatment items yet.</p> : null}
              </div>

              {editable ? (
                <form action={addTreatmentPlanItem} style={{ display: "grid", gridTemplateColumns: "2fr .7fr 1fr .7fr auto", gap: 10, alignItems: "end", marginTop: 24 }}>
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <label>Procedure / component<input name="description" required placeholder="Implant placement" /></label>
                  <label>Qty<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label>
                  <label>Unit price<input name="unit_price" type="number" min="0" step="0.01" required /></label>
                  <label>Currency<select name="currency" defaultValue={currency}><option>INR</option><option>USD</option><option>GBP</option><option>AUD</option><option>AED</option><option>EUR</option></select></label>
                  <button className="button button--ghost" type="submit">Add</button>
                </form>
              ) : null}
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Send to patient</h2><span className="status-pill">Controlled handoff</span></div>
            <div className="portal-card__body">
              <p>This is a preliminary estimate based on available records and consultation. Once sent, this version becomes immutable; further changes require a new version.</p>
              {editable ? (
                <form action={sendTreatmentPlan}>
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <button className="button" type="submit">Send treatment plan & estimate →</button>
                </form>
              ) : <p><strong>Status:</strong> {plan.status.replaceAll("_", " ")}</p>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
