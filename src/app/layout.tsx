import type { Metadata, Viewport } from "next";
import PublicDentalAssistant from "@/components/public-dental-assistant";
import { SiteStructuredData } from "@/components/site-structured-data";
import "./globals.css";
import "./assistant.css";
import "./accessibility.css";
import "./brand.css";
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
    default: "Dentist in Ameerpet, Hyderabad | JV Dental & Implant Centre",
    template: "%s | JV Dental",
  },
  description:
    "Complete dental care near Ameerpet and S R Nagar, Hyderabad, including general dentistry, restorative care, root canal treatment, crowns, dentures, oral surgery and advanced dental implants.",
  keywords: [
    "dentist Ameerpet",
    "dental clinic Ameerpet",
    "dentist SR Nagar",
    "dentist Hyderabad",
    "dental implants Hyderabad",
    "dental clinic near Ameerpet",
    "JV Dental",
  ],
  openGraph: {
    type: "website",
    siteName: "JV Dental & Implant Centre",
    title: "Dentist in Ameerpet, Hyderabad | JV Dental & Implant Centre",
    description:
      "Complete dental care in Hyderabad with advanced implant dentistry, restorative treatment and support for local and international patients.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dentist in Ameerpet, Hyderabad | JV Dental",
    description:
      "Complete dental care in Hyderabad with advanced implant dentistry and coordinated patient support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteStructuredData />
        {children}
        <PublicDentalAssistant />
      </body>
    </html>
  );
}
