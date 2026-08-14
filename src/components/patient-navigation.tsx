"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/patient", label: "Overview" },
  { href: "/patient/notifications", label: "Notifications" },
  { href: "/patient/intake", label: "My details" },
  { href: "/patient/documents", label: "Documents" },
  { href: "/patient/messages", label: "Messages" },
  { href: "/patient/plan", label: "Treatment plan" },
  { href: "/patient/payments", label: "Payments" },
  { href: "/patient/travel", label: "Travel" },
  { href: "/patient/passport", label: "Implant passport" },
];

export default function PatientNavigation({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/patient" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Patient portal navigation">
        {items.map((item) => {
          const active = isActive(item.href);
          const label = item.href === "/patient/notifications" && unreadNotifications
            ? `${item.label} (${unreadNotifications})`
            : item.label;
          return (
            <Link
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
              data-active={active ? "true" : undefined}
              prefetch
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        .portal-sidebar a[data-active="true"] {
          background: var(--white);
          color: var(--ink);
          font-weight: 700;
          box-shadow: inset 3px 0 0 var(--mineral);
        }

        .portal-sidebar a:first-child:not([data-active="true"]) {
          background: transparent;
          color: #515651;
          font-weight: 400;
          box-shadow: none;
        }

        @media (max-width: 820px) {
          .portal-layout {
            display: block;
          }

          .portal-header {
            min-height: 64px;
            padding: 10px 16px;
            flex-wrap: wrap;
            row-gap: 8px;
          }

          .portal-header__right {
            margin-left: auto;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 10px;
          }

          .portal-sidebar {
            display: block;
            position: sticky;
            top: 0;
            z-index: 35;
            width: 100%;
            padding: 8px 12px;
            border-right: 0;
            border-bottom: 1px solid #dfe2de;
            background: rgba(245, 246, 244, 0.96);
            backdrop-filter: blur(14px);
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
          }

          .portal-sidebar::-webkit-scrollbar {
            display: none;
          }

          .portal-sidebar nav {
            display: flex;
            width: max-content;
            min-width: 100%;
            gap: 6px;
          }

          .portal-sidebar a {
            flex: 0 0 auto;
            min-height: 42px;
            padding: 10px 13px;
            display: inline-flex;
            align-items: center;
            border: 1px solid transparent;
            border-radius: 10px;
            white-space: nowrap;
            touch-action: manipulation;
          }

          .portal-sidebar a[data-active="true"] {
            border-color: #d7ddd9;
            box-shadow: none;
          }
        }

        @media (max-width: 560px) {
          .portal-header__right > span:not(.status-pill) {
            display: none;
          }

          .portal-header__right {
            font-size: 0.72rem;
          }

          .portal-header__right .text-link {
            white-space: nowrap;
          }

          .portal-title {
            font-size: clamp(2rem, 10vw, 3rem);
          }

          .portal-card__header {
            min-height: 56px;
            padding: 12px 16px;
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .portal-card__body {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
