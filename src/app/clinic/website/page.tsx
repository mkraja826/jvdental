import { redirect } from "next/navigation";
import WebsiteMediaUploader from "@/components/website-media-uploader";
import WebsiteThemePicker from "@/components/website-theme-picker";
import { DEFAULT_WEBSITE_THEME, getWebsiteTheme } from "@/content/website-themes";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const groups = [
  {
    title: "Homepage",
    description: "Main public-facing photography used to establish trust and the clinic identity.",
    slots: [
      { key: "home-hero", label: "Homepage hero", description: "Primary homepage image. Keep the subject slightly off-centre so text has room.", width: 1600, height: 1000, previewHref: "/" },
      { key: "clinic-team", label: "Clinic / team", description: "Clinic or team image used in trust and about sections.", width: 1400, height: 1050, previewHref: "/" },
    ],
  },
  {
    title: "Implants",
    description: "Primary imagery for JV Dental's implant-focused treatment experience.",
    slots: [
      { key: "implant-hero", label: "Dental implants hero", description: "Main image for implant-focused pages and promotions.", width: 1600, height: 1000, previewHref: "/dental-implants" },
    ],
  },
  {
    title: "Treatments",
    description: "Supporting adult-dentistry pages. Each image is independently replaceable.",
    slots: [
      { key: "treatment-root-canal", label: "Root canal", description: "Treatment-specific image for the root canal page.", width: 1400, height: 900, previewHref: "/dental-treatments/root-canal-treatment" },
      { key: "treatment-crowns-bridges", label: "Crowns & bridges", description: "Treatment-specific image for crowns and bridges.", width: 1400, height: 900, previewHref: "/dental-treatments/crowns-bridges" },
      { key: "treatment-cosmetic", label: "Cosmetic dentistry", description: "Treatment-specific image for cosmetic dentistry.", width: 1400, height: 900, previewHref: "/dental-treatments/cosmetic-dentistry" },
      { key: "treatment-whitening", label: "Teeth whitening", description: "Treatment-specific image for whitening.", width: 1400, height: 900, previewHref: "/dental-treatments/teeth-whitening" },
      { key: "treatment-aligners", label: "Clear aligners", description: "Treatment-specific image for aligners.", width: 1400, height: 900, previewHref: "/dental-treatments/clear-aligners" },
      { key: "treatment-braces", label: "Braces", description: "Treatment-specific image for braces.", width: 1400, height: 900, previewHref: "/dental-treatments/braces" },
      { key: "treatment-gum-care", label: "Gum care", description: "Treatment-specific image for periodontal care.", width: 1400, height: 900, previewHref: "/dental-treatments/gum-care" },
      { key: "treatment-cleaning", label: "Scaling & cleaning", description: "Treatment-specific image for professional cleaning.", width: 1400, height: 900, previewHref: "/dental-treatments/scaling-cleaning" },
      { key: "treatment-fillings", label: "Dental fillings", description: "Treatment-specific image for restorative fillings.", width: 1400, height: 900, previewHref: "/dental-treatments/fillings" },
    ],
  },
  {
    title: "International patients",
    description: "Photography used for the international treatment and dental-tourism journey.",
    slots: [
      { key: "international-hero", label: "International patients hero", description: "Hero image for dental-tourism and international-patient content.", width: 1600, height: 1000, previewHref: "/international" },
    ],
  },
] as const;

export default async function WebsiteMediaPage() {
  const { staff } = await requireStaff();
  if (staff.role !== "owner" && staff.role !== "admin") redirect("/clinic");

  const supabase = await createClient();
  const [{ data: mediaData }, { data: themeData }] = await Promise.all([
    supabase.from("website_media").select("slot_key,storage_path,alt_text"),
    supabase.from("website_theme_settings").select("theme_key").eq("id", true).maybeSingle(),
  ]);

  const current = new Map((mediaData ?? []).map((row) => [row.slot_key, row]));
  const currentTheme = getWebsiteTheme(themeData?.theme_key ?? DEFAULT_WEBSITE_THEME).key;

  return (
    <main className="clinic-page-shell">
      <header className="clinic-page-header">
        <div><p className="portal-overline">Website</p><h1>Website art</h1></div>
        <p>Control the public website&apos;s approved visual style from one place. Choose a preset theme or manage website photography without touching code.</p>
      </header>

      <WebsiteThemePicker currentTheme={currentTheme} />

      <section aria-labelledby="website-photos-heading">
        <div style={{ marginBottom: 22 }}>
          <p className="portal-overline">Website art</p>
          <h2 id="website-photos-heading" style={{ marginBottom: 6 }}>Website photos</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Upload any suitable photo, crop it to the fixed frame, publish it, or restore the website default image at any time.</p>
        </div>

        <div style={{ display: "grid", gap: 36 }}>
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={`media-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <div style={{ marginBottom: 16 }}>
                <p className="portal-overline">Website media</p>
                <h3 id={`media-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} style={{ marginBottom: 6 }}>{group.title}</h3>
                <p style={{ margin: 0, color: "var(--muted)" }}>{group.description}</p>
              </div>
              <div className="portal-grid" style={{ alignItems: "start" }}>
                {group.slots.map((slot) => {
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
                    previewHref={slot.previewHref}
                    currentPath={item?.storage_path ?? null}
                    currentUrl={currentUrl}
                    currentAlt={item?.alt_text ?? null}
                  />;
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
