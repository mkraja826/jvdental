import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addDoctorExternalLink,
  addDoctorMembership,
  addDoctorQualification,
  deleteDoctorDetail,
  updateDoctorProfile,
  uploadDoctorProfileImage,
} from "@/app/clinic/doctors/actions";
import { requireStaff } from "@/lib/auth/guards";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DoctorProfileEditor({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, staff } = await requireStaff();
  if (!new Set(["owner", "admin"]).has(staff.role)) redirect("/clinic");

  const [profileResult, qualificationsResult, membershipsResult, linksResult, staffResult, postsResult, casesResult] = await Promise.all([
    supabase.from("doctor_profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("doctor_qualifications").select("id,qualification,institution,completion_year,sort_order").eq("doctor_profile_id", id).order("sort_order"),
    supabase.from("doctor_memberships").select("id,organisation,membership_number,sort_order").eq("doctor_profile_id", id).order("sort_order"),
    supabase.from("doctor_external_links").select("id,label,url,sort_order").eq("doctor_profile_id", id).order("sort_order"),
    supabase.from("staff_profiles").select("user_id,full_name,role,is_active").in("role", ["owner", "admin", "implantologist", "doctor"]).eq("is_active", true).order("full_name"),
    supabase.from("blog_posts").select("id,title,status,slug").eq("doctor_profile_id", id).order("updated_at", { ascending: false }).limit(20),
    supabase.from("signature_cases").select("id,title,publication_status,slug,dionavi_used").eq("doctor_profile_id", id).order("updated_at", { ascending: false }).limit(20),
  ]);

  const profile = profileResult.data;
  if (!profile) notFound();

  const imageUrl = profile.profile_image_path
    ? supabase.storage.from("public-content").getPublicUrl(profile.profile_image_path).data.publicUrl
    : null;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><Link className="text-link" href="/clinic/doctors">← Doctor portfolios</Link><span className="status-pill">{profile.status}</span></div>
      </header>

      <section className="portal-main">
        <p className="portal-overline">Doctor portfolio CMS</p>
        <h1 className="portal-title">{profile.full_name}</h1>
        <p className="portal-subtitle">Only publish details the doctor or clinic has verified. Experience, credentials and technology claims appear publicly exactly as stored here.</p>

        {query.saved ? <p className="form-note">Doctor profile saved.</p> : null}
        {query.image ? <p className="form-note">Profile photograph updated.</p> : null}
        {query.error ? <p className="form-note">The requested change could not be saved. Review the entered details.</p> : null}

        <div className="portal-grid">
          <article className="portal-card">
            <div className="portal-card__header"><h2>Professional profile</h2><span className="status-pill">Core</span></div>
            <div className="portal-card__body">
              <form action={updateDoctorProfile} style={{ display: "grid", gap: 18 }}>
                <input type="hidden" name="id" value={profile.id} />
                <label>Full name<input name="full_name" required defaultValue={profile.full_name} /></label>
                <label>Public URL<input name="slug" required defaultValue={profile.slug} /></label>
                <label>Professional title<input name="professional_title" defaultValue={profile.professional_title ?? ""} /></label>
                <label>Short introduction<textarea name="short_intro" rows={3} defaultValue={profile.short_intro ?? ""} /></label>
                <label>Biography<textarea name="biography" rows={8} defaultValue={profile.biography ?? ""} /></label>
                <label>Treatment philosophy<textarea name="treatment_philosophy" rows={5} defaultValue={profile.treatment_philosophy ?? ""} /></label>

                <div className="form-grid-2">
                  <label>Overall experience (years)<input name="overall_experience_years" type="number" min="0" defaultValue={profile.overall_experience_years ?? ""} /></label>
                  <label>Specialist experience (years)<input name="specialist_experience_years" type="number" min="0" defaultValue={profile.specialist_experience_years ?? ""} /></label>
                </div>

                <div className="form-grid-2">
                  <label>Registration number<input name="registration_number" defaultValue={profile.registration_number ?? ""} /></label>
                  <label>Registration council<input name="registration_council" defaultValue={profile.registration_council ?? ""} /></label>
                </div>

                <label>Languages<textarea name="languages" rows={2} defaultValue={(profile.languages ?? []).join(", ")} placeholder="English, Telugu, Hindi" /></label>
                <label>Areas of clinical focus<textarea name="specialties" rows={3} defaultValue={(profile.specialties ?? []).join(", ")} /></label>
                <label>Technologies used<textarea name="technologies" rows={3} defaultValue={(profile.technologies ?? []).join(", ")} /></label>
                <label>Practo profile<input name="practo_url" type="url" defaultValue={profile.practo_url ?? ""} /></label>

                <label>Linked staff account
                  <select name="staff_user_id" defaultValue={profile.staff_user_id ?? ""}>
                    <option value="">Not linked yet</option>
                    {(staffResult.data ?? []).map((person) => <option value={person.user_id} key={person.user_id}>{person.full_name ?? person.user_id} · {person.role}</option>)}
                  </select>
                </label>

                <div className="form-grid-2">
                  <label>Display order<input name="display_order" type="number" min="0" defaultValue={profile.display_order ?? 0} /></label>
                  <label>Publication state
                    <select name="status" defaultValue={profile.status}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                </div>
                <label><input name="featured" type="checkbox" defaultChecked={profile.featured} /> Feature this doctor in the team hierarchy</label>

                <label>SEO title<input name="seo_title" maxLength={70} defaultValue={profile.seo_title ?? ""} /></label>
                <label>SEO description<textarea name="seo_description" rows={3} maxLength={180} defaultValue={profile.seo_description ?? ""} /></label>

                <button className="button" type="submit">Save doctor profile</button>
              </form>
            </div>
          </article>

          <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Portrait</h2><span className="status-pill">Public media</span></div>
              <div className="portal-card__body">
                <div className="doctor-admin-portrait">
                  {imageUrl ? <img src={imageUrl} alt={`${profile.full_name} profile`} /> : <span>{profile.full_name.split(/\s+/).filter(Boolean).slice(-1)[0]?.slice(0, 1) ?? "J"}</span>}
                </div>
                <form action={uploadDoctorProfileImage} style={{ display: "grid", gap: 14, marginTop: 18 }}>
                  <input type="hidden" name="id" value={profile.id} />
                  <label>Professional portrait<input name="profile_image" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
                  <p className="form-note">JPG, PNG or WebP, maximum 8 MB. Use a high-resolution, professionally lit clinical portrait.</p>
                  <button className="button button--ghost" type="submit">Upload portrait</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Public page</h2></div>
              <div className="portal-card__body">
                <p><strong>/{`doctors/${profile.slug}`}</strong></p>
                <p style={{ color: "var(--muted)" }}>{profile.overall_experience_years ?? "—"} years overall · {profile.specialist_experience_years ?? "—"} years specialist</p>
                <Link className="button button--ghost" href={`/doctors/${profile.slug}`}>Preview portfolio →</Link>
              </div>
            </article>
          </div>
        </div>

        <div className="portal-grid" style={{ marginTop: 28 }}>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Qualifications</h2><span className="status-pill">Verified only</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(qualificationsResult.data ?? []).map((item) => (
                  <div className="status-row" key={item.id}>
                    <div><strong>{item.qualification}</strong><br /><small>{[item.institution, item.completion_year].filter(Boolean).join(" · ")}</small></div>
                    <span />
                    <form action={deleteDoctorDetail}><input type="hidden" name="doctor_profile_id" value={id} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="type" value="qualification" /><button className="text-link" type="submit">Remove</button></form>
                  </div>
                ))}
              </div>
              <form action={addDoctorQualification} style={{ display: "grid", gap: 12, marginTop: 18 }}>
                <input type="hidden" name="doctor_profile_id" value={id} />
                <input name="qualification" required placeholder="Qualification" />
                <input name="institution" placeholder="Institution" />
                <input name="completion_year" type="number" min="1900" max="2200" placeholder="Year" />
                <button className="button button--ghost" type="submit">Add qualification</button>
              </form>
            </div>
          </article>

          <article className="portal-card">
            <div className="portal-card__header"><h2>Memberships & registrations</h2></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(membershipsResult.data ?? []).map((item) => (
                  <div className="status-row" key={item.id}>
                    <div><strong>{item.organisation}</strong><br /><small>{item.membership_number ?? ""}</small></div>
                    <span />
                    <form action={deleteDoctorDetail}><input type="hidden" name="doctor_profile_id" value={id} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="type" value="membership" /><button className="text-link" type="submit">Remove</button></form>
                  </div>
                ))}
              </div>
              <form action={addDoctorMembership} style={{ display: "grid", gap: 12, marginTop: 18 }}>
                <input type="hidden" name="doctor_profile_id" value={id} />
                <input name="organisation" required placeholder="Professional organisation" />
                <input name="membership_number" placeholder="Membership / registration number" />
                <button className="button button--ghost" type="submit">Add membership</button>
              </form>
            </div>
          </article>
        </div>

        <div className="portal-grid" style={{ marginTop: 28 }}>
          <article className="portal-card">
            <div className="portal-card__header"><h2>External professional profiles</h2></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(linksResult.data ?? []).map((item) => (
                  <div className="status-row" key={item.id}>
                    <div><strong>{item.label}</strong><br /><small>{item.url}</small></div>
                    <span />
                    <form action={deleteDoctorDetail}><input type="hidden" name="doctor_profile_id" value={id} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="type" value="link" /><button className="text-link" type="submit">Remove</button></form>
                  </div>
                ))}
              </div>
              <form action={addDoctorExternalLink} style={{ display: "grid", gap: 12, marginTop: 18 }}>
                <input type="hidden" name="doctor_profile_id" value={id} />
                <input name="label" required placeholder="Practo / Professional society / LinkedIn" />
                <input name="url" type="url" required placeholder="https://..." />
                <button className="button button--ghost" type="submit">Add external profile</button>
              </form>
            </div>
          </article>

          <article className="portal-card">
            <div className="portal-card__header"><h2>Connected clinical work</h2></div>
            <div className="portal-card__body">
              <p><strong>{postsResult.data?.length ?? 0}</strong> linked Journal articles</p>
              <p><strong>{casesResult.data?.length ?? 0}</strong> linked Signature Cases</p>
              <p className="form-note">Assign the doctor while creating an article or Signature Case. Published items then appear automatically on this portfolio.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="button button--ghost" href="/clinic/publishing">Open publishing →</Link>
                <Link className="button button--ghost" href="/clinic/cases">Open cases →</Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
