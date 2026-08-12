import Link from "next/link";
import { saveBlogPost, setBlogStatus } from "@/app/clinic/publishing/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function PublishingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, staff, user } = await requireClinicalPublisher();
  const params = await searchParams;

  let doctorQuery = supabase
    .from("doctor_profiles")
    .select("id,full_name,slug,staff_user_id,status")
    .neq("status", "archived")
    .order("display_order")
    .order("full_name");
  if (!["owner", "admin"].includes(staff.role)) doctorQuery = doctorQuery.eq("staff_user_id", user.id);

  const [{ data: posts }, { data: doctors }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id,title,slug,status,published_at,updated_at,doctor_profiles(full_name,slug)")
      .order("updated_at", { ascending: false })
      .limit(50),
    doctorQuery,
  ]);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><Link className="text-link" href="/clinic">Back to clinic</Link></div>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Publishing navigation">
            <Link href="/clinic/publishing">Publishing</Link>
            <Link href="/journal">Public journal</Link>
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic/doctors">Doctor portfolios</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Doctor publishing</p>
          <h1 className="portal-title">Write once. Publish carefully.</h1>
          <p className="portal-subtitle">Create doctor-authored educational articles for JV Dental. Assigning a doctor portfolio lets the article appear automatically in that clinician&apos;s public portfolio.</p>

          {params.saved ? <p className="status-pill">Article saved</p> : null}
          {params.error ? <p style={{ color: "var(--danger)" }}>The article could not be saved. Check the title, doctor attribution, slug and required fields.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>New article</h2><span className="status-pill">Clinical authoring</span></div>
              <div className="portal-card__body">
                <form action={saveBlogPost} style={{ display: "grid", gap: 18 }}>
                  <label>Doctor portfolio
                    <select name="doctor_profile_id" defaultValue="">
                      <option value="">JV Dental editorial / not attributed</option>
                      {(doctors ?? []).map((doctor) => <option value={doctor.id} key={doctor.id}>{doctor.full_name}</option>)}
                    </select>
                  </label>
                  <label>Title<input name="title" required minLength={5} placeholder="Guided dental implants: what patients should know" /></label>
                  <label>URL slug<input name="slug" placeholder="guided-dental-implants" /></label>
                  <label>Short introduction<textarea name="excerpt" rows={3} placeholder="A concise patient-friendly summary." /></label>
                  <label>Article<textarea name="content" rows={16} required placeholder="Write the article here. Clinical claims should be evidence-based and doctor approved." /></label>
                  <label>SEO title<input name="seo_title" maxLength={70} /></label>
                  <label>SEO description<textarea name="seo_description" rows={3} maxLength={180} /></label>
                  <label>Publishing state
                    <select name="status" defaultValue="draft">
                      <option value="draft">Draft</option>
                      <option value="review">Ready for review</option>
                      <option value="published">Publish on JV Dental</option>
                    </select>
                  </label>
                  <button className="button" type="submit">Save article</button>
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Articles</h2><span className="status-pill">{posts?.length ?? 0}</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(posts ?? []).map((post) => {
                    const doctor = Array.isArray(post.doctor_profiles) ? post.doctor_profiles[0] : post.doctor_profiles;
                    return (
                      <div className="status-row" key={post.id}>
                        <div><strong>{post.title}</strong><br /><small>{doctor?.full_name ? `${doctor.full_name} · ` : ""}/{post.slug}</small></div>
                        <span className="status-pill">{post.status}</span>
                        <form action={setBlogStatus}>
                          <input type="hidden" name="id" value={post.id} />
                          <select name="status" defaultValue={post.status} aria-label={`Status for ${post.title}`}>
                            <option value="draft">Draft</option>
                            <option value="review">Review</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button className="text-link" type="submit" style={{ marginLeft: 8, background: "none", border: 0, cursor: "pointer" }}>Update</button>
                        </form>
                      </div>
                    );
                  })}
                  {!posts?.length ? <p>No articles yet.</p> : null}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
