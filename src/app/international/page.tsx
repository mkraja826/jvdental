import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { internationalMarkets } from "@/content/international-markets";
import { getWebsiteMedia } from "@/lib/content/website-media";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Dental Treatment in India for International Patients",
  description:
    "Plan dental treatment in Hyderabad, India with JV Dental. Begin with remote clinical review, understand the likely treatment schedule, and coordinate practical travel support around your confirmed clinic visits.",
  alternates: {
    canonical: "/international",
    languages: Object.fromEntries([
      ["en", `${siteUrl}/international`],
      ...internationalMarkets.map((market) => [market.hreflang, `${siteUrl}/international/${market.slug}`]),
    ]),
  },
  robots: { index: true, follow: true },
};

const journey = [
  ["01", "Share your concern and records", "Tell JV Dental what you would like help with and securely share any available reports, photographs, OPG or CBCT when the clinical team requests them."],
  ["02", "Remote clinical review", "The team reviews the information available, identifies what still needs to be assessed and explains whether an online consultation is the appropriate next step."],
  ["03", "Discuss the likely treatment pathway", "Use the online consultation to understand the preliminary clinical pathway, likely number of clinic visits, questions to clarify and what cannot be confirmed until an in-person examination."],
  ["04", "Agree provisional clinic dates", "Once the clinical team has enough information, provisional treatment dates can be discussed. Avoid committing to non-refundable travel until the clinic has confirmed the expected visit window."],
  ["05", "Coordinate the Hyderabad stay", "After provisional clinic dates are agreed, practical support such as arrival pickup, accommodation planning and treatment-day transport can be discussed around the clinical schedule."],
  ["06", "Examination, treatment and follow-up", "Attend JV Dental for in-person assessment and final treatment decisions. After treatment, return-travel timing and remote follow-up are coordinated according to the treating dentist’s instructions."],
] as const;

const support = [
  ["Arrival in Hyderabad", "Once your arrival details and clinic dates are confirmed, the team can coordinate airport pickup and help you understand the first steps after reaching Hyderabad."],
  ["Stay planning around treatment", "Accommodation planning can be aligned with the expected treatment schedule and clinic location, helping you choose a practical stay rather than planning travel first and fitting treatment around it."],
  ["Clinic-day support", "A JV Dental representative can assist with practical coordination during your stay, including treatment-day transport arrangements and communication around scheduled clinic visits."],
  ["Return travel & remote follow-up", "Return-transfer timing can be planned around the treating dentist’s advice. After you travel home, treatment-related questions and scheduled follow-up communication can continue remotely."],
] as const;

const beforeTravel = [
  ["Clinical information first", "Send the information the clinic requests before making travel decisions. Better pre-travel information helps the team give you a more realistic provisional pathway."],
  ["Keep the first plan provisional", "Remote review can guide planning, but final diagnosis, procedure choice and treatment sequence may change after examination or new imaging in Hyderabad."],
  ["Confirm the visit window", "Discuss the likely number of clinic visits and expected treatment window with JV Dental before booking non-refundable flights or accommodation."],
  ["Plan recovery time", "Some procedures may require observation, healing time or a review visit before long-distance travel. Follow the treating dentist’s advice when deciding your return date."],
] as const;

const faqs = [
  ["Does JV Dental treat international patients for procedures other than dental implants?", "Yes. International patients can enquire about general, restorative and surgical dental care as well as dental implants and full-mouth rehabilitation. The correct treatment pathway is confirmed after clinical assessment."],
  ["What practical support can JV Dental coordinate for international patients?", "After provisional clinic dates are agreed, the team can discuss airport pickup, accommodation planning, local assistance, treatment-day transport and return-transfer coordination. The exact arrangements, availability and any associated costs should be confirmed with the clinic before travel."],
  ["Can I receive a final treatment plan before travelling to India?", "Remote review and an online consultation can help establish a preliminary pathway, but final diagnosis and treatment planning may require an in-person examination, appropriate imaging and confirmation by the treating dentist."],
  ["Can I send my dental scans or reports before travelling?", "Yes. When individual clinical review is appropriate, patients can use the secure patient portal to share available dental records or imaging with the clinic."],
  ["Should I book flights before the online consultation?", "It is better to discuss the likely treatment pathway and provisional clinic dates first. Avoid committing to non-refundable travel until the clinic has confirmed the expected visit window."],
  ["What happens after I return home?", "Post-treatment questions and follow-up communication can continue remotely. The exact follow-up schedule depends on the treatment performed and the treating dentist’s recommendations."],
] as const;

export default async function InternationalPage() {
  const internationalHero = await getWebsiteMedia("international-hero", "International dental patient journey to Hyderabad");
  const heroStyle = internationalHero.url
    ? { backgroundImage: `linear-gradient(180deg, rgba(20,35,32,.08), rgba(20,35,32,.52)), url(${internationalHero.url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main className="international-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SiteHeader />

      <section className="hero international-hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">International dental patients · Hyderabad, India</p>
            <h1 className="display-title">Plan the treatment first.<br /><em>Then plan the journey around it.</em></h1>
            <p className="hero__description">JV Dental &amp; Implant Centre supports international patients seeking implants, full-mouth rehabilitation and complete adult dental care in Hyderabad. Begin remotely, understand the likely clinical pathway and provisional visit schedule, then coordinate the practical parts of your stay around treatment.</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/dental-treatments">Explore dental treatments</Link>
              <Link className="button button--ghost" href="/patient/login">Patient portal</Link>
            </div>
          </div>
          <p className="hero__note">Remote review is for preliminary planning. Final diagnosis, procedure choice, treatment sequence and recovery advice depend on an in-person examination and any imaging the treating dentist considers necessary.</p>
        </div>
        <div className="hero__visual" aria-label={internationalHero.alt} style={heroStyle}>
          <span className="hero__visual-label">Remote review · provisional dates · Hyderabad treatment · follow-up</span>
          <div className="hero__visual-copy"><p>International patient planning</p><strong>A clinically led journey from first review to return home.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Country-specific planning</p>
        <h2 className="section-title">Start with guidance for where you are travelling from.</h2>
        <p className="section-intro">Regional pages use the same JV Dental clinical pathway while highlighting practical questions that commonly matter before travelling from each market.</p>
        <div className="portal-grid international-grid">
          {internationalMarkets.map((market) => (
            <article className="portal-card" key={market.slug}>
              <div className="portal-card__header"><h3>{market.name}</h3></div>
              <div className="portal-card__body"><p>{market.intro}</p><Link className="text-link" href={`/international/${market.slug}`}>Planning from {market.name} →</Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Before booking travel</p>
        <h2 className="section-title">Reduce uncertainty before you commit to flights and accommodation.</h2>
        <p className="section-intro">The safest international-patient journey starts with clinical information, not travel bookings. These four steps help keep expectations realistic before you leave home.</p>
        <div className="principle-list international-trust-list">
          {beforeTravel.map(([title, body], index) => (
            <article className="principle" key={title}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Practical support in Hyderabad</p>
        <h2 className="section-title">Travel support organised around your clinical schedule.</h2>
        <p className="section-intro">Once provisional clinic dates are agreed, JV Dental can help coordinate practical parts of the Hyderabad stay so the treatment plan remains the centre of the journey.</p>
        <div className="principle-list international-trust-list international-support-list">
          {support.map(([title, body], index) => (
            <article className="principle" key={title}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </article>
          ))}
        </div>
        <p className="section-intro international-support-note">Travel assistance is coordination support rather than a guaranteed package inclusion. Exact arrangements, availability and any associated costs should be confirmed with the clinic before you travel.</p>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">International patient journey</p>
          <h2 className="section-title">Know the next clinical step before the next travel step.</h2>
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
        <p className="section-intro">JV Dental provides comprehensive adult dental care as well as advanced implant dentistry and full-mouth rehabilitation. The appropriate treatment pathway is determined after diagnosis rather than assumed before examination.</p>
        <div className="hero__actions">
          <Link className="button" href="/dental-treatments">View dental treatments <span aria-hidden="true">→</span></Link>
          <Link className="button button--ghost" href="/dental-implants">Dental implant care</Link>
          <Link className="button button--ghost" href="/guided-implants">Guided implants</Link>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">International dental treatment questions</p>
        <h2 className="section-title">Questions worth answering before treatment abroad.</h2>
        <div className="principle-list international-trust-list">
          {faqs.map(([question, answer], index) => (
            <article className="principle" key={question}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{question}</h3><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--tight">
        <p className="section-kicker">Planning safely</p>
        <h2 className="section-title">Clinical decisions stay separate from travel promises.</h2>
        <div className="principle-list international-trust-list">
          <article className="principle"><span className="principle__number">01</span><div><h3>Diagnosis first</h3><p>Travel coordination does not guarantee that a specific procedure is suitable. Final recommendations follow clinical assessment.</p></div></article>
          <article className="principle"><span className="principle__number">02</span><div><h3>Share records securely</h3><p>Patients who are ready for individual review can use the authenticated patient portal to share relevant records with the clinic.</p></div></article>
          <article className="principle"><span className="principle__number">03</span><div><h3>Recovery affects travel</h3><p>Return dates should allow for the treating dentist’s recommended review or recovery period rather than being fixed independently of treatment.</p></div></article>
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">Start from anywhere</p><h2>Tell JV Dental what you are considering before you organise the trip.</h2></div>
        <div className="assistant-panel">
          <p>Begin with an online consultation to discuss the likely treatment pathway and provisional visit requirements. When individual clinical review is appropriate, continue through the secure patient portal to share records.</p>
          <div className="hero__actions international-actions"><Link className="button button--light" href="/book">Book consultation</Link><Link className="button" href="/patient/login">Patient portal <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
