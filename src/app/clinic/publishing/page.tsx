import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function PublishingPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id,title,slug,status,published_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic">Back to clinic</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Publishing navigation">
            <Link href="/clinic/publishing">Articles</Link>
            <Link href="/clinic/cases">Signature cases</Link>
            <Link href="/clinic">Overview</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Doctor publishing</p>
          <h1 className="portal-title">Publish expertise, not filler.</h1>
          <p className="portal-subtitle">
            Draft implant articles once, publish them on JV Dental, and track approved external publication channels such as Blogger without duplicating the editorial workflow.
          </p>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Editorial workflow</h2><span className="status-pill">CMS</span></div>
              <div className="portal-card__body">
                <p>Draft → clinical review → SEO review → publish on JV Dental → optionally syndicate externally.</p>
                <p>External publishing is tracked separately so JV Dental remains the canonical source when appropriate.</p>
              </div>
            </article>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Recommended article families</h2></div>
              <div className="portal-card__body">
                <p>Guided implants, DIOnavi workflow, full-arch rehabilitation, bone grafting, implant maintenance, complex implant cases and international-patient preparation.</p>
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Articles</h2><span className="status-pill">{posts?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {!posts?.length ? (
                <p>No articles yet. The editor form is the next publishing milestone.</p>
              ) : (
                <div className="status-list">
                  {posts.map((post) => (
                    <div className="status-row" key={post.id}>
                      <strong>{post.title}</strong>
                      <span>{post.status}</span>
                      <span>{post.published_at ? "Published" : "Not public"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
