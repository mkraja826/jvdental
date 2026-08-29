import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string }> };
function publicMediaUrl(supabaseUrl: string | undefined, path: string) { return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/public-content/${path}` : null; }

async function getPublishedCase(slug: string) {
  const supabase = await createClient();
  const { data: item } = await supabase.from("signature_cases")
    .select("id,slug,title,treatment_type,short_summary,patient_age_band,patient_country,guided_implant,dionavi_used,published_at,doctor_profiles(full_name,slug,professional_title)")
    .eq("slug", slug).eq("publication_status", "published").eq("consent_for_website", true).maybeSingle();
  return { supabase, item };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublishedCase(slug);
  if (!item) return { title: "Dental Case | JV Dental" };
  const title = `${item.title} | Dental Case in Hyderabad`;
  const description = item.short_summary || `A ${item.treatment_type} treatment journey from JV Dental & Implant Centre in Hyderabad.`;
  return { title, description, alternates: { canonical: `/cases/${item.slug}` }, openGraph: { type: "article", title, description, url: `/cases/${item.slug}`, ...(item.published_at ? { publishedTime: item.published_at } : {}) }, robots: { index: true, follow: true } };
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { supabase, item } = await getPublishedCase(slug);
  if (!item) notFound();
  const doctor = Array.isArray(item.doctor_profiles) ? item.doctor_profiles[0] : item.doctor_profiles;
  const [{ data: stages }, { data: media }] = await Promise.all([
    supabase.from("signature_case_stages").select("id,stage_type,title,body,sort_order").eq("signature_case_id", item.id).order("sort_order", { ascending: true }),
    supabase.from("signature_case_media").select("id,stage_id,media_type,storage_path,alt_text,caption,sort_order").eq("signature_case_id", item.id).order("sort_order", { ascending: true }),
  ]);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const unassigned = (media ?? []).filter((asset) => !asset.stage_id);

  const renderMedia = (assets: typeof unassigned, fallback: string) => assets.length ? <div className="case-stage__media">{assets.map((asset) => {
    const src = publicMediaUrl(supabaseUrl, asset.storage_path);
    return src && asset.media_type !== "video" ? <figure key={asset.id}><Image src={src} alt={asset.alt_text ?? asset.caption ?? fallback} width={1200} height={900} sizes="(max-width: 720px) 100vw, 50vw" />{asset.caption ? <figcaption>{asset.caption}</figcaption> : null}</figure> : null;
  })}</div> : null;

  return <main className="case-detail-page">
    <SiteHeader />
    <section className="section">
      <p className="section-kicker">Real patient case {item.dionavi_used ? "· DIOnavi guided" : ""}</p>
      <h1 className="section-title">{item.title}</h1>
      <p className="section-intro">{item.short_summary ?? `Follow this ${item.treatment_type.toLowerCase()} journey from assessment and planning through treatment.`}</p>
      <div className="data-strip case-detail-data">
        <div className="data-strip__item"><span>Treatment</span><strong>{item.treatment_type}</strong></div>
        <div className="data-strip__item"><span>Approach</span><strong>{item.dionavi_used ? "DIOnavi guided" : item.guided_implant ? "Guided" : "Individual treatment plan"}</strong></div>
        <div className="data-strip__item"><span>Case</span><strong>Anonymised</strong></div>
      </div>
    </section>

    <section className="dark-band case-detail-sequence"><div className="section">
      <p className="section-kicker">Treatment journey</p><h2 className="section-title">See how the treatment progressed.</h2>
      {unassigned.length ? <div className="case-stage"><div className="treatment-row case-stage__heading"><span>01</span><strong>Treatment journey</strong><b>{unassigned.length} photos</b></div>{renderMedia(unassigned, item.title)}</div> : null}
      {(stages ?? []).map((stage, index) => {
        const stageMedia = (media ?? []).filter((asset) => asset.stage_id === stage.id);
        return <div className="case-stage" key={stage.id}><div className="treatment-row case-stage__heading"><span>{String(index + (unassigned.length ? 2 : 1)).padStart(2, "0")}</span><strong>{stage.title}</strong><b>{stage.stage_type === "dionavi_planning" ? "DIOnavi" : ""}</b></div>{stage.body ? <p className="case-stage__body">{stage.body}</p> : null}{renderMedia(stageMedia, stage.title)}</div>;
      })}
    </div></section>

    {doctor?.slug ? <section className="section section--tight"><p className="section-kicker">Treating clinician</p><h2 className="section-title">{doctor.full_name}</h2><p className="section-intro">{doctor.professional_title}</p><Link className="button button--ghost" href={`/doctors/${doctor.slug}`}>View doctor portfolio →</Link></section> : null}
    <section className="section section--tight case-detail-cta"><p>Every patient is different. Treatment recommendations and outcomes depend on clinical examination, anatomy, oral health and medical history.</p><div className="hero__actions"><Link className="button" href="/book">Request an implant assessment</Link><Link className="button button--ghost" href="/cases">View more cases</Link></div></section>
    <SiteFooter />
  </main>;
}
