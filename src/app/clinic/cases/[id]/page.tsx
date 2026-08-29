import Link from "next/link";
import { notFound } from "next/navigation";
import { addCaseStage, setCasePublication } from "@/app/clinic/cases/actions";
import CaseMediaUploader from "@/app/clinic/cases/[id]/CaseMediaUploader";
import { requireClinicalPublisher } from "@/lib/content/permissions";

const stages = [
  ["presentation", "Before treatment"],
  ["diagnosis", "Examination / diagnosis"],
  ["cbct", "X-ray / CBCT"],
  ["intraoral_scan", "Scan"],
  ["digital_planning", "Treatment planning"],
  ["dionavi_planning", "DIOnavi planning"],
  ["surgical_guide", "Surgical guide"],
  ["implant_placement", "Implant placement"],
  ["temporary_prosthesis", "Temporary teeth"],
  ["prosthetic_phase", "Final teeth preparation"],
  ["final_result", "Final result"],
  ["follow_up", "Follow-up"],
];

export default async function SignatureCaseEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireClinicalPublisher();
  const { data: item } = await supabase
    .from("signature_cases")
    .select("id,title,slug,treatment_type,publication_status,consent_for_website,dionavi_used,guided_implant,short_summary")
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const [{ data: caseStages }, { data: caseMedia }] = await Promise.all([
    supabase.from("signature_case_stages").select("id,stage_type,title,body,sort_order").eq("signature_case_id", id).order("sort_order", { ascending: true }),
    supabase.from("signature_case_media").select("id,stage_id,media_type,storage_path,alt_text,caption").eq("signature_case_id", id).order("created_at", { ascending: true }),
  ]);

  const photoCount = caseMedia?.length ?? 0;
  const stageCount = caseStages?.length ?? 0;
  const readyToReview = photoCount > 0;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><Link className="text-link" href="/clinic/cases">Back to cases</Link></div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Case editor navigation">
            <Link href="/clinic/cases">All cases</Link>
            <Link href={`/cases/${item.slug}`}>Preview case</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Case workspace</p>
          <h1 className="portal-title">{item.title}</h1>
          <p className="portal-subtitle">{item.treatment_type}</p>

          <article className="portal-card" style={{ marginTop: 22 }}>
            <div className="portal-card__header"><h2>What to do</h2><span className="status-pill">{item.publication_status === "published" ? "Published" : "In progress"}</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                <div className="status-row"><strong>1. Add treatment photos</strong><span>{photoCount ? `${photoCount} added` : "Start here"}</span><span className="status-pill">{photoCount ? "Done" : "Next"}</span></div>
                <div className="status-row"><strong>2. Describe important steps</strong><span>{stageCount ? `${stageCount} added` : "Optional"}</span><span className="status-pill">{stageCount ? "Done" : "Later"}</span></div>
                <div className="status-row"><strong>3. Preview and publish</strong><span>{readyToReview ? "Ready to review" : "After photos"}</span><span className="status-pill">{item.publication_status}</span></div>
              </div>
            </div>
          </article>

          {query.error === "consent_required" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>Patient website consent must be recorded before this case can be published.</p> : null}

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>1 · Add treatment photos</h2><span className="status-pill">{photoCount} photos</span></div>
            <div className="portal-card__body">
              <p style={{ color: "var(--muted)", marginTop: 0 }}>Choose the complete case photos together in treatment order. You can organise them into treatment steps afterward.</p>
              <CaseMediaUploader caseId={item.id} stages={(caseStages ?? []).map((stage) => ({ id: stage.id, title: stage.title, stage_type: stage.stage_type }))} />
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>2 · Describe treatment steps</h2><span className="status-pill">{stageCount} steps</span></div>
            <div className="portal-card__body">
              <p style={{ color: "var(--muted)", marginTop: 0 }}>Add only the important steps a patient should understand. You do not need to describe every photo.</p>
              <form action={addCaseStage} style={{ display: "grid", gap: 16 }}>
                <input type="hidden" name="case_id" value={item.id} />
                <label>What happened?
                  <select name="stage_type" defaultValue={item.dionavi_used ? "dionavi_planning" : "presentation"}>
                    {stages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label>Short heading<input name="title" required placeholder="Implant placement" /></label>
                <label>Explain this step (optional)<textarea name="body" rows={4} placeholder="A short patient-friendly explanation." /></label>
                <button className="button" type="submit">Add treatment step</button>
              </form>

              {stageCount ? <div className="status-list" style={{ marginTop: 20 }}>
                {(caseStages ?? []).map((stage, index) => (
                  <div className="status-row" key={stage.id}>
                    <span>{index + 1}</span>
                    <div><strong>{stage.title}</strong>{stage.body ? <><br /><small>{stage.body}</small></> : null}</div>
                    <span className="status-pill">Step {index + 1}</span>
                  </div>
                ))}
              </div> : null}
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 24, marginBottom: 32 }}>
            <div className="portal-card__header"><h2>3 · Review & publish</h2><span className="status-pill">{item.publication_status}</span></div>
            <div className="portal-card__body">
              <p style={{ color: "var(--muted)", marginTop: 0 }}>Check the case exactly as a website visitor will see it. Publish only after the photos, treatment details and patient consent are confirmed.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                <Link className="button button--ghost" href={`/cases/${item.slug}`}>Preview on website →</Link>
              </div>
              <p>Patient website consent: <strong>{item.consent_for_website ? "Recorded ✓" : "Not recorded"}</strong></p>
              <form action={setCasePublication} style={{ display: "grid", gap: 12 }}>
                <input type="hidden" name="case_id" value={item.id} />
                <label>Case status
                  <select name="publication_status" defaultValue={item.publication_status}>
                    <option value="draft">Keep private</option>
                    <option value="review">Ready for doctor review</option>
                    <option value="published">Publish on website</option>
                    <option value="archived">Remove from website</option>
                  </select>
                </label>
                <button className="button" type="submit">Save case status</button>
              </form>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
