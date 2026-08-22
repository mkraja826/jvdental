import part1 from "@/lib/hero-video-part1";
import part2 from "@/lib/hero-video-part2";

// Compact, silent five-second loop derived from the clinic-supplied implant video.
// Split into two modules to keep the source manageable for deployment while
// avoiding a network request before autoplay can begin.
export const HERO_VIDEO_SRC_V2 = `data:video/mp4;base64,${part1}${part2}`;
