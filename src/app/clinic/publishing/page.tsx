import Link from "next/link";
import { saveBlogPost, setBlogStatus } from "@/app/clinic/publishing/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function PublishingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireClinicalPublisher();
  const params = await searchParams;
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id,title,slug,status,published_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

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
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Doctor publishing</p>
          <h1 className="portal-title">Write once. Publish carefully.</h1>
          <p className="portal-subtitle">Create doctor-authored educational articles for JV Dental. External syndication is tracked separately so JV Dental can remain the canonical source.</p>

          {params.saved ? <p className="status-pill">Article saved</p> : null}
          {params.error ? <p style={{ color: "var(--danger)" }}>The article could not be saved. Check the title, slug and required fields.</p> : null}

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>New article</h2><span className="status-pill">Clinical authoring</span></div>
              <div className="portal-card__body">
                <form action={saveBlogPost} style={{ display: "grid", gap: 18 }}>
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
                  {(posts ?? []).map((post) => (
                    <div className="status-row" key={post.id}>
                      <div><strong>{post.title}</strong><br /><small>/{post.slug}</small></div>
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
                  ))}
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
