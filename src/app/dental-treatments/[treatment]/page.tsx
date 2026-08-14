import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { generalTreatmentPages, getGeneralTreatmentPage } from "@/content/general-treatment-pages";

type PageProps = { params: Promise<{ treatment: string }> };

export function generateStaticParams() {
  return generalTreatmentPages.map(({ slug }) => ({ treatment: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = getGeneralTreatmentPage((await params).treatment);
  if (!page) return { title: "Dental Treatment | JV Dental", robots: { index: false, follow: false } };
  return { title: page.title, description: page.description, alternates: { canonical: `/dental-treatments/${page.slug}` } };
}

export default async function GeneralTreatmentPage({ params }: PageProps) {
  const page = getGeneralTreatmentPage((await params).treatment);
  if (!page) notFound();
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };

  return <main className="treatment-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <SiteHeader />
    <section className="hero treatment-hero"><div className="hero__copy treatment-hero__copy"><div><p className="eyebrow">{page.eyebrow}</p><h1 className="display-title">{page.heading}<br /><em>{page.accent}</em></h1><p className="hero__description">{page.intro}</p><div className="hero__actions"><Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-treatments">All dental treatments</Link></div></div><p className="hero__note">The appropriate treatment depends on clinical examination, medical and dental history, and any records or imaging the treating dentist considers necessary.</p></div><div className="hero__visual treatment-hero__visual" aria-label={page.title}><span className="hero__visual-label">Diagnosis · treatment planning · long-term oral health</span><div className="treatment-visual__marker" aria-hidden="true"><span /><span /><span /></div><div className="hero__visual-copy"><p>Complete dental care</p><strong>One clinical pathway, planned around you.</strong></div></div></section>
    <section className="section treatment-process"><p className="section-kicker">Your treatment pathway</p><h2 className="section-title">Understand the condition before choosing the treatment.</h2><div className="principle-list treatment-steps">{page.steps.map(([title, body], index) => <article className="principle treatment-step" key={title}><span className="principle__number">{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>
    <section className="dark-band treatment-considerations"><div className="section"><p className="section-kicker">Common questions</p><h2 className="section-title">Answers before your dental appointment.</h2><div className="principle-list treatment-steps">{page.faqs.map(([question, answer], index) => <article className="principle treatment-step" key={question}><span className="principle__number">{String(index + 1).padStart(2, "0")}</span><div><h3>{question}</h3><p>{answer}</p></div></article>)}</div></div></section>
    <section className="section section--tight treatment-next-step"><p className="section-kicker">Next step</p><h2 className="section-title">Start with an assessment, even when you are unsure of the treatment name.</h2><div className="hero__actions"><Link className="button" href="/book">Request an appointment</Link><Link className="button button--ghost" href="/dentist-ameerpet">Visit JV Dental near Ameerpet</Link><Link className="button button--ghost" href="/dental-implants">Missing teeth and implants</Link></div></section>
    <SiteFooter />
  </main>;
}
