import { createClient } from "@/lib/supabase/server";

export type WebsiteMedia = {
  url: string | null;
  alt: string;
};

export async function getWebsiteMedia(slotKey: string, fallbackAlt: string): Promise<WebsiteMedia> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("website_media")
      .select("storage_path,alt_text")
      .eq("slot_key", slotKey)
      .maybeSingle();

    if (!data?.storage_path) return { url: null, alt: fallbackAlt };

    const { data: publicUrl } = supabase.storage.from("public-content").getPublicUrl(data.storage_path);
    return {
      url: publicUrl.publicUrl,
      alt: data.alt_text || fallbackAlt,
    };
  } catch {
    return { url: null, alt: fallbackAlt };
  }
}
