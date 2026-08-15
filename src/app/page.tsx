import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const principles = [
  { title: "Diagnosis before treatment", body: "Dental care starts with understanding the problem, the condition of the teeth and gums, and the patient’s priorities before recommending a procedure." },
  { title: "Restoration-led implant planning", body: "When implants are needed, the final tooth, bite, hygiene access and long-term maintainability should guide how the case is planned—not the other way around." },
  { title: "One documented journey", body: "From first enquiry to treatment planning, clinical records, payments and follow-up, the platform is designed around one continuous patient journey." },
];

const implantTreatments = [
  { title: "Single & multiple dental implants", href: "/dental-implants" },
  { title: "Full-arch implant rehabilitation", href: "/full-arch-implants" },
  { title: "All-on-4 / All-on-6 planning", href: "/all-on-4-all-on-6" },
  { title: "Bone grafting & complex implant cases", href: "/bone-grafting-dental-implants" },
  { title: "Digitally guided implant surgery", href: "/guided-implants" },
];

const completeCare = [
  { title: "General Dentistry", body: "Check-ups, cleaning, preventive care and fillings.", href: "/dental-treatments/general-dentistry", image: "https://images.pexels.com/photos/3845723/pexels-photo-3845723.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { title: "Root Canal & Restorative", body: "Root canal treatment, crowns and bridges.", href: "/dental-treatments/root-canal-treatment", image: "https://images.pexels.com/photos/6528869/pexels-photo-6528869.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { title: "Cosmetic Dentistry", body: "Smile-focused restorative care and professional whitening.", href: "/dental-treatments/cosmetic-dentistry", image: "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { title: "Orthodontics", body: "Clear aligners and braces for suitable cases.", href: "/dental-treatments/clear-aligners", image: "https://images.pexels.com/photos/6812520/pexels-photo-6812520.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { title: "Gum Care", body: "Periodontal assessment, scaling and gum maintenance.", href: "/dental-treatments/gum-care", image: "https://images.pexels.com/photos/13264624/pexels-photo-13264624.jpeg?auto=compress&cs=tinysrgb&w=900" },
] as const;

const journey = ["Share your concern", "Remote dental review", "Online consultation", "Travel & stay coordination", "Dental treatment in Hyderabad", "Return & remote follow-up"];

const clinicVisuals = [
  { key: "team", label: "Dental team", title: "Dentist-led complete dental care", href: "/doctors" },
  { key: "clinic", label: "Clinical environment", title: "Modern dental treatment setting", href: "/dental-treatments" },
  { key: "planning", label: "Digital dentistry", title: "3D implant planning & guided workflows", href: "/guided-implants" },
  { key: "cases", label: "Clinical evidence", title: "Documented dental cases", href: "/cases" },
];

export default function Home() {
  return <main className="home-page"><SiteHeader />
    <section className="hero" aria-labelledby="hero-title"><div className="hero__copy"><div><p className="eyebrow">Implant-focused dental clinic · Ameerpet / S R Nagar · Hyderabad</p><h1 className="display-title" id="hero-title">Advanced dental implants<br />&amp; <em>complete adult dentistry.</em></h1><p className="hero__description">JV Dental focuses on dental implants, guided implant surgery and complex full-mouth rehabilitation, supported by comprehensive adult dental care when patients need treatment beyond implants.</p><div className="hero__actions"><Link className="button" href="/book">Request an implant assessment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-implants">Explore dental implants</Link></div></div><p className="hero__note">Treatment begins with clinical assessment and appropriate diagnosis. Online review can support planning before a clinic visit or international travel, but does not replace an in-person dental examination.</p></div><div className="hero__visual" aria-label="Dental implant planning at JV Dental Hyderabad"><span className="hero__visual-label">Dental implants · guided surgery · full-mouth rehabilitation</span><div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>Implant dentistry, carefully planned.</strong></div></div></section>

    <section className="data-strip" aria-label="JV Dental focus areas"><div className="data-strip__item"><span>Primary focus</span><strong>Dental implants</strong></div><div className="data-strip__item"><span>Advanced workflow</span><strong>Guided implant surgery</strong></div><div className="data-strip__item"><span>Complex care</span><strong>Full-mouth rehabilitation</strong></div><div className="data-strip__item"><span>Supporting care</span><strong>Complete adult dentistry</strong></div></section>

    <section className="clinic-evidence" aria-label="JV Dental clinical environment">{clinicVisuals.map((item) => <Link className={`clinic-evidence__item clinic-evidence__item--${item.key}`} href={item.href} key={item.key}><span className="clinic-evidence__visual" aria-hidden="true"><i /><i /><i /></span><span className="clinic-evidence__copy"><small>{item.label}</small><strong>{item.title}</strong><b aria-hidden="true">↗</b></span></Link>)}</section>

    <section className="section" id="approach"><p className="section-kicker">Implant philosophy</p><h2 className="section-title">Plan the final tooth first. Build the implant treatment around long-term function.</h2><p className="section-intro">Implant care is the major clinical focus at JV Dental. Every case starts with diagnosis, restorative planning and an assessment of bone, gums, bite and maintainability before the surgical pathway is chosen.</p><div className="editorial-split"><div className="editorial-quote">“Understand the problem. Plan the restoration. Treat with the long term in mind.”<small>Diagnosis-led implant dentistry</small></div><div className="principle-list">{principles.map((p, i) => <article className="principle" key={p.title}><span className="principle__number">0{i + 1}</span><div><h3>{p.title}</h3><p>{p.body}</p></div></article>)}</div></div></section>

    <section className="dark-band" id="treatments"><div className="section"><p className="section-kicker">Implant treatments</p><h2 className="section-title">Dedicated implant pathways for missing teeth and complex rehabilitation.</h2><p className="section-intro">From a single missing tooth to full-arch rehabilitation, JV Dental provides focused implant pathways with digital planning and guided options where clinically appropriate.</p><div className="treatments">{implantTreatments.map((t, i) => <Link className="treatment-row" href={t.href} key={t.title}><span>{String(i + 1).padStart(2,"0")}</span><strong>{t.title}</strong><b aria-hidden="true">↗</b></Link>)}</div></div></section>

    <section className="section" id="complete-dental-care"><p className="section-kicker">Complete dental care</p><h2 className="section-title">More than implants when your treatment needs it.</h2><p className="section-intro">Implants remain our main focus, but patients can also access complete adult dental care at the same clinic. These supporting treatments are kept intentionally compact on the homepage.</p><div className="complete-care-grid">{completeCare.map((item) => <Link className="complete-care-card" href={item.href} key={item.title}><span className="complete-care-card__image" style={{ backgroundImage: `linear-gradient(180deg, rgba(9,25,31,.03), rgba(9,25,31,.45)), url(${item.image})` }} aria-hidden="true"/><span className="complete-care-card__copy"><strong>{item.title}</strong><small>{item.body}</small><b aria-hidden="true">Explore →</b></span></Link>)}</div><div className="hero__actions"><Link className="button button--ghost" href="/dental-treatments">View all adult dental treatments</Link></div></section>

    <section className="section" id="local-dentist"><p className="section-kicker">Dentist near Ameerpet, Hyderabad</p><h2 className="section-title">Implant-focused care from S R Nagar for Hyderabad and beyond.</h2><p className="section-intro">JV Dental &amp; Implant Centre is located at Sai Ganga Towers on Balkampet Road, S R Nagar, close to Ameerpet. Patients can access implant assessment, restorative treatment and supporting adult dental care from the same clinic.</p><div className="hero__actions"><Link className="button" href="/book">Book an assessment <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-treatments">Complete dental care</Link></div></section>

    <section className="section" id="cases"><p className="section-kicker">Implant & dental cases</p><h2 className="section-title">See how treatment is planned—not only how it finishes.</h2><p className="section-intro">Published cases are structured around diagnosis → planning → treatment → restoration → outcome, with patient consent and appropriate anonymisation.</p><article className="case-feature"><div className="case-feature__visual"><span>Clinical dental imagery is published only with appropriate consent</span></div><div className="case-feature__content"><div><p className="section-kicker">Inside a dental case</p><h3>Diagnosis and planning come before the final result.</h3><div className="case-meta"><div><span>01 · Dental diagnosis</span><strong>Clinical findings and imaging</strong></div><div><span>02 · Treatment planning</span><strong>Restorative and clinical strategy</strong></div><div><span>03 · Treatment</span><strong>Documented clinical stages</strong></div><div><span>04 · Restoration</span><strong>Final result and follow-up</strong></div></div></div><Link className="text-link" href="/cases">Explore documented dental cases →</Link></div></article></section>

    <section className="section" id="international"><p className="section-kicker">International implant patients</p><h2 className="section-title">Plan implant treatment in Hyderabad with support from arrival to return.</h2><p className="section-intro">International patients can begin remotely, discuss implant and restorative treatment before travelling, and coordinate airport pickup, hotel planning, local assistance, clinic visits and return transfer around the clinical schedule.</p><div className="journey">{journey.map((step, i) => <div className="journey-step" key={step}><span>0{i + 1}</span><strong>{step}</strong></div>)}</div><div className="hero__actions"><Link className="button button--ghost" href="/international">International patient support</Link><Link className="button" href="/book">Book an online consultation <span aria-hidden="true">→</span></Link></div></section>

    <section className="assistant-band"><div><p className="section-kicker">JV Dental digital assistant</p><h2>Ask about dental implants, our clinic, treatment pathways and planning care in Hyderabad.</h2></div><div className="assistant-panel"><p>The public assistant provides clinic information and general dental education. Personal diagnosis, radiograph review and treatment decisions remain with the clinical team.</p><Link className="button button--light" href="/book">Book a consultation <span aria-hidden="true">→</span></Link></div></section>
    <SiteFooter /></main>;
}
