import Link from "next/link";
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

export function ImplantServicePage({
  eyebrow,
  title,
  accent,
  description,
  suitability,
  steps,
  considerations,
}: ImplantServicePageProps) {
  return (
    <main>
      <SiteHeader />

      <section className="hero" style={{ minHeight: "auto" }}>
        <div className="hero__copy" style={{ minHeight: 620 }}>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-title">{title}<br /><em>{accent}</em></h1>
            <p className="hero__description">{description}</p>
            <div className="hero__actions">
              <Link className="button" href="/patient/login">Upload records for assessment <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/cases">Explore documented cases</Link>
            </div>
          </div>
          <p className="hero__note">Treatment suitability, implant number, surgical approach, restorative design and timing depend on clinical examination, medical history and appropriate imaging. Online information is educational and does not replace diagnosis.</p>
        </div>
        <div className="hero__visual" style={{ minHeight: 620 }}>
          <div className="hero__visual-copy">
            <p>Diagnosis-led implant care</p>
            <strong>{suitability}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">How treatment is planned</p>
        <h2 className="section-title">A sequence built around the final restoration.</h2>
        <div className="principle-list" style={{ marginTop: 64 }}>
          {steps.map((step, index) => (
            <article className="principle" key={step.title}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">Clinical considerations</p>
          <h2 className="section-title">What the implantologist evaluates before recommending treatment.</h2>
          <div className="treatments">
            {considerations.map((item, index) => (
              <div className="treatment-row" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <b aria-hidden="true">·</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <p className="section-kicker">Next step</p>
        <h2 className="section-title">Understand the options before committing to treatment.</h2>
        <p className="section-intro">You can review the clinic&apos;s published cases and guided-implant workflow without creating an account. Create a secure patient account only when you are ready to send records for individual review.</p>
        <div className="hero__actions">
          <Link className="button button--ghost" href="/guided-implants">Explore guided implants</Link>
          <Link className="button button--ghost" href="/doctors">Meet the clinical team</Link>
          <Link className="button" href="/patient/login">Start assessment</Link>
        </div>
      </section>
    </main>
  );
}
