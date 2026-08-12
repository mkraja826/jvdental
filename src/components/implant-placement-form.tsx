"use client";

import { useMemo, useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { placeImplant } from "@/app/clinic/inventory/actions";

type CaseOption = {
  id: string;
  label: string;
};

type BatchOption = {
  id: string;
  label: string;
  scanCode: string | null;
  gtin: string | null;
  expiryDate: string | null;
  quantity: number;
};

type ImplantPlacementFormProps = {
  cases: CaseOption[];
  batches: BatchOption[];
};

export default function ImplantPlacementForm({ cases, batches }: ImplantPlacementFormProps) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [scanNote, setScanNote] = useState<string | null>(null);
  const selected = useMemo(() => batches.find((batch) => batch.id === batchId) ?? null, [batches, batchId]);

  function handleDetected(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    const match = batches.find((batch) => batch.scanCode === normalized || batch.gtin === normalized);
    if (match) {
      setBatchId(match.id);
      setScanNote(`Matched ${match.label}`);
    } else {
      setScanNote("No in-stock implant batch matches that code. Check the catalogue/received batch details before proceeding.");
    }
  }

  return (
    <form action={placeImplant} className="form-grid">
      <div className="field field--wide">
        <label htmlFor="case_id">Patient case *</label>
        <select id="case_id" name="case_id" defaultValue="" required>
          <option value="" disabled>Select patient case</option>
          {cases.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      <div className="field field--wide">
        <BarcodeInput name="inventory_scan" label="Scan implant package" placeholder="QR / Data Matrix / barcode" onDetected={handleDetected} />
        {scanNote ? <small style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>{scanNote}</small> : null}
      </div>

      <div className="field field--wide">
        <label htmlFor="batch_id">Implant batch *</label>
        <select id="batch_id" name="batch_id" value={batchId} onChange={(event) => setBatchId(event.target.value)} required>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label}</option>)}
        </select>
        {selected ? <small style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>FEFO order · Qty {selected.quantity}{selected.expiryDate ? ` · Exp ${selected.expiryDate}` : " · No expiry entered"}</small> : null}
      </div>

      <div className="field"><label htmlFor="tooth_site">Tooth / implant site *</label><input id="tooth_site" name="tooth_site" placeholder="e.g. 46" required /></div>
      <div className="field"><label htmlFor="placement_date">Placement date</label><input id="placement_date" name="placement_date" type="date" /></div>
      <div className="field field--wide"><label htmlFor="notes">Clinical traceability note</label><textarea id="notes" name="notes" placeholder="Optional note. Do not use this field for the full operative note." /></div>
      <div className="field field--wide">
        <p className="form-note">Confirm the physical package, lot and site before submission. This action deducts one implant and creates the patient’s permanent implant record.</p>
        <PendingSubmit label="Confirm implant placement" pendingLabel="Recording placement…" />
      </div>
    </form>
  );
}
