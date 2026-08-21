"use client";

import { useMemo, useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import PendingSubmit from "@/components/pending-submit";
import { placeImplant } from "@/app/clinic/inventory/actions";
import { normalizeGtin, parseGs1Scan } from "@/lib/inventory/gs1";

type CaseOption = {
  id: string;
  label: string;
};

type BatchOption = {
  id: string;
  label: string;
  scanCode: string | null;
  gtin: string | null;
  lotNumber: string;
  expiryDate: string | null;
  quantity: number;
};

type ImplantPlacementFormProps = {
  cases: CaseOption[];
  batches: BatchOption[];
  idempotencyKey: string;
};

export default function ImplantPlacementForm({ cases, batches, idempotencyKey }: ImplantPlacementFormProps) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [scanNote, setScanNote] = useState<string | null>(null);
  const selected = useMemo(() => batches.find((batch) => batch.id === batchId) ?? null, [batches, batchId]);

  function handleDetected(value: string) {
    const raw = value.trim();
    if (!raw) return;

    const direct = batches.find((batch) => batch.scanCode === raw);
    if (direct) {
      setBatchId(direct.id);
      setScanNote(`Matched ${direct.label}`);
      return;
    }

    const parsed = parseGs1Scan(raw);
    const gtin = normalizeGtin(parsed.gtin);
    if (!gtin) {
      setScanNote("No in-stock implant batch matches that code. Check the catalogue/received batch details before proceeding.");
      return;
    }

    const candidates = batches.filter((batch) => normalizeGtin(batch.gtin) === gtin);
    const lotMatches = parsed.lot ? candidates.filter((batch) => batch.lotNumber === parsed.lot) : [];
    const match = lotMatches.length === 1 ? lotMatches[0] : !parsed.lot && candidates.length === 1 ? candidates[0] : null;

    if (match) {
      setBatchId(match.id);
      setScanNote(`GS1 matched ${match.label}${parsed.serial ? " · serialized package verified" : ""}`);
      return;
    }

    if (parsed.lot && candidates.length) {
      setScanNote(`GTIN matched stock, but lot ${parsed.lot} is not available. Do not substitute another lot.`);
    } else if (candidates.length > 1) {
      setScanNote("GTIN matches multiple in-stock lots. Scan the GS1 DataMatrix containing the lot number or select the physical lot manually.");
    } else {
      setScanNote("No in-stock implant batch matches that GTIN and lot. Check receiving before proceeding.");
    }
  }

  return (
    <form action={placeImplant} className="form-grid">
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <div className="field field--wide">
        <label htmlFor="case_id">Patient case *</label>
        <select id="case_id" name="case_id" defaultValue="" required>
          <option value="" disabled>Select patient case</option>
          {cases.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      <div className="field field--wide">
        <BarcodeInput name="inventory_scan" label="Scan implant package" placeholder="QR / Data Matrix / barcode" onDetected={handleDetected} />
        {scanNote ? <small aria-live="polite" style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>{scanNote}</small> : null}
      </div>

      <div className="field field--wide">
        <label htmlFor="batch_id">Implant batch *</label>
        <select id="batch_id" name="batch_id" value={batchId} onChange={(event) => setBatchId(event.target.value)} required>
          {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label}</option>)}
        </select>
        {selected ? <small style={{ display: "block", marginTop: 8, color: "var(--muted)" }}>FEFO order · Lot {selected.lotNumber} · Qty {selected.quantity}{selected.expiryDate ? ` · Exp ${selected.expiryDate}` : " · No expiry entered"}</small> : null}
      </div>

      <div className="field"><label htmlFor="tooth_site">Tooth / implant site *</label><input id="tooth_site" name="tooth_site" placeholder="e.g. 46" required /></div>
      <div className="field"><label htmlFor="placement_date">Placement date</label><input id="placement_date" name="placement_date" type="date" /></div>
      <div className="field field--wide"><label htmlFor="notes">Clinical traceability note</label><textarea id="notes" name="notes" placeholder="Optional note. Do not use this field for the full operative note." /></div>
      <div className="field field--wide">
        <p className="form-note">Scan the physical package before placement. GS1 product and lot are matched to available stock; serialised package IDs may differ between units and do not change the batch identity. Submission deducts one implant and creates the permanent patient passport record.</p>
        <PendingSubmit label="Confirm implant placement" pendingLabel="Recording placement…" />
      </div>
    </form>
  );
}
