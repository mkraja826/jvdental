import { redirect } from "next/navigation";
import WebsiteMediaUploader from "@/components/website-media-uploader";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const slots = [
  { key: "home-hero", label: "Homepage hero", description: "Primary homepage image. Keep the subject slightly off-centre so text has room.", width: 1600, height: 1000 },
  { key: "clinic-team", label: "Clinic / team", description: "Clinic or team image used in trust and about sections.", width: 1400, height: 1050 },
  { key: "implant-hero", label: "Dental implants hero", description: "Main image for implant-focused pages and promotions.", width: 1600, height: 1000 },
  { key: "treatment-root-canal", label: "Root canal", description: "Treatment-specific image for the root canal page.", width: 1400, height: 900 },
  { key: "treatment-crowns-bridges", label: "Crowns & bridges", description: "Treatment-specific image for crowns and bridges.", width: 1400, height: 900 },
  { key: "treatment-cosmetic", label: "Cosmetic dentistry", description: "Treatment-specific image for cosmetic dentistry.", width: 1400, height: 900 },
  { key: "treatment-whitening", label: "Teeth whitening", description: "Treatment-specific image for whitening.", width: 1400, height: 900 },
  { key: "treatment-aligners", label: "Clear aligners", description: "Treatment-specific image for aligners.", width: 1400, height: 900 },
  { key: "treatment-braces", label: "Braces", description: "Treatment-specific image for braces.", width: 1400, height: 900 },
  { key: "treatment-gum-care", label: "Gum care", description: "Treatment-specific image for periodontal care.", width: 1400, height: 900 },
  { key: "treatment-cleaning", label: "Scaling & cleaning", description: "Treatment-specific image for professional cleaning.", width: 1400, height: 900 },
  { key: "treatment-fillings", label: "Dental fillings", description: "Treatment-specific image for restorative fillings.", width: 1400, height: 900 },
  { key: "international-hero", label: "International patients", description: "Hero image for dental-tourism and international-patient content.", width: 1600, height: 1000 },
] as const;

export default async function WebsiteMediaPage() {
  const { staff } = await requireStaff();
  if (staff.role !== "owner" && staff.role !== "admin") redirect("/clinic");

  const supabase = await createClient();
  const { data } = await supabase.from("website_media").select("slot_key,storage_path,alt_text");
  const current = new Map((data ?? []).map((row) => [row.slot_key, row]));

  return (
    <main className="clinic-page-shell">
      <header className="clinic-page-header">
        <div><p className="portal-overline">Website</p><h1>Website photos</h1></div>
        <p>Replace public website images without changing code. Every slot uses a fixed crop size so the layout remains consistent on desktop and mobile.</p>
      </header>

      <section className="portal-grid" style={{ alignItems: "start" }}>
        {slots.map((slot) => {
          const item = current.get(slot.key);
          const currentUrl = item?.storage_path
            ? supabase.storage.from("public-content").getPublicUrl(item.storage_path).data.publicUrl
            : null;
          return <WebsiteMediaUploader
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            description={slot.description}
            width={slot.width}
            height={slot.height}
            currentPath={item?.storage_path ?? null}
            currentUrl={currentUrl}
            currentAlt={item?.alt_text ?? null}
          />;
        })}
      </section>
    </main>
  );
}
