import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

const workflow = [
  ["01", "Clinical assessment", "The implantologist reviews the dental condition, medical history and treatment goals before deciding whether guided implant surgery is appropriate."],
  ["02", "CBCT & digital records", "3D radiographic information and digital records are used to understand available bone, anatomy and restorative requirements."],
  ["03", "Virtual implant planning", "Implant position is planned digitally with the final restorative objective in mind rather than treating placement as an isolated surgical step."],
  ["04", "DIOnavi guided planning", "For suitable cases, the DIOnavi workflow supports the transition from virtual planning to a patient-specific guided surgical approach."],
  ["05", "Guided implant placement", "The surgical guide helps transfer the approved digital plan into the clinical procedure. The exact surgical protocol remains case-specific."],
  ["06", "Restoration & follow-up", "Temporary and final prosthetic stages, healing and review are planned according to the individual case."],
];

export default async function GuidedImplantsPage() {
  const supabase = await createClient();
  const { data: technology } = await supabase
    .from("clinic_technologies")
    .select("name,brand,summary,description")
    .eq("slug", "dionavi-guided-implant-surgery")
    .eq("is_active", true)
    .maybeSingle();

  const { data: cases } = await supabase
    .from("signature_cases")
    .select("id,title,slug,short_summary")
    .eq("publication_status", "published")
    .eq("consent_for_website", true)
    .eq("dionavi_used", true)
    .order("featured", { ascending: false })
    .limit(3);

  return (
    <main className="treatment-page guided-implants-page">
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Digital guided implant surgery · DIOnavi</p>
            <h1 className="display-title">Plan digitally.<br /><em>Place precisely.</em></h1>
            <p className="hero__description">JV Dental uses DIOnavi guided implant technology for suitable implant cases as part of a diagnosis-led digital workflow. Technology supports the plan; clinical judgement determines the treatment.</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Request guided implant assessment</Link>
              <Link className="button button--ghost" href="/cases">See clinical cases</Link>
            </div>
          </div>
          <p className="hero__note">Guided surgery is not automatically suitable for every patient. Final treatment decisions require appropriate clinical and radiographic assessment by the treating implantologist.</p>
        </div>
        <div className="hero__visual guided-implants-visual">
          <span className="hero__visual-label">Real JV Dental DIOnavi planning and surgical-guide imagery will appear here</span>
          <div className="hero__visual-copy"><p>Technology</p><strong>{technology?.name ?? "DIOnavi guided implant surgery"}</strong></div>
        </div>
      </section>

      <section className="section guided-workflow-section">
        <p className="section-kicker">The workflow</p>
        <h2 className="section-title">Digital planning that continues into surgery.</h2>
        <p className="section-intro">The value of guided implantology is not the software alone. The records, restorative objective, surgical plan and execution need to remain connected.</p>
        <div className="principle-list guided-workflow">
          {workflow.map(([number, title, body]) => <div className="principle" key={number}><span className="principle__number">{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}
        </div>
      </section>

      <section className="dark-band guided-case-band">
        <div className="section">
          <p className="section-kicker">Why JV Dental documents cases</p>
          <h2 className="section-title">See the planning, not only the smile.</h2>
          <p className="section-intro">Approved Signature Cases can show the diagnostic and planning stages behind the final restoration, including DIOnavi planning and surgical-guide stages where used.</p>
          <div className="treatments">
            {(cases ?? []).map((item, index) => <Link className="treatment-row" href={`/cases/${item.slug}`} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><b>→</b></Link>)}
            {!cases?.length ? <div className="guided-case-empty">Selected DIOnavi cases are being prepared for publication.</div> : null}
          </div>
        </div>
      </section>

      <section className="section section--tight guided-international-cta">
        <p className="section-kicker">International patients</p>
        <h2 className="section-title">Begin with records before planning travel.</h2>
        <p className="section-intro">International patients can create a secure account, complete their dental and medical intake, and provide available records for the clinic to review before an online consultation.</p>
        <div className="guided-international-cta__action"><Link className="button" href="/book">Start implant assessment</Link></div>
      </section>

      <SiteFooter />
    </main>
  );
}
