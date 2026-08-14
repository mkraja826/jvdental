import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { publishBlogToBlogger, saveBlogPost, setBlogStatus } from "@/app/clinic/publishing/actions";
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

  let postsQuery = supabase
    .from("blog_posts")
    .select("id,author_user_id,title,slug,status,published_at,updated_at,doctor_profiles(full_name,slug),blog_publications(id,channel,external_blog_name,external_post_id,external_url,publish_status,last_error,last_synced_at)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (!["owner", "admin"].includes(staff.role)) postsQuery = postsQuery.eq("author_user_id", user.id);

  const [{ data: posts }, { data: doctors }, { data: blogger }] = await Promise.all([
    postsQuery,
    doctorQuery,
    supabase
      .from("publishing_integrations")
      .select("id,provider,external_blog_name,external_blog_url,status,last_sync_at,last_error")
      .eq("provider", "blogger")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const bloggerReady = blogger?.status === "connected" && Boolean(blogger.external_blog_name);

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
            {new Set(["owner", "admin"]).has(staff.role) ? <Link href="/clinic/integrations">Integrations</Link> : null}
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Doctor publishing</p>
          <h1 className="portal-title">Write once. Publish carefully.</h1>
          <p className="portal-subtitle">JV Dental remains the primary clinical Journal. Published articles can be synchronized to one explicitly connected Blogger / Blogspot publication target without creating duplicate external posts on every edit.</p>

          {params.saved ? <p className="status-pill">Article saved</p> : null}
          {params.blogger === "published" ? <p className="form-note">Article published to Blogger and linked to this JV Dental article.</p> : null}
          {params.blogger === "synced" ? <p className="form-note">The existing Blogger post was synchronized with the current JV Dental article.</p> : null}
          {params.error === "blogger_publish" ? <p style={{ color: "var(--danger)" }}>Blogger publish/sync failed. Check the integration status and article state.</p> : null}
          {params.error && params.error !== "blogger_publish" ? <p style={{ color: "var(--danger)" }}>The article could not be saved. Check the title, doctor attribution, slug and required fields.</p> : null}

          <article className="portal-card" style={{ marginBottom: 24 }}>
            <div className="portal-card__header"><h2>External publishing</h2><span className="status-pill">{bloggerReady ? "Blogger ready" : blogger?.status?.replaceAll("_", " ") ?? "Not connected"}</span></div>
            <div className="portal-card__body">
              {bloggerReady ? (
                <div className="status-list">
                  <div className="status-row"><strong>Target blog</strong><span>{blogger?.external_blog_name}</span><span>{blogger?.external_blog_url ? <a className="text-link" href={blogger.external_blog_url} target="_blank" rel="noreferrer">Open ↗</a> : null}</span></div>
                  <div className="status-row"><strong>Last sync</strong><span>{blogger?.last_sync_at ? new Date(blogger.last_sync_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                </div>
              ) : (
                <p>Blogger is not ready. An Owner/Admin must connect the clinic&apos;s Blogger account and select the exact Blogspot target before external publishing becomes available.</p>
              )}
              {blogger?.last_error ? <p className="form-note">Blogger sync detail: {blogger.last_error}</p> : null}
              {new Set(["owner", "admin"]).has(staff.role) ? <Link className="button button--ghost" href="/clinic/integrations">Manage publishing integration →</Link> : null}
            </div>
          </article>

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
                  <PendingSubmit label="Save article" pendingLabel="Saving article…" className="button" />
                </form>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Articles</h2><span className="status-pill">{posts?.length ?? 0}</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {(posts ?? []).map((post) => {
                    const doctor = Array.isArray(post.doctor_profiles) ? post.doctor_profiles[0] : post.doctor_profiles;
                    const publications = Array.isArray(post.blog_publications) ? post.blog_publications : [];
                    const bloggerPublication = publications.find((publication) => publication.channel === "blogger");
                    const canPush = bloggerReady && post.status === "published";
                    return (
                      <div className="status-row" key={post.id} style={{ alignItems: "start" }}>
                        <div>
                          <strong>{post.title}</strong><br />
                          <small>{doctor?.full_name ? `${doctor.full_name} · ` : ""}/{post.slug}</small>
                          {bloggerPublication ? (
                            <div style={{ marginTop: 8 }}>
                              <small>Blogger · {bloggerPublication.publish_status.replaceAll("_", " ")}{bloggerPublication.last_synced_at ? ` · ${new Date(bloggerPublication.last_synced_at).toLocaleDateString("en-IN")}` : ""}</small>
                              {bloggerPublication.external_url ? <> · <a className="text-link" href={bloggerPublication.external_url} target="_blank" rel="noreferrer">Open post ↗</a></> : null}
                              {bloggerPublication.last_error ? <div><small style={{ color: "var(--danger)" }}>{bloggerPublication.last_error}</small></div> : null}
                            </div>
                          ) : null}
                        </div>
                        <span className="status-pill">{post.status}</span>
                        <div style={{ display: "grid", gap: 8 }}>
                          <form action={setBlogStatus}>
                            <input type="hidden" name="id" value={post.id} />
                            <select name="status" defaultValue={post.status} aria-label={`Status for ${post.title}`}>
                              <option value="draft">Draft</option>
                              <option value="review">Review</option>
                              <option value="published">Published</option>
                              <option value="archived">Archived</option>
                            </select>
                            <PendingSubmit label="Update" pendingLabel="Updating…" className="text-link" />
                          </form>
                          {canPush ? (
                            <form action={publishBlogToBlogger}>
                              <input type="hidden" name="blog_post_id" value={post.id} />
                              <PendingSubmit
                                label={bloggerPublication?.external_post_id ? "Sync Blogger" : "Publish to Blogger"}
                                pendingLabel={bloggerPublication?.external_post_id ? "Syncing…" : "Publishing…"}
                                className="button button--ghost"
                              />
                            </form>
                          ) : null}
                        </div>
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
