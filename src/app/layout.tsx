import type { Metadata } from "next";
import PublicDentalAssistant from "@/components/public-dental-assistant";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JV Dental & Implant Centre",
    template: "%s | JV Dental",
  },
  description:
    "Advanced implant dentistry and full-mouth rehabilitation in Hyderabad, India, for patients from India and around the world.",
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
