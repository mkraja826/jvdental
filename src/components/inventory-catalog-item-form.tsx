"use client";

import { useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { createInventoryItem } from "@/app/clinic/inventory/actions";
import { normalizeGtin, parseGs1Scan } from "@/lib/inventory/gs1";

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

export default function InventoryCatalogItemForm() {
  const [gtin, setGtin] = useState("");
  const [sku, setSku] = useState("");
  const [scanNote, setScanNote] = useState("Scan a package to fill the canonical GTIN and a safe internal SKU. Verify the product name/specification once.");

  function handleDetected(raw: string) {
    const parsed = parseGs1Scan(raw);
    const normalized = normalizeGtin(parsed.gtin);
    if (!normalized) {
      setScanNote("This code does not contain a supported GTIN. Enter the manufacturer product details manually and keep the barcode for receiving only.");
      return;
    }
    setGtin(normalized);
    setSku((current) => current || `GTIN-${normalized}`);
    setScanNote(`GTIN ${normalized} captured${parsed.lot ? ` · package lot ${parsed.lot} detected but not stored in the product master` : ""}. Verify the product description and implant dimensions before creating the catalogue item.`);
  }

  return (
    <form action={createInventoryItem} className="form-grid">
      <div className="field field--wide">
        <BarcodeInput name="catalog_gtin_scan" label="Scan product package" placeholder="GS1 DataMatrix / EAN / UPC" onDetected={handleDetected} />
        <small aria-live="polite" style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>{scanNote}</small>
      </div>
      <input type="hidden" name="gtin" value={gtin} />

      <div className="field"><label htmlFor="sku">SKU *</label><input id="sku" name="sku" required value={sku} onChange={(event) => setSku(event.target.value)} /></div>
      <div className="field"><label htmlFor="category">Category *</label><select id="category" name="category" required defaultValue="implant">{categories.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}</select></div>
      <div className="field field--wide"><label htmlFor="name">Verified product name *</label><input id="name" name="name" required /></div>
      <div className="field"><label htmlFor="brand">Brand</label><input id="brand" name="brand" /></div>
      <div className="field"><label htmlFor="system">System / family</label><input id="system" name="system" /></div>
      <div className="field"><label htmlFor="manufacturer_reference">Manufacturer reference</label><input id="manufacturer_reference" name="manufacturer_reference" /></div>
      <div className="field"><label htmlFor="gtin_display">GTIN / product barcode</label><input id="gtin_display" value={gtin} readOnly placeholder="Filled by scan" /></div>
      <div className="field"><label htmlFor="diameter_mm">Diameter (mm)</label><input id="diameter_mm" name="diameter_mm" type="number" min="0" step="0.01" /></div>
      <div className="field"><label htmlFor="length_mm">Length (mm)</label><input id="length_mm" name="length_mm" type="number" min="0" step="0.01" /></div>
      <div className="field"><label htmlFor="connection">Connection</label><input id="connection" name="connection" /></div>
      <div className="field"><label htmlFor="min_stock">Minimum stock</label><input id="min_stock" name="min_stock" type="number" min="0" defaultValue="0" /></div>
      <input type="hidden" name="unit_of_measure" value="unit" />
      <div className="field field--wide">
        <p className="form-note">Barcode data identifies the trade item, lot and expiry; it does not reliably contain the clinical product name, implant dimensions or connection. Verify those master-data fields once. Routine receiving and placement can then be scan-first.</p>
        <PendingSubmit label="Create catalogue item" pendingLabel="Creating…" />
      </div>
    </form>
  );
}
