import Link from "next/link";
import InventoryCatalogItemForm from "@/components/inventory-catalog-item-form";
import { requireStaff } from "@/lib/auth/guards";

const ITEM_EDITORS = new Set(["owner", "admin", "implantologist", "dental_assistant"]);

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InventoryCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, staff } = await requireStaff();
  const canEdit = ITEM_EDITORS.has(staff.role);
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
          <p className="portal-subtitle">Scan GTIN where available, verify the product master once, then use scan-first receiving and implant placement for routine clinic work.</p>

          {params.created === "1" ? <p className="form-note">Inventory item created.</p> : null}
          {typeof params.error === "string" ? <p className="form-note">The item could not be saved. Check required fields and duplicate SKU/GTIN values.</p> : null}

          {canEdit ? (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__header"><h2>Add catalogue item</h2><span className="status-pill">Barcode-assisted master data</span></div>
              <div className="portal-card__body"><InventoryCatalogItemForm /></div>
            </article>
          ) : (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__header"><h2>Catalogue access</h2><span className="status-pill">Read only</span></div>
              <div className="portal-card__body"><p className="form-note">Your role can review stock identities but cannot create or edit product master data.</p></div>
            </article>
          )}

          <article className="portal-card" style={{ marginTop: 26 }}>
            <div className="portal-card__header"><h2>Catalogue</h2><span className="status-pill">{items?.length ?? 0} items</span></div>
            <div className="portal-card__body">
              {items?.length ? <div className="status-list">{items.map((item) => {
                const dimensions = [item.diameter_mm, item.length_mm].filter((value) => value != null).join(" × ");
                return <div className="status-row" key={item.id}>
                  <div><strong>{item.name}</strong><div style={{ color: "var(--muted)", marginTop: 4 }}>{[item.brand, item.system, dimensions ? `${dimensions} mm` : null, item.connection, item.gtin ? `GTIN ${item.gtin}` : null].filter(Boolean).join(" · ")}</div></div>
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
