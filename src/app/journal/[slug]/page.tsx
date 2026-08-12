import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main>
      <SiteHeader />

      <article className="section" style={{ maxWidth: 980 }}>
        <p className="section-kicker">JV Dental Journal</p>
        <h1 className="section-title">{post.title}</h1>
        {post.excerpt ? <p className="section-intro">{post.excerpt}</p> : null}
        <div style={{ marginTop: 24, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", color: "var(--muted)", fontSize: ".78rem" }}>
          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
          {doctor?.slug ? <Link className="text-link" href={`/doctors/${doctor.slug}`}>By {doctor.full_name} · {doctor.professional_title ?? "JV Dental clinician"} →</Link> : null}
        </div>

        <div style={{ marginTop: 64, maxWidth: 760, whiteSpace: "pre-wrap", fontSize: "1.08rem", lineHeight: 1.8 }}>
          {post.content_markdown}
        </div>

        {doctor?.slug ? (
          <div style={{ marginTop: 56, padding: "26px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <p className="section-kicker">About the author</p>
            <h2 style={{ margin: "8px 0 10px", fontFamily: "var(--serif)", fontWeight: 400 }}>{doctor.full_name}</h2>
            <p style={{ color: "var(--muted)" }}>{doctor.professional_title}</p>
            <Link className="text-link" href={`/doctors/${doctor.slug}`}>View doctor portfolio →</Link>
          </div>
        ) : null}

        <div style={{ marginTop: 72, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
          <p style={{ color: "var(--muted)", fontSize: ".82rem" }}>This article is for general dental education and does not replace an individual clinical and radiographic assessment.</p>
          <Link className="button" href="/patient/login?next=/patient/intake">Request an implant assessment</Link>
        </div>
      </article>
    </main>
  );
}
