import type { Metadata } from "next";
import PublicDentalAssistant from "@/components/public-dental-assistant";
import "./globals.css";
import "./assistant.css";
import "./accessibility.css";
import "./brand.css";
import "./header-responsive.css";
import "./clinic-visuals.css";
import "./mobile-first.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "JV Dental & Implant Centre",
  title: {
    default: "JV Dental & Implant Centre",
    template: "%s | JV Dental",
  },
  description:
    "Advanced implant dentistry and full-mouth rehabilitation in Hyderabad, India, for patients from India and around the world.",
  openGraph: {
    type: "website",
    siteName: "JV Dental & Implant Centre",
    title: "JV Dental & Implant Centre",
    description:
      "Advanced implant dentistry and full-mouth rehabilitation in Hyderabad, India, for patients from India and around the world.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "JV Dental & Implant Centre",
    description:
      "Advanced implant dentistry and full-mouth rehabilitation in Hyderabad, India, for patients from India and around the world.",
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
        {children}
        <PublicDentalAssistant />
      </body>
    </html>
  );
}
