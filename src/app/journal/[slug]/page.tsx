import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title,excerpt,content_markdown,published_at,seo_title,seo_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

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

      <article className="section" style={{ maxWidth: 980 }}>
        <p className="section-kicker">JV Dental Journal</p>
        <h1 className="section-title">{post.title}</h1>
        {post.excerpt ? <p className="section-intro">{post.excerpt}</p> : null}
        <p style={{ marginTop: 24, color: "var(--muted)", fontSize: ".78rem" }}>
          {post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}
        </p>

        <div style={{ marginTop: 64, maxWidth: 760, whiteSpace: "pre-wrap", fontSize: "1.08rem", lineHeight: 1.8 }}>
          {post.content_markdown}
        </div>

        <div style={{ marginTop: 72, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
          <p style={{ color: "var(--muted)", fontSize: ".82rem" }}>This article is for general dental education and does not replace an individual clinical and radiographic assessment.</p>
          <Link className="button" href="/patient/login">Request an implant assessment</Link>
        </div>
      </article>
    </main>
  );
}
