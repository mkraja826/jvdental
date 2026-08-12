import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section" style={{ minHeight: "72vh", display: "grid", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <p className="eyebrow">JV Dental · 404</p>
        <h1 className="display" style={{ marginTop: 18 }}>The page you requested is not here.</h1>
        <p className="lede" style={{ marginTop: 20 }}>
          The address may have changed, or the page may no longer be available.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
          <Link className="button" href="/">Return home</Link>
          <Link className="button button--ghost" href="/doctors">Meet the clinical team</Link>
        </div>
      </div>
    </main>
  );
}
