import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getInternationalMarket, internationalMarkets } from "@/content/international-markets";

type PageProps = { params: Promise<{ market: string }> };

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");

function languageAlternates() {
  return Object.fromEntries([
    ["en", `${siteUrl}/international`],
    ...internationalMarkets.map((market) => [market.hreflang, `${siteUrl}/international/${market.slug}`]),
  ]);
}

export function generateStaticParams() {
  return internationalMarkets.map((market) => ({ market: market.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market: slug } = await params;
  const market = getInternationalMarket(slug);
  if (!market) return { title: "International Dental Patients | JV Dental", robots: { index: false, follow: false } };

  return {
    title: market.title,
    description: market.description,
    alternates: {
      canonical: `/international/${market.slug}`,
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      title: market.title,
      description: market.description,
      url: `/international/${market.slug}`,
    },
  };
}

export default async function InternationalMarketPage({ params }: PageProps) {
  const { market: slug } = await params;
  const market = getInternationalMarket(slug);
  if (!market) notFound();

  const pageUrl = `${siteUrl}/international/${market.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: market.title,
        description: market.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#dentist` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "JV Dental", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "International patients", item: `${siteUrl}/international` },
          { "@type": "ListItem", position: 3, name: market.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="international-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />

      <section className="hero international-hero">
        <div className="hero__copy">
          <div>
            <p className="eyebrow">{market.eyebrow}</p>
            <h1 className="display-title">Dental treatment in Hyderabad<br /><em>planned before you travel.</em></h1>
            <p className="hero__description">{market.intro}</p>
            <div className="hero__actions">
              <Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link>
              <Link className="button button--ghost" href="/international">International patient support</Link>
              <Link className="button button--ghost" href="/dental-treatments">Dental treatments</Link>
            </div>
          </div>
          <p className="hero__note">Remote review supports planning but does not replace in-person examination. Final diagnosis, treatment sequence and timing depend on the treating dentist&apos;s clinical assessment and required imaging.</p>
        </div>
        <div className="hero__visual" aria-label={`Dental treatment planning for patients from ${market.name}`}>
          <span className="hero__visual-label">Remote review · Hyderabad treatment · return follow-up</span>
          <div className="hero__visual-copy"><p>{market.name} patient pathway</p><strong>Clinical planning first. Travel coordination around it.</strong></div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Planning from {market.name}</p>
        <h2 className="section-title">What to clarify before confirming your treatment trip.</h2>
        <div className="principle-list">
          {market.planningFocus.map((item, index) => (
            <article className="principle" key={item}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><p>{item}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">End-to-end international support</p>
          <h2 className="section-title">One coordinated journey around the dental plan.</h2>
          <p className="section-intro">JV Dental can coordinate airport pickup, hotel planning, local patient assistance, clinic travel and return transfer alongside the treatment schedule. These services support the patient journey and do not replace clinical diagnosis or medically necessary care.</p>
          <div className="hero__actions">
            <Link className="button button--light" href="/international">See the full international journey</Link>
            <Link className="button" href="/patient/login">Secure patient portal <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section-kicker">Questions from {market.name}</p>
        <h2 className="section-title">Plan the clinical pathway before the practical details.</h2>
        <div className="principle-list">
          {market.questions.map(([question, answer], index) => (
            <article className="principle" key={question}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{question}</h3><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="assistant-band">
        <div><p className="section-kicker">Start from {market.name}</p><h2>Share the concern first. Build the travel plan after the clinical review.</h2></div>
        <div className="assistant-panel">
          <p>Book an online consultation to discuss the treatment concern and likely next steps. When personal records are needed, continue through the secure patient portal.</p>
          <div className="hero__actions international-actions"><Link className="button button--light" href="/book">Book consultation</Link><Link className="button" href="/patient/login">Patient portal <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
