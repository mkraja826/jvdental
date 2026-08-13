import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type ServiceStep = { title: string; body: string };

type ImplantServicePageProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  suitability: string;
  steps: ServiceStep[];
  considerations: string[];
};

export function ImplantServicePage({ eyebrow, title, accent, description, suitability, steps, considerations }: ImplantServicePageProps) {
  return (
    <main className="treatment-page">
      <SiteHeader />

      <section className="hero treatment-hero">
        <div className="hero__copy treatment-hero__copy">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-title">{title}<br /><em>{accent}</em></h1>
            <p className="hero__description">{description}</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book implant assessment <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/cases">Explore dental cases</Link>
            </div>
          </div>
          <p className="hero__note">Treatment suitability, implant number, surgical approach, restorative design and timing depend on clinical examination, medical history and appropriate imaging. Online information is educational and does not replace diagnosis.</p>
        </div>
        <div className="hero__visual treatment-hero__visual">
          <span className="hero__visual-label">Dental implant treatment · clinical assessment · restorative planning</span>
          <div className="treatment-visual__marker" aria-hidden="true"><span /><span /><span /></div>
          <div className="hero__visual-copy">
            <p>Diagnosis-led dental implant care</p>
            <strong>{suitability}</strong>
          </div>
        </div>
      </section>

      <section className="section treatment-process">
        <p className="section-kicker">Your treatment pathway</p>
        <h2 className="section-title">From dental assessment to the final restoration.</h2>
        <p className="section-intro">Each stage connects diagnosis, implant planning, surgery, restorative dentistry and follow-up rather than treating implant placement as an isolated procedure.</p>
        <div className="principle-list treatment-steps">
          {steps.map((step, index) => (
            <article className="principle treatment-step" key={step.title}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band treatment-considerations">
        <div className="section">
          <p className="section-kicker">Before treatment is recommended</p>
          <h2
            className="section-title"
            style={{ color: "#ffffff", display: "block", visibility: "visible", opacity: 1 }}
          >
            What your implant dentist evaluates.
          </h2>
          <p className="section-intro">The right treatment pathway depends on your teeth, gums, bone, bite, medical history and restorative goals—not on a treatment label alone.</p>
          <div className="treatments">
            {considerations.map((item, index) => (
              <div className="treatment-row" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <b aria-hidden="true">✓</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight treatment-next-step">
        <p className="section-kicker">Talk to the dental team</p>
        <h2 className="section-title">Understand your options before committing to implant treatment.</h2>
        <p className="section-intro">Explore treatment information, documented cases and the dental team without creating an account. Book an assessment when you are ready to discuss your case, and use the secure patient portal when you need to send clinical records.</p>
        <div className="hero__actions">
          <Link className="button button--ghost" href="/guided-implants">Guided implant dentistry</Link>
          <Link className="button button--ghost" href="/doctors">Meet the dentists</Link>
          <Link className="button" href="/book">Book assessment</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
