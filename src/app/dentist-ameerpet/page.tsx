import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dentist in Ameerpet, Hyderabad",
  description:
    "Looking for a dentist near Ameerpet? JV Dental & Implant Centre is located on Balkampet Road, S R Nagar, Hyderabad, providing complete dental care and advanced implant treatment.",
  alternates: { canonical: "/dentist-ameerpet" },
};

const address = "7-1-395/29 (34-A), Sai Ganga Towers, Balkampet Road, S R Nagar, Hyderabad, Telangana 500038";
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const reasons = [
  ["Complete dental care", "Routine dental needs, restorative care, tooth replacement and complex treatment can be assessed within the same clinic."],
  ["Advanced implant dentistry", "Dedicated implant pathways include single and multiple implants, full-arch rehabilitation, bone grafting and digitally guided workflows."],
  ["Local continuity", "Patients from Ameerpet, S R Nagar and surrounding Hyderabad can keep diagnosis, treatment records and follow-up connected through one clinic."],
  ["Digital patient support", "Appointments, secure records, messages, treatment plans and follow-up can continue through the JV Dental patient portal where appropriate."],
] as const;

export default function DentistAmeerpetPage() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Dentist near Ameerpet · S R Nagar · Hyderabad</p>
            <h1 className="display-title">Complete dental care<br /><em>near Ameerpet.</em></h1>
            <p className="hero__description">
              JV Dental &amp; Implant Centre is located on Balkampet Road in S R Nagar, close to Ameerpet, providing comprehensive dentistry and advanced implant care for patients across the surrounding Hyderabad area.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link>
              <a className="button button--ghost" href={mapsUrl} target="_blank" rel="noreferrer">Open clinic location</a>
            </div>
          </div>
          <p className="hero__note">Reception: +91 40 4020 8910 · WhatsApp: +91 96666 89855</p>
        </div>
        <div className="hero__visual" aria-label="JV Dental near Ameerpet Hyderabad">
          <span className="hero__visual-label">Ameerpet · S R Nagar · Balkampet Road</span>
          <div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Your local dental clinic for routine and advanced care.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Why patients visit JV Dental</p>
        <h2 className="section-title">One clinic for everyday dentistry and advanced treatment.</h2>
        <div className="portal-grid international-grid">
          {reasons.map(([title, body]) => (
            <article className="portal-card" key={title}>
              <div className="portal-card__header"><h3>{title}</h3></div>
              <div className="portal-card__body"><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">Dental treatments near Ameerpet</p>
          <h2 className="section-title">Start with the problem. The dental team can guide the treatment pathway.</h2>
          <p className="section-intro">Patients can visit for routine and preventive dental needs, restorative treatment, root canal care, crowns and bridges, dentures, gum care, extractions and oral surgery, as well as dental implants and full-mouth rehabilitation.</p>
          <div className="hero__actions">
            <Link className="button button--light" href="/dental-treatments">Explore complete dental treatments</Link>
            <Link className="button" href="/dental-implants">Explore dental implants <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Clinic location</p>
        <h2 className="section-title">S R Nagar, close to Ameerpet.</h2>
        <p className="section-intro">{address}</p>
        <div className="hero__actions">
          <a className="button" href={mapsUrl} target="_blank" rel="noreferrer">Directions on Google Maps <span aria-hidden="true">→</span></a>
          <a className="button button--ghost" href="tel:+914040208910">Call reception</a>
          <a className="button button--ghost" href="https://wa.me/919666689855" target="_blank" rel="noreferrer">WhatsApp JV Dental</a>
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">Need help choosing?</p><h2>You do not need to diagnose yourself before booking.</h2></div>
        <div className="assistant-panel">
          <p>Describe the dental concern when requesting an appointment. The clinic can assess the problem and explain the appropriate next step after examination.</p>
          <Link className="button button--light" href="/book">Request an appointment <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
