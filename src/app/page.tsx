import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const principles = [
  {
    title: "Restoration-led planning",
    body: "The final tooth, bite, hygiene access and long-term maintainability should guide how an implant case is planned—not the other way around.",
  },
  {
    title: "Diagnosis before promises",
    body: "International patients can submit records before travel, but treatment recommendations remain preliminary until the implantologist has the clinical and radiographic information required.",
  },
  {
    title: "One documented journey",
    body: "From first enquiry to treatment planning, implant records and follow-up, the platform is designed around one continuous patient record.",
  },
];

const treatments = [
  "Single & multiple implants",
  "Full-arch implant rehabilitation",
  "All-on-4 / All-on-6 planning",
  "Bone grafting & complex implant cases",
];

const journey = [
  "Share your records",
  "Implantologist review",
  "Online consultation",
  "Plan your visit",
  "Treatment in Hyderabad",
  "Remote follow-up",
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Advanced implant dentistry · Hyderabad, India</p>
            <h1 className="display-title" id="hero-title">
              Implant dentistry,
              <br />
              considered down to the <em>millimetre.</em>
            </h1>
            <p className="hero__description">
              A precise, digitally planned approach to dental implants and full-mouth
              rehabilitation for patients from India and around the world.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/patient/login">
                Request an implant assessment <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--ghost" href="#cases">
                Explore patient cases
              </Link>
            </div>
          </div>

          <p className="hero__note">
            Online case review is intended to support treatment planning. Final diagnosis
            and treatment recommendations depend on appropriate clinical and radiographic
            assessment by the treating dentist.
          </p>
        </div>

        <div className="hero__visual" aria-label="Reserved for original JV Dental clinical photography">
          <span className="hero__visual-label">
            Original JV Dental clinical photography will replace this art-directed placeholder.
          </span>
          <div className="hero__visual-copy">
            <p>Designed around the clinician, not stock imagery</p>
            <strong>Precision you can see before you travel.</strong>
          </div>
        </div>
      </section>

      <section className="data-strip" aria-label="JV Dental focus areas">
        <div className="data-strip__item">
          <span>Clinical focus</span>
          <strong>Implant-led care</strong>
        </div>
        <div className="data-strip__item">
          <span>Location</span>
          <strong>Hyderabad, India</strong>
        </div>
        <div className="data-strip__item">
          <span>International care</span>
          <strong>Pre-travel planning</strong>
        </div>
        <div className="data-strip__item">
          <span>Patient records</span>
          <strong>Digital case journey</strong>
        </div>
      </section>

      <section className="section" id="approach">
        <p className="section-kicker">The JV Dental approach</p>
        <h2 className="section-title">A specialist experience should feel considered at every step.</h2>
        <p className="section-intro">
          The new platform is being designed to make clinical thinking visible—through
          documented cases, transparent planning and a quieter patient experience.
        </p>

        <div className="editorial-split">
          <div className="editorial-quote">
            “Plan the restoration. Understand the anatomy. Then place the implant.”
            <small>Working positioning statement · final doctor-approved wording pending</small>
          </div>

          <div className="principle-list">
            {principles.map((principle, index) => (
              <article className="principle" key={principle.title}>
                <span className="principle__number">0{index + 1}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-band" id="implants">
        <div className="section">
          <p className="section-kicker">Implant dentistry</p>
          <h2 className="section-title">Treatment organised around the complexity of the case.</h2>
          <p className="section-intro">
            Each treatment page will eventually be supported by the doctor&apos;s own cases,
            protocols, technologies and verified treatment information.
          </p>

          <div className="treatments">
            {treatments.map((treatment, index) => (
              <Link className="treatment-row" href="/patient/login" key={treatment}>
                <span>0{index + 1}</span>
                <strong>{treatment}</strong>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="cases">
        <p className="section-kicker">Documented patient cases</p>
        <h2 className="section-title">Not a gallery. A clinical case library.</h2>
        <p className="section-intro">
          Real JV Dental cases will be presented as diagnosis → planning → surgery →
          restoration → outcome, with patient consent and appropriate anonymisation.
        </p>

        <article className="case-feature">
          <div className="case-feature__visual">
            <span>Reserved for consented clinical case imagery</span>
          </div>
          <div className="case-feature__content">
            <div>
              <p className="section-kicker">Case format · Full-arch rehabilitation</p>
              <h3>The result is only the final chapter.</h3>
              <div className="case-meta">
                <div>
                  <span>01 · Diagnosis</span>
                  <strong>Clinical findings and imaging</strong>
                </div>
                <div>
                  <span>02 · Planning</span>
                  <strong>Restorative and surgical strategy</strong>
                </div>
                <div>
                  <span>03 · Treatment</span>
                  <strong>Documented surgical and prosthetic stages</strong>
                </div>
                <div>
                  <span>04 · Outcome</span>
                  <strong>Final result and follow-up</strong>
                </div>
              </div>
            </div>
            <Link className="text-link" href="/patient/login">
              Send your records for review →
            </Link>
          </div>
        </article>
      </section>

      <section className="section" id="international">
        <p className="section-kicker">International patients</p>
        <h2 className="section-title">Treatment in Hyderabad, with more clarity before you book a flight.</h2>
        <p className="section-intro">
          The international patient flow is designed to answer the practical questions that
          matter before travel: records, review, consultation, treatment stages, expected
          stay and follow-up.
        </p>

        <div className="journey">
          {journey.map((step, index) => (
            <div className="journey-step" key={step}>
              <span>0{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="assistant-band">
        <div>
          <p className="section-kicker">JV Dental digital assistant</p>
          <h2>Ask about the clinic, implants and planning treatment in India.</h2>
        </div>
        <div className="assistant-panel">
          <p>
            The public AI assistant will answer from doctor-approved clinic knowledge and
            general dental education, then hand personal diagnosis, radiograph review and
            treatment decisions to the clinical team.
          </p>
          <Link className="button button--light" href="/patient/login">
            Start with your case <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div>
          <div className="wordmark" aria-label="JV Dental">
            <span>JV</span>
            <span>Dental</span>
          </div>
          <p>
            JV Dental & Implant Centre · Hyderabad, India. Final doctor profile, contact,
            accreditation, treatment claims and clinical content will be published only after verification.
          </p>
        </div>
        <div className="footer-links">
          <Link href="#implants">Implants</Link>
          <Link href="#international">International</Link>
          <Link href="#cases">Patient cases</Link>
          <Link href="/patient/login">Patient login</Link>
          <Link href="/clinic">Clinic portal</Link>
          <Link href="#approach">Our approach</Link>
        </div>
      </footer>
    </main>
  );
}
