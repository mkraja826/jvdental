import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark clinic-wordmark" href="/" aria-label="JV Dental & Implant Centre home">
          <span>JV</span>
          <span>Dental</span>
          <small>Implant Centre</small>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/book">Book appointment</Link>
          <Link href="/dental-implants">Dental implants</Link>
          <Link href="/guided-implants">Guided implants</Link>
          <Link href="/doctors">Dentists</Link>
          <Link href="/cases">Cases</Link>
          <Link href="/international">International</Link>
          <Link href="/journal">Journal</Link>
        </nav>

        <div className="header-actions">
          <div className="header-logins" aria-label="Portal access">
            <Link className="text-link" href="/patient/login">Patient login</Link>
            <Link className="text-link clinic-login-link" href="/staff/login">Clinic login</Link>
          </div>
          <Link className="button header-assessment" href="/book">
            Book appointment <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
