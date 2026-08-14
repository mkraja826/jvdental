"use client";

import { useEffect } from "react";

type PortalErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  surface: "patient" | "clinic";
};

async function digestError(error: Error & { digest?: string }) {
  if (error.digest && /^[a-f0-9]{16,128}$/i.test(error.digest)) return error.digest;
  const input = `${error.name}|${error.stack ?? ""}`;
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export default function PortalErrorBoundary({ error, reset, surface }: PortalErrorBoundaryProps) {
  useEffect(() => {
    let active = true;
    void digestError(error).then((errorDigest) => {
      if (!active) return;
      void fetch("/api/telemetry/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface,
          route: window.location.pathname,
          errorName: error.name || "Error",
          errorDigest,
        }),
        keepalive: true,
      }).catch(() => undefined);
    });
    return () => { active = false; };
  }, [error, surface]);

  return (
    <main className="portal-shell">
      <section className="portal-main" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 72 }}>
        <article className="portal-card">
          <div className="portal-card__body">
            <p className="portal-overline">JV Dental secure portal</p>
            <h1 className="portal-title" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>This screen could not finish loading.</h1>
            <p className="portal-subtitle">Your saved clinic information has not been changed. Try loading this screen again. If the issue continues, the portal team can review the anonymous error fingerprint recorded for this session.</p>
            <button className="button" type="button" onClick={reset}>Try again</button>
          </div>
        </article>
      </section>
    </main>
  );
}
