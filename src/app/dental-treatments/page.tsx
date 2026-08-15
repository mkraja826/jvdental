import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dental Treatments in Ameerpet, Hyderabad",
  description: "Adult dental care at JV Dental in Hyderabad including general dentistry, root canal care, crowns, cosmetic dentistry, orthodontics and gum care, alongside advanced implant dentistry.",
  alternates: { canonical: "/dental-treatments" },
};

const groups = [
  { title: "General Dentistry", body: "Check-ups, preventive care, professional cleaning and tooth-coloured fillings for long-term oral health.", href: "/dental-treatments/general-dentistry" },
  { title: "Root Canal & Restorative", body: "Root canal treatment, crowns and bridges focused on preserving teeth and restoring comfortable function.", href: "/dental-treatments/root-canal-treatment" },
  { title: "Cosmetic Dentistry", body: "Smile-focused care including aesthetic restorations and professional whitening where clinically suitable.", href: "/dental-treatments/cosmetic-dentistry" },
  { title: "Orthodontics", body: "Clear aligners and braces for suitable tooth-alignment and bite concerns following clinical assessment.", href: "/dental-treatments/clear-aligners" },
  { title: "Gum Care", body: "Periodontal assessment, professional cleaning and gum-health maintenance for natural teeth and implants.", href: "/dental-treatments/gum-care" },
] as const;

const individual = [
  ["Root canal treatment", "/dental-treatments/root-canal-treatment"], ["Crowns & bridges", "/dental-treatments/crowns-bridges"], ["Teeth whitening", "/dental-treatments/teeth-whitening"], ["Clear aligners", "/dental-treatments/clear-aligners"], ["Braces", "/dental-treatments/braces"], ["Scaling & cleaning", "/dental-treatments/scaling-cleaning"], ["Dental fillings", "/dental-treatments/fillings"],
] as const;

export default function DentalTreatmentsPage() {
  return <main><SiteHeader />
    <section className="hero"><div className="hero__copy"><div><p className="eyebrow">Complete adult dental care · Hyderabad</p><h1 className="display-title">Complete dental care,<br /><em>with implants at our core.</em></h1><p className="hero__description">JV Dental is strongly focused on advanced implant dentistry while also providing comprehensive adult dental care for teeth, gums, function and smile concerns.</p><div className="hero__actions"><Link className="button" href="/book">Book a dental appointment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-implants">Explore dental implants</Link></div></div><p className="hero__note">You do not need to know the treatment name before booking. Start with your concern and the dentist can assess the appropriate pathway.</p></div><div className="hero__visual" aria-label="Complete adult dental care at JV Dental"><span className="hero__visual-label">Implant-focused · complete adult dentistry</span><div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Advanced implants. Complete dental care.</strong></div></div></section>
    <section className="section"><p className="section-kicker">Complete dental care</p><h2 className="section-title">Five supporting areas of adult dentistry.</h2><p className="section-intro">These services complement our implant focus without changing the clinic&apos;s core positioning.</p><div className="portal-grid international-grid">{groups.map((g) => <Link className="portal-card" href={g.href} key={g.title}><div className="portal-card__header"><h3>{g.title}</h3></div><div className="portal-card__body"><p>{g.body}</p><strong>Explore treatment →</strong></div></Link>)}</div></section>
    <section className="dark-band"><div className="section"><p className="section-kicker">Individual treatments</p><h2 className="section-title">Find the treatment relevant to your concern.</h2><div className="treatments">{individual.map(([title, href], i) => <Link className="treatment-row" href={href} key={href}><span>{String(i + 1).padStart(2,"0")}</span><strong>{title}</strong><b aria-hidden="true">↗</b></Link>)}</div></div></section>
    <section className="section"><p className="section-kicker">Our primary focus</p><h2 className="section-title">Need to replace missing teeth?</h2><p className="section-intro">Explore JV Dental&apos;s dedicated implant pathways for single or multiple missing teeth, full-arch rehabilitation, guided implant surgery and complex implant planning.</p><div className="hero__actions"><Link className="button" href="/dental-implants">Explore dental implants <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/guided-implants">Guided implants</Link><Link className="button button--ghost" href="/full-arch-implants">Full-arch implants</Link></div></section>
    <SiteFooter /></main>;
}
