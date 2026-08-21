import PendingSubmit from "@/components/pending-submit";
import { requireStaff } from "@/lib/auth/guards";
import { adjustInventory } from "@/app/clinic/inventory/actions";

const ITEM_EDITORS = new Set(["owner", "admin", "implantologist", "dental_assistant"]);

export default async function ClinicInventorySections() {
  const { supabase, staff } = await requireStaff();
  const canAdjust = ITEM_EDITORS.has(staff.role);

  const [batchesResult, movementsResult] = await Promise.all([
    supabase
      .from("inventory_batches")
      .select("id,lot_number,expiry_date,quantity_on_hand,storage_location,inventory_items(name,brand,sku,diameter_mm,length_mm,min_stock,category)")
      .gt("quantity_on_hand", 0)
      .order("expiry_date", { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .from("stock_movements")
      .select("id,movement_type,quantity_delta,tooth_site,reason,inventory_items(name,brand),inventory_batches(lot_number),patient_cases(case_number)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const rows = batchesResult.data ?? [];
  const movements = movementsResult.data ?? [];
  const lowStockCount = rows.filter((batch) => {
    const item = Array.isArray(batch.inventory_items) ? batch.inventory_items[0] : batch.inventory_items;
    return item?.min_stock != null && batch.quantity_on_hand <= item.min_stock;
  }).length;
  const units = rows.reduce((total, batch) => total + (batch.quantity_on_hand ?? 0), 0);
  const implantUnits = rows.reduce((total, batch) => {
    const item = Array.isArray(batch.inventory_items) ? batch.inventory_items[0] : batch.inventory_items;
    return total + (item?.category === "implant" ? batch.quantity_on_hand ?? 0 : 0);
  }, 0);

  return (
    <>
      <div className="metric-grid">
        <article className="metric"><span>Active batches</span><strong>{rows.length}</strong></article>
        <article className="metric"><span>Units on hand</span><strong>{units}</strong></article>
        <article className="metric"><span>Implants on hand</span><strong>{implantUnits}</strong></article>
        <article className="metric"><span>Low-stock batches</span><strong>{lowStockCount}</strong></article>
      </div>

      <article className="portal-card" style={{ marginTop: 26 }}>
        <div className="portal-card__header"><h2>Current stock</h2><span className="status-pill">FEFO</span></div>
        <div className="portal-card__body">
          {rows.length ? <div className="status-list">{rows.map((batch) => {
            const item = Array.isArray(batch.inventory_items) ? batch.inventory_items[0] : batch.inventory_items;
            const dimensions = [item?.diameter_mm, item?.length_mm].filter((value) => value != null).join(" × ");
            return <div className="status-row" key={batch.id}>
              <div><strong>{item?.name ?? "Inventory item"}</strong><div style={{ color: "var(--muted)", marginTop: 4 }}>{[item?.brand, dimensions ? `${dimensions} mm` : null, `Lot ${batch.lot_number}`, batch.storage_location].filter(Boolean).join(" · ")}</div></div>
              <span>Qty {batch.quantity_on_hand}</span>
              <span className="status-pill">{batch.expiry_date ? `Exp ${batch.expiry_date}` : "No expiry"}</span>
            </div>;
          })}</div> : <div><strong>No stock has been received yet.</strong><p style={{ color: "var(--muted)", marginBottom: 0 }}>Create catalogue items and receive the clinic’s opening stock by lot.</p></div>}
        </div>
      </article>

      <article className="portal-card" style={{ marginTop: 26 }}>
        <div className="portal-card__header"><h2>Recent movement ledger</h2><span className="status-pill">Latest 20</span></div>
        <div className="portal-card__body">
          {movements.length ? <div className="status-list">{movements.map((movement) => {
            const item = Array.isArray(movement.inventory_items) ? movement.inventory_items[0] : movement.inventory_items;
            const batch = Array.isArray(movement.inventory_batches) ? movement.inventory_batches[0] : movement.inventory_batches;
            const patientCase = Array.isArray(movement.patient_cases) ? movement.patient_cases[0] : movement.patient_cases;
            return <div className="status-row" key={movement.id}>
              <div><strong>{item?.name ?? "Inventory item"}</strong><div style={{ color: "var(--muted)", marginTop: 4 }}>{[batch?.lot_number ? `Lot ${batch.lot_number}` : null, patientCase?.case_number ? `JV-${patientCase.case_number}` : null, movement.tooth_site ? `Site ${movement.tooth_site}` : null, movement.reason].filter(Boolean).join(" · ")}</div></div>
              <span>{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta}</span>
              <span className="status-pill">{movement.movement_type.replaceAll("_", " ")}</span>
            </div>;
          })}</div> : <p>No stock movements yet.</p>}
        </div>
      </article>

      {rows.length && canAdjust ? <article className="portal-card" style={{ marginTop: 26 }}>
        <div className="portal-card__header"><h2>Audited adjustment</h2><span className="status-pill">Reason required</span></div>
        <div className="portal-card__body">
          <form action={adjustInventory} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <input type="hidden" name="idempotency_key" value={crypto.randomUUID()} />
            <div className="field"><label htmlFor="batch_id">Batch</label><select id="batch_id" name="batch_id" required>{rows.map((batch) => {
              const item = Array.isArray(batch.inventory_items) ? batch.inventory_items[0] : batch.inventory_items;
              return <option value={batch.id} key={batch.id}>{item?.name ?? item?.sku} · Lot {batch.lot_number} · Qty {batch.quantity_on_hand}</option>;
            })}</select></div>
            <div className="field"><label htmlFor="movement_type">Reason type</label><select id="movement_type" name="movement_type" required><option value="adjustment">Correction</option><option value="damaged">Damaged</option><option value="expired">Expired</option><option value="return_to_vendor">Return to vendor</option><option value="transfer">Transfer</option></select></div>
            <div className="field"><label htmlFor="quantity_delta">Quantity change</label><input id="quantity_delta" name="quantity_delta" type="number" step="1" placeholder="e.g. -1 or +1" required /></div>
            <div className="field"><label htmlFor="reason">Reason *</label><input id="reason" name="reason" required /></div>
            <div className="field"><PendingSubmit label="Record adjustment" pendingLabel="Recording…" className="button button--ghost" /></div>
          </form>
        </div>
      </article> : null}
    </>
  );
}
