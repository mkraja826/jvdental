"use client";

import { useMemo, useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { receiveInventory } from "@/app/clinic/inventory/actions";
import { normalizeGtin, parseGs1Scan } from "@/lib/inventory/gs1";

type ItemOption = {
  id: string;
  label: string;
  gtin: string | null;
};

type VendorOption = {
  id: string;
  name: string;
};

type KnownBatch = {
  itemId: string;
  scanCode: string | null;
  lotNumber: string;
  expiryDate: string | null;
};

export default function InventoryReceiveForm({
  items,
  vendors,
  knownBatches,
  idempotencyKey,
}: {
  items: ItemOption[];
  vendors: VendorOption[];
  knownBatches: KnownBatch[];
  idempotencyKey: string;
}) {
  const [itemId, setItemId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchScanCode, setBatchScanCode] = useState("");
  const [scanNote, setScanNote] = useState("Scan the package first. Supported GS1 labels can fill product, lot and expiry automatically.");

  const itemByGtin = useMemo(() => {
    const map = new Map<string, ItemOption>();
    for (const item of items) {
      const key = normalizeGtin(item.gtin);
      if (key) map.set(key, item);
    }
    return map;
  }, [items]);

  function handleDetected(value: string) {
    const raw = value.trim();
    if (!raw) return;

    const known = knownBatches.find((batch) => batch.scanCode === raw);
    if (known) {
      setItemId(known.itemId);
      setLotNumber(known.lotNumber);
      setExpiryDate(known.expiryDate ?? "");
      setBatchScanCode(known.scanCode ?? "");
      setScanNote("Known batch code matched. Product, lot and expiry are ready for confirmation.");
      return;
    }

    const parsed = parseGs1Scan(raw);
    const normalized = normalizeGtin(parsed.gtin);
    const item = normalized ? itemByGtin.get(normalized) : undefined;

    if (item) setItemId(item.id);
    if (parsed.lot) setLotNumber(parsed.lot);
    if (parsed.expiry) setExpiryDate(parsed.expiry);

    // GS1 package labels commonly carry AI (21) serial numbers, so the complete
    // raw scan can differ for every unit in the same lot. Do not persist that
    // serialized raw value as the batch identity. Product + lot is the stable
    // identity, while non-GS1 proprietary batch codes may still be stored.
    setBatchScanCode(parsed.isGs1 || parsed.gtin ? "" : raw);

    const detected = [
      item ? `product: ${item.label}` : parsed.gtin ? `GTIN: ${parsed.gtin}` : null,
      parsed.lot ? `lot: ${parsed.lot}` : null,
      parsed.expiry ? `expiry: ${parsed.expiry}` : null,
      parsed.serial ? "serialized unit detected" : null,
    ].filter(Boolean);

    if (item && parsed.lot) {
      setScanNote(`GS1 matched · ${detected.join(" · ")}. Review and receive.`);
    } else if (parsed.gtin && !item) {
      setScanNote(`GTIN ${parsed.gtin} was read, but it is not in the catalogue yet. Add this product once, then future receipts can be scan-first.`);
    } else {
      setScanNote(`Barcode captured${detected.length ? ` · ${detected.join(" · ")}` : ""}. Complete any field not encoded on this label.`);
    }
  }

  return (
    <form action={receiveInventory} className="form-grid">
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <input type="hidden" name="scan_code" value={batchScanCode} />

      <div className="field field--wide">
        <BarcodeInput name="inventory_scan_raw" label="1 · Scan package barcode / QR / Data Matrix" placeholder="Use scanner or camera" onDetected={handleDetected} />
        <small aria-live="polite" style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>{scanNote}</small>
      </div>

      <div className="field field--wide">
        <label htmlFor="item_id">2 · Catalogue item *</label>
        <select id="item_id" name="item_id" required value={itemId} onChange={(event) => setItemId(event.target.value)}>
          <option value="" disabled>Select product</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      <div className="field"><label htmlFor="lot_number">3 · Lot / batch number *</label><input id="lot_number" name="lot_number" required value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} /></div>
      <div className="field"><label htmlFor="expiry_date">Expiry date</label><input id="expiry_date" name="expiry_date" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></div>
      <div className="field"><label htmlFor="quantity">Quantity received *</label><input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue="1" required /></div>
      <div className="field"><label htmlFor="unit_cost">Unit cost (INR)</label><input id="unit_cost" name="unit_cost" type="number" min="0" step="0.01" /></div>
      <div className="field"><label htmlFor="storage_location">Storage location</label><input id="storage_location" name="storage_location" placeholder="Implant cabinet / drawer" /></div>
      <div className="field"><label htmlFor="vendor_id">Vendor</label><select id="vendor_id" name="vendor_id" defaultValue=""><option value="">Not specified</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
      <div className="field field--wide">
        <p className="form-note">For standard GS1 implant labels, scanning can populate product, lot and expiry without typing. Serialized package IDs are deliberately not used as batch identity, so multiple units from the same lot remain receivable.</p>
        <PendingSubmit label="Receive & record movement" pendingLabel="Receiving…" />
      </div>
    </form>
  );
}
