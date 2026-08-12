import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href="/" aria-label="JV Dental home">
          <span>JV</span>
          <span>Dental</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/guided-implants">Guided implants</Link>
          <Link href="/doctors">Doctors</Link>
          <Link href="/cases">Cases</Link>
          <Link href="/#international">International</Link>
          <Link href="/journal">Journal</Link>
        </nav>

        <div className="header-actions">
          <Link className="text-link" href="/patient/login">
            Patient login
          </Link>
          <Link className="button" href="/patient/login">
            Request assessment <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
