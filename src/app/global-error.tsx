"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F4F1EB", color: "#171918", fontFamily: "Arial, sans-serif" }}>
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "96px 24px" }}>
          <p style={{ letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>JV Dental</p>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", lineHeight: 1.05, margin: "20px 0" }}>This page could not be loaded.</h1>
          <p style={{ maxWidth: 560, lineHeight: 1.7 }}>
            Your information has not been displayed on this error screen. Try the page again, or return to the JV Dental home page.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <button type="button" onClick={() => reset()} style={{ padding: "12px 18px", border: "1px solid #171918", background: "#171918", color: "#fff", cursor: "pointer" }}>
              Try again
            </button>
            <Link href="/" style={{ padding: "12px 18px", border: "1px solid #171918", color: "#171918", textDecoration: "none" }}>
              Return home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
