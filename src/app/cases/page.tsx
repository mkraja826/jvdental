import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

function publicMediaUrl(supabaseUrl: string | undefined, path: string | undefined) {
  return supabaseUrl && path ? `${supabaseUrl}/storage/v1/object/public/public-content/${path}` : null;
}

export const metadata: Metadata = {
  title: "Dental Treatment Cases in Hyderabad",
  description: "Explore consented, anonymised dental treatment cases from JV Dental in Hyderabad, including diagnosis, planning, restorative treatment and implant workflows.",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "Dental Treatment Cases in Hyderabad | JV Dental",
    description: "See how selected dental cases are assessed, planned and treated at JV Dental & Implant Centre in Hyderabad.",
    url: "/cases",
  },
};

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("signature_cases")
    .select("id,title,slug,treatment_type,short_summary,patient_age_band,patient_country,guided_implant,dionavi_used,full_arch,featured,published_at,signature_case_media(storage_path,alt_text,caption,sort_order)")
    .eq("publication_status", "published")
    .eq("consent_for_website", true)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <main>
      <SiteHeader />

      <section className="section public-listing-page">
        <p className="section-kicker">Selected clinical work</p>
        <h1 className="section-title">Cases that show how dental treatment is actually planned.</h1>
        <p className="section-intro">Approved, anonymised clinical stories from diagnosis through treatment planning, restorative care, guided surgery where used and follow-up. Individual outcomes vary and every treatment plan begins with assessment.</p>

        <div className="principle-list public-listing-list">
          {(cases ?? []).map((item, index) => {
            const preview = Array.isArray(item.signature_case_media)
              ? [...item.signature_case_media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
              : null;
            const previewUrl = publicMediaUrl(supabaseUrl, preview?.storage_path);

            return (
              <Link className="principle public-case-card" href={`/cases/${item.slug}`} key={item.id}>
                <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
                {previewUrl ? (
                  <Image
                    className="public-case-card__image"
                    src={previewUrl}
                    alt={preview?.alt_text ?? preview?.caption ?? item.title}
                    width={360}
                    height={270}
                    sizes="(max-width: 820px) 100vw, 240px"
                  />
                ) : null}
                <div>
                  <p className="eyebrow public-listing-eyebrow">{item.dionavi_used ? "DIOnavi guided implant case" : item.guided_implant ? "Guided implant case" : item.treatment_type}</p>
                  <h3>{item.title}</h3>
                  <p>{item.short_summary ?? item.treatment_type}</p>
                  <p className="public-listing-meta">{[item.patient_age_band ? `Age ${item.patient_age_band}` : null, item.patient_country, item.full_arch ? "Full arch" : null].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            );
          })}
          {!cases?.length ? <p className="public-listing-empty">Selected cases are being prepared for publication.</p> : null}
        </div>

        <div className="public-listing-cta hero__actions">
          <Link className="button" href="/book">Book a dental consultation</Link>
          <Link className="button button--ghost" href="/dental-treatments">Explore dental treatments</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
