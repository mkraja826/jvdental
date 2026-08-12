import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { requireStaff } from "@/lib/auth/guards";
import { createInventoryItem } from "../actions";

const categories = [
  "implant",
  "healing_abutment",
  "prosthetic_abutment",
  "cover_screw",
  "multi_unit_abutment",
  "temporary_component",
  "bone_graft",
  "membrane",
  "suture",
  "biomaterial",
  "anaesthetic",
  "medicine",
  "sterilisation",
  "prosthodontic_material",
  "consumable",
  "other",
];

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InventoryCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, staff } = await requireStaff();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id,sku,category,name,brand,system,manufacturer_reference,gtin,diameter_mm,length_mm,connection,min_stock,is_active")
    .order("category")
    .order("brand")
    .order("name")
    .limit(250);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Catalogue</span></div>
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
          <p className="portal-overline">Inventory catalogue</p>
          <h1 className="portal-title">Define products once. Trace them everywhere.</h1>
          <p className="portal-subtitle">Create implant systems and materials with SKU, manufacturer reference, GTIN, dimensions and minimum-stock thresholds before receiving batches.</p>

          {params.created === "1" ? <p className="form-note">Inventory item created.</p> : null}
          {typeof params.error === "string" ? <p className="form-note">The item could not be saved. Check required fields and duplicate SKU/GTIN values.</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Add catalogue item</h2><span className="status-pill">Master data</span></div>
            <div className="portal-card__body">
              <form action={createInventoryItem} className="form-grid">
                <div className="field"><label htmlFor="sku">SKU *</label><input id="sku" name="sku" required /></div>
                <div className="field"><label htmlFor="category">Category *</label><select id="category" name="category" required>{categories.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}</select></div>
                <div className="field field--wide"><label htmlFor="name">Product name *</label><input id="name" name="name" required /></div>
                <div className="field"><label htmlFor="brand">Brand</label><input id="brand" name="brand" /></div>
                <div className="field"><label htmlFor="system">System / family</label><input id="system" name="system" /></div>
                <div className="field"><label htmlFor="manufacturer_reference">Manufacturer reference</label><input id="manufacturer_reference" name="manufacturer_reference" /></div>
                <div className="field"><label htmlFor="gtin">GTIN / product barcode</label><input id="gtin" name="gtin" inputMode="numeric" /></div>
                <div className="field"><label htmlFor="diameter_mm">Diameter (mm)</label><input id="diameter_mm" name="diameter_mm" type="number" min="0" step="0.01" /></div>
                <div className="field"><label htmlFor="length_mm">Length (mm)</label><input id="length_mm" name="length_mm" type="number" min="0" step="0.01" /></div>
                <div className="field"><label htmlFor="connection">Connection</label><input id="connection" name="connection" /></div>
                <div className="field"><label htmlFor="min_stock">Minimum stock</label><input id="min_stock" name="min_stock" type="number" min="0" defaultValue="0" /></div>
                <input type="hidden" name="unit_of_measure" value="unit" />
                <div className="field field--wide"><PendingSubmit label="Create catalogue item" pendingLabel="Creating…" /></div>
              </form>
            </div>
          </article>

          <article className="portal-card" style={{ marginTop: 26 }}>
            <div className="portal-card__header"><h2>Catalogue</h2><span className="status-pill">{items?.length ?? 0} items</span></div>
            <div className="portal-card__body">
              {items?.length ? <div className="status-list">{items.map((item) => {
                const dimensions = [item.diameter_mm, item.length_mm].filter((value) => value != null).join(" × ");
                return <div className="status-row" key={item.id}>
                  <div><strong>{item.name}</strong><div style={{ color: "var(--muted)", marginTop: 4 }}>{[item.brand, item.system, dimensions ? `${dimensions} mm` : null, item.connection].filter(Boolean).join(" · ")}</div></div>
                  <span>{item.sku}</span>
                  <span className="status-pill">{item.category.replaceAll("_", " ")}</span>
                </div>;
              })}</div> : <p>No catalogue items yet.</p>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
