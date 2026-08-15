import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Treatment = {
  title: string;
  summary: string;
  intro: string;
  signs: string[];
  steps: string[];
  benefits: string[];
  related: { label: string; href: string }[];
};

const treatmentImages: Record<string, string> = {
  "general-dentistry": "https://images.pexels.com/photos/3845723/pexels-photo-3845723.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "root-canal-treatment": "https://images.pexels.com/photos/6528869/pexels-photo-6528869.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "crowns-bridges": "https://images.pexels.com/photos/6812520/pexels-photo-6812520.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "cosmetic-dentistry": "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "teeth-whitening": "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "clear-aligners": "https://images.pexels.com/photos/6812520/pexels-photo-6812520.jpeg?auto=compress&cs=tinysrgb&w=1400",
  braces: "https://images.pexels.com/photos/6812520/pexels-photo-6812520.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "gum-care": "https://images.pexels.com/photos/13264624/pexels-photo-13264624.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "scaling-cleaning": "https://images.pexels.com/photos/3845723/pexels-photo-3845723.jpeg?auto=compress&cs=tinysrgb&w=1400",
  fillings: "https://images.pexels.com/photos/6528869/pexels-photo-6528869.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

const treatments: Record<string, Treatment> = {
  "general-dentistry": {
    title: "General Dentistry",
    summary: "Routine assessment, preventive care, professional cleaning and tooth-coloured restorations for long-term oral health.",
    intro: "General dentistry focuses on identifying dental problems early, maintaining healthy teeth and gums, and treating common concerns before they become more complex.",
    signs: ["You are due for a routine dental check-up", "Plaque or tartar build-up", "A chipped, worn or sensitive tooth", "Suspected tooth decay or an old filling that needs review"],
    steps: ["Dental examination and history", "Diagnostic imaging when clinically required", "Personalised preventive or restorative plan", "Treatment and appropriate recall advice"],
    benefits: ["Early identification of dental problems", "Preservation of natural teeth", "Better gum and oral health", "A clear long-term maintenance plan"],
    related: [{ label: "Root canal treatment", href: "/dental-treatments/root-canal-treatment" }, { label: "Gum care", href: "/dental-treatments/gum-care" }],
  },
  "root-canal-treatment": {
    title: "Root Canal Treatment",
    summary: "Endodontic care designed to treat infection or inflammation inside a tooth and preserve the natural tooth where clinically appropriate.",
    intro: "Root canal treatment removes infected or inflamed tissue from inside a tooth, disinfects the root canal system and seals it. The tooth is then restored according to how much healthy structure remains.",
    signs: ["Persistent or severe toothache", "Pain when biting or chewing", "Lingering sensitivity to hot or cold", "Swelling or a gum boil near a tooth"],
    steps: ["Clinical assessment and dental imaging", "Local anaesthesia and isolation", "Cleaning, shaping and disinfecting the canals", "Sealing and planning the final restoration"],
    benefits: ["Treats infection within the tooth", "Can relieve tooth-related pain", "Helps preserve the natural tooth", "Restores function after appropriate final restoration"],
    related: [{ label: "Crowns & bridges", href: "/dental-treatments/crowns-bridges" }, { label: "Dental implants", href: "/dental-implants" }],
  },
  "crowns-bridges": {
    title: "Crowns & Bridges",
    summary: "Fixed restorations planned to strengthen compromised teeth or replace selected missing teeth with attention to bite, function and appearance.",
    intro: "A crown covers and protects a prepared tooth, while a bridge can replace a missing tooth by using suitable neighbouring support. The correct option depends on tooth condition, bite and long-term maintainability.",
    signs: ["A heavily restored or weakened tooth", "A tooth requiring protection after root canal treatment", "A fractured or significantly worn tooth", "One or more missing teeth requiring replacement assessment"],
    steps: ["Examination and bite assessment", "Restorative planning and material selection", "Tooth preparation and records", "Final fitting, bite checks and maintenance advice"],
    benefits: ["Restores chewing function", "Protects suitable weakened teeth", "Can replace selected missing teeth", "Designed for a natural, balanced appearance"],
    related: [{ label: "Root canal treatment", href: "/dental-treatments/root-canal-treatment" }, { label: "Dental implants", href: "/dental-implants" }],
  },
  "cosmetic-dentistry": {
    title: "Cosmetic Dentistry",
    summary: "Conservative smile-focused dentistry including aesthetic restorations, veneers and whitening where clinically suitable.",
    intro: "Cosmetic dentistry starts with oral health, facial and smile assessment. Treatment should be selected around the individual tooth condition rather than applying the same cosmetic procedure to every smile.",
    signs: ["Discoloured or stained teeth", "Chipped or worn front teeth", "Uneven tooth shape or proportions", "You want to discuss a more harmonious smile"],
    steps: ["Smile and oral-health assessment", "Discuss goals and suitable options", "Conservative treatment planning", "Treatment, review and maintenance guidance"],
    benefits: ["Individualised smile planning", "Focus on natural-looking results", "Conservative options where appropriate", "Treatment planned around oral health and function"],
    related: [{ label: "Teeth whitening", href: "/dental-treatments/teeth-whitening" }, { label: "Clear aligners", href: "/dental-treatments/clear-aligners" }],
  },
  "teeth-whitening": {
    title: "Teeth Whitening",
    summary: "Professional assessment and whitening options for suitable patients who want to reduce tooth discolouration and brighten their smile.",
    intro: "Not every type of tooth discolouration responds in the same way to whitening. A dental assessment helps identify whether whitening is suitable and whether existing fillings, crowns or other restorations may affect the final appearance.",
    signs: ["General tooth staining or darkening", "Tea, coffee or lifestyle-related staining", "You want a brighter smile before an event", "You want professional advice before using whitening products"],
    steps: ["Dental and shade assessment", "Check teeth, gums and existing restorations", "Select an appropriate whitening approach", "Review results and sensitivity/maintenance advice"],
    benefits: ["Professionally supervised planning", "Treatment matched to tooth condition", "Clear expectations before treatment", "Aftercare guidance for maintaining results"],
    related: [{ label: "Cosmetic dentistry", href: "/dental-treatments/cosmetic-dentistry" }, { label: "General dentistry", href: "/dental-treatments/general-dentistry" }],
  },
  "clear-aligners": {
    title: "Clear Aligners",
    summary: "Discreet orthodontic treatment using removable aligners for suitable tooth-alignment and bite concerns.",
    intro: "Clear aligners use a planned sequence of removable trays to move teeth progressively. Suitability depends on the type and complexity of tooth movement required, oral health and patient compliance.",
    signs: ["Crowded or overlapping teeth", "Spaces between teeth", "You want a discreet orthodontic option", "A bite or alignment concern needs assessment"],
    steps: ["Orthodontic assessment and records", "Digital treatment planning where appropriate", "Sequential aligner treatment and reviews", "Retention planning after active treatment"],
    benefits: ["Removable and discreet appliance", "Digitally planned tooth movement", "Easier access for brushing than fixed appliances", "Structured review and retention pathway"],
    related: [{ label: "Braces", href: "/dental-treatments/braces" }, { label: "Cosmetic dentistry", href: "/dental-treatments/cosmetic-dentistry" }],
  },
  braces: {
    title: "Braces",
    summary: "Fixed orthodontic treatment for suitable alignment and bite concerns, planned around the complexity of tooth movement required.",
    intro: "Braces apply controlled forces to move teeth over time. An orthodontic assessment is required to understand alignment, bite, jaw relationships and the treatment approach appropriate for the individual patient.",
    signs: ["Crowded or rotated teeth", "Spaces between teeth", "Bite concerns", "Clear aligners may not be the preferred option for your case"],
    steps: ["Orthodontic assessment and diagnostic records", "Treatment planning", "Appliance placement and scheduled adjustments", "Retention after active tooth movement"],
    benefits: ["Suitable for a broad range of orthodontic movements", "Controlled tooth movement", "Regular clinical monitoring", "Long-term retention planning"],
    related: [{ label: "Clear aligners", href: "/dental-treatments/clear-aligners" }, { label: "General dentistry", href: "/dental-treatments/general-dentistry" }],
  },
  "gum-care": {
    title: "Gum & Periodontal Care",
    summary: "Assessment and treatment for gum inflammation and the supporting tissues around natural teeth and dental implants.",
    intro: "Healthy gums support healthy teeth and implants. Periodontal care focuses on identifying inflammation, controlling plaque and calculus, and creating an appropriate maintenance programme based on individual risk.",
    signs: ["Bleeding gums", "Persistent gum swelling or tenderness", "Bad breath associated with gum problems", "Gum recession, mobility or periodontal concerns"],
    steps: ["Gum and periodontal assessment", "Measure and identify areas requiring care", "Professional cleaning or deeper periodontal therapy as indicated", "Review and maintenance planning"],
    benefits: ["Controls gum inflammation", "Supports natural teeth and implants", "Improves long-term oral-health maintenance", "Risk-based follow-up planning"],
    related: [{ label: "Scaling & cleaning", href: "/dental-treatments/scaling-cleaning" }, { label: "Dental implants", href: "/dental-implants" }],
  },
  "scaling-cleaning": {
    title: "Scaling & Professional Cleaning",
    summary: "Professional removal of plaque and calculus with oral-hygiene guidance to support healthy teeth and gums.",
    intro: "Professional cleaning removes deposits that cannot be completely removed by routine brushing. The type and depth of cleaning required depends on gum health and the amount and location of calculus.",
    signs: ["Visible tartar or calculus", "Bleeding during brushing", "A dental examination recommends professional cleaning", "You are maintaining teeth, crowns, bridges or implants"],
    steps: ["Oral and gum assessment", "Professional plaque and calculus removal", "Polishing when appropriate", "Personalised home-care and recall advice"],
    benefits: ["Removes hard deposits", "Supports gum health", "Helps maintain restorations and implants", "Reinforces effective home care"],
    related: [{ label: "Gum care", href: "/dental-treatments/gum-care" }, { label: "General dentistry", href: "/dental-treatments/general-dentistry" }],
  },
  fillings: {
    title: "Dental Fillings",
    summary: "Restorative treatment for suitable cavities and damaged tooth structure, with tooth-coloured materials used where clinically appropriate.",
    intro: "A filling replaces tooth structure lost through decay, wear or minor fracture. Treatment planning considers the size and location of the defect, remaining tooth strength and bite forces.",
    signs: ["A cavity or suspected tooth decay", "Food trapping in a damaged area", "A small chipped or fractured tooth", "An old filling feels loose, broken or uncomfortable"],
    steps: ["Examination and diagnosis", "Remove compromised tooth structure as required", "Restore and shape the tooth", "Check the bite and provide aftercare advice"],
    benefits: ["Restores damaged tooth structure", "Helps protect the tooth from further breakdown", "Returns comfortable function", "Tooth-coloured options where suitable"],
    related: [{ label: "General dentistry", href: "/dental-treatments/general-dentistry" }, { label: "Root canal treatment", href: "/dental-treatments/root-canal-treatment" }],
  },
};

export function generateStaticParams() { return Object.keys(treatments).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const treatment = treatments[slug];
  if (!treatment) return {};
  return {
    title: `${treatment.title} in Hyderabad | JV Dental`,
    description: treatment.summary,
    alternates: { canonical: `/dental-treatments/${slug}` },
    openGraph: { title: `${treatment.title} in Hyderabad | JV Dental`, description: treatment.summary, type: "website" },
  };
}

export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const treatment = treatments[slug];
  if (!treatment) notFound();

  const faqs = [
    ["How do I know if this treatment is right for me?", `Suitability for ${treatment.title.toLowerCase()} depends on your symptoms, oral health and clinical findings. The dentist will examine the area and explain the appropriate options.`],
    ["Will I need dental X-rays or scans?", "Imaging is requested only when it is clinically useful for diagnosis or treatment planning. The type of imaging depends on the problem being assessed."],
    ["How many visits will treatment take?", "The number of visits varies with the diagnosis, complexity of treatment and healing or laboratory stages involved. Your expected sequence is explained after assessment."],
    ["Can I book if I am not sure what treatment I need?", "Yes. You can book based on your symptom or concern. You do not need to choose a procedure before the dentist has examined you."],
  ] as const;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: treatment.title,
    description: treatment.summary,
    provider: { "@type": "Dentist", name: "JV Dental & Implant Centre", address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" } },
    areaServed: { "@type": "City", name: "Hyderabad" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };

  const image = treatmentImages[slug];

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <SiteHeader />
    <section className="hero"><div className="hero__copy"><div><p className="eyebrow">Complete dental care · JV Dental Hyderabad</p><h1 className="display-title">{treatment.title}</h1><p className="hero__description">{treatment.summary}</p><div className="hero__actions"><Link className="button" href="/book">Book a consultation <span aria-hidden="true">→</span></Link><Link className="button button--ghost" href="/dental-treatments">All treatments</Link></div></div><p className="hero__note">Treatment suitability and recommendations are confirmed only after clinical examination and any required diagnostic imaging.</p></div><div className="hero__visual" aria-label={`${treatment.title} at JV Dental`} style={{ backgroundImage: `linear-gradient(180deg, rgba(20,35,32,.08), rgba(20,35,32,.48)), url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}><span className="hero__visual-label">Adult dental care · diagnosis-led treatment</span><div className="hero__visual-copy"><p>JV Dental &amp; Implant Centre</p><strong>{treatment.title}</strong></div></div></section>
    <section className="section"><p className="section-kicker">Understanding your treatment</p><h2 className="section-title">What is {treatment.title.toLowerCase()}?</h2><p className="section-intro">{treatment.intro}</p></section>
    <section className="section"><p className="section-kicker">When to seek an assessment</p><h2 className="section-title">You may benefit from a consultation if:</h2><div className="portal-grid international-grid">{treatment.signs.map((item) => <article className="portal-card" key={item}><div className="portal-card__body"><p>{item}</p></div></article>)}</div></section>
    <section className="dark-band"><div className="section"><p className="section-kicker">Treatment pathway</p><h2 className="section-title">A diagnosis-first approach.</h2><div className="principle-list">{treatment.steps.map((step, i) => <article className="principle" key={step}><span className="principle__number">{String(i + 1).padStart(2, "0")}</span><div><h3>{step}</h3></div></article>)}</div></div></section>
    <section className="section"><p className="section-kicker">Benefits</p><h2 className="section-title">Treatment planned around health, function and maintainability.</h2><div className="portal-grid international-grid">{treatment.benefits.map((item) => <article className="portal-card" key={item}><div className="portal-card__body"><p>{item}</p></div></article>)}</div></section>
    <section className="section"><p className="section-kicker">Common questions</p><h2 className="section-title">Before your appointment.</h2><div className="principle-list">{faqs.map(([question, answer], i) => <article className="principle" key={question}><span className="principle__number">{String(i + 1).padStart(2, "0")}</span><div><h3>{question}</h3><p>{answer}</p></div></article>)}</div></section>
    <section className="section"><p className="section-kicker">Related care</p><h2 className="section-title">Explore connected treatment pathways.</h2><div className="hero__actions">{treatment.related.map((item) => <Link className="button button--ghost" href={item.href} key={item.href}>{item.label}</Link>)}<Link className="button" href="/book">Request an appointment <span aria-hidden="true">→</span></Link></div></section>
    <SiteFooter />
  </main>;
}
