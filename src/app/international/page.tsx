import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { internationalCostCategories, internationalJourney, internationalLogistics } from "@/content/international-patient";

export const metadata: Metadata = {
  title: "International Dental Implant Patients in Hyderabad",
  description: "Plan dental implant treatment in Hyderabad with a structured pre-travel review, online consultation, visit planning and follow-up pathway.",
  robots: { index: false, follow: true },
};

const visaUrl = "https://www.indianvisaonline.gov.in/";

export default function InternationalPage() {
  return (
    <main className="international-page">
      <SiteHeader />

      <section className="hero international-hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">International implant patients · Hyderabad, India</p>
            <h1 className="display-title">Plan more before<br /><em>you travel.</em></h1>
            <p className="hero__description">Start with records, clinical review and an online consultation so your trip to Hyderabad is organised around a documented treatment pathway—not assumptions.</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="#costs">See costs & timelines</Link>
              <Link className="button button--ghost" href="/patient/login">Patient portal</Link>
            </div>
          </div>
          <p className="hero__note">Online review and indicative planning do not replace an in-person diagnosis. Final treatment recommendations depend on appropriate clinical and radiographic assessment by the treating dentist.</p>
        </div>
        <div className="hero__visual" aria-label="International patient planning journey">
          <span className="hero__visual-label">Remote review · Hyderabad treatment · connected follow-up</span>
          <div className="hero__visual-copy"><p>International patient pathway</p><strong>Know the next step before the next flight.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Your treatment journey</p>
        <h2 className="section-title">Six stages, each with a clear responsibility and outcome.</h2>
        <p className="section-intro">Timeframes remain intentionally unpublished until the clinic confirms them. The workflow below separates what you do, what the clinic returns, who owns the step and whether it happens remotely or in Hyderabad.</p>
        <div className="portal-grid international-grid">
          {internationalJourney.map((step, index) => (
            <article className="portal-card" key={step.id}>
              <div className="portal-card__header"><h3>{String(index + 1).padStart(2, "0")} · {step.title}</h3><span className="status-pill">{step.location}</span></div>
              <div className="portal-card__body">
                <p><strong>Typical timeframe</strong><br />{step.timeframe}</p>
                <p><strong>What you need to do</strong><br />{step.patientAction}</p>
                <p><strong>What you get back</strong><br />{step.deliverable}</p>
                <p style={{ marginBottom: 0 }}><strong>Who is involved</strong><br />{step.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band" id="costs">
        <div className="section">
          <p className="section-kicker">Cost transparency</p>
          <h2 className="section-title">Indicative ranges belong here—final quotes come after review.</h2>
          <p className="section-intro">The clinic has not yet confirmed public price ranges or inclusions, so we are keeping those fields visibly unverified rather than publishing invented numbers.</p>
          <div className="treatments">
            {internationalCostCategories.map((item, index) => (
              <div className="treatment-row" key={item.treatment} style={{ cursor: "default" }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong style={{ display: "block" }}>{item.treatment}</strong><small style={{ display: "block", marginTop: 8 }}>Range: {item.range} · Includes/excludes: {item.includes}</small></div>
                <b aria-hidden="true">—</b>
              </div>
            ))}
          </div>
          <p className="hero__note">Final diagnosis, treatment sequence and pricing can change after in-person examination, imaging and confirmation of restorative requirements.</p>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Travel & practical planning</p>
        <h2 className="section-title">The questions patients ask before booking treatment abroad.</h2>
        <div className="portal-grid international-grid">
          {internationalLogistics.map((item) => (
            <article className="portal-card" key={item.title}>
              <div className="portal-card__header"><h3>{item.title}</h3></div>
              <div className="portal-card__body"><p>{item.body}</p>{item.title === "Visa guidance" ? <a className="text-link" href={visaUrl} target="_blank" rel="noreferrer">Open the official Government of India visa portal →</a> : null}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--tight">
        <p className="section-kicker">Trust, safety & privacy</p>
        <h2 className="section-title">Only verified trust signals should be public.</h2>
        <div className="principle-list international-trust-list">
          <article className="principle"><span className="principle__number">01</span><div><h3>Accreditations</h3><p>[TO BE CONFIRMED BY CLINIC]. No ISO, NABH or other accreditation will be claimed until documentary verification is complete.</p></div></article>
          <article className="principle"><span className="principle__number">02</span><div><h3>Sterilisation & clinical safety</h3><p>Clinic-approved sterilisation, infection-control and surgical-safety wording: [TO BE CONFIRMED BY CLINIC].</p></div></article>
          <article className="principle"><span className="principle__number">03</span><div><h3>International / NRI patient reviews</h3><p>Only consented, verifiable international or NRI patient reviews will be surfaced here. [TO BE CONFIRMED BY CLINIC]</p></div></article>
          <article className="principle"><span className="principle__number">04</span><div><h3>Medical-record privacy</h3><p>Uploaded records are handled through the secure patient workflow. Public wording for encryption, authorised viewers, retention and deletion policy must be confirmed against the clinic’s final privacy policy before this page is indexed.</p></div></article>
        </div>
      </section>

      <section className="assistant-band" id="coordinator">
        <div><p className="section-kicker">Choose how far you want to go</p><h2>Research first. Talk when ready. Upload records only when you want clinical review.</h2></div>
        <div className="assistant-panel">
          <p><strong>Just researching:</strong> this page and the public implant pages stay open without login.<br /><br /><strong>Ready to talk:</strong> book a clinic or video consultation through the appointment flow.<br /><br /><strong>Ready to share records:</strong> use the secure patient portal after you are ready for individual review.</p>
          <div className="hero__actions international-actions"><Link className="button button--light" href="/book">Book consultation</Link><Link className="button" href="/patient/login">Patient portal <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
