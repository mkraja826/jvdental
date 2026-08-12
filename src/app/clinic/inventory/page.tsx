import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";

export default async function InventoryPage() {
  const { supabase, staff } = await requireStaff();

  const { data: batches } = await supabase
    .from("inventory_batches")
    .select(
      "id, lot_number, expiry_date, quantity_on_hand, storage_location, inventory_items(name, brand, sku, diameter_mm, length_mm, min_stock)"
    )
    .gt("quantity_on_hand", 0)
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .limit(25);

  const rows = batches ?? [];
  const lowStockCount = rows.filter((batch) => {
    const item = Array.isArray(batch.inventory_items)
      ? batch.inventory_items[0]
      : batch.inventory_items;
    return item?.min_stock != null && batch.quantity_on_hand <= item.min_stock;
  }).length;

  const implantUnits = rows.reduce((total, batch) => total + (batch.quantity_on_hand ?? 0), 0);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic">
          <span>JV</span>
          <span>Clinic</span>
        </Link>
        <div className="portal-header__right">
          <span>{staff.full_name ?? "JV Dental staff"}</span>
          <span className="status-pill">Inventory</span>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic inventory navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/inventory">Stock</Link>
            <Link href="/clinic/inventory#expiry">Expiry</Link>
            <Link href="/clinic/inventory#movements">Movements</Link>
            <Link href="/clinic/inventory#vendors">Vendors</Link>
            <Link href="/clinic/inventory#purchases">Purchases</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Implant & material control</p>
          <h1 className="portal-title">Inventory without guesswork.</h1>
          <p className="portal-subtitle">
            Track implant dimensions, batch and lot numbers, expiry, storage location and
            patient-linked usage from the same clinical platform.
          </p>

          <div className="metric-grid">
            <article className="metric">
              <span>Active batch rows</span>
              <strong>{rows.length || "—"}</strong>
            </article>
            <article className="metric">
              <span>Units represented</span>
              <strong>{rows.length ? implantUnits : "—"}</strong>
            </article>
            <article className="metric">
              <span>Low-stock batches</span>
              <strong>{rows.length ? lowStockCount : "—"}</strong>
            </article>
            <article className="metric">
              <span>Traceability</span>
              <strong style={{ fontSize: "1.55rem" }}>Lot → Patient</strong>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 26 }}>
            <div className="portal-card__header">
              <h2>Current stock</h2>
              <span className="status-pill">FEFO-ready</span>
            </div>
            <div className="portal-card__body">
              {rows.length ? (
                <div className="status-list">
                  {rows.map((batch) => {
                    const item = Array.isArray(batch.inventory_items)
                      ? batch.inventory_items[0]
                      : batch.inventory_items;
                    const dimensions = [item?.diameter_mm, item?.length_mm]
                      .filter((value) => value != null)
                      .join(" × ");

                    return (
                      <div className="status-row" key={batch.id}>
                        <div>
                          <strong>{item?.name ?? "Inventory item"}</strong>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>
                            {[item?.brand, dimensions ? `${dimensions} mm` : null, `Lot ${batch.lot_number}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                        <span>Qty {batch.quantity_on_hand}</span>
                        <span className="status-pill">
                          {batch.expiry_date ? `Exp ${batch.expiry_date}` : "No expiry"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <strong>No inventory has been loaded yet.</strong>
                  <p style={{ color: "var(--muted)", marginBottom: 0 }}>
                    The schema is ready for implant systems, prosthetic components,
                    biomaterials and consumables. Stock will appear here after the clinic&apos;s
                    initial inventory is imported or received.
                  </p>
                </div>
              )}
            </div>
          </article>

          <div className="portal-grid" id="movements">
            <article className="portal-card">
              <div className="portal-card__header">
                <h2>Movement model</h2>
              </div>
              <div className="portal-card__body">
                <p>
                  Every purchase, patient use, expiry, damage, return and adjustment is stored
                  as an immutable stock movement rather than silently overwriting quantity.
                </p>
              </div>
            </article>

            <article className="portal-card" id="expiry">
              <div className="portal-card__header">
                <h2>Expiry control</h2>
              </div>
              <div className="portal-card__body">
                <p>
                  Batches are ordered by expiry date so the eventual receiving/usage workflow
                  can support first-expiry-first-out handling.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
