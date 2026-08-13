import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="clinic-wordmark" href="/" aria-label="JV Dental & Implant Centre home">
          <img
            className="clinic-wordmark__image"
            src="/jv-dental-logo.svg"
            alt="JV Dental Implant Centre"
            width="480"
            height="242"
          />
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
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
            Request assessment <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
