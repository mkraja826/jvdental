import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DIOnavi Guided Dental Implants in Hyderabad",
  description: "Learn how JV Dental uses DIO DIOnavi digital implant planning and guided surgery for selected implant and full-arch cases in Hyderabad.",
  alternates: { canonical: "/guided-implants" },
};

const workflow = [
  ["01", "Clinical assessment & 3D records", "The implantologist first evaluates the dental condition, medical history, bone, gums, bite and restorative goals. Digital records may include CBCT and intra-oral scan information."],
  ["02", "Restoration-led digital planning", "The intended tooth or full-arch restoration is considered alongside the 3D anatomy so implant position can be planned around prosthetic space, occlusion and available bone."],
  ["03", "Patient-specific surgical guide", "A surgical guide is designed from the approved plan to help transfer the intended implant position and direction to the clinical procedure."],
  ["04", "Guided drilling protocol", "DIO describes DIOnavi as using a guided drilling sequence with a long drill tube and double-contact drilling to reduce tolerance-related positional error during the osteotomy."],
  ["05", "Cooling during guided preparation", "The DIO India catalogue describes metal-sleeve guidance and a cooling approach intended to deliver irrigation into deeper bone areas while guided drilling is performed."],
  ["06", "Guided placement & restoration", "The guide supports execution of the approved plan in suitable cases. The provisional and final restorative sequence is then selected according to the individual clinical situation."],
] as const;

const dionaviDesign = [
  ["Accurate guidance", "DIO describes a long drill-tube design and double-contact drilling intended to reduce tolerance-related error during guided preparation."],
  ["Metal-sleeve guidance", "The catalogue describes a metal sleeve incorporated into the guide to help maintain the planned drilling path."],
  ["Cooling access", "A dedicated metal-needle cooling approach is described for irrigation into deeper bone areas during guided drilling."],
  ["Multiple clinical categories", "DIO lists DIOnavi kit options for regular, wide, narrow, sinus and edentulous cases; the final protocol depends on individual diagnosis."],
] as const;

const fullArch = [
  ["3D pre-planning", "DIO describes full-arch planning with 3D simulation before placement and a minimum of 4–6 implants in the planned arch, depending on the case."],
  ["Immediate provisional workflow", "In suitable cases, DIO’s Full Arch protocol describes placing implants with the surgical guide and delivering a fixed first provisional bridge on the same day."],
  ["Provisional-to-final digital sequence", "The workflow scans the first provisional bridge to support fabrication of the next provisional stage and applies the same digital approach when progressing toward the final restoration."],
  ["Final screw-retained zirconia", "DIO describes a final screw-retained full-arch restoration made from zirconia within its Full Arch workflow."],
] as const;

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
            <p className="eyebrow">DIO DIOnavi · digital guided implant surgery</p>
            <h1 className="display-title">Plan in 3D.<br /><em>Guide the clinical pathway.</em></h1>
            <p className="hero__description">JV Dental uses DIO DIOnavi for selected implant cases. The system links digital diagnosis and restorative planning with a patient-specific surgical guide and a guided drilling protocol designed to transfer the approved plan into surgery.</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Request guided implant assessment</Link>
              <Link className="button button--ghost" href="/cases">See clinical cases</Link>
            </div>
          </div>
          <p className="hero__note">DIOnavi is a planning and guided-surgery technology. It does not replace clinical judgement, and guided surgery is not automatically suitable for every patient.</p>
        </div>
        <div className="hero__visual guided-implants-visual">
          <span className="hero__visual-label">DIOnavi · 3D records · digital planning · surgical guide · guided drilling</span>
          <div className="hero__visual-copy"><p>Technology</p><strong>{technology?.name ?? "DIOnavi guided implant surgery"}</strong></div>
        </div>
      </section>

      <section className="section guided-workflow-section">
        <p className="section-kicker">The DIOnavi workflow</p>
        <h2 className="section-title">Digital planning that continues into surgery.</h2>
        <p className="section-intro">This patient-friendly summary is based on DIO’s DIOnavi materials supplied to JV Dental. The actual sequence, drill protocol, implant system and restorative timing are decided by the treating implantologist for each patient.</p>
        <div className="principle-list guided-workflow">
          {workflow.map(([number, title, body]) => <div className="principle" key={number}><span className="principle__number">{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">How DIO describes the guided system</p>
          <h2 className="section-title">Accuracy, guidance and cooling built into the DIOnavi protocol.</h2>
          <p className="section-intro">DIO’s India product catalogue presents DIOnavi as an accurate and safe digital implant system and details design features intended to support guided drilling. These are system characteristics, not a guarantee of an individual treatment result.</p>
          <div className="principle-list">
            {dionaviDesign.map(([title, body], index) => <article className="principle" key={title}><span className="principle__number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
          </div>
          <div className="hero__actions">
            <a className="button button--light" href="https://hq.dionavi.com/" target="_blank" rel="noreferrer">Official DIOnavi website <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section className="section" id="dionavi-full-arch">
        <p className="section-kicker">DIOnavi Full Arch</p>
        <h2 className="section-title">A guided digital workflow for selected full-arch implant cases.</h2>
        <p className="section-intro">For suitable edentulous or full-arch cases, DIO describes a dedicated DIOnavi Full Arch workflow that combines pre-planning, guided placement, provisional restoration and a digital path toward the final screw-retained prosthesis.</p>
        <div className="principle-list">
          {fullArch.map(([title, body], index) => <article className="principle" key={title}><span className="principle__number">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
        </div>
        <p className="hero__note">DIO’s catalogue illustrates a Full Arch pathway that may be completed in six visits after consultation and describes a treatment duration as short as 2–4 months. These timings are manufacturer workflow examples only; actual treatment time, healing and visit count vary by patient.</p>
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
