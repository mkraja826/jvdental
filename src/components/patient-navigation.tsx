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
  );
}
