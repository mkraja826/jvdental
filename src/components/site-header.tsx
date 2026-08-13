"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  ["Dental implants", "/dental-implants"],
  ["Guided implants", "/guided-implants"],
  ["Dentists", "/doctors"],
  ["Cases", "/cases"],
  ["International", "/international"],
  ["Journal", "/journal"],
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`site-header${menuOpen ? " site-header--menu-open" : ""}`}>
      <div className="site-header__inner">
        <Link className="clinic-wordmark" href="/" aria-label="JV Dental & Implant Centre home" onClick={() => setMenuOpen(false)}>
          <img
            className="clinic-wordmark__image"
            src="/jv-dental-logo.svg"
            alt="JV Dental Implant Centre"
            width="480"
            height="242"
          />
        </Link>

        <nav className="site-nav" id="mobile-primary-navigation" aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="mobile-menu-portals" aria-label="Portal access">
            <Link href="/patient/login" onClick={() => setMenuOpen(false)}>Patient login</Link>
            <Link href="/staff/login" onClick={() => setMenuOpen(false)}>Clinic login</Link>
          </div>
        </nav>

        <div className="header-actions">
          <div className="header-logins" aria-label="Portal access">
            <Link className="text-link" href="/patient/login">Patient login</Link>
            <Link className="text-link clinic-login-link" href="/staff/login">Clinic login</Link>
          </div>
          <Link className="button header-assessment" href="/book" onClick={() => setMenuOpen(false)}>
            Request assessment <span aria-hidden="true">→</span>
          </Link>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
