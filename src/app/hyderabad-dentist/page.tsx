import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dentist in Hyderabad | Areas Served by JV Dental",
  description:
    "JV Dental & Implant Centre serves patients from Ameerpet, S R Nagar, Begumpet, Punjagutta, Somajiguda, Banjara Hills, Jubilee Hills, Kukatpally, Secunderabad, Madhapur and surrounding Hyderabad areas.",
  alternates: { canonical: "/hyderabad-dentist" },
};

const clusters = [
  {
    title: "Ameerpet, S R Nagar & Balkampet",
    body: "This is JV Dental's primary local catchment around the clinic on Balkampet Road in S R Nagar, close to Ameerpet. Patients visit for routine dental care, restorative treatment, root canal care, tooth replacement and advanced implant dentistry.",
  },
  {
    title: "Begumpet, Punjagutta & Somajiguda",
    body: "Patients from these central Hyderabad areas can access JV Dental for general dentistry, ongoing restorative care and specialist treatment planning while keeping follow-up connected through one clinic.",
  },
  {
    title: "Banjara Hills & Jubilee Hills",
    body: "JV Dental supports patients seeking complete dental care as well as complex restorative, implant and full-mouth rehabilitation pathways from the Banjara Hills and Jubilee Hills side of Hyderabad.",
  },
  {
    title: "Kukatpally, KPHB & Moosapet",
    body: "Patients from the north-west Hyderabad corridor can book routine or advanced dental assessment at JV Dental, including missing-tooth replacement, crowns, dentures and implant treatment planning.",
  },
  {
    title: "Madhapur, HITEC City, Kondapur & Gachibowli",
    body: "For patients travelling from Hyderabad's western business corridor, the clinic offers scheduled dental consultations, structured treatment planning and digital patient support for ongoing care where appropriate.",
  },
  {
    title: "Secunderabad, Paradise & Marredpally",
    body: "Patients from the Secunderabad side of the city can access JV Dental for comprehensive dentistry, clinical review and advanced treatment while maintaining one connected treatment record and follow-up pathway.",
  },
] as const;

const faqs = [
  [
    "Does JV Dental serve patients from outside Ameerpet?",
    "Yes. While the clinic is located in S R Nagar close to Ameerpet, patients visit JV Dental from surrounding central, western and northern Hyderabad areas for both routine and advanced dental treatment.",
  ],
  [
    "Should I choose a dentist only based on distance?",
    "Distance matters for convenience, especially for treatments that need follow-up, but treatment scope, clinical assessment, continuity of care and the dentist's experience with the required procedure are also important considerations.",
  ],
  [
    "Can I book online before travelling across Hyderabad?",
    "Yes. You can request a clinic appointment online. For selected cases, an online consultation can also help clarify what records or imaging may be useful before an in-person visit.",
  ],
] as const;

export default function HyderabadDentistPage() {
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
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SiteHeader />

      <section className="hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">Dental clinic for Ameerpet & surrounding Hyderabad</p>
            <h1 className="display-title">Complete dental care for patients<br /><em>across Hyderabad.</em></h1>
            <p className="hero__description">
              JV Dental &amp; Implant Centre is based on Balkampet Road in S R Nagar, close to Ameerpet, and serves patients from surrounding Hyderabad for general dentistry, restorative treatment, oral surgery and advanced implant care.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/dentist-ameerpet">Ameerpet clinic page</Link>
            </div>
          </div>
          <p className="hero__note">Clinic address: 7-1-395/29 (34-A), Sai Ganga Towers, Balkampet Road, S R Nagar, Hyderabad, Telangana 500038.</p>
        </div>
        <div className="hero__visual" aria-label="JV Dental Hyderabad service area">
          <span className="hero__visual-label">Central · western · north-west Hyderabad</span>
          <div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Local continuity for routine and advanced dental care.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Hyderabad catchment</p>
        <h2 className="section-title">Areas from which patients commonly consider JV Dental.</h2>
        <p className="section-intro">
          These area groups describe the wider Hyderabad catchment around the clinic. They do not imply that JV Dental has branches in those neighbourhoods; the clinic's physical location remains S R Nagar, close to Ameerpet.
        </p>
        <div className="portal-grid international-grid">
          {clusters.map((cluster) => (
            <article className="portal-card" key={cluster.title}>
              <div className="portal-card__header"><h3>{cluster.title}</h3></div>
              <div className="portal-card__body"><p>{cluster.body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">What patients can book</p>
          <h2 className="section-title">Routine dentistry and specialist treatment in one clinic.</h2>
          <p className="section-intro">JV Dental provides complete dental care alongside advanced implant dentistry, so patients can begin with an assessment even when they do not know the exact treatment they need.</p>
          <div className="hero__actions">
            <Link className="button button--light" href="/dental-treatments">Explore all dental treatments</Link>
            <Link className="button" href="/dental-implants">Dental implant treatments <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Local dental care questions</p>
        <h2 className="section-title">Choosing a dental clinic across Hyderabad.</h2>
        <div className="principle-list">
          {faqs.map(([question, answer], index) => (
            <article className="principle" key={question}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{question}</h3><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">Before you travel across the city</p><h2>Book first and arrive with a clear next step.</h2></div>
        <div className="assistant-panel">
          <p>Request an appointment online and describe the main dental concern. The clinic can advise what to bring and whether existing dental records or imaging may be useful.</p>
          <Link className="button button--light" href="/book">Request an appointment <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
