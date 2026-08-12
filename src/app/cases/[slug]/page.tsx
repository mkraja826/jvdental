import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

function publicMediaUrl(supabaseUrl: string | undefined, path: string) {
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/public-content/${path}`;
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("signature_cases")
    .select("id,title,treatment_type,short_summary,diagnosis_summary,challenge_summary,treatment_plan_summary,final_outcome_summary,patient_age_band,patient_country,guided_implant,dionavi_used,full_arch,published_at,doctor_profiles(full_name,slug,professional_title)")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .eq("consent_for_website", true)
    .maybeSingle();

  if (!item) notFound();
  const doctor = Array.isArray(item.doctor_profiles) ? item.doctor_profiles[0] : item.doctor_profiles;

  const [{ data: stages }, { data: media }] = await Promise.all([
    supabase.from("signature_case_stages").select("id,stage_type,title,body,sort_order").eq("signature_case_id", item.id).order("sort_order", { ascending: true }),
    supabase.from("signature_case_media").select("id,stage_id,media_type,storage_path,alt_text,caption,sort_order").eq("signature_case_id", item.id).order("sort_order", { ascending: true }),
  ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <main>
      <SiteHeader />

      <section className="section">
        <p className="section-kicker">Signature case {item.dionavi_used ? "· DIOnavi" : ""}</p>
        <h1 className="section-title">{item.title}</h1>
        <p className="section-intro">{item.short_summary ?? item.treatment_type}</p>
        {doctor?.slug ? <p style={{ marginTop: 22 }}><Link className="text-link" href={`/doctors/${doctor.slug}`}>Clinical portfolio: {doctor.full_name} · {doctor.professional_title ?? "JV Dental clinician"} →</Link></p> : null}
        <div className="data-strip" style={{ width: "100%", marginTop: 52, borderTop: "1px solid var(--line)" }}>
          <div className="data-strip__item"><span>Treatment</span><strong>{item.treatment_type}</strong></div>
          <div className="data-strip__item"><span>Workflow</span><strong>{item.dionavi_used ? "DIOnavi guided" : item.guided_implant ? "Guided" : "Case specific"}</strong></div>
          <div className="data-strip__item"><span>Patient</span><strong>{item.patient_age_band ? `Age ${item.patient_age_band}` : "Anonymised"}</strong></div>
          <div className="data-strip__item"><span>Origin</span><strong>{item.patient_country ?? "Not disclosed"}</strong></div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="editorial-split">
          <div className="editorial-quote">Planning before placement.<small>{item.dionavi_used ? "DIOnavi digital guided workflow" : "Structured implant workflow"}</small></div>
          <div className="principle-list">
            {item.diagnosis_summary ? <div className="principle"><span className="principle__number">01</span><div><h3>Diagnosis</h3><p>{item.diagnosis_summary}</p></div></div> : null}
            {item.challenge_summary ? <div className="principle"><span className="principle__number">02</span><div><h3>Clinical challenge</h3><p>{item.challenge_summary}</p></div></div> : null}
            {item.treatment_plan_summary ? <div className="principle"><span className="principle__number">03</span><div><h3>Treatment plan</h3><p>{item.treatment_plan_summary}</p></div></div> : null}
            {item.final_outcome_summary ? <div className="principle"><span className="principle__number">04</span><div><h3>Outcome</h3><p>{item.final_outcome_summary}</p></div></div> : null}
          </div>
        </div>
      </section>

      <section className="dark-band">
        <div className="section">
          <p className="section-kicker">Clinical sequence</p>
          <h2 className="section-title">From records to restoration.</h2>
          <div className="treatments">
            {(stages ?? []).map((stage, index) => {
              const stageMedia = (media ?? []).filter((asset) => asset.stage_id === stage.id);
              return (
                <div key={stage.id} style={{ borderBottom: "1px solid #3d413f", padding: "34px 0" }}>
                  <div className="treatment-row" style={{ borderBottom: 0, minHeight: 0 }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{stage.title}</strong>
                    <b>{stage.stage_type === "dionavi_planning" ? "DIOnavi" : ""}</b>
                  </div>
                  {stage.body ? <p style={{ maxWidth: 760, color: "#aeb3af", marginLeft: 114 }}>{stage.body}</p> : null}
                  {stageMedia.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, margin: "24px 0 0 114px" }}>
                      {stageMedia.map((asset) => {
                        const src = publicMediaUrl(supabaseUrl, asset.storage_path);
                        return src && asset.media_type !== "video" ? <figure key={asset.id} style={{ margin: 0 }}><img src={src} alt={asset.alt_text ?? asset.caption ?? stage.title} style={{ width: "100%", display: "block" }} />{asset.caption ? <figcaption style={{ color: "#aeb3af", fontSize: ".75rem", marginTop: 8 }}>{asset.caption}</figcaption> : null}</figure> : null;
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!stages?.length ? <p style={{ color: "#aeb3af", paddingTop: 28 }}>Clinical stage documentation is being prepared.</p> : null}
          </div>
        </div>
      </section>

      {doctor?.slug ? (
        <section className="section section--tight">
          <p className="section-kicker">Treating clinician</p>
          <h2 className="section-title">{doctor.full_name}</h2>
          <p className="section-intro">{doctor.professional_title}</p>
          <Link className="button button--ghost" href={`/doctors/${doctor.slug}`}>View doctor portfolio →</Link>
        </section>
      ) : null}

      <section className="section section--tight">
        <p style={{ maxWidth: 700, color: "var(--muted)", fontSize: ".82rem" }}>This case is shown with recorded publication consent and is presented for education. Treatment recommendations and outcomes vary according to anatomy, oral health, medical history and clinical findings.</p>
        <Link className="button" href="/patient/login?next=/patient/intake">Request your implant assessment</Link>
      </section>
    </main>
  );
}
