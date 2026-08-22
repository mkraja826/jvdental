"use client";

import { useEffect } from "react";
import { HERO_VIDEO_SRC_V2 } from "@/lib/hero-video-source-v2";

export function HeroVideoAutoplay() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(".home-hero-video__media");
    const wrapper = video?.closest<HTMLElement>(".home-hero-video");
    if (!video || !wrapper) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    // Replace the tiny placeholder asset with a compact loop taken from the
    // clinic-supplied implant video. Using an inline source avoids a second
    // network request and improves autoplay reliability on mobile browsers.
    if (video.src !== HERO_VIDEO_SRC_V2) {
      video.src = HERO_VIDEO_SRC_V2;
      video.load();
    }

    const usable = () =>
      Number.isFinite(video.duration) &&
      video.duration >= 4 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;

    const revealIfPlaying = () => {
      if (usable() && !video.paused && !video.ended) {
        wrapper.classList.add("is-video-playing");
      }
    };

    const hideVideo = () => wrapper.classList.remove("is-video-playing");

    const play = () => {
      if (!usable()) return;
      const attempt = video.play();
      if (attempt) attempt.then(revealIfPlaying).catch(hideVideo);
    };

    const onMetadata = () => {
      if (!usable()) {
        hideVideo();
        return;
      }
      play();
    };

    const resumeWhenVisible = () => {
      if (!document.hidden) play();
    };

    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("canplay", play);
    video.addEventListener("playing", revealIfPlaying);
    video.addEventListener("error", hideVideo);
    video.addEventListener("stalled", hideVideo);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", play);
    window.addEventListener("touchstart", play, { once: true, passive: true });
    window.addEventListener("pointerdown", play, { once: true, passive: true });

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("canplay", play);
      video.removeEventListener("playing", revealIfPlaying);
      video.removeEventListener("error", hideVideo);
      video.removeEventListener("stalled", hideVideo);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", play);
      window.removeEventListener("touchstart", play);
      window.removeEventListener("pointerdown", play);
    };
  }, []);

  return null;
}
