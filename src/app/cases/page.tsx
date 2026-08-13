import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("signature_cases")
    .select("id,title,slug,treatment_type,short_summary,patient_age_band,patient_country,guided_implant,dionavi_used,full_arch,featured,published_at")
    .eq("publication_status", "published")
    .eq("consent_for_website", true)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <main>
      <SiteHeader />

      <section className="section public-listing-page">
        <p className="section-kicker">Selected clinical work</p>
        <h1 className="section-title">Cases that show how treatment is actually planned.</h1>
        <p className="section-intro">Approved, anonymised clinical stories from diagnosis through planning, guided surgery, prosthetic rehabilitation and follow-up. Individual outcomes vary and every treatment plan begins with assessment.</p>

        <div className="principle-list public-listing-list">
          {(cases ?? []).map((item, index) => (
            <Link className="principle" href={`/cases/${item.slug}`} key={item.id}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow public-listing-eyebrow">{item.dionavi_used ? "DIOnavi guided implant case" : item.guided_implant ? "Guided implant case" : item.treatment_type}</p>
                <h3>{item.title}</h3>
                <p>{item.short_summary ?? item.treatment_type}</p>
                <p className="public-listing-meta">{[item.patient_age_band ? `Age ${item.patient_age_band}` : null, item.patient_country, item.full_arch ? "Full arch" : null].filter(Boolean).join(" · ")}</p>
              </div>
            </Link>
          ))}
          {!cases?.length ? <p className="public-listing-empty">Selected cases are being prepared for publication.</p> : null}
        </div>

        <div className="public-listing-cta">
          <Link className="button" href="/book">Book an implant assessment</Link>
        </div>
      </section>
    </main>
  );
}
