import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dental Treatments in Ameerpet, Hyderabad",
  description:
    "Explore complete dental care at JV Dental near Ameerpet and S R Nagar, Hyderabad—from preventive and restorative dentistry to root canal care, crowns, dentures, oral surgery and advanced dental implants.",
  alternates: { canonical: "/dental-treatments" },
};

const treatmentGroups = [
  {
    title: "General & preventive dentistry",
    body: "Routine dental assessment, preventive care, professional cleaning and treatment planning focused on protecting teeth, gums and long-term oral health.",
  },
  {
    title: "Restorative dentistry",
    body: "Care for damaged or decayed teeth, including fillings and restorative treatment designed to recover function, comfort and tooth structure where clinically appropriate.",
  },
  {
    title: "Root canal treatment",
    body: "Endodontic care for teeth affected by pulpal infection or inflammation, followed by appropriate restoration based on the condition of the tooth.",
  },
  {
    title: "Crowns, bridges & dentures",
    body: "Fixed and removable tooth-replacement options planned around bite, function, appearance, remaining teeth and long-term maintainability.",
  },
  {
    title: "Gum & periodontal care",
    body: "Assessment and treatment planning for gum health, inflammation and supporting tissues around natural teeth and dental implants.",
  },
  {
    title: "Extractions & oral surgery",
    body: "Dental extractions and surgical care when a tooth cannot be predictably maintained, with replacement planning discussed where appropriate.",
  },
];

const implantTreatments = [
  ["Dental implants", "/dental-implants"],
  ["Full-arch implant rehabilitation", "/full-arch-implants"],
  ["All-on-4 / All-on-6", "/all-on-4-all-on-6"],
  ["Bone grafting & complex implant cases", "/bone-grafting-dental-implants"],
  ["Digitally guided implants", "/guided-implants"],
] as const;

export default function DentalTreatmentsPage() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Complete dental care · Ameerpet / S R Nagar · Hyderabad</p>
            <h1 className="display-title">Dental treatment for everyday care<br /><em>and complex rehabilitation.</em></h1>
            <p className="hero__description">
              JV Dental &amp; Implant Centre provides comprehensive dentistry for patients from Ameerpet, S R Nagar and surrounding Hyderabad—while maintaining advanced implant dentistry as a major clinical focus.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/doctors">Meet the dental team</Link>
            </div>
          </div>
          <p className="hero__note">Treatment recommendations depend on clinical examination and, where required, appropriate dental imaging. The most suitable option is decided after diagnosis.</p>
        </div>
        <div className="hero__visual" aria-label="Complete dental care at JV Dental Hyderabad">
          <span className="hero__visual-label">Preventive · restorative · surgical · implant dentistry</span>
          <div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>One clinic for complete dental care.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Complete dentistry</p>
        <h2 className="section-title">Care for teeth, gums, function, comfort and tooth replacement.</h2>
        <p className="section-intro">
          Patients do not need to know the exact treatment name before booking. Start with the problem—pain, a damaged tooth, missing teeth, gum concerns, difficulty chewing or a routine check—and the clinical team can assess the appropriate pathway.
        </p>
        <div className="portal-grid international-grid">
          {treatmentGroups.map((group) => (
            <article className="portal-card" key={group.title}>
              <div className="portal-card__header"><h3>{group.title}</h3></div>
              <div className="portal-card__body"><p>{group.body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">Advanced implant dentistry</p>
          <h2 className="section-title">Dedicated pathways for missing teeth and full-mouth rehabilitation.</h2>
          <p className="section-intro">Explore the implant-focused pages when tooth replacement, complex rehabilitation or digitally guided implant planning is the main concern.</p>
          <div className="treatments">
            {implantTreatments.map(([title, href], index) => (
              <Link className="treatment-row" href={href} key={href}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Local dental care in Hyderabad</p>
        <h2 className="section-title">Conveniently located for Ameerpet, S R Nagar and surrounding Hyderabad.</h2>
        <p className="section-intro">
          The clinic is at Sai Ganga Towers on Balkampet Road, S R Nagar, close to Ameerpet. JV Dental serves patients from the surrounding Hyderabad catchment for routine dental care, specialist treatment and ongoing follow-up.
        </p>
        <div className="hero__actions">
          <Link className="button" href="/book">Request an appointment <span aria-hidden="true">→</span></Link>
          <Link className="button button--ghost" href="/international">International patient support</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
