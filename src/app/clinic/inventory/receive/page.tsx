import Link from "next/link";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { requireStaff } from "@/lib/auth/guards";
import { receiveInventory } from "../actions";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReceiveInventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, staff } = await requireStaff();
  const [{ data: items }, { data: vendors }] = await Promise.all([
    supabase.from("inventory_items").select("id,sku,name,brand,system,diameter_mm,length_mm,gtin,category").eq("is_active", true).order("category").order("brand").order("name"),
    supabase.from("vendors").select("id,name").eq("is_active", true).order("name"),
  ]);

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
          <h1 className="portal-title">Receive by lot, expiry and scan code.</h1>
          <p className="portal-subtitle">Each receipt increases the batch balance and writes an immutable purchase movement. The same lot can be received again later without losing its history.</p>

          {params.received === "1" ? <p className="form-note">Stock received and movement recorded.</p> : null}
          {typeof params.error === "string" ? <p className="form-note">Receiving failed: {params.error}</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Receive inventory</h2><span className="status-pill">Audited</span></div>
            <div className="portal-card__body">
              {items?.length ? (
                <form action={receiveInventory} className="form-grid">
                  <div className="field field--wide">
                    <label htmlFor="item_id">Catalogue item *</label>
                    <select id="item_id" name="item_id" required defaultValue="">
                      <option value="" disabled>Select product</option>
                      {items.map((item) => {
                        const dimensions = [item.diameter_mm, item.length_mm].filter((value) => value != null).join(" × ");
                        return <option key={item.id} value={item.id}>{[item.brand, item.name, dimensions ? `${dimensions} mm` : null, item.system, item.sku].filter(Boolean).join(" · ")}</option>;
                      })}
                    </select>
                  </div>
                  <BarcodeInput name="scan_code" label="Package barcode / QR / Data Matrix" placeholder="Scan or enter package code" />
                  <div className="field"><label htmlFor="lot_number">Lot / batch number *</label><input id="lot_number" name="lot_number" required /></div>
                  <div className="field"><label htmlFor="expiry_date">Expiry date</label><input id="expiry_date" name="expiry_date" type="date" /></div>
                  <div className="field"><label htmlFor="quantity">Quantity received *</label><input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue="1" required /></div>
                  <div className="field"><label htmlFor="unit_cost">Unit cost (INR)</label><input id="unit_cost" name="unit_cost" type="number" min="0" step="0.01" /></div>
                  <div className="field"><label htmlFor="storage_location">Storage location</label><input id="storage_location" name="storage_location" placeholder="Implant cabinet / drawer" /></div>
                  <div className="field"><label htmlFor="vendor_id">Vendor</label><select id="vendor_id" name="vendor_id" defaultValue=""><option value="">Not specified</option>{vendors?.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
                  <div className="field field--wide"><PendingSubmit label="Receive & record movement" pendingLabel="Receiving…" /></div>
                </form>
              ) : (
                <div><strong>Create a catalogue item first.</strong><p style={{ color: "var(--muted)" }}>Receiving is intentionally blocked until the product master exists.</p><Link className="button" href="/clinic/inventory/catalog">Open catalogue →</Link></div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
