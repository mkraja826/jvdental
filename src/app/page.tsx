import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const principles = [
  {
    title: "Diagnosis before treatment",
    body: "Dental care starts with understanding the problem, the condition of the teeth and gums, and the patient’s priorities before recommending a procedure.",
  },
  {
    title: "Restoration-led implant planning",
    body: "When implants are needed, the final tooth, bite, hygiene access and long-term maintainability should guide how the case is planned—not the other way around.",
  },
  {
    title: "One documented journey",
    body: "From first enquiry to treatment planning, clinical records, payments and follow-up, the platform is designed around one continuous patient journey.",
  },
];

const treatments = [
  { title: "Complete dental treatments", href: "/dental-treatments" },
  { title: "Single & multiple dental implants", href: "/dental-implants" },
  { title: "Full-arch implant rehabilitation", href: "/full-arch-implants" },
  { title: "All-on-4 / All-on-6 planning", href: "/all-on-4-all-on-6" },
  { title: "Bone grafting & complex implant cases", href: "/bone-grafting-dental-implants" },
  { title: "Digitally guided implant surgery", href: "/guided-implants" },
];

const journey = [
  "Share your concern",
  "Remote dental review",
  "Online consultation",
  "Travel & stay coordination",
  "Dental treatment in Hyderabad",
  "Return & remote follow-up",
];

const clinicVisuals = [
  { key: "team", label: "Dental team", title: "Dentist-led complete dental care", href: "/doctors" },
  { key: "clinic", label: "Clinical environment", title: "Modern dental treatment setting", href: "/dental-treatments" },
  { key: "planning", label: "Digital dentistry", title: "3D implant planning & guided workflows", href: "/guided-implants" },
  { key: "cases", label: "Clinical evidence", title: "Documented dental cases", href: "/cases" },
];

export default function Home() {
  return (
    <main className="home-page">
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Dental Clinic · Ameerpet / S R Nagar · Hyderabad</p>
            <h1 className="display-title" id="hero-title">
              Complete dental care
              <br />
              &amp; <em>advanced implant dentistry.</em>
            </h1>
            <p className="hero__description">
              Comprehensive dental treatment for patients across Hyderabad—from preventive and restorative care to root canal treatment, crowns, dentures, oral surgery, dental implants and complex full-mouth rehabilitation.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">
                Book a dental appointment <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--ghost" href="/dental-treatments">
                Explore dental treatments
              </Link>
            </div>
          </div>

          <p className="hero__note">
            Treatment begins with clinical assessment and appropriate diagnosis. Online review can support planning before a clinic visit or international travel, but does not replace an in-person dental examination.
          </p>
        </div>

        <div className="hero__visual" aria-label="Complete dental care and implant planning at JV Dental Hyderabad">
          <span className="hero__visual-label">
            Complete dentistry · implant care · digital planning · coordinated follow-up
          </span>
          <div className="hero__visual-copy">
            <p>JV Dental &amp; Implant Centre</p>
            <strong>Modern dentistry. Carefully planned.</strong>
          </div>
        </div>
      </section>

      <section className="data-strip" aria-label="JV Dental focus areas">
        <div className="data-strip__item"><span>Local dental care</span><strong>Ameerpet &amp; S R Nagar</strong></div>
        <div className="data-strip__item"><span>Complete dentistry</span><strong>Routine to complex care</strong></div>
        <div className="data-strip__item"><span>Advanced speciality</span><strong>Dental implants</strong></div>
        <div className="data-strip__item"><span>International care</span><strong>Travel coordination</strong></div>
      </section>

      <section className="clinic-evidence" aria-label="JV Dental clinical environment">
        {clinicVisuals.map((item) => (
          <Link className={`clinic-evidence__item clinic-evidence__item--${item.key}`} href={item.href} key={item.key}>
            <span className="clinic-evidence__visual" aria-hidden="true"><i /><i /><i /></span>
            <span className="clinic-evidence__copy">
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <b aria-hidden="true">↗</b>
            </span>
          </Link>
        ))}
      </section>

      <section className="section" id="approach">
        <p className="section-kicker">Clinical approach</p>
        <h2 className="section-title">Start with the dental problem. Plan the treatment around long-term function.</h2>
        <p className="section-intro">
          JV Dental provides complete dental care while maintaining a strong focus on implant dentistry and full-mouth rehabilitation. The appropriate pathway depends on diagnosis, not on a predetermined procedure.
        </p>

        <div className="editorial-split">
          <div className="editorial-quote">
            “Understand the problem. Plan the restoration. Treat with the long term in mind.”
            <small>Diagnosis-led dental care</small>
          </div>
          <div className="principle-list">
            {principles.map((principle, index) => (
              <article className="principle" key={principle.title}>
                <span className="principle__number">0{index + 1}</span>
                <div><h3>{principle.title}</h3><p>{principle.body}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-band" id="treatments">
        <div className="section">
          <p className="section-kicker">Dental treatments</p>
          <h2 className="section-title">Complete dental care with dedicated implant pathways.</h2>
          <p className="section-intro">
            Start with complete dental care or explore specialist implant pathways for missing teeth, full-mouth rehabilitation and digitally guided treatment.
          </p>
          <div className="treatments">
            {treatments.map((treatment, index) => (
              <Link className="treatment-row" href={treatment.href} key={treatment.title}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{treatment.title}</strong><b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="local-dentist">
        <p className="section-kicker">Dentist near Ameerpet, Hyderabad</p>
        <h2 className="section-title">Local dental care from S R Nagar for Ameerpet and surrounding Hyderabad.</h2>
        <p className="section-intro">
          JV Dental &amp; Implant Centre is located at Sai Ganga Towers on Balkampet Road, S R Nagar, close to Ameerpet. Patients from the surrounding Hyderabad area can access general dental care, restorative treatment, surgical care and advanced implant dentistry from the same clinic.
        </p>
        <div className="hero__actions">
          <Link className="button" href="/book">Book an appointment <span aria-hidden="true">→</span></Link>
          <Link className="button button--ghost" href="/dental-treatments">View complete dental care</Link>
        </div>
      </section>

      <section className="section" id="cases">
        <p className="section-kicker">Dental cases</p>
        <h2 className="section-title">See how dental treatment is planned—not only how it finishes.</h2>
        <p className="section-intro">
          Published cases are structured around diagnosis → planning → treatment → restoration → outcome, with patient consent and appropriate anonymisation.
        </p>
        <article className="case-feature">
          <div className="case-feature__visual"><span>Clinical dental imagery is published only with appropriate consent</span></div>
          <div className="case-feature__content">
            <div>
              <p className="section-kicker">Inside a dental case</p>
              <h3>Diagnosis and planning come before the final result.</h3>
              <div className="case-meta">
                <div><span>01 · Dental diagnosis</span><strong>Clinical findings and imaging</strong></div>
                <div><span>02 · Treatment planning</span><strong>Restorative and clinical strategy</strong></div>
                <div><span>03 · Treatment</span><strong>Documented clinical stages</strong></div>
                <div><span>04 · Restoration</span><strong>Final result and follow-up</strong></div>
              </div>
            </div>
            <Link className="text-link" href="/cases">Explore documented dental cases →</Link>
          </div>
        </article>
      </section>

      <section className="section" id="international">
        <p className="section-kicker">International dental patients</p>
        <h2 className="section-title">Plan dental treatment in Hyderabad with support from arrival to return.</h2>
        <p className="section-intro">
          International patients can begin remotely, discuss treatment before travelling, and coordinate airport pickup, hotel planning, local assistance, clinic visits and return transfer around the clinical schedule.
        </p>
        <div className="journey">
          {journey.map((step, index) => <div className="journey-step" key={step}><span>0{index + 1}</span><strong>{step}</strong></div>)}
        </div>
        <div className="hero__actions">
          <Link className="button button--ghost" href="/international">International patient support</Link>
          <Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">JV Dental digital assistant</p><h2>Ask about our dental clinic, dental treatments, implants and planning care in Hyderabad.</h2></div>
        <div className="assistant-panel">
          <p>The public assistant provides clinic information and general dental education. Personal diagnosis, radiograph review and treatment decisions remain with the clinical team.</p>
          <Link className="button button--light" href="/book">Book a consultation <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
