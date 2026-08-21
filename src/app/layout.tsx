import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import PublicDentalAssistant from "@/components/public-dental-assistant";
import { SiteStructuredData } from "@/components/site-structured-data";
import { DEFAULT_WEBSITE_THEME, getWebsiteTheme, websiteThemeVariables } from "@/content/website-themes";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import "./assistant.css";
import "./accessibility.css";
import "./brand.css";
import "./website-themes.css";
import "./header-responsive.css";
import "./clinic-visuals.css";
import "./mobile-first.css";
import "./booking.css";
import "./mobile-v2.css";
import "./mobile-polish.css";
import "./public-content.css";
import "./site-audit.css";
import "./home-mobile.css";
import "./footer-polish.css";
import "./mobile-stabilization.css";
import "./route-mobile-qa.css";
import "./detail-mobile-qa.css";
import "./treatment-contrast.css";
import "./complete-care.css";
import "./mobile-header-final.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "JV Dental & Implant Centre",
  title: {
    default: "Dental Implants in Hyderabad | JV Dental & Implant Centre",
    template: "%s | JV Dental",
  },
  description:
    "Implant-focused dental care in Hyderabad with guided implant surgery, full-mouth rehabilitation and complete adult dentistry at JV Dental near Ameerpet and S R Nagar.",
  keywords: [
    "dental implants Hyderabad",
    "implant dentist Hyderabad",
    "guided dental implants Hyderabad",
    "full mouth dental implants Hyderabad",
    "dentist Ameerpet",
    "dental clinic Ameerpet",
    "dentist SR Nagar",
    "JV Dental",
  ],
  openGraph: {
    type: "website",
    siteName: "JV Dental & Implant Centre",
    title: "Dental Implants in Hyderabad | JV Dental & Implant Centre",
    description:
      "Implant-focused dentistry in Hyderabad with guided implant planning, full-mouth rehabilitation and complete adult dental care.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dental Implants in Hyderabad | JV Dental",
    description:
      "Implant-focused dentistry with guided planning, complex rehabilitation and complete adult dental care in Hyderabad.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function resolveWebsiteTheme() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("website_theme_settings")
      .select("theme_key")
      .eq("id", true)
      .maybeSingle();
    return getWebsiteTheme(data?.theme_key ?? DEFAULT_WEBSITE_THEME);
  } catch {
    return getWebsiteTheme(DEFAULT_WEBSITE_THEME);
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await resolveWebsiteTheme();

  return (
    <html lang="en" data-website-theme={theme.key} style={websiteThemeVariables(theme) as CSSProperties}>
      <body>
        <SiteStructuredData />
        {children}
        <PublicDentalAssistant />
      </body>
    </html>
  );
}
