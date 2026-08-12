import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function SignatureCasesPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("signature_cases")
    .select("id,title,treatment_type,publication_status,featured,guided_implant,dionavi_used,consent_for_website,updated_at")
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
            <Link href="/clinic/publishing">Articles</Link>
            <Link href="/clinic">Overview</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Clinical portfolio</p>
          <h1 className="portal-title">Signature implant cases.</h1>
          <p className="portal-subtitle">
            Curate the doctor&apos;s strongest cases as structured clinical stories rather than a simple before-and-after gallery.
          </p>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>DIOnavi guided workflow</h2><span className="status-pill">Technology</span></div>
              <div className="portal-card__body">
                <p>Each suitable case can document CBCT, intraoral scan, virtual planning, DIOnavi planning, surgical guide, implant placement, prosthetic phase and final result.</p>
              </div>
            </article>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Publication safety</h2><span className="status-pill">Consent required</span></div>
              <div className="portal-card__body">
                <p>A case cannot be treated as public portfolio content unless website consent is recorded. Cases default to anonymised.</p>
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Case library</h2><span className="status-pill">{cases?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {!cases?.length ? (
                <p>No signature cases yet. Case creation and media upload are the next clinical-content milestone.</p>
              ) : (
                <div className="status-list">
                  {cases.map((item) => (
                    <div className="status-row" key={item.id}>
                      <strong>{item.title}</strong>
                      <span>{item.dionavi_used ? "DIOnavi" : item.guided_implant ? "Guided" : item.treatment_type}</span>
                      <span className="status-pill">{item.consent_for_website ? item.publication_status : "Consent pending"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
