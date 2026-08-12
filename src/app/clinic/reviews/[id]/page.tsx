import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClinicalPublisher } from "@/lib/content/permissions";
import { addInternalClinicalNote, updateClinicalCaseStatus } from "./actions";

const statuses = [
  ["records_received", "Records received"],
  ["doctor_review", "Doctor review"],
  ["more_information_required", "More information required"],
  ["consultation_scheduled", "Consultation scheduled"],
  ["preliminary_plan_ready", "Preliminary plan ready"],
  ["estimate_sent", "Estimate sent"],
  ["patient_considering", "Patient considering"],
  ["travel_confirmed", "Travel confirmed"],
  ["in_treatment", "In treatment"],
  ["follow_up", "Follow-up"],
  ["completed", "Completed"],
  ["closed", "Closed"],
] as const;

function yesNo(value: boolean | null) {
  if (value === null) return "Not answered";
  return value ? "Yes" : "No";
}

export default async function DoctorCaseReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireClinicalPublisher();

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,patient_id,case_number,status,treatment_interest,country_snapshot,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!caseRecord) notFound();

  const [profileResult, medicalResult, dentalResult, documentsResult, notesResult, historyResult, conversationResult] = await Promise.all([
    supabase.from("patient_profiles").select("full_name,date_of_birth,gender,country,city,phone,whatsapp,preferred_language,preferred_contact_method").eq("user_id", caseRecord.patient_id).maybeSingle(),
    supabase.from("medical_histories").select("diabetes,hypertension,heart_condition,blood_thinners,allergies,current_medications,smoking_status,previous_surgeries,other_conditions").eq("patient_id", caseRecord.patient_id).maybeSingle(),
    supabase.from("dental_intakes").select("primary_concern,missing_teeth,loose_teeth,existing_dentures,previous_implants,pain_or_infection,treatment_interest,preferred_treatment_month,notes").eq("patient_id", caseRecord.patient_id).maybeSingle(),
    supabase.from("patient_documents").select("id,category,storage_path,file_name,content_type,file_size_bytes,created_at").eq("case_id", id).order("created_at", { ascending: false }),
    supabase.from("case_notes").select("id,author_user_id,note,created_at").eq("case_id", id).order("created_at", { ascending: false }),
    supabase.from("case_status_history").select("id,previous_status,new_status,changed_by,note,created_at").eq("case_id", id).order("created_at", { ascending: false }),
    supabase.from("conversations").select("id").eq("case_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const profile = profileResult.data;
  const medical = medicalResult.data;
  const dental = dentalResult.data;
  const notes = notesResult.data ?? [];
  const history = historyResult.data ?? [];
  const conversation = conversationResult.data;

  const staffIds = [...new Set([
    ...notes.map((note) => note.author_user_id),
    ...history.map((entry) => entry.changed_by).filter((userId): userId is string => Boolean(userId)),
  ])];
  const { data: staffRows } = staffIds.length
    ? await supabase.from("staff_profiles").select("user_id,full_name,role").in("user_id", staffIds)
    : { data: [] };
  const staffMap = new Map((staffRows ?? []).map((row) => [row.user_id, row]));

  const documents = await Promise.all((documentsResult.data ?? []).map(async (document) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(document.storage_path, 300);
    return { ...document, signedUrl: data?.signedUrl ?? null };
  }));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href={`/clinic/commercial/${caseRecord.id}`}>Consultation & estimate</Link>
          {conversation ? <Link className="text-link" href={`/clinic/inbox/${conversation.id}`}>Open patient conversation</Link> : null}
          <Link className="text-link" href="/clinic/reviews">Back to queue</Link>
        </div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Case review navigation">
            <Link href="/clinic/reviews">Review queue</Link>
            <Link href={`/clinic/commercial/${caseRecord.id}`}>Consultation & estimate</Link>
            {conversation ? <Link href={`/clinic/inbox/${conversation.id}`}>Patient conversation</Link> : null}
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic">Overview</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Clinical review · JV-{caseRecord.case_number}</p>
          <h1 className="portal-title">{profile?.full_name ?? "Patient case"}</h1>
          <p className="portal-subtitle">
            {profile?.country ?? caseRecord.country_snapshot ?? "Country not recorded"} · {caseRecord.treatment_interest ?? "Implant assessment"}
          </p>

          {query.error ? <p style={{ color: "var(--danger)" }}>The requested update could not be saved.</p> : null}

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Patient & case</h2><span className="status-pill">{caseRecord.status.replaceAll("_", " ")}</span></div>
              <div className="portal-card__body">
                <p><strong>Country:</strong> {profile?.country ?? "—"}<br />
                  <strong>City:</strong> {profile?.city ?? "—"}<br />
                  <strong>Date of birth:</strong> {profile?.date_of_birth ?? "—"}<br />
                  <strong>Preferred language:</strong> {profile?.preferred_language ?? "—"}<br />
                  <strong>Preferred contact:</strong> {profile?.preferred_contact_method ?? "—"}</p>
                <form action={updateClinicalCaseStatus} style={{ display: "grid", gap: 12 }}>
                  <input type="hidden" name="case_id" value={caseRecord.id} />
                  <label>Clinical workflow status
                    <select name="status" defaultValue={caseRecord.status}>
                      {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <button className="button button--ghost" type="submit">Update status</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Dental concern</h2></div>
              <div className="portal-card__body">
                <p><strong>Primary concern:</strong> {dental?.primary_concern ?? "—"}<br />
                  <strong>Missing teeth:</strong> {dental?.missing_teeth ?? "—"}<br />
                  <strong>Loose teeth:</strong> {yesNo(dental?.loose_teeth ?? null)}<br />
                  <strong>Existing dentures:</strong> {yesNo(dental?.existing_dentures ?? null)}<br />
                  <strong>Previous implants:</strong> {dental?.previous_implants ?? "—"}<br />
                  <strong>Pain / infection:</strong> {dental?.pain_or_infection ?? "—"}</p>
                {dental?.treatment_interest?.length ? <p><strong>Treatment interests:</strong><br />{dental.treatment_interest.join(", ")}</p> : null}
                {dental?.preferred_treatment_month ? <p><strong>Preferred treatment month:</strong> {dental.preferred_treatment_month}</p> : null}
                {dental?.notes ? <p><strong>Patient notes:</strong><br />{dental.notes}</p> : null}
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Medical considerations</h2><span className="status-pill">Clinical</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                <div className="status-row"><strong>Diabetes</strong><span>{yesNo(medical?.diabetes ?? null)}</span><span /></div>
                <div className="status-row"><strong>Hypertension</strong><span>{yesNo(medical?.hypertension ?? null)}</span><span /></div>
                <div className="status-row"><strong>Heart condition</strong><span>{yesNo(medical?.heart_condition ?? null)}</span><span /></div>
                <div className="status-row"><strong>Blood thinners</strong><span>{yesNo(medical?.blood_thinners ?? null)}</span><span /></div>
                <div className="status-row"><strong>Smoking</strong><span>{medical?.smoking_status ?? "—"}</span><span /></div>
              </div>
              {medical?.allergies ? <p><strong>Allergies:</strong> {medical.allergies}</p> : null}
              {medical?.current_medications ? <p><strong>Current medications:</strong> {medical.current_medications}</p> : null}
              {medical?.previous_surgeries ? <p><strong>Previous surgeries:</strong> {medical.previous_surgeries}</p> : null}
              {medical?.other_conditions ? <p><strong>Other conditions:</strong> {medical.other_conditions}</p> : null}
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Private records</h2><span className="status-pill">{documents.length}</span></div>
            <div className="portal-card__body">
              {!documents.length ? <p>No records uploaded for this case.</p> : (
                <div className="status-list">
                  {documents.map((document) => (
                    <div className="status-row" key={document.id}>
                      <strong>{document.file_name}</strong>
                      <span>{document.category.replaceAll("_", " ")}</span>
                      {document.signedUrl ? <a className="text-link" href={document.signedUrl} target="_blank" rel="noreferrer">Open 5-min link</a> : <span>Unavailable</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <div className="portal-grid" style={{ marginTop: 24 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Internal clinical notes</h2><span className="status-pill">Not patient-visible</span></div>
              <div className="portal-card__body">
                <form action={addInternalClinicalNote} style={{ display: "grid", gap: 12 }}>
                  <input type="hidden" name="case_id" value={caseRecord.id} />
                  <label>New internal note<textarea name="note" rows={5} required placeholder="Clinical observations, records still required, planning considerations..." /></label>
                  <button className="button button--ghost" type="submit">Add internal note</button>
                </form>
                <div className="status-list" style={{ marginTop: 22 }}>
                  {notes.map((note) => {
                    const author = staffMap.get(note.author_user_id);
                    return <div className="status-row" key={note.id}><strong>{author?.full_name ?? author?.role ?? "Staff"}</strong><span>{note.note}</span><span>{new Date(note.created_at).toLocaleDateString("en-IN")}</span></div>;
                  })}
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Case history</h2><span className="status-pill">Audit</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {history.map((entry) => {
                    const actor = entry.changed_by ? staffMap.get(entry.changed_by) : null;
                    return <div className="status-row" key={entry.id}><strong>{entry.new_status.replaceAll("_", " ")}</strong><span>{actor?.full_name ?? actor?.role ?? "System"}</span><span>{new Date(entry.created_at).toLocaleString("en-IN")}</span></div>;
                  })}
                  {!history.length ? <p>No status transitions recorded yet.</p> : null}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
