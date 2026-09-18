import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import PendingSubmit from "@/components/pending-submit";
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
            <Link href="/clinic/doctors/content">Content attribution</Link>
            <Link href="/doctors">Public doctors</Link>
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic/publishing">Publishing</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinical team CMS</p>
          <h1 className="portal-title">Every doctor gets a portfolio, not a template page.</h1>
          <p className="portal-subtitle">Create a reusable professional profile for each clinician, then connect their articles, selected cases, technologies and verified qualifications without developer work.</p>

          {params.error === "slug_taken" ? <p className="form-note">That portfolio URL is already in use. Choose a different slug, such as <em>dr-name-mumbai</em>.</p> : null}
          {params.error === "permission" ? <p className="form-note">Your clinic account does not have permission to create doctor profiles. Ask an owner or admin to update your role.</p> : null}
          {params.error === "invalid" ? <p className="form-note">Enter a doctor name with at least three characters.</p> : null}
          {params.error === "save" ? <p className="form-note">The profile could not be saved. Please try again or contact an owner/admin if the problem continues.</p> : null}

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
                  <PendingSubmit label="Create doctor portfolio →" pendingLabel="Creating portfolio…" />
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinical team</h2><span className="status-pill">{doctors?.length ?? 0}</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(doctors ?? []).map((doctor) => {
                    const imageUrl = doctor.profile_image_path
                      ? supabase.storage.from("public-content").getPublicUrl(doctor.profile_image_path).data.publicUrl
                      : null;
                    const initial = doctor.full_name.split(/\\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J";

                    return (
                      <Link className="status-row" href={`/clinic/doctors/${doctor.id}`} key={doctor.id} prefetch>
                        <span className="status-row__avatar" aria-hidden="true">
                          {imageUrl ? (
                            <Image src={imageUrl} alt="" width={88} height={110} sizes="48px" />
                          ) : <span>{initial}</span>}
                        </span>
                        <span className="status-row__identity">
                          <strong>{doctor.full_name}</strong>
                          <small>{doctor.professional_title ?? "Professional title pending"}</small>
                        </span>
                        <span className="status-row__experience">
                          {doctor.overall_experience_years != null ? `${doctor.overall_experience_years} yrs overall` : "Experience pending"}
                        </span>
                        <span className="status-pill">{doctor.featured ? "Featured · " : ""}{doctor.status}</span>
                      </Link>
                    );
                  })}
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
