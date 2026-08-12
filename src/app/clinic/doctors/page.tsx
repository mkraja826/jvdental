import Link from "next/link";
import { redirect } from "next/navigation";
import { createDoctorProfile } from "@/app/clinic/doctors/actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function DoctorProfilesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, staff } = await requireStaff();
  if (!new Set(["owner", "admin"]).has(staff.role)) redirect("/clinic");
  const params = await searchParams;

  const { data: doctors } = await supabase
    .from("doctor_profiles")
    .select("id,full_name,slug,professional_title,overall_experience_years,specialist_experience_years,status,featured,profile_image_path,updated_at")
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Doctor portfolios</span></div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Doctor portfolio navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/doctors">Doctor portfolios</Link>
            <Link href="/doctors">Public doctors</Link>
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic/publishing">Publishing</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinical team CMS</p>
          <h1 className="portal-title">Every doctor gets a portfolio, not a template page.</h1>
          <p className="portal-subtitle">Create a reusable professional profile for each clinician, then connect their articles, selected cases, technologies and verified qualifications without developer work.</p>

          {params.error ? <p className="form-note">The profile could not be created. Check the name and URL slug.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Add doctor</h2><span className="status-pill">Starts as draft</span></div>
              <div className="portal-card__body">
                <form action={createDoctorProfile} style={{ display: "grid", gap: 18 }}>
                  <label>Doctor name<input name="full_name" required minLength={3} placeholder="Dr. Full Name" /></label>
                  <label>Portfolio URL<input name="slug" placeholder="dr-full-name" /></label>
                  <label>Professional title<input name="professional_title" placeholder="Implantologist · Prosthodontist" /></label>
                  <div className="form-grid-2">
                    <label>Overall experience<input name="overall_experience_years" type="number" min="0" placeholder="25" /></label>
                    <label>Specialist experience<input name="specialist_experience_years" type="number" min="0" placeholder="22" /></label>
                  </div>
                  <button className="button" type="submit">Create doctor portfolio →</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinical team</h2><span className="status-pill">{doctors?.length ?? 0}</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(doctors ?? []).map((doctor) => (
                    <Link className="status-row" href={`/clinic/doctors/${doctor.id}`} key={doctor.id}>
                      <div>
                        <strong>{doctor.full_name}</strong>
                        <br />
                        <small>{doctor.professional_title ?? "Professional title pending"}</small>
                      </div>
                      <span>{doctor.overall_experience_years != null ? `${doctor.overall_experience_years} yrs overall` : "Experience pending"}</span>
                      <span className="status-pill">{doctor.featured ? "Featured · " : ""}{doctor.status}</span>
                    </Link>
                  ))}
                  {!doctors?.length ? <p>No doctor profiles have been created.</p> : null}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
