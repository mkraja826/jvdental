import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title,excerpt,content_markdown,published_at,seo_title,seo_description,doctor_profiles(full_name,slug,professional_title)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();
  const doctor = Array.isArray(post.doctor_profiles) ? post.doctor_profiles[0] : post.doctor_profiles;

  return (
    <main className="journal-article-page">
      <SiteHeader />

      <article className="section journal-article">
        <p className="section-kicker">JV Dental Journal</p>
        <h1 className="section-title">{post.title}</h1>
        {post.excerpt ? <p className="section-intro">{post.excerpt}</p> : null}
        <div className="journal-article__meta">
          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
          {doctor?.slug ? <Link className="text-link" href={`/doctors/${doctor.slug}`}>By {doctor.full_name} · {doctor.professional_title ?? "JV Dental clinician"} →</Link> : null}
        </div>

        <div className="journal-article__body">{post.content_markdown}</div>

        {doctor?.slug ? (
          <div className="journal-author">
            <p className="section-kicker">About the author</p>
            <h2>{doctor.full_name}</h2>
            <p>{doctor.professional_title}</p>
            <Link className="text-link" href={`/doctors/${doctor.slug}`}>View doctor portfolio →</Link>
          </div>
        ) : null}

        <div className="journal-article__cta">
          <p>This article is for general dental education and does not replace an individual clinical and radiographic assessment.</p>
          <Link className="button" href="/book">Book an implant assessment</Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
