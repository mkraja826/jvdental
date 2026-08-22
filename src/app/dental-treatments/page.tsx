import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dental Treatments in Ameerpet, Hyderabad",
  description: "Dental treatments at JV Dental in Hyderabad including dental implants, root canal treatment, crowns and bridges, cosmetic dentistry, oral surgery, gum treatment, preventive and general dentistry, aligners and braces.",
  alternates: { canonical: "/dental-treatments" },
};

const groups = [
  {
    title: "Dental Implants",
    body: "Implant dentistry for single or multiple missing teeth, guided implant surgery and full-arch rehabilitation with detailed treatment planning.",
    href: "/dental-implants",
    cta: "Explore dental implants →",
  },
  {
    title: "Root Canal Treatment",
    body: "Endodontic care focused on treating infection or inflammation inside a tooth and preserving the natural tooth where clinically appropriate.",
    href: "/dental-treatments/root-canal-treatment",
    cta: "Explore treatment →",
  },
  {
    title: "Crowns and Bridges",
    body: "Fixed restorations designed to strengthen compromised teeth or replace selected missing teeth with attention to function, bite and appearance.",
    href: "/dental-treatments/crowns-bridges",
    cta: "Explore treatment →",
  },
  {
    title: "Cosmetic Dentistry",
    body: "Smile-focused care including aesthetic restorations and professional whitening where clinically suitable and planned around oral health.",
    href: "/dental-treatments/cosmetic-dentistry",
    cta: "Explore treatment →",
  },
  {
    title: "Oral Surgery",
    body: "Clinical assessment and oral surgical care where indicated, with clear treatment planning, appropriate imaging and aftercare guidance.",
    href: "/book",
    cta: "Book an assessment →",
  },
  {
    title: "Gum Treatment",
    body: "Assessment and treatment for gum inflammation and periodontal concerns around natural teeth and dental implants.",
    href: "/dental-treatments/gum-care",
    cta: "Explore treatment →",
  },
  {
    title: "Preventive and General Dentistry",
    body: "Routine dental examinations, preventive care, professional cleaning and restorative treatment to support long-term oral health.",
    href: "/dental-treatments/general-dentistry",
    cta: "Explore treatment →",
  },
  {
    title: "Aligners and Braces",
    body: "Clear aligners and fixed braces for suitable tooth-alignment and bite concerns following clinical and orthodontic assessment.",
    href: "/dental-treatments/clear-aligners",
    cta: "Explore treatment →",
  },
] as const;

const individual = [
  ["Dental Implants", "/dental-implants"],
  ["Root Canal Treatment", "/dental-treatments/root-canal-treatment"],
  ["Crowns and Bridges", "/dental-treatments/crowns-bridges"],
  ["Cosmetic Dentistry", "/dental-treatments/cosmetic-dentistry"],
  ["Oral Surgery", "/book"],
  ["Gum Treatment", "/dental-treatments/gum-care"],
  ["Preventive and General Dentistry", "/dental-treatments/general-dentistry"],
  ["Aligners and Braces", "/dental-treatments/clear-aligners"],
] as const;

export default function DentalTreatmentsPage() {
  return <main><SiteHeader />
    <section className="hero"><div className="hero__copy"><div><p className="eyebrow">Complete adult dental care · Hyderabad</p><h1 className="display-title">Complete dental care,<br /><em>with implants at our core.</em></h1><p className="hero__description">JV Dental is strongly focused on advanced implant dentistry while also providing comprehensive adult dental care for teeth, gums, function and smile concerns.</p><div className="hero__actions"><Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-implants">Explore dental implants</Link></div></div><p className="hero__note">You do not need to know the treatment name before booking. Start with your concern and the dentist can assess the appropriate pathway.</p></div><div className="hero__visual" aria-label="Complete adult dental care at JV Dental"><span className="hero__visual-label">Implant-focused · complete adult dentistry</span><div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Advanced implants. Complete dental care.</strong></div></div></section>
    <section className="section"><p className="section-kicker">Our treatments</p><h2 className="section-title">Eight areas of dental care.</h2><p className="section-intro">From advanced implant dentistry to preventive, restorative, cosmetic, periodontal and orthodontic care, treatment is planned around your individual clinical needs.</p><div className="portal-grid international-grid">{groups.map((g) => <Link className="portal-card" href={g.href} key={g.title}><div className="portal-card__header"><h3>{g.title}</h3></div><div className="portal-card__body"><p>{g.body}</p><strong>{g.cta}</strong></div></Link>)}</div></section>
    <section className="dark-band"><div className="section"><p className="section-kicker">Treatment directory</p><h2 className="section-title">Find the treatment relevant to your concern.</h2><div className="treatments">{individual.map(([title, href], i) => <Link className="treatment-row" href={href} key={title}><span>{String(i + 1).padStart(2,"0")}</span><strong>{title}</strong><b aria-hidden="true">↗</b></Link>)}</div></div></section>
    <section className="section"><p className="section-kicker">Our primary focus</p><h2 className="section-title">Need to replace missing teeth?</h2><p className="section-intro">Explore JV Dental&apos;s dedicated implant pathways for single or multiple missing teeth, full-arch rehabilitation, guided implant surgery and complex implant planning.</p><div className="hero__actions"><Link className="button" href="/dental-implants">Explore dental implants <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/guided-implants">Guided implants</Link><Link className="button button--ghost" href="/full-arch-implants">Full-arch implants</Link></div></section>
    <SiteFooter /></main>;
}
