import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { internationalMarkets } from "@/content/international-markets";
import { generalTreatmentPages } from "@/content/general-treatment-pages";

export const dynamic = "force-dynamic";

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/dentist-ameerpet`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/hyderabad-dentist`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/dental-treatments`, changeFrequency: "monthly", priority: 0.95 },
    ...generalTreatmentPages.map((treatment) => ({
      url: `${siteUrl}/dental-treatments/${treatment.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/dental-implants`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/full-arch-implants`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/all-on-4-all-on-6`, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/bone-grafting-dental-implants`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/guided-implants`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/international`, changeFrequency: "monthly", priority: 0.9 },
    ...internationalMarkets.map((market) => ({
      url: `${siteUrl}/international/${market.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    { url: `${siteUrl}/doctors`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/cases`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/journal`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/book`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const supabase = await createClient();
    const [doctorsResult, postsResult, casesResult] = await Promise.all([
      supabase
        .from("doctor_profiles")
        .select("slug,updated_at")
        .eq("status", "published")
        .order("display_order"),
      supabase
        .from("blog_posts")
        .select("slug,updated_at")
        .eq("status", "published")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString()),
      supabase
        .from("signature_cases")
        .select("slug,updated_at")
        .eq("publication_status", "published")
        .eq("consent_for_website", true),
    ]);

    const doctorRoutes: MetadataRoute.Sitemap = (doctorsResult.data ?? []).map((doctor) => ({
      url: `${siteUrl}/doctors/${doctor.slug}`,
      lastModified: asDate(doctor.updated_at),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const journalRoutes: MetadataRoute.Sitemap = (postsResult.data ?? []).map((post) => ({
      url: `${siteUrl}/journal/${post.slug}`,
      lastModified: asDate(post.updated_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    const caseRoutes: MetadataRoute.Sitemap = (casesResult.data ?? []).map((caseRecord) => ({
      url: `${siteUrl}/cases/${caseRecord.slug}`,
      lastModified: asDate(caseRecord.updated_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...doctorRoutes, ...caseRoutes, ...journalRoutes];
  } catch {
    return staticRoutes;
  }
}
