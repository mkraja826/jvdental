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
          <h1 className="portal-title">Patient case journeys.</h1>
          <p className="portal-subtitle">Create the case first, then add and arrange the treatment photos, review the website presentation, and publish when ready.</p>
          {params.error ? <p style={{ color: "var(--danger)" }}>The case could not be created. Check the case title and treatment type.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Step 1 · Create a case</h2><span className="status-pill">Draft first</span></div>
              <div className="portal-card__body">
                <form action={createSignatureCase} style={{ display: "grid", gap: 18 }}>
                  <label>Case title<input name="title" required minLength={5} placeholder="Guided implant placement" /></label>
                  <label>Treatment type<input name="treatment_type" required placeholder="Implant rehabilitation" /></label>

                  <details style={{ borderTop: "1px solid var(--clinic-border)", paddingTop: 16 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 650 }}>Additional clinical details (optional)</summary>
                    <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
                      <label>Patient age band<input name="patient_age_band" placeholder="For example: 50–59" /></label>
                      <label>Patient country<input name="patient_country" placeholder="Add only when confirmed" /></label>
                      <label>Short summary<textarea name="short_summary" rows={3} placeholder="A short patient-friendly overview of this treatment journey." /></label>
                      <label>Diagnosis<textarea name="diagnosis_summary" rows={4} /></label>
                      <label>Clinical challenge<textarea name="challenge_summary" rows={4} /></label>
                      <label>Treatment plan<textarea name="treatment_plan_summary" rows={4} /></label>
                      <label>Final outcome<textarea name="final_outcome_summary" rows={4} /></label>
                      <label><input type="checkbox" name="guided_implant" /> Guided implant workflow</label>
                      <label><input type="checkbox" name="dionavi_used" /> DIOnavi used</label>
                      <label><input type="checkbox" name="full_arch" /> Full-arch case</label>
                    </div>
                  </details>

                  <input type="hidden" name="publication_status" value="draft" />
                  <p style={{ color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.6, margin: 0 }}>The case starts privately as a draft. The website address and internal case reference are created automatically. Photos, consent, review and publishing are handled on the next screen.</p>
                  <PendingSubmit label="Create case & add photos →" pendingLabel="Creating case…" />
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
                      <span>{item.dionavi_used ? "DIOnavi" : item.guided_implant ? "Guided" : "Case"}</span>
                      <span className="status-pill">{item.consent_for_website ? item.publication_status : item.publication_status === "draft" ? "Draft" : "Consent pending"}</span>
                    </Link>
                  ))}
                  {!cases?.length ? <p>No cases yet. Create the first case above.</p> : null}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
