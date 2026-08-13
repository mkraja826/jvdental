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
  { title: "Single & multiple implants", href: "/dental-implants" },
  { title: "Full-arch implant rehabilitation", href: "/full-arch-implants" },
  { title: "All-on-4 / All-on-6 planning", href: "/all-on-4-all-on-6" },
  { title: "Bone grafting & complex implant cases", href: "/bone-grafting-dental-implants" },
  { title: "Digitally guided implant surgery", href: "/guided-implants" },
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
            <p className="eyebrow">Dental Implant Centre · Hyderabad, India</p>
            <h1 className="display-title" id="hero-title">
              Advanced dental implants
              <br />
              &amp; <em>full-mouth rehabilitation.</em>
            </h1>
            <p className="hero__description">
              Digitally planned implant dentistry focused on restoring function, comfort and
              confidence—from a single missing tooth to complex full-arch rehabilitation.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/patient/login">
                Request an implant assessment <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--ghost" href="/doctors">
                Meet the dental team
              </Link>
            </div>
          </div>

          <p className="hero__note">
            Implant treatment begins with clinical and radiographic assessment. Online case
            review can support planning before a clinic visit or international travel.
          </p>
        </div>

        <div className="hero__visual" aria-label="Dental implant planning at JV Dental">
          <span className="hero__visual-label">
            Implant dentistry · digital planning · guided workflows
          </span>
          <div className="hero__visual-copy">
            <p>JV Dental &amp; Implant Centre</p>
            <strong>Modern dentistry. Carefully planned.</strong>
          </div>
        </div>
      </section>

      <section className="data-strip" aria-label="JV Dental focus areas">
        <div className="data-strip__item">
          <span>Dental care</span>
          <strong>Implant dentistry</strong>
        </div>
        <div className="data-strip__item">
          <span>Advanced treatment</span>
          <strong>Full-mouth rehabilitation</strong>
        </div>
        <div className="data-strip__item">
          <span>Digital dentistry</span>
          <strong>Guided implant planning</strong>
        </div>
        <div className="data-strip__item">
          <span>Clinic</span>
          <strong>Hyderabad, India</strong>
        </div>
      </section>

      <section className="section" id="approach">
        <p className="section-kicker">Clinical approach</p>
        <h2 className="section-title">Dental implant care planned around the final smile, bite and long-term function.</h2>
        <p className="section-intro">
          Every implant case starts with diagnosis. Clinical examination, imaging and restorative
          planning guide the treatment pathway before surgery is considered.
        </p>

        <div className="editorial-split">
          <div className="editorial-quote">
            “Plan the restoration. Understand the anatomy. Then place the implant.”
            <small>Restoration-led implant planning</small>
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
          <p className="section-kicker">Dental implant treatments</p>
          <h2 className="section-title">From one missing tooth to complete dental rehabilitation.</h2>
          <p className="section-intro">
            Explore implant treatment pathways, digital guided workflows and approaches used for
            straightforward and complex dental implant cases.
          </p>

          <div className="treatments">
            {treatments.map((treatment, index) => (
              <Link className="treatment-row" href={treatment.href} key={treatment.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{treatment.title}</strong>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="cases">
        <p className="section-kicker">Dental implant cases</p>
        <h2 className="section-title">See how dental treatment is planned—not only how it finishes.</h2>
        <p className="section-intro">
          Published cases are structured around diagnosis → planning → surgery → restoration →
          outcome, with patient consent and appropriate anonymisation.
        </p>

        <article className="case-feature">
          <div className="case-feature__visual">
            <span>Clinical dental imagery is published only with appropriate consent</span>
          </div>
          <div className="case-feature__content">
            <div>
              <p className="section-kicker">Inside an implant case</p>
              <h3>Diagnosis and planning come before the final result.</h3>
              <div className="case-meta">
                <div><span>01 · Dental diagnosis</span><strong>Clinical findings and imaging</strong></div>
                <div><span>02 · Implant planning</span><strong>Restorative and surgical strategy</strong></div>
                <div><span>03 · Treatment</span><strong>Documented surgical and prosthetic stages</strong></div>
                <div><span>04 · Restoration</span><strong>Final result and follow-up</strong></div>
              </div>
            </div>
            <Link className="text-link" href="/cases">Explore documented dental cases →</Link>
          </div>
        </article>
      </section>

      <section className="section" id="international">
        <p className="section-kicker">International dental patients</p>
        <h2 className="section-title">Plan dental implant treatment in Hyderabad before you travel.</h2>
        <p className="section-intro">
          Start remotely, share available dental records and imaging, understand the proposed
          pathway before travel, and keep consultations and follow-up connected.
        </p>

        <div className="journey">
          {journey.map((step, index) => (
            <div className="journey-step" key={step}>
              <span>0{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="hero__actions">
          <Link className="button button--ghost" href="/international">International patient journey</Link>
          <Link className="button" href="/patient/login">Upload dental records <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="assistant-band">
        <div>
          <p className="section-kicker">JV Dental digital assistant</p>
          <h2>Ask about our dental clinic, implant treatments and planning care in Hyderabad.</h2>
        </div>
        <div className="assistant-panel">
          <p>
            The public assistant provides clinic information and general dental education.
            Personal diagnosis, radiograph review and treatment decisions remain with the clinical team.
          </p>
          <Link className="button button--light" href="/patient/login">Start with your dental case <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="footer">
        <div>
          <div className="wordmark" aria-label="JV Dental"><span>JV</span><span>Dental</span></div>
          <p>
            JV Dental &amp; Implant Centre · Hyderabad, India. Dental implants, full-mouth
            rehabilitation, digital treatment planning and coordinated care for patients from India and abroad.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/dental-implants">Dental implants</Link>
          <Link href="/guided-implants">Guided implants</Link>
          <Link href="/international">International patients</Link>
          <Link href="/cases">Dental cases</Link>
          <Link href="/doctors">Dentists</Link>
          <Link href="/journal">Dental journal</Link>
          <Link href="/patient/login">Patient login</Link>
          <Link href="/staff/login">Clinic login</Link>
        </div>
      </footer>
    </main>
  );
}
