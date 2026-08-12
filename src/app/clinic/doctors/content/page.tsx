import Link from "next/link";
import { redirect } from "next/navigation";
import { assignDoctorArticle, assignDoctorCase, unlinkDoctorContent } from "@/app/clinic/doctors/content-actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function DoctorContentAttributionPage() {
  const { supabase, staff } = await requireStaff();
  if (!["owner", "admin"].includes(staff.role)) redirect("/clinic");

  const [doctorsResult, casesResult, articlesResult] = await Promise.all([
    supabase.from("doctor_profiles").select("id,full_name,status").neq("status", "archived").order("display_order").order("full_name"),
    supabase.from("signature_cases").select("id,title,treatment_type,publication_status,doctor_profile_id,doctor_profiles(full_name)").order("updated_at", { ascending: false }).limit(100),
    supabase.from("blog_posts").select("id,title,status,doctor_profile_id,doctor_profiles(full_name)").order("updated_at", { ascending: false }).limit(100),
  ]);

  const doctors = doctorsResult.data ?? [];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><Link className="text-link" href="/clinic/doctors">← Doctor portfolios</Link><span className="status-pill">Attribution</span></div>
      </header>

      <section className="portal-main">
        <p className="portal-overline">Portfolio attribution</p>
        <h1 className="portal-title">Connect the right doctor to the right work.</h1>
        <p className="portal-subtitle">Use this screen for existing content, imported material or cases created before a doctor portfolio existed. Public doctor pages only show content linked here and already approved for public publication.</p>

        <div className="portal-grid">
          <article className="portal-card">
            <div className="portal-card__header"><h2>Signature Cases</h2><span className="status-pill">{casesResult.data?.length ?? 0}</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(casesResult.data ?? []).map((item) => {
                  const linked = Array.isArray(item.doctor_profiles) ? item.doctor_profiles[0] : item.doctor_profiles;
                  return (
                    <div className="status-row" key={item.id}>
                      <div><strong>{item.title}</strong><br /><small>{item.treatment_type} · {item.publication_status}</small></div>
                      <span>{linked?.full_name ?? "Unassigned"}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <form action={assignDoctorCase} style={{ display: "flex", gap: 8 }}>
                          <input type="hidden" name="case_id" value={item.id} />
                          <select name="doctor_profile_id" defaultValue={item.doctor_profile_id ?? ""} required>
                            <option value="" disabled>Select doctor</option>
                            {doctors.map((doctor) => <option value={doctor.id} key={doctor.id}>{doctor.full_name}</option>)}
                          </select>
                          <button className="text-link" type="submit">Assign</button>
                        </form>
                        {item.doctor_profile_id ? (
                          <form action={unlinkDoctorContent}>
                            <input type="hidden" name="doctor_profile_id" value={item.doctor_profile_id} />
                            <input type="hidden" name="content_id" value={item.id} />
                            <input type="hidden" name="type" value="case" />
                            <button className="text-link" type="submit">Unlink</button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="portal-card">
            <div className="portal-card__header"><h2>Journal articles</h2><span className="status-pill">{articlesResult.data?.length ?? 0}</span></div>
            <div className="portal-card__body">
              <div className="status-list">
                {(articlesResult.data ?? []).map((item) => {
                  const linked = Array.isArray(item.doctor_profiles) ? item.doctor_profiles[0] : item.doctor_profiles;
                  return (
                    <div className="status-row" key={item.id}>
                      <div><strong>{item.title}</strong><br /><small>{item.status}</small></div>
                      <span>{linked?.full_name ?? "Unassigned"}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <form action={assignDoctorArticle} style={{ display: "flex", gap: 8 }}>
                          <input type="hidden" name="article_id" value={item.id} />
                          <select name="doctor_profile_id" defaultValue={item.doctor_profile_id ?? ""} required>
                            <option value="" disabled>Select doctor</option>
                            {doctors.map((doctor) => <option value={doctor.id} key={doctor.id}>{doctor.full_name}</option>)}
                          </select>
                          <button className="text-link" type="submit">Assign</button>
                        </form>
                        {item.doctor_profile_id ? (
                          <form action={unlinkDoctorContent}>
                            <input type="hidden" name="doctor_profile_id" value={item.doctor_profile_id} />
                            <input type="hidden" name="content_id" value={item.id} />
                            <input type="hidden" name="type" value="article" />
                            <button className="text-link" type="submit">Unlink</button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
