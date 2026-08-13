"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ClinicNavigationProps = {
  canManageStaff?: boolean;
  canManageDoctors?: boolean;
  canManageIntegrations?: boolean;
  canManageAssistant?: boolean;
  unreadNotifications?: number;
};

type NavItem = {
  href: string;
  label: string;
  show?: boolean;
};

export default function ClinicNavigation({
  canManageStaff = false,
  canManageDoctors = false,
  canManageIntegrations = false,
  canManageAssistant = false,
  unreadNotifications = 0,
}: ClinicNavigationProps) {
  const pathname = usePathname();

  const groups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: "Today",
      items: [
        { href: "/clinic", label: "Overview" },
        {
          href: "/clinic/notifications",
          label: unreadNotifications ? `Notifications (${unreadNotifications})` : "Notifications",
        },
      ],
    },
    {
      label: "Patients & clinical",
      items: [
        { href: "/clinic/reviews", label: "Doctor review" },
        { href: "/clinic/commercial", label: "Consultations & estimates" },
        { href: "/clinic/inbox", label: "Patient inbox" },
        { href: "/clinic/travel", label: "International travel" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/clinic/bookings", label: "Bookings" },
        { href: "/clinic/finance", label: "Payments & finance" },
        { href: "/clinic/inventory", label: "Inventory" },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/clinic/cases", label: "Signature cases" },
        { href: "/clinic/publishing", label: "Publishing" },
        { href: "/clinic/doctors", label: "Doctor portfolios", show: canManageDoctors },
      ],
    },
    {
      label: "Administration",
      items: [
        { href: "/clinic/staff", label: "Staff access", show: canManageStaff },
        { href: "/clinic/integrations", label: "Integrations", show: canManageIntegrations },
        { href: "/clinic/assistant", label: "Public AI assistant", show: canManageAssistant },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/clinic" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="clinic-nav" aria-label="Clinic portal navigation">
      {groups.map((group) => {
        const visibleItems = group.items.filter((item) => item.show !== false);
        if (!visibleItems.length) return null;

        return (
          <section className="clinic-nav__group" key={group.label}>
            <p className="clinic-nav__label">{group.label}</p>
            <div className="clinic-nav__items">
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    aria-current={active ? "page" : undefined}
                    data-active={active ? "true" : undefined}
                    prefetch
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
