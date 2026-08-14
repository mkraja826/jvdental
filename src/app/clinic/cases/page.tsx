import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { createSignatureCase } from "@/app/clinic/cases/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function SignatureCasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireClinicalPublisher();
  const params = await searchParams;
  const { data: cases } = await supabase
    .from("signature_cases")
    .select("id,title,slug,treatment_type,publication_status,featured,guided_implant,dionavi_used,consent_for_website,updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic">Back to clinic</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Case publishing navigation">
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/cases">Public cases</Link>
            <Link href="/clinic/publishing">Articles</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Clinical portfolio</p>
          <h1 className="portal-title">Signature implant cases.</h1>
          <p className="portal-subtitle">Curate the doctor&apos;s strongest cases as structured clinical stories: diagnosis, CBCT, DIOnavi planning, surgical guide, placement, prosthetics and final outcome.</p>
          {params.error ? <p style={{ color: "var(--danger)" }}>The case could not be saved. Check the required fields and slug.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Create signature case</h2><span className="status-pill">Consent gated</span></div>
              <div className="portal-card__body">
                <form action={createSignatureCase} style={{ display: "grid", gap: 18 }}>
                  <label>Case title<input name="title" required minLength={5} placeholder="DIOnavi-guided full-arch rehabilitation" /></label>
                  <label>URL slug<input name="slug" placeholder="dionavi-guided-full-arch-rehabilitation" /></label>
                  <label>Internal case code<input name="case_code" placeholder="JV-CASE-001" /></label>
                  <label>Treatment type<input name="treatment_type" required placeholder="Full-arch implant rehabilitation" /></label>
                  <label>Patient age band<input name="patient_age_band" placeholder="50–59" /></label>
                  <label>Patient country<input name="patient_country" placeholder="United Kingdom" /></label>
                  <label>Short summary<textarea name="short_summary" rows={3} /></label>
                  <label>Diagnosis<textarea name="diagnosis_summary" rows={4} /></label>
                  <label>Clinical challenge<textarea name="challenge_summary" rows={4} /></label>
                  <label>Treatment plan<textarea name="treatment_plan_summary" rows={4} /></label>
                  <label>Final outcome<textarea name="final_outcome_summary" rows={4} /></label>
                  <label><input type="checkbox" name="guided_implant" /> Guided implant workflow</label>
                  <label><input type="checkbox" name="dionavi_used" /> DIOnavi used</label>
                  <label><input type="checkbox" name="full_arch" /> Full-arch case</label>
                  <label><input type="checkbox" name="featured" /> Feature on website</label>
                  <label><input type="checkbox" name="consent_for_website" /> Patient consent recorded for website publication</label>
                  <label><input type="checkbox" name="consent_for_social" /> Patient consent recorded for social publishing</label>
                  <label>Publication state
                    <select name="publication_status" defaultValue="draft">
                      <option value="draft">Draft</option>
                      <option value="review">Ready for review</option>
                      <option value="published">Publish now</option>
                    </select>
                  </label>
                  <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>Cases are anonymised by default. A case requested as published will remain in review if website consent has not been recorded.</p>
                  <PendingSubmit label="Create case" pendingLabel="Creating case…" />
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Case library</h2><span className="status-pill">{cases?.length ?? 0}</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(cases ?? []).map((item) => (
                    <Link className="status-row" href={`/clinic/cases/${item.id}`} key={item.id} prefetch>
                      <div><strong>{item.title}</strong><br /><small>{item.treatment_type}</small></div>
                      <span>{item.dionavi_used ? "DIOnavi" : item.guided_implant ? "Guided" : "Conventional"}</span>
                      <span className="status-pill">{item.consent_for_website ? item.publication_status : "Consent pending"}</span>
                    </Link>
                  ))}
                  {!cases?.length ? <p>No signature cases yet.</p> : null}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
