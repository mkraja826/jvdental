"use client";

import { useEffect } from "react";
import { HERO_VIDEO_SRC } from "@/lib/hero-video-source";

export function HeroVideoAutoplay() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(".home-hero-video__media");
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    // Use a short, motion-rich clip from the supplied implant video so the
    // hero visibly animates instead of looking like a frozen poster frame.
    if (video.src !== HERO_VIDEO_SRC) {
      video.src = HERO_VIDEO_SRC;
      video.load();
    }

    const play = () => {
      const attempt = video.play();
      if (attempt) attempt.catch(() => undefined);
    };

    const resumeWhenVisible = () => {
      if (!document.hidden) play();
    };

    const resumeOnFirstInteraction = () => play();

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
    } else {
      video.addEventListener("loadeddata", play, { once: true });
      video.addEventListener("canplay", play, { once: true });
    }

    const timer = window.setTimeout(play, 120);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", play);
    window.addEventListener("touchstart", resumeOnFirstInteraction, { once: true, passive: true });
    window.addEventListener("pointerdown", resumeOnFirstInteraction, { once: true, passive: true });

    return () => {
      window.clearTimeout(timer);
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", play);
      window.removeEventListener("touchstart", resumeOnFirstInteraction);
      window.removeEventListener("pointerdown", resumeOnFirstInteraction);
    };
  }, []);

  return null;
}
