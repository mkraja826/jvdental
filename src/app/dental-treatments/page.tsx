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
    body: "Conventional and DIOnavi guided implant surgery, digital planning and guide fabrication, full-mouth rehabilitation, bone grafting and implant prosthesis.",
    href: "/dental-implants",
    cta: "Explore dental implants →",
  },
  {
    title: "Root Canal Treatment",
    body: "Root canal care with post-and-core restoration and periapical surgery available where clinically indicated.",
    href: "/dental-treatments/root-canal-treatment",
    cta: "Explore treatment →",
  },
  {
    title: "Crowns and Bridges",
    body: "Metal-free crowns including zirconia, LAVA and E.max options, together with DMLS crowns and bridge planning where suitable.",
    href: "/dental-treatments/crowns-bridges",
    cta: "Explore treatment →",
  },
  {
    title: "Cosmetic Dentistry",
    body: "Veneers, professional teeth whitening and smile designing planned around oral health, tooth condition and individual smile goals.",
    href: "/dental-treatments/cosmetic-dentistry",
    cta: "Explore treatment →",
  },
  {
    title: "Oral Surgery",
    body: "Oral surgical assessment and care including extractions, impactions and fracture treatment where clinically indicated.",
    href: "/dental-treatments/oral-surgery",
    cta: "Explore treatment →",
  },
  {
    title: "Gum Treatment",
    body: "Periodontal care including laser surgery, flap surgery and gum depigmentation where clinically appropriate.",
    href: "/dental-treatments/gum-care",
    cta: "Explore treatment →",
  },
  {
    title: "Preventive and General Dentistry",
    body: "Fillings, oral prophylaxis, pit and fissure sealants and fluoride applications to support long-term oral health.",
    href: "/dental-treatments/general-dentistry",
    cta: "Explore treatment →",
  },
  {
    title: "Aligners and Braces",
    body: "Metal braces, ceramic braces, Invisalign and Spark aligners following orthodontic assessment and treatment planning.",
    href: "/dental-treatments/aligners-braces",
    cta: "Explore treatment →",
  },
] as const;

const individual = [
  ["Dental Implants", "/dental-implants"],
  ["Root Canal Treatment", "/dental-treatments/root-canal-treatment"],
  ["Crowns and Bridges", "/dental-treatments/crowns-bridges"],
  ["Cosmetic Dentistry", "/dental-treatments/cosmetic-dentistry"],
  ["Oral Surgery", "/dental-treatments/oral-surgery"],
  ["Gum Treatment", "/dental-treatments/gum-care"],
  ["Preventive and General Dentistry", "/dental-treatments/general-dentistry"],
  ["Aligners and Braces", "/dental-treatments/aligners-braces"],
] as const;

export default function DentalTreatmentsPage() {
  return <main><SiteHeader />
    <section className="hero"><div className="hero__copy"><div><p className="eyebrow">Complete adult dental care · Hyderabad</p><h1 className="display-title">Complete dental care,<br /><em>with implants at our core.</em></h1><p className="hero__description">JV Dental is strongly focused on advanced implant dentistry while also providing comprehensive adult dental care for teeth, gums, function and smile concerns.</p><div className="hero__actions"><Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-implants">Explore dental implants</Link></div></div><p className="hero__note">You do not need to know the treatment name before booking. Start with your concern and the dentist can assess the appropriate pathway.</p></div><div className="hero__visual" aria-label="Complete adult dental care at JV Dental"><span className="hero__visual-label">Implant-focused · complete adult dentistry</span><div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Advanced implants. Complete dental care.</strong></div></div></section>
    <section className="section"><p className="section-kicker">Our treatments</p><h2 className="section-title">Eight areas of dental care.</h2><p className="section-intro">From advanced implant dentistry to preventive, restorative, cosmetic, periodontal and orthodontic care, treatment is planned around your individual clinical needs.</p><div className="portal-grid international-grid">{groups.map((g) => <Link className="portal-card" href={g.href} key={g.title}><div className="portal-card__header"><h3>{g.title}</h3></div><div className="portal-card__body"><p>{g.body}</p><strong>{g.cta}</strong></div></Link>)}</div></section>
    <section className="dark-band"><div className="section"><p className="section-kicker">Treatment directory</p><h2 className="section-title">Find the treatment relevant to your concern.</h2><div className="treatments">{individual.map(([title, href], i) => <Link className="treatment-row" href={href} key={title}><span>{String(i + 1).padStart(2,"0")}</span><strong>{title}</strong><b aria-hidden="true">↗</b></Link>)}</div></div></section>
    <section className="section"><p className="section-kicker">Our primary focus</p><h2 className="section-title">Need to replace missing teeth?</h2><p className="section-intro">Explore JV Dental&apos;s dedicated implant pathways for single or multiple missing teeth, full-arch rehabilitation, guided implant surgery and complex implant planning.</p><div className="hero__actions"><Link className="button" href="/dental-implants">Explore dental implants <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/guided-implants">Guided implants</Link><Link className="button button--ghost" href="/full-arch-implants">Full-arch implants</Link></div></section>
    <SiteFooter /></main>;
}
