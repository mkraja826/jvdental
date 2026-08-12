import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="wordmark" href="/"><span>JV</span><span>Dental</span></Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/guided-implants">Guided implants</Link>
            <Link href="/cases">Cases</Link>
            <Link href="/journal">Journal</Link>
          </nav>
          <div className="header-actions"><Link className="button" href="/patient/login">Patient login</Link></div>
        </div>
      </header>

      <section className="section">
        <p className="section-kicker">JV Dental Journal</p>
        <h1 className="section-title">Clinical knowledge, explained for patients.</h1>
        <p className="section-intro">Doctor-authored articles on guided implant surgery, digital planning, full-arch rehabilitation, implant maintenance and international treatment preparation.</p>

        <div className="principle-list" style={{ marginTop: 64 }}>
          {(posts ?? []).map((post, index) => (
            <Link className="principle" href={`/journal/${post.slug}`} key={post.id}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{post.title}</h3>
                <p>{post.excerpt ?? "Read the article."}</p>
                <small>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</small>
              </div>
            </Link>
          ))}
          {!posts?.length ? <p style={{ padding: "32px 0" }}>The doctor’s journal is being prepared.</p> : null}
        </div>
      </section>
    </main>
  );
}
