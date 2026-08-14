import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string }> };

async function getDoctor(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return { supabase, doctor: data };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { doctor } = await getDoctor(slug);
  if (!doctor) return { title: "Doctor | JV Dental" };

  const professionalTitle = doctor.professional_title ?? "Dentist";
  const title = doctor.seo_title || `${doctor.full_name} | ${professionalTitle} in Hyderabad`;
  const description = doctor.seo_description || doctor.short_intro || `${doctor.full_name} is part of the clinical team at JV Dental & Implant Centre in S R Nagar, near Ameerpet, Hyderabad.`;

  return {
    title,
    description,
    alternates: { canonical: `/doctors/${doctor.slug}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `/doctors/${doctor.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function DoctorPortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  const { supabase, doctor } = await getDoctor(slug);
  if (!doctor) notFound();

  const [qualificationsResult, membershipsResult, linksResult, articlesResult, casesResult] = await Promise.all([
    supabase.from("doctor_qualifications").select("id,qualification,institution,completion_year").eq("doctor_profile_id", doctor.id).order("sort_order"),
    supabase.from("doctor_memberships").select("id,organisation,membership_number").eq("doctor_profile_id", doctor.id).order("sort_order"),
    supabase.from("doctor_external_links").select("id,label,url").eq("doctor_profile_id", doctor.id).order("sort_order"),
    supabase.from("blog_posts").select("id,title,slug,excerpt,published_at").eq("doctor_profile_id", doctor.id).eq("status", "published").order("published_at", { ascending: false }).limit(6),
    supabase.from("signature_cases").select("id,title,slug,treatment_type,short_summary,dionavi_used,guided_implant,featured").eq("doctor_profile_id", doctor.id).eq("publication_status", "published").eq("consent_for_website", true).order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(6),
  ]);

  const imageUrl = doctor.profile_image_path
    ? supabase.storage.from("public-content").getPublicUrl(doctor.profile_image_path).data.publicUrl
    : null;

  const qualifications = qualificationsResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const links = linksResult.data ?? [];
  const articles = articlesResult.data ?? [];
  const cases = casesResult.data ?? [];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");
  const profileUrl = `${siteUrl}/doctors/${doctor.slug}`;
  const sameAs = Array.from(new Set([
    doctor.practo_url,
    ...links.map((item) => item.url),
  ].filter((value): value is string => Boolean(value))));

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: doctor.full_name,
    url: profileUrl,
    mainEntityOfPage: profileUrl,
    ...(doctor.professional_title ? { jobTitle: doctor.professional_title } : {}),
    ...(doctor.short_intro || doctor.biography ? { description: doctor.short_intro || doctor.biography } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(doctor.specialties?.length ? { knowsAbout: doctor.specialties } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    affiliation: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "JV Dental & Implant Centre",
      url: siteUrl,
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <section className="doctor-profile-hero">
        <div className="doctor-profile-hero__portrait">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={doctor.full_name}
              width={1000}
              height={1250}
              sizes="(max-width: 900px) 100vw, 42vw"
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : <span>{doctor.full_name.split(/\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J"}</span>}
        </div>
        <div className="doctor-profile-hero__copy">
          <p className="eyebrow">JV DENTAL · CLINICAL PORTFOLIO</p>
          <h1>{doctor.full_name}</h1>
          <p className="doctor-profile-title">{doctor.professional_title ?? "JV Dental clinician"}</p>
          {doctor.short_intro ? <p className="doctor-profile-intro">{doctor.short_intro}</p> : null}

          <div className="doctor-profile-metrics">
            {doctor.overall_experience_years != null ? <div><strong>{doctor.overall_experience_years}</strong><span>Years overall clinical experience</span></div> : null}
            {doctor.specialist_experience_years != null ? <div><strong>{doctor.specialist_experience_years}</strong><span>Years specialist experience</span></div> : null}
          </div>

          <div className="hero__actions">
            <Link className="button" href="/book">Book a dental consultation →</Link>
            {doctor.practo_url ? <a className="button button--ghost" href={doctor.practo_url} target="_blank" rel="noreferrer">View Practo profile</a> : null}
          </div>
        </div>
      </section>

      <section className="section editorial-split">
        <div>
          <p className="eyebrow">Clinical focus</p>
          <h2 className="section-title">Experience connected to the treatment workflow.</h2>
        </div>
        <div>
          {doctor.biography ? <p>{doctor.biography}</p> : <p>{doctor.short_intro}</p>}
          <div className="doctor-focus-list">
            {(doctor.specialties ?? []).map((item: string) => <span key={item}>{item}</span>)}
          </div>
          {(doctor.technologies ?? []).length ? (
            <div className="doctor-technology-block">
              <p className="eyebrow">Technology</p>
              {(doctor.technologies ?? []).map((item: string) => <strong key={item}>{item}</strong>)}
              {(doctor.technologies ?? []).some((item: string) => item.toLowerCase().includes("dionavi")) ? <Link className="text-link" href="/guided-implants">Explore the guided implant workflow →</Link> : null}
            </div>
          ) : null}
        </div>
      </section>

      {doctor.treatment_philosophy ? (
        <section className="doctor-philosophy">
          <p className="eyebrow">Treatment philosophy</p>
          <blockquote>“{doctor.treatment_philosophy}”</blockquote>
        </section>
      ) : null}

      {(qualifications.length || memberships.length || doctor.registration_number) ? (
        <section className="section doctor-credentials-grid">
          <article>
            <p className="eyebrow">Qualifications</p>
            <div className="credential-list">
              {qualifications.map((item) => <div key={item.id}><strong>{item.qualification}</strong><span>{[item.institution, item.completion_year].filter(Boolean).join(" · ")}</span></div>)}
              {!qualifications.length ? <p>Qualification details are being verified for publication.</p> : null}
            </div>
          </article>
          <article>
            <p className="eyebrow">Professional standing</p>
            <div className="credential-list">
              {doctor.registration_number ? <div><strong>{doctor.registration_council ?? "Professional registration"}</strong><span>{doctor.registration_number}</span></div> : null}
              {memberships.map((item) => <div key={item.id}><strong>{item.organisation}</strong><span>{item.membership_number ?? "Member"}</span></div>)}
            </div>
          </article>
        </section>
      ) : null}

      {cases.length ? (
        <section className="section">
          <div className="section-heading-row">
            <div><p className="eyebrow">Selected clinical work</p><h2 className="section-title">Signature cases</h2></div>
            <Link className="text-link" href="/cases">View all cases →</Link>
          </div>
          <div className="doctor-work-grid">
            {cases.map((item) => (
              <Link className="doctor-work-card" href={`/cases/${item.slug}`} key={item.id}>
                <span className="eyebrow">{item.dionavi_used ? "DIOnavi guided" : item.guided_implant ? "Guided implant" : "Clinical case"}</span>
                <h3>{item.title}</h3>
                <p>{item.treatment_type}</p>
                {item.short_summary ? <small>{item.short_summary}</small> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {articles.length ? (
        <section className="section">
          <div className="section-heading-row">
            <div><p className="eyebrow">Doctor&apos;s journal</p><h2 className="section-title">Clinical writing</h2></div>
            <Link className="text-link" href="/journal">Read the Journal →</Link>
          </div>
          <div className="doctor-work-grid">
            {articles.map((article) => (
              <Link className="doctor-work-card" href={`/journal/${article.slug}`} key={article.id}>
                <span className="eyebrow">Journal</span>
                <h3>{article.title}</h3>
                {article.excerpt ? <p>{article.excerpt}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {links.length ? (
        <section className="section doctor-links-strip">
          <span>Professional profiles</span>
          <div>{links.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>{item.label} ↗</a>)}</div>
        </section>
      ) : null}

      <section className="section final-cta">
        <p className="eyebrow">Dental consultation</p>
        <h2>Considering treatment with {doctor.full_name}?</h2>
        <p>Book a clinic or video consultation first. When individual record review is needed, the secure patient portal can be used to share your dental history and available imaging.</p>
        <Link className="button" href="/book">Book your consultation →</Link>
      </section>

      <SiteFooter />
    </main>
  );
}
