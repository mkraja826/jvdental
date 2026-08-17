"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type NavLink = { label: string; href: string };
type NavItem = NavLink & { children?: readonly NavLink[] };

const treatmentItems = [
  { label: "All treatments", href: "/dental-treatments" },
  { label: "Root canal treatment", href: "/dental-treatments#root-canal-treatment" },
  { label: "Crowns & bridges", href: "/dental-treatments#crowns-bridges" },
  { label: "Cosmetic dentistry", href: "/dental-treatments#cosmetic-dentistry" },
  { label: "Veneers", href: "/dental-treatments#veneers" },
  { label: "Teeth whitening", href: "/dental-treatments#teeth-whitening" },
  { label: "Dentures", href: "/dental-treatments#dentures" },
  { label: "Gum treatment", href: "/dental-treatments#gum-treatment" },
  { label: "Oral surgery & extractions", href: "/dental-treatments#oral-surgery" },
  { label: "Preventive & general dentistry", href: "/dental-treatments#preventive-dentistry" },
] as const;

const implantItems = [
  { label: "Dental implants", href: "/dental-implants" },
  { label: "Guided implants", href: "/guided-implants" },
  { label: "All-on-4 / All-on-6", href: "/all-on-4-all-on-6" },
  { label: "Bone grafting for implants", href: "/bone-grafting-dental-implants" },
  { label: "Book implant consultation", href: "/book" },
] as const;

const navItems: readonly NavItem[] = [
  { label: "Treatments", href: "/dental-treatments", children: treatmentItems },
  { label: "Dental Implants", href: "/dental-implants", children: implantItems },
  { label: "About Us", href: "/doctors" },
  { label: "Cases", href: "/cases" },
  { label: "International", href: "/international" },
  { label: "Journal", href: "/journal" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeMenus = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header className={`site-header${menuOpen ? " site-header--menu-open" : ""}`}>
      <div className="site-header__inner">
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-primary-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => {
            setMenuOpen((open) => !open);
            setOpenDropdown(null);
          }}
        >
          <span />
          <span />
          <span />
        </button>

        <Link className="clinic-wordmark" href="/" aria-label="JV Dental & Implant Centre home" onClick={closeMenus}>
          <Image
            className="clinic-wordmark__image"
            src="/jv-dental-logo.svg"
            alt="JV Dental & Implant Centre in Hyderabad"
            width={480}
            height={242}
            priority
            sizes="(max-width: 420px) 96px, (max-width: 820px) 104px, (max-width: 1180px) 174px, 198px"
          />
        </Link>

        <nav className="site-nav" id="mobile-primary-navigation" aria-label="Primary navigation">
          {navItems.map((item) => item.children ? (
            <div className="site-nav__dropdown" key={item.href} data-open={openDropdown === item.label}>
              <div className="site-nav__dropdown-trigger">
                <Link href={item.href} onClick={closeMenus}>{item.label}</Link>
                <button
                  type="button"
                  className="site-nav__dropdown-toggle"
                  aria-label={`Toggle ${item.label} menu`}
                  aria-expanded={openDropdown === item.label}
                  onClick={() => setOpenDropdown((current) => current === item.label ? null : item.label)}
                >
                  <span aria-hidden="true">⌄</span>
                </button>
              </div>
              <div className="site-nav__dropdown-menu" aria-label={`${item.label} links`}>
                {item.children.map((child) => (
                  <Link href={child.href} key={child.href} onClick={closeMenus}>{child.label}</Link>
                ))}
              </div>
            </div>
          ) : (
            <Link href={item.href} key={item.href} onClick={closeMenus}>{item.label}</Link>
          ))}
          <div className="mobile-menu-portals" aria-label="Portal access">
            <Link href="/patient/login" onClick={closeMenus}>Patient login</Link>
            <Link href="/staff/login" onClick={closeMenus}>Clinic login</Link>
          </div>
        </nav>

        <div className="header-actions">
          <div className="header-logins" aria-label="Portal access">
            <Link className="text-link" href="/patient/login">Patient login</Link>
            <Link className="text-link clinic-login-link" href="/staff/login">Clinic login</Link>
          </div>
          <Link className="button header-assessment" href="/book" onClick={closeMenus}>
            Book Consultation <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
