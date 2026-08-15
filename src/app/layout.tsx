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
import "./complete-care.css";

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
