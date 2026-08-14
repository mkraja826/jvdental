import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string }> };

async function getPublishedPost(slug: string) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,content_markdown,published_at,updated_at,seo_title,seo_description,doctor_profiles(full_name,slug,professional_title)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return post;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Dental Journal | JV Dental" };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Dental education from the clinical team at JV Dental & Implant Centre in Hyderabad.`;

  return {
    title,
    description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/journal/${post.slug}`,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(post.updated_at ? { modifiedTime: post.updated_at } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const doctor = Array.isArray(post.doctor_profiles) ? post.doctor_profiles[0] : post.doctor_profiles;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/journal/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${articleUrl}#article`,
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    url: articleUrl,
    mainEntityOfPage: articleUrl,
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(doctor?.slug ? {
      author: {
        "@type": "Person",
        "@id": `${siteUrl}/doctors/${doctor.slug}#person`,
        name: doctor.full_name,
        url: `${siteUrl}/doctors/${doctor.slug}`,
      },
    } : {
      author: {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "JV Dental & Implant Centre",
      },
    }),
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "JV Dental & Implant Centre",
      url: siteUrl,
    },
  };

  return (
    <main className="journal-article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
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
          <div className="hero__actions">
            <Link className="button" href="/book">Book a dental consultation</Link>
            <Link className="button button--ghost" href="/dental-treatments">Explore dental treatments</Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
