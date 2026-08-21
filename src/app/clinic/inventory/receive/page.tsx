import Link from "next/link";
import InventoryReceiveForm from "@/components/inventory-receive-form";
import { requireStaff } from "@/lib/auth/guards";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReceiveInventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, staff } = await requireStaff();
  const [{ data: items }, { data: vendors }, { data: knownBatches }] = await Promise.all([
    supabase.from("inventory_items").select("id,sku,name,brand,system,diameter_mm,length_mm,gtin,category").eq("is_active", true).order("category").order("brand").order("name"),
    supabase.from("vendors").select("id,name").eq("is_active", true).order("name"),
    supabase.from("inventory_batches").select("item_id,scan_code,lot_number,expiry_date").not("scan_code", "is", null).order("received_at", { ascending: false }).limit(500),
  ]);

  const itemOptions = (items ?? []).map((item) => {
    const dimensions = [item.diameter_mm, item.length_mm].filter((value) => value != null).join(" × ");
    return {
      id: item.id,
      gtin: item.gtin ?? null,
      label: [item.brand, item.name, dimensions ? `${dimensions} mm` : null, item.system, item.sku].filter(Boolean).join(" · "),
    };
  });

  const batchOptions = (knownBatches ?? []).map((batch) => ({
    itemId: batch.item_id,
    scanCode: batch.scan_code ?? null,
    lotNumber: batch.lot_number,
    expiryDate: batch.expiry_date ?? null,
  }));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Receive stock</span></div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Inventory navigation">
            <Link href="/clinic/inventory">Stock</Link>
            <Link href="/clinic/inventory/catalog">Catalogue</Link>
            <Link href="/clinic/inventory/receive">Receive stock</Link>
            <Link href="/clinic/inventory/place">Place implant</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Goods receiving</p>
          <h1 className="portal-title">Scan first. Lot and expiry follow.</h1>
          <p className="portal-subtitle">GS1 DataMatrix labels can identify a catalogued product by GTIN and populate lot and expiry automatically. Repeated package scans can also reuse a previously known batch code.</p>

          {params.received === "1" ? <p className="form-note">Stock received and movement recorded.</p> : null}
          {typeof params.error === "string" ? <p className="form-note">Receiving failed: {params.error}</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Receive inventory</h2><span className="status-pill">Scan-first · Audited</span></div>
            <div className="portal-card__body">
              {itemOptions.length ? (
                <InventoryReceiveForm
                  items={itemOptions}
                  vendors={(vendors ?? []).map((vendor) => ({ id: vendor.id, name: vendor.name }))}
                  knownBatches={batchOptions}
                  idempotencyKey={crypto.randomUUID()}
                />
              ) : (
                <div><strong>Create a catalogue item first.</strong><p style={{ color: "var(--muted)" }}>A product needs a one-time catalogue identity before scan-only receiving can match its GTIN safely.</p><Link className="button" href="/clinic/inventory/catalog">Open catalogue →</Link></div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
