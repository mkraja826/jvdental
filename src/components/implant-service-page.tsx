import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getWebsiteMedia } from "@/lib/content/website-media";

type ServiceStep = { title: string; body: string };

type ImplantServicePageProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  suitability: string;
  steps: ServiceStep[];
  considerations: string[];
  services?: ServiceStep[];
  showBookingActions?: boolean;
};

export async function ImplantServicePage({
  eyebrow,
  title,
  accent,
  description,
  suitability,
  steps,
  considerations,
  services,
  showBookingActions = true,
}: ImplantServicePageProps) {
  const managedHero = await getWebsiteMedia("implant-hero", "Dental implant planning at JV Dental Hyderabad");
  const heroStyle = managedHero.url
    ? { backgroundImage: `linear-gradient(180deg, rgba(20,35,32,.06), rgba(20,35,32,.5)), url(${managedHero.url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

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
              {showBookingActions ? <Link className="button" href="/book">Book implant assessment <span aria-hidden="true">→</span></Link> : null}
              <Link className="button button--ghost" href="/cases">Explore dental cases</Link>
            </div>
          </div>
          <p className="hero__note">Treatment suitability, implant number, surgical approach, restorative design and timing depend on clinical examination, medical history and appropriate imaging. Online information is educational and does not replace diagnosis.</p>
        </div>
        <div className="hero__visual treatment-hero__visual" aria-label={managedHero.alt} style={heroStyle}>
          <span className="hero__visual-label">Dental implant treatment · clinical assessment · restorative planning</span>
          {!managedHero.url ? <div className="treatment-visual__marker" aria-hidden="true"><span /><span /><span /></div> : null}
          <div className="hero__visual-copy">
            <p>Diagnosis-led dental implant care</p>
            <strong>{suitability}</strong>
          </div>
        </div>
      </section>

      {services?.length ? (
        <section className="section">
          <p className="section-kicker">Dental implant services</p>
          <h2 className="section-title">Implant treatment options available after assessment.</h2>
          <div className="portal-grid international-grid">
            {services.map((service) => (
              <article className="portal-card" key={service.title}>
                <div className="portal-card__header"><h3>{service.title}</h3></div>
                <div className="portal-card__body"><p>{service.body}</p></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
          <h2 className="section-title" style={{ color: "#ffffff", display: "block", visibility: "visible", opacity: 1 }}>What your implant dentist evaluates.</h2>
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
        <p className="section-kicker">Explore implant care</p>
        <h2 className="section-title">Understand the available implant pathways and documented cases.</h2>
        <p className="section-intro">Explore treatment information, documented cases and the dental team without creating an account. Clinical recommendations are made only after assessment and appropriate records.</p>
        <div className="hero__actions">
          <Link className="button button--ghost" href="/guided-implants">Guided implant dentistry</Link>
          <Link className="button button--ghost" href="/doctors">Meet the dentists</Link>
          {showBookingActions ? <Link className="button" href="/book">Book assessment</Link> : null}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
