export type WebsiteTheme = {
  key: string;
  name: string;
  description: string;
  colors: {
    offWhite: string;
    mist: string;
    accent: string;
    navy: string;
    muted: string;
    line: string;
  };
};

export const DEFAULT_WEBSITE_THEME = "jv-default";

export const websiteThemes: WebsiteTheme[] = [
  { key: "jv-default", name: "JV Dental Default", description: "The original calm blue and navy identity.", colors: { offWhite: "#f9f7f8", mist: "#dae2ef", accent: "#4072af", navy: "#102d4d", muted: "#52677f", line: "#c7d2e2" } },
  { key: "deep-navy", name: "Deep Navy", description: "Confident navy with a clear clinical-blue accent.", colors: { offWhite: "#f7f9fc", mist: "#dfe7f2", accent: "#315f9b", navy: "#0d2948", muted: "#53657a", line: "#cbd5e2" } },
  { key: "dental-teal", name: "Dental Teal", description: "Fresh teal with a grounded deep-green anchor.", colors: { offWhite: "#f6faf9", mist: "#d9ece8", accent: "#238779", navy: "#123e39", muted: "#55716d", line: "#c5dcd7" } },
  { key: "royal-blue", name: "Royal Blue", description: "A brighter international blue with strong contrast.", colors: { offWhite: "#f8f9fd", mist: "#e0e6f7", accent: "#4267c7", navy: "#182d63", muted: "#5c6680", line: "#ccd3e7" } },
  { key: "emerald", name: "Emerald", description: "Premium emerald tones with a clean medical feel.", colors: { offWhite: "#f7faf8", mist: "#dcebe2", accent: "#2d7f5e", navy: "#173f31", muted: "#5a7067", line: "#c9dbd2" } },
  { key: "charcoal-gold", name: "Charcoal Gold", description: "Elegant charcoal with restrained warm-gold accents.", colors: { offWhite: "#faf9f6", mist: "#ece7da", accent: "#9a762e", navy: "#292b2e", muted: "#68665f", line: "#d8d2c4" } },
  { key: "burgundy", name: "Burgundy", description: "Warm, distinctive burgundy with soft neutral surfaces.", colors: { offWhite: "#fbf8f8", mist: "#eee0e3", accent: "#985064", navy: "#522638", muted: "#75616a", line: "#ddccd1" } },
  { key: "slate-blue", name: "Slate Blue", description: "Quiet slate-blue for a refined specialist-clinic look.", colors: { offWhite: "#f8f9fb", mist: "#e0e5ec", accent: "#5d7195", navy: "#303f5a", muted: "#626d80", line: "#cdd4df" } },
  { key: "soft-aqua", name: "Soft Aqua", description: "Light aqua accents balanced by a deep-ocean tone.", colors: { offWhite: "#f6fbfb", mist: "#d9eeee", accent: "#3a979b", navy: "#184b51", muted: "#5b7376", line: "#c4dddd" } },
  { key: "sand-navy", name: "Warm Sand + Navy", description: "Warm neutral surfaces paired with classic navy.", colors: { offWhite: "#fbf9f4", mist: "#eee5d5", accent: "#9b7443", navy: "#233c59", muted: "#6d6b65", line: "#ddd4c6" } },
  { key: "black-champagne", name: "Black + Champagne", description: "A premium dark-neutral identity with champagne accents.", colors: { offWhite: "#faf9f6", mist: "#ebe5d9", accent: "#9b8052", navy: "#242424", muted: "#68645e", line: "#d8d1c5" } },
];

export function getWebsiteTheme(key: string | null | undefined) {
  return websiteThemes.find((theme) => theme.key === key) ?? websiteThemes[0];
}

export function websiteThemeVariables(theme: WebsiteTheme): Record<string, string> {
  return {
    "--brand-off-white": theme.colors.offWhite,
    "--brand-mist": theme.colors.mist,
    "--brand-blue": theme.colors.accent,
    "--brand-navy": theme.colors.navy,
    "--bone": theme.colors.mist,
    "--paper": theme.colors.offWhite,
    "--ink": theme.colors.navy,
    "--muted": theme.colors.muted,
    "--line": theme.colors.line,
    "--mineral": theme.colors.accent,
    "--mineral-soft": theme.colors.mist,
  };
}
