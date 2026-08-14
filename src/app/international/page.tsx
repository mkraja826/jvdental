import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dental Treatment in India for International Patients",
  description:
    "Plan dental treatment in Hyderabad, India with JV Dental. International patient support includes remote review, treatment scheduling, airport pickup, hotel coordination, local assistance and return transfer.",
  alternates: { canonical: "/international" },
  robots: { index: true, follow: true },
};

const journey = [
  ["01", "Share your concern", "Tell the clinic what you need help with and share available dental records or imaging when appropriate."],
  ["02", "Remote clinical review", "The dental team reviews the information available and explains what may need to be assessed before treatment planning can be finalised."],
  ["03", "Online consultation", "Discuss the proposed pathway, questions, likely visit requirements and what should be completed before travelling."],
  ["04", "Travel coordination", "The international patient team coordinates the treatment schedule together with airport pickup, hotel planning and local transport support."],
  ["05", "Treatment in Hyderabad", "Attend the clinic for examination, required imaging, final diagnosis and agreed dental treatment."],
  ["06", "Return & follow-up", "The team coordinates return transfer and keeps post-treatment communication connected after you travel home."],
] as const;

const support = [
  ["Airport pickup", "Pickup can be coordinated for the patient’s arrival in Hyderabad."],
  ["Hotel coordination", "The team assists with accommodation planning around the expected treatment schedule."],
  ["Local assistance", "A JV Dental representative can support coordination during the patient’s stay and clinic visits."],
  ["Clinic transport coordination", "Treatment-day travel can be coordinated as part of the international patient journey."],
  ["Return transfer", "Return travel to the airport can be coordinated after the planned treatment visit."],
  ["Connected follow-up", "Questions and follow-up communication can continue remotely after the patient returns home."],
] as const;

export default function InternationalPage() {
  return (
    <main className="international-page">
      <SiteHeader />

      <section className="hero international-hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">International dental patients · Hyderabad, India</p>
            <h1 className="display-title">Dental treatment in India<br /><em>with support from arrival to return.</em></h1>
            <p className="hero__description">
              JV Dental &amp; Implant Centre supports international patients seeking general, restorative and advanced dental treatment in Hyderabad—not only dental implants. Start remotely, plan the clinical journey before travel and coordinate the practical parts of your stay with one team.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/dental-treatments">Explore dental treatments</Link>
              <Link className="button button--ghost" href="/patient/login">Patient portal</Link>
            </div>
          </div>
          <p className="hero__note">Online review and preliminary planning do not replace an in-person examination. Final diagnosis, treatment sequence and timelines depend on the treating dentist’s clinical assessment and any required imaging.</p>
        </div>
        <div className="hero__visual" aria-label="International dental patient journey to Hyderabad">
          <span className="hero__visual-label">Remote review · travel support · Hyderabad treatment · follow-up</span>
          <div className="hero__visual-copy"><p>International patient support</p><strong>One coordinated journey from first contact to return travel.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">End-to-end support</p>
        <h2 className="section-title">The dental visit and the travel around it can be coordinated together.</h2>
        <p className="section-intro">International patients can work with the clinic on practical arrangements alongside their treatment schedule, reducing the number of separate contacts they need to manage while travelling.</p>
        <div className="portal-grid international-grid">
          {support.map(([title, body]) => (
            <article className="portal-card" key={title}>
              <div className="portal-card__header"><h3>{title}</h3></div>
              <div className="portal-card__body"><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">International patient journey</p>
          <h2 className="section-title">Understand the next step before you book the next flight.</h2>
          <div className="principle-list international-trust-list">
            {journey.map(([number, title, body]) => (
              <article className="principle" key={number}>
                <span className="principle__number">{number}</span>
                <div><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Complete dental care</p>
        <h2 className="section-title">Travel for the treatment you need—not for an implant-only pathway.</h2>
        <p className="section-intro">JV Dental provides comprehensive dental care as well as advanced implant dentistry and full-mouth rehabilitation. The appropriate treatment pathway is determined after diagnosis rather than assumed before examination.</p>
        <div className="hero__actions">
          <Link className="button" href="/dental-treatments">View dental treatments <span aria-hidden="true">→</span></Link>
          <Link className="button button--ghost" href="/dental-implants">Dental implant care</Link>
          <Link className="button button--ghost" href="/guided-implants">Guided implants</Link>
        </div>
      </section>

      <section className="section section--tight">
        <p className="section-kicker">Planning safely</p>
        <h2 className="section-title">Clinical decisions stay separate from travel promises.</h2>
        <div className="principle-list international-trust-list">
          <article className="principle"><span className="principle__number">01</span><div><h3>Diagnosis first</h3><p>Travel coordination does not guarantee that a specific procedure is suitable. Final recommendations follow clinical assessment.</p></div></article>
          <article className="principle"><span className="principle__number">02</span><div><h3>Share records securely</h3><p>Patients who are ready for individual review can use the authenticated patient portal to share relevant records with the clinic.</p></div></article>
          <article className="principle"><span className="principle__number">03</span><div><h3>Plan around treatment</h3><p>Accommodation and local coordination should follow the expected clinical schedule rather than the other way around.</p></div></article>
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">Start from anywhere</p><h2>Tell JV Dental what treatment you are considering and where you will be travelling from.</h2></div>
        <div className="assistant-panel">
          <p>Begin with an online consultation if you want to discuss treatment and travel planning. When you are ready to share personal dental records, continue through the secure patient portal.</p>
          <div className="hero__actions international-actions"><Link className="button button--light" href="/book">Book consultation</Link><Link className="button" href="/patient/login">Patient portal <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
