import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Clinical Team | JV Dental",
  description: "Meet the clinicians behind JV Dental's implant and digital guided dentistry workflows in Hyderabad.",
};

export default async function DoctorsPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select("id,full_name,slug,professional_title,short_intro,overall_experience_years,specialist_experience_years,specialties,technologies,profile_image_path,featured")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  return (
    <main>
      <SiteHeader />
      <section className="doctor-directory-hero">
        <p className="eyebrow">JV DENTAL · CLINICAL TEAM</p>
        <h1>The clinicians behind the treatment plan.</h1>
        <p>Professional profiles are maintained from verified clinic information, with each doctor&apos;s areas of focus, experience, selected cases and educational writing connected in one place.</p>
      </section>

      <section className="section doctor-directory-grid" aria-label="JV Dental doctors">
        {(doctors ?? []).map((doctor) => {
          const imageUrl = doctor.profile_image_path
            ? supabase.storage.from("public-content").getPublicUrl(doctor.profile_image_path).data.publicUrl
            : null;
          return (
            <article className="doctor-card" key={doctor.id}>
              <Link className="doctor-card__portrait" href={`/doctors/${doctor.slug}`} aria-label={`View ${doctor.full_name} portfolio`}>
                {imageUrl ? <img src={imageUrl} alt={doctor.full_name} /> : <span>{doctor.full_name.split(/\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J"}</span>}
              </Link>
              <div className="doctor-card__body">
                {doctor.featured ? <p className="eyebrow">Featured clinician</p> : <p className="eyebrow">Clinical team</p>}
                <h2>{doctor.full_name}</h2>
                <p className="doctor-card__title">{doctor.professional_title ?? "JV Dental clinician"}</p>
                <div className="doctor-card__experience">
                  {doctor.overall_experience_years != null ? <span><strong>{doctor.overall_experience_years}</strong> years overall</span> : null}
                  {doctor.specialist_experience_years != null ? <span><strong>{doctor.specialist_experience_years}</strong> years specialist</span> : null}
                </div>
                {doctor.short_intro ? <p>{doctor.short_intro}</p> : null}
                <div className="doctor-card__tags">{(doctor.specialties ?? []).slice(0, 4).map((item: string) => <span key={item}>{item}</span>)}</div>
                <Link className="text-link" href={`/doctors/${doctor.slug}`}>View doctor portfolio →</Link>
              </div>
            </article>
          );
        })}
        {!doctors?.length ? <p>No public doctor profiles are available yet.</p> : null}
      </section>
    </main>
  );
}
