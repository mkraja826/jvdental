import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dentists in Ameerpet & S R Nagar, Hyderabad",
  description: "Meet the JV Dental clinical team in S R Nagar near Ameerpet, Hyderabad. Open a dentist profile to view their experience, clinical focus, selected cases and educational writing.",
  alternates: { canonical: "/doctors" },
  openGraph: {
    title: "Dentists in Ameerpet & S R Nagar, Hyderabad | JV Dental",
    description: "Meet the dentists behind complete dental care and advanced implant dentistry at JV Dental in Hyderabad.",
    url: "/doctors",
  },
};

export default async function DoctorsPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select("id,full_name,slug,professional_title,profile_image_path,featured")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  return (
    <main>
      <SiteHeader />
      <section className="doctor-directory-hero">
        <p className="eyebrow">JV DENTAL · CLINICAL TEAM</p>
        <h1>Meet the dentists behind your treatment plan.</h1>
        <p>Select a dentist to view their complete profile, experience, clinical interests, cases and professional background.</p>
      </section>

      <section className="section doctor-directory-grid" aria-label="JV Dental dentists">
        {(doctors ?? []).map((doctor) => {
          const imageUrl = doctor.profile_image_path
            ? supabase.storage.from("public-content").getPublicUrl(doctor.profile_image_path).data.publicUrl
            : null;

          return (
            <article className="doctor-card" key={doctor.id}>
              <Link className="doctor-card__portrait" href={`/doctors/${doctor.slug}`} aria-label={`View ${doctor.full_name} dentist profile`}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`${doctor.full_name}, dentist at JV Dental`}
                    width={900}
                    height={1100}
                    sizes="(max-width: 720px) 100vw, 420px"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : <span>{doctor.full_name.split(/\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J"}</span>}
              </Link>

              <div className="doctor-card__body">
                {doctor.featured ? <p className="eyebrow">Featured dentist</p> : <p className="eyebrow">JV Dental team</p>}
                <h2>{doctor.full_name}</h2>
                <p className="doctor-card__title">{doctor.professional_title ?? "JV Dental dentist"}</p>
                <Link className="text-link" href={`/doctors/${doctor.slug}`}>View full profile →</Link>
              </div>
            </article>
          );
        })}
        {!doctors?.length ? <p>No public dentist profiles are available yet.</p> : null}
      </section>

      <section className="section section--tight final-cta">
        <p className="eyebrow">Complete dental care</p>
        <h2>Find the right starting point for your dental concern.</h2>
        <div className="hero__actions">
          <Link className="button" href="/book">Book a dental consultation</Link>
          <Link className="button button--ghost" href="/dental-treatments">Explore dental treatments</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
