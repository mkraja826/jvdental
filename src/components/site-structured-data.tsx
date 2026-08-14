const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jvdental.com").replace(/\/$/, "");

const dentalClinicSchema = {
  "@context": "https://schema.org",
  "@type": ["Dentist", "LocalBusiness"],
  "@id": `${siteUrl}/#dental-clinic`,
  name: "JV Dental & Implant Centre",
  alternateName: "JV Dental",
  url: siteUrl,
  logo: `${siteUrl}/jv-dental-logo.svg`,
  image: `${siteUrl}/jv-dental-logo.svg`,
  telephone: "+91-40-4020-8910",
  address: {
    "@type": "PostalAddress",
    streetAddress: "7-1-395/29 (34-A), Sai Ganga Towers, Balkampet Road, S R Nagar",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500038",
    addressCountry: "IN",
  },
  areaServed: [
    { "@type": "City", name: "Hyderabad" },
    { "@type": "Place", name: "Ameerpet" },
    { "@type": "Place", name: "S R Nagar" },
  ],
  sameAs: [
    "https://in.linkedin.com/in/jaya-prakash-chinta-9849a51b8",
    "https://www.practo.com/hyderabad/clinic/jv-dental-care-sr-nagar-1",
  ],
  medicalSpecialty: [
    "Dentistry",
    "Implant dentistry",
    "Restorative dentistry",
    "Prosthodontics",
  ],
};

export function SiteStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dentalClinicSchema) }}
    />
  );
}
