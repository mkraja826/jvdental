import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Oral Surgery in Hyderabad | JV Dental",
  description: "Oral surgery at JV Dental in Hyderabad including extractions, impactions and fracture treatment where clinically indicated, with diagnosis-led planning and aftercare guidance.",
  alternates: { canonical: "/dental-treatments/oral-surgery" },
  openGraph: {
    title: "Oral Surgery in Hyderabad | JV Dental",
    description: "Oral surgery at JV Dental in Hyderabad including extractions, impactions and fracture treatment where clinically indicated.",
    type: "website",
  },
};

const services = [
  ["Extractions", "Dental extractions are planned only after assessment of the tooth, surrounding tissues, medical history and appropriate imaging where required."],
  ["Impactions", "Assessment and surgical management of impacted teeth is planned according to tooth position, surrounding anatomy and individual clinical findings."],
  ["Fracture treatment", "Fracture assessment and treatment planning is based on the site and extent of injury, symptoms, imaging findings and the structures involved."],
] as const;

const assessmentReasons = [
  "A tooth or area has persistent pain, swelling or recurrent infection",
  "Your dentist has advised that a surgical assessment may be required",
  "An impacted tooth or fracture needs clinical and radiographic assessment",
  "You want a clear explanation of surgical and non-surgical options before treatment",
] as const;

const pathway = [
  "Clinical examination and medical history review",
  "Dental imaging when clinically required",
  "Diagnosis and discussion of suitable treatment options",
  "Procedure planning, consent and aftercare instructions",
] as const;

const benefits = [
  "Diagnosis-first treatment planning",
  "Appropriate imaging before treatment where required",
  "Clear explanation of options, risks and aftercare",
  "Care coordinated with restorative, periodontal or implant treatment when needed",
] as const;

export default function OralSurgeryPage() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Complete dental care · JV Dental Hyderabad</p>
            <h1 className="display-title">Oral Surgery</h1>
            <p className="hero__description">
              Oral surgical care including extractions, impactions and fracture treatment, planned after careful diagnosis, appropriate imaging and clinical assessment.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book a consultation <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/dental-treatments">All treatments</Link>
            </div>
          </div>
          <p className="hero__note">
            The exact treatment recommendation is confirmed only after clinical examination and any required diagnostic imaging.
          </p>
        </div>
        <div className="hero__visual" aria-label="Oral surgery at JV Dental">
          <span className="hero__visual-label">Adult dental care · diagnosis-led treatment</span>
          <div className="hero__visual-copy">
            <p>JV Dental &amp; Implant Centre</p>
            <strong>Oral Surgery</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Understanding your treatment</p>
        <h2 className="section-title">What is oral surgery?</h2>
        <p className="section-intro">
          Oral surgery covers dental conditions that may require a surgical approach after careful diagnosis. Treatment planning depends on the condition being treated, surrounding teeth and tissues, medical history, imaging findings and the safest long-term option for the patient.
        </p>
      </section>

      <section className="section">
        <p className="section-kicker">Oral surgery services</p>
        <h2 className="section-title">Treatment options available after assessment.</h2>
        <div className="portal-grid international-grid">
          {services.map(([title, body]) => (
            <article className="portal-card" key={title}>
              <div className="portal-card__header"><h3>{title}</h3></div>
              <div className="portal-card__body"><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">When to seek an assessment</p>
        <h2 className="section-title">You may benefit from a consultation if:</h2>
        <div className="portal-grid international-grid">
          {assessmentReasons.map((item) => (
            <article className="portal-card" key={item}>
              <div className="portal-card__body"><p>{item}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">Treatment pathway</p>
          <h2 className="section-title">A diagnosis-first approach.</h2>
          <div className="principle-list">
            {pathway.map((step, index) => (
              <article className="principle" key={step}>
                <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{step}</h3></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Benefits</p>
        <h2 className="section-title">Care planned around safety, function and healing.</h2>
        <div className="portal-grid international-grid">
          {benefits.map((item) => (
            <article className="portal-card" key={item}>
              <div className="portal-card__body"><p>{item}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Related care</p>
        <h2 className="section-title">Explore connected treatment pathways.</h2>
        <div className="hero__actions">
          <Link className="button button--ghost" href="/dental-implants">Dental implants</Link>
          <Link className="button button--ghost" href="/dental-treatments/gum-care">Gum treatment</Link>
          <Link className="button" href="/book">Request an appointment <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
