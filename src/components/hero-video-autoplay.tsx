"use client";

import { useEffect } from "react";

const DIO_VIDEO_ID = "89s6z6wv2gc";

export function HeroVideoAutoplay() {
  useEffect(() => {
    const wrapper = document.querySelector<HTMLElement>(".home-hero-video");
    const localVideo = wrapper?.querySelector<HTMLVideoElement>(".home-hero-video__media");
    if (!wrapper) return;

    // Stop using the experimental short/local animation. The clinic-supplied
    // footage corresponds to DIO's full official UV Implant video, so render
    // that complete source without crop/zoom effects.
    if (localVideo) {
      localVideo.pause();
      localVideo.removeAttribute("src");
      localVideo.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
      localVideo.load();
      localVideo.hidden = true;
    }

    wrapper.querySelector(".home-hero-video__iframe")?.remove();

    const iframe = document.createElement("iframe");
    iframe.className = "home-hero-video__iframe";
    iframe.title = "DIO UV Implant technology";
    iframe.src = `https://www.youtube-nocookie.com/embed/${DIO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${DIO_VIDEO_ID}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "eager");

    wrapper.appendChild(iframe);
    wrapper.classList.add("has-full-dio-video");

    return () => {
      iframe.remove();
      wrapper.classList.remove("has-full-dio-video");
    };
  }, []);

  return null;
}
