import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type WebsiteMedia = {
  url: string | null;
  alt: string;
};

export async function getWebsiteMedia(slotKey: string, fallbackAlt: string): Promise<WebsiteMedia> {
  try {
    // Website media is CMS content and must be resolved at request time.
    // This prevents Cloudflare/OpenNext from serving a prerendered page after
    // an owner replaces an image in the clinic portal.
    await connection();

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
