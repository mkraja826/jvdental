import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { researchArticles } from "@/content/research-articles";
import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const researchPosts = researchArticles.map((article) => ({
    id: `research-${article.slug}`,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    published_at: article.publishedAt,
  }));
  const allPosts = [...researchPosts, ...(posts ?? [])]
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());

  return (
    <main>
      <SiteHeader />
      <section className="section public-listing-page">
        <p className="section-kicker">JV Dental Journal</p>
        <h1 className="section-title">Clinical knowledge, explained for patients.</h1>
        <p className="section-intro">Doctor-authored and research-backed articles on dental implants, guided surgery, digital planning, full-arch rehabilitation, implant maintenance and international treatment preparation.</p>

        <div className="principle-list public-listing-list">
          {allPosts.map((post, index) => (
            <Link className="principle" href={`/journal/${post.slug}`} key={post.id}>
              <span className="principle__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{post.title}</h3>
                <p>{post.excerpt ?? "Read the article."}</p>
                <small className="public-listing-meta">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</small>
              </div>
            </Link>
          ))}
          {!allPosts.length ? <p className="public-listing-empty">The doctor’s journal is being prepared.</p> : null}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
