import { Suspense } from "react";
import Link from "next/link";
import ClinicInventorySections from "@/components/clinic-inventory-sections";
import { requireStaff } from "@/lib/auth/guards";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function InventoryContentSkeleton() {
  return (
    <div aria-label="Loading inventory data" aria-live="polite">
      <div className="metric-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => <article className="metric clinic-inline-skeleton" key={item} />)}
      </div>
      <article className="portal-card clinic-inline-skeleton clinic-inline-skeleton--panel" style={{ marginTop: 26 }} />
      <article className="portal-card clinic-inline-skeleton clinic-inline-skeleton--panel" style={{ marginTop: 26 }} />
    </div>
  );
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { staff } = await requireStaff();

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Inventory</span></div>
      </header>

      <section className="portal-main">
        <p className="portal-overline">Implant & material control</p>
        <h1 className="portal-title">Inventory without guesswork.</h1>
        <p className="portal-subtitle">Track implant dimensions, batch and lot numbers, expiry, storage, scanned package codes and patient-linked usage with an append-only movement history.</p>

        {params.adjusted === "1" ? <p className="form-note">Stock adjustment recorded in the movement ledger.</p> : null}
        {typeof params.error === "string" ? <p className="form-note">Inventory action could not be completed: {params.error}</p> : null}

        <div className="clinic-page-actions">
          <Link className="button" href="/clinic/inventory/receive" prefetch>Receive stock →</Link>
          <Link className="button button--ghost" href="/clinic/inventory/place" prefetch>Record implant placement →</Link>
          <Link className="button button--ghost" href="/clinic/inventory/catalog" prefetch>Manage catalogue →</Link>
        </div>

        <Suspense fallback={<InventoryContentSkeleton />}>
          <ClinicInventorySections />
        </Suspense>
      </section>
    </main>
  );
}
