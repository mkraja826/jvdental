import { Suspense } from "react";
import Link from "next/link";
import ClinicBookingsSections from "@/components/clinic-bookings-sections";

function BookingsSkeleton() {
  return (
    <div aria-label="Loading bookings" aria-live="polite">
      <div className="metric-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => <article className="metric clinic-inline-skeleton" key={item} />)}
      </div>
      <article className="portal-card clinic-inline-skeleton clinic-inline-skeleton--panel" style={{ marginTop: 26 }} />
      <article className="portal-card clinic-inline-skeleton clinic-inline-skeleton--panel" style={{ marginTop: 18 }} />
    </div>
  );
}

export default function ClinicBookingsPage() {
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><Link className="text-link" href="/clinic">← Overview</Link></div>
      </header>

      <section className="portal-main">
        <p className="portal-overline">Local patient operations</p>
        <h1 className="portal-title">Bookings & consultations.</h1>
        <p className="portal-subtitle">Review website booking requests, confirm appointment times, assign dentists and check payment status from one operational queue.</p>

        <Suspense fallback={<BookingsSkeleton />}>
          <ClinicBookingsSections />
        </Suspense>
      </section>
    </main>
  );
}
