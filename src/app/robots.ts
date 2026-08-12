import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/patient/", "/clinic/", "/staff/", "/auth/", "/notifications/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
