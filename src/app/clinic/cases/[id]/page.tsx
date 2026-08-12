import Link from "next/link";
import { notFound } from "next/navigation";
import { addCaseStage, setCasePublication } from "@/app/clinic/cases/actions";
import CaseMediaUploader from "@/app/clinic/cases/[id]/CaseMediaUploader";
import { requireClinicalPublisher } from "@/lib/content/permissions";

const stages = [
  ["presentation", "Presentation"],
  ["diagnosis", "Diagnosis"],
  ["cbct", "CBCT"],
  ["intraoral_scan", "Intraoral scan"],
  ["digital_planning", "Digital planning"],
  ["dionavi_planning", "DIOnavi planning"],
  ["surgical_guide", "Surgical guide"],
  ["implant_placement", "Implant placement"],
  ["temporary_prosthesis", "Temporary prosthesis"],
  ["prosthetic_phase", "Prosthetic phase"],
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
            <Link href={`/cases/${item.slug}`}>Public preview</Link>
            <Link href="/guided-implants">DIOnavi page</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Signature case editor</p>
          <h1 className="portal-title">{item.title}</h1>
          <p className="portal-subtitle">{item.treatment_type} {item.dionavi_used ? "· DIOnavi guided" : item.guided_implant ? "· Guided implant workflow" : ""}</p>
          {query.error === "consent_required" ? <p style={{ color: "var(--danger)" }}>Website publication is blocked until patient website consent is recorded.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Publication</h2><span className="status-pill">{item.publication_status}</span></div>
              <div className="portal-card__body">
                <p>Website consent: <strong>{item.consent_for_website ? "Recorded" : "Not recorded"}</strong></p>
                <form action={setCasePublication} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="hidden" name="case_id" value={item.id} />
                  <select name="publication_status" defaultValue={item.publication_status}>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button className="button button--ghost" type="submit">Update publication</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Add clinical stage</h2><span className="status-pill">{caseStages?.length ?? 0} stages</span></div>
              <div className="portal-card__body">
                <form action={addCaseStage} style={{ display: "grid", gap: 16 }}>
                  <input type="hidden" name="case_id" value={item.id} />
                  <label>Stage
                    <select name="stage_type" defaultValue={item.dionavi_used ? "dionavi_planning" : "diagnosis"}>
                      {stages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>Stage title<input name="title" required placeholder="Virtual implant planning" /></label>
                  <label>Clinical explanation<textarea name="body" rows={6} placeholder="Explain what was assessed, planned or performed at this stage." /></label>
                  <button className="button" type="submit">Add stage</button>
                </form>
              </div>
            </article>
          </div>

          <div className="portal-grid" style={{ marginTop: 24 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Upload public case media</h2><span className="status-pill">{caseMedia?.length ?? 0} files</span></div>
              <div className="portal-card__body">
                <CaseMediaUploader caseId={item.id} stages={(caseStages ?? []).map((stage) => ({ id: stage.id, title: stage.title, stage_type: stage.stage_type }))} />
              </div>
            </article>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Media register</h2><span className="status-pill">De-identified</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(caseMedia ?? []).map((asset) => (
                    <div className="status-row" key={asset.id}>
                      <strong>{asset.media_type.replaceAll("_", " ")}</strong>
                      <span>{asset.caption ?? asset.alt_text ?? "No caption"}</span>
                      <span className="status-pill">{asset.stage_id ? "Stage linked" : "General"}</span>
                    </div>
                  ))}
                  {!caseMedia?.length ? <p>No public media uploaded yet.</p> : null}
                </div>
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Clinical story</h2><span className="status-pill">Ordered</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(caseStages ?? []).map((stage, index) => (
                  <div className="status-row" key={stage.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{stage.title}</strong><br /><small>{stage.stage_type.replaceAll("_", " ")}</small>{stage.body ? <p>{stage.body}</p> : null}</div>
                    <span className="status-pill">{stage.stage_type === "dionavi_planning" ? "DIOnavi" : "Clinical"}</span>
                  </div>
                ))}
                {!caseStages?.length ? <p>Add the stages in the order the treatment occurred.</p> : null}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
