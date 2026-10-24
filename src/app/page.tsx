import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getWebsiteMedia } from "@/lib/content/website-media";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const principles = [
  { title: "Diagnosis before treatment", body: "Dental care starts with understanding the problem, the condition of the teeth and gums, and the patient’s priorities before recommending a procedure." },
  { title: "Restoration-led implant planning", body: "When implants are needed, the final tooth, bite, hygiene access and long-term maintainability should guide how the case is planned—not the other way around." },
  { title: "One documented journey", body: "From first enquiry to treatment planning, clinical records, payments and follow-up, the platform is designed around one continuous patient journey." },
];

const implantWorkflow = [
  { title: "Comprehensive implant consultation", href: "/dental-implants" },
  { title: "3D imaging and individual treatment planning", href: "/guided-implants" },
  { title: "Guided implant placement when appropriate", href: "/guided-implants" },
  { title: "Restoration, bite and smile assessment", href: "/dental-implants" },
  { title: "Long-term reviews and implant maintenance", href: "/dental-implants" },
];

const completeCare = [
  { title: "General Dentistry", body: "Check-ups, cleaning, preventive care and fillings.", href: "/dental-treatments/general-dentistry", image: "/media/IMG-20260918-WA0029.jpg" },
  { title: "Root Canal & Restorative", body: "Root canal treatment, crowns and bridges.", href: "/dental-treatments/root-canal-treatment", image: "/media/IMG-20260918-WA0022.jpg" },
  { title: "Cosmetic Dentistry", body: "Smile-focused restorative care and professional whitening.", href: "/dental-treatments/cosmetic-dentistry", image: "/media/IMG-20260918-WA0021.jpg" },
  { title: "Orthodontics", body: "Braces and orthodontic treatment for suitable cases.", href: "/dental-treatments/clear-aligners", image: "/media/IMG-20260918-WA0025.jpg" },
  { title: "Clear Aligners", body: "Discreet removable aligners for suitable cases.", href: "/dental-treatments/clear-aligners", image: "/media/IMG-20260918-WA0024.jpg" },
  { title: "Oral Surgery", body: "Tooth removal and minor oral surgical procedures.", href: "/dental-treatments/oral-surgery", image: "/media/IMG-20260918-WA0023.jpg" },
  { title: "Gum Care", body: "Periodontal assessment, scaling and gum maintenance.", href: "/dental-treatments/gum-care", image: "/media/file_000000007394821184a2a923bc754f48.png" },
] as const;

const journey = ["Share your concern", "Remote dental review", "Online consultation", "Travel & stay coordination", "Dental treatment in Hyderabad", "Return & remote follow-up"];

const clinicVisuals = [
  { key: "team", label: "Dental team", title: "Meet our dental team", href: "/doctors" },
  { key: "clinic", label: "Clinical environment", title: "Modern dental treatment setting", href: "/dental-treatments" },
  { key: "planning", label: "Digital dentistry", title: "3D implant planning & guided workflows", href: "/guided-implants" },
  { key: "cases", label: "Clinical evidence", title: "Documented dental cases", href: "/cases" },
];

export default async function Home() {
  const [homeHero, clinicTeam] = await Promise.all([
    getWebsiteMedia("home-hero", "JV Dental implant-focused dental clinic in Hyderabad"),
    getWebsiteMedia("clinic-team", "JV Dental clinical team in Hyderabad"),
  ]);

  return <main className="home-page"><SiteHeader />
    <section className="hero" aria-labelledby="hero-title"><div className="hero__copy"><div><p className="eyebrow">Dental implants · S R Nagar / Ameerpet · Hyderabad</p><h1 className="display-title" id="hero-title">Personalised implant care<br />{" "}with <em>complete adult dentistry.</em></h1><p className="hero__description">JV Dental brings together experienced clinicians, diagnosis-led planning and complete adult dental care. Implant treatment is planned around your health, function, comfort and long-term maintenance.</p><div className="hero__actions"><Link className="button" href="/book">Request an implant assessment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-implants">Explore dental implants</Link></div></div><p className="hero__note">Treatment begins with clinical assessment and appropriate diagnosis. Online review can support planning before a clinic visit or international travel, but does not replace an in-person dental examination.</p></div><div className="hero__visual home-hero-video" aria-label="JV Dental clinical care and implant treatment"><video className="home-hero-video__media" autoPlay muted loop playsInline controls preload="auto" aria-label="JV Dental implant care video"><source src="/media/video_20261021_175507_edit.mp4" type="video/mp4" /></video></div></section>

    <section className="data-strip" aria-label="JV Dental focus areas"><div className="data-strip__item"><span>Primary focus</span><strong>Dental implants</strong></div><div className="data-strip__item"><span>Advanced workflow</span><strong>Guided implant surgery</strong></div><div className="data-strip__item"><span>Complex care</span><strong>Full-mouth rehabilitation</strong></div><div className="data-strip__item"><span>Supporting care</span><strong>Complete adult dentistry</strong></div></section>

    <section className="clinic-evidence" aria-label="JV Dental clinical environment">{clinicVisuals.map((item) => {
      const isTeam = item.key === "team" && clinicTeam.url;
      return <Link className={`clinic-evidence__item clinic-evidence__item--${item.key}`} href={item.href} key={item.key}><span className="clinic-evidence__visual" aria-label={isTeam ? clinicTeam.alt : undefined} aria-hidden={isTeam ? undefined : "true"} style={isTeam ? { backgroundImage: `linear-gradient(180deg, rgba(9,25,31,.04), rgba(9,25,31,.36)), url(${clinicTeam.url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!isTeam ? <><i /><i /><i /></> : null}</span><span className="clinic-evidence__copy"><small>{item.label}</small><strong>{item.title}</strong><b aria-hidden="true">↗</b></span></Link>;
    })}</section>

    <section className="section" id="approach"><p className="section-kicker">Implant philosophy</p><h2 className="section-title">Plan the final tooth first. Build the implant treatment around long-term function.</h2><p className="section-intro">Implant care is the major clinical focus at JV Dental. Every case starts with diagnosis, restorative planning and an assessment of bone, gums, bite and maintainability before the surgical pathway is chosen.</p><div className="editorial-split"><div className="editorial-quote">“Understand the problem. Plan the restoration. Treat with the long term in mind.”<small>Diagnosis-led implant dentistry</small></div><div className="principle-list">{principles.map((p, i) => <article className="principle" key={p.title}><span className="principle__number">0{i + 1}</span><div><h3>{p.title}</h3><p>{p.body}</p></div></article>)}</div></div></section>

    <section className="dark-band" id="treatments"><div className="section"><p className="section-kicker">Implant care at JV Dental</p><h2 className="section-title">Thoughtful implant planning, from consultation to long-term care.</h2><p className="section-intro">Our dental team assesses your oral health, available bone, bite and restoration goals before recommending an individual treatment plan. Where clinically suitable, digital planning and guided placement can support precise implant treatment.</p><div className="treatments">{implantWorkflow.map((t, i) => <Link className="treatment-row" href={t.href} key={t.title}><span>{String(i + 1).padStart(2,"0")}</span><strong>{t.title}</strong><b aria-hidden="true">↗</b></Link>)}</div><div className="hero__actions"><Link className="button button--light" href="/dental-implants">Explore implant care at JV Dental <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/doctors">Meet our dental team</Link></div></div></section>

    <section className="section" id="complete-dental-care"><p className="section-kicker">Complete dental care</p><h2 className="section-title">More than implants when your treatment needs it.</h2><p className="section-intro">Implants remain our main focus, but patients can also access complete adult dental care at the same clinic. These supporting treatments are kept intentionally compact on the homepage.</p><div className="complete-care-grid">{completeCare.map((item) => <Link className="complete-care-card" href={item.href} key={item.title}><span className="complete-care-card__image" style={{ backgroundImage: `linear-gradient(180deg, rgba(9,25,31,.03), rgba(9,25,31,.45)), url(${item.image})` }} aria-hidden="true"/><span className="complete-care-card__copy"><strong>{item.title}</strong><small>{item.body}</small><b aria-hidden="true">Explore →</b></span></Link>)}</div><div className="hero__actions"><Link className="button button--ghost" href="/dental-treatments">View all adult dental treatments</Link></div></section>

    <section className="section" id="local-dentist"><p className="section-kicker">Dentist near Ameerpet, Hyderabad</p><h2 className="section-title">Implant-focused care from S R Nagar for Hyderabad and beyond.</h2><p className="section-intro">JV Dental &amp; Implant Centre is located at Sai Ganga Towers on Balkampet Road, S R Nagar, close to Ameerpet. Patients can access implant assessment, restorative treatment and supporting adult dental care from the same clinic.</p><div className="hero__actions"><Link className="button" href="/book">Book an assessment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-treatments">Complete dental care</Link></div></section>

    <section className="section" id="cases"><p className="section-kicker">Implant & dental cases</p><h2 className="section-title">See how treatment is planned—not only how it finishes.</h2><p className="section-intro">Published cases are structured around diagnosis → planning → treatment → restoration → outcome, with patient consent and appropriate anonymisation.</p><article className="case-feature"><div className="case-feature__visual"><span>Clinical dental imagery is published only with appropriate consent</span></div><div className="case-feature__content"><div><p className="section-kicker">Inside a dental case</p><h3>Diagnosis and planning come before the final result.</h3><div className="case-meta"><div><span>01 · Dental diagnosis</span><strong>Clinical findings and imaging</strong></div><div><span>02 · Treatment planning</span><strong>Restorative and clinical strategy</strong></div><div><span>03 · Treatment</span><strong>Documented clinical stages</strong></div><div><span>04 · Restoration</span><strong>Final result and follow-up</strong></div></div></div><Link className="text-link" href="/cases">Explore documented dental cases →</Link></div></article></section>

    <section className="section" id="international"><p className="section-kicker">International implant patients</p><h2 className="section-title">Plan implant treatment in Hyderabad with support from arrival to return.</h2><p className="section-intro">International patients can begin remotely, discuss implant and restorative treatment before travelling, and coordinate airport pickup, hotel planning, local assistance, clinic visits and return transfer around the clinical schedule.</p><div className="journey">{journey.map((step, i) => <div className="journey-step" key={step}><span>0{i + 1}</span><strong>{step}</strong></div>)}</div><div className="hero__actions"><Link className="button button--ghost" href="/international">International patient support</Link><Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link></div></section>

    <SiteFooter /></main>;
}
