"use client";

import { useMemo, useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { receiveInventory } from "@/app/clinic/inventory/actions";

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

type ParsedScan = {
  gtin: string | null;
  lot: string | null;
  expiry: string | null;
  serial: string | null;
};

function normalizeGtin(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits.padStart(14, "0") : "";
}

function gs1ExpiryToIso(value: string) {
  if (!/^\d{6}$/.test(value)) return null;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  let day = Number(value.slice(4, 6));
  if (month < 1 || month > 12) return null;
  if (day === 0) day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseParenthesizedGs1(raw: string): ParsedScan | null {
  if (!raw.includes("(")) return null;
  const values = new Map<string, string>();
  const matches = [...raw.matchAll(/\((01|10|17|21)\)(.*?)(?=\((?:01|10|17|21)\)|$)/g)];
  for (const match of matches) values.set(match[1], match[2].trim());
  if (!values.size) return null;
  return {
    gtin: values.get("01") ?? null,
    lot: values.get("10") ?? null,
    expiry: values.get("17") ? gs1ExpiryToIso(values.get("17")!) : null,
    serial: values.get("21") ?? null,
  };
}

function parseCompactGs1(raw: string): ParsedScan | null {
  const source = raw.replace(/^\]d2/i, "");
  const values = new Map<string, string>();
  let index = 0;

  while (index < source.length) {
    if (source[index] === "\u001d") {
      index += 1;
      continue;
    }

    const ai = source.slice(index, index + 2);
    if (ai === "01") {
      const value = source.slice(index + 2, index + 16);
      if (!/^\d{14}$/.test(value)) break;
      values.set(ai, value);
      index += 16;
      continue;
    }
    if (ai === "17") {
      const value = source.slice(index + 2, index + 8);
      if (!/^\d{6}$/.test(value)) break;
      values.set(ai, value);
      index += 8;
      continue;
    }
    if (ai === "10" || ai === "21") {
      const start = index + 2;
      const separator = source.indexOf("\u001d", start);
      const end = separator === -1 ? source.length : separator;
      const value = source.slice(start, end).trim();
      if (!value) break;
      values.set(ai, value);
      index = separator === -1 ? source.length : separator + 1;
      continue;
    }
    break;
  }

  if (!values.size) return null;
  return {
    gtin: values.get("01") ?? null,
    lot: values.get("10") ?? null,
    expiry: values.get("17") ? gs1ExpiryToIso(values.get("17")!) : null,
    serial: values.get("21") ?? null,
  };
}

function parseScan(raw: string): ParsedScan {
  const clean = raw.trim();
  const parsed = parseParenthesizedGs1(clean) ?? parseCompactGs1(clean);
  if (parsed) return parsed;
  const gtin = normalizeGtin(clean);
  return { gtin: gtin || null, lot: null, expiry: null, serial: null };
}

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
      setScanNote("Known package code matched. Product, lot and expiry are ready for confirmation.");
      return;
    }

    const parsed = parseScan(raw);
    const normalized = normalizeGtin(parsed.gtin);
    const item = normalized ? itemByGtin.get(normalized) : undefined;
    if (item) setItemId(item.id);
    if (parsed.lot) setLotNumber(parsed.lot);
    if (parsed.expiry) setExpiryDate(parsed.expiry);

    const detected = [
      item ? `product: ${item.label}` : parsed.gtin ? `GTIN: ${parsed.gtin}` : null,
      parsed.lot ? `lot: ${parsed.lot}` : null,
      parsed.expiry ? `expiry: ${parsed.expiry}` : null,
    ].filter(Boolean);

    if (item && parsed.lot) {
      setScanNote(`Scan matched · ${detected.join(" · ")}. Review and receive.`);
    } else if (parsed.gtin && !item) {
      setScanNote(`GTIN ${parsed.gtin} was read, but it is not in the catalogue yet. Add this product once, then future receipts can be scan-first.`);
    } else {
      setScanNote(`Barcode captured${detected.length ? ` · ${detected.join(" · ")}` : ""}. Complete any field not encoded on this label.`);
    }
  }

  return (
    <form action={receiveInventory} className="form-grid">
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <div className="field field--wide">
        <BarcodeInput name="scan_code" label="1 · Scan package barcode / QR / Data Matrix" placeholder="Use scanner or camera" onDetected={handleDetected} />
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
        <p className="form-note">For standard GS1 implant labels, scanning can populate the product GTIN, lot and expiry without typing. Quantity defaults to one package. Optional cost, vendor and storage fields can be added when needed.</p>
        <PendingSubmit label="Receive & record movement" pendingLabel="Receiving…" />
      </div>
    </form>
  );
}
