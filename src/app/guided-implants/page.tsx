import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Guided Dental Implants in Hyderabad",
  description: "Learn how JV Dental uses digital implant planning and guided surgery for selected implant and full-arch cases in Hyderabad.",
  alternates: { canonical: "/guided-implants" },
  openGraph: { title: "Guided Dental Implants in Hyderabad | JV Dental", description: "Understand 3D digital planning and guided dental implant surgery for suitable patients at JV Dental.", url: "/guided-implants", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "JV Dental & Implant Centre" }] },
};

const workflow = [
  ["01", "Clinical consultation", "We review your dental concerns, medical history, gum health, bite and restorative goals before recommending treatment."],
  ["02", "3D diagnosis and planning", "Where indicated, digital scans and imaging help the dental team assess bone anatomy and plan implant positioning."],
  ["03", "Individual treatment plan", "Your clinician explains suitable implant options, treatment stages, potential risks and expected follow-up."],
  ["04", "Guided placement when suitable", "For selected cases, a patient-specific surgical guide can help transfer the planned implant position to surgery."],
  ["05", "Restoration and bite", "Implant-supported crowns or bridges are designed around function, comfort, cleaning access and appearance."],
  ["06", "Maintenance and reviews", "Regular clinical reviews and daily hygiene support the long-term care of implant restorations."],
] as const;

export default async function GuidedImplantsPage() {
  const supabase = await createClient();
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

      <section className="hero"><div className="hero__copy"><div><p className="eyebrow">JV Dental · Guided implant care</p><h1 className="display-title">Digital planning.<br /><em>Personalised implant care.</em></h1><p className="hero__description">At JV Dental, implant treatment begins with clinical assessment and restorative planning. For suitable cases, digital planning and a surgical guide can support implant placement tailored to individual anatomy and treatment goals.</p><div className="hero__actions"><Link className="button" href="/book">Request implant assessment</Link><Link className="button button--ghost" href="/cases">Explore clinical cases</Link></div></div><p className="hero__note">Guided surgery is not suitable for every patient. Your dentist will discuss available options after assessment.</p></div><div className="hero__visual guided-implants-visual"><div className="hero-visual-fallback"><span className="hero-visual-fallback__mark">JV</span><strong>Implant care<br />planned around you.</strong></div><span className="hero__visual-label">JV Dental &amp; Implant Centre</span></div></section><section className="section guided-workflow-section"><p className="section-kicker">Our clinical approach</p><h2 className="section-title">From assessment to long-term implant care.</h2><p className="section-intro">Your dental team will recommend treatment based on clinical findings, individual needs and available options.</p><div className="principle-list guided-workflow">{workflow.map(([number,title,body]) => <div className="principle" key={number}><span className="principle__number">{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div></section>

<section className="dark-band guided-case-band">
        <div className="section">
          <p className="section-kicker">Why JV Dental documents cases</p>
          <h2 className="section-title">See the planning, not only the smile.</h2>
          <p className="section-intro">Approved Signature Cases can show the diagnostic and planning stages behind the final restoration, including digital planning and surgical-guide stages where used.</p>
          <div className="treatments">
            {(cases ?? []).map((item, index) => <Link className="treatment-row" href={`/cases/${item.slug}`} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><b>→</b></Link>)}
            {!cases?.length ? <div className="guided-case-empty">Selected guided implant cases are being prepared for publication.</div> : null}
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
