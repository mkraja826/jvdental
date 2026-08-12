import Link from "next/link";
import ImplantPlacementForm from "@/components/implant-placement-form";
import { requireStaff } from "@/lib/auth/guards";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PlaceImplantPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, staff } = await requireStaff();

  const [casesResult, batchesResult] = await Promise.all([
    supabase
      .from("patient_cases")
      .select("id,case_number,status,patient_profiles(full_name,country)")
      .not("status", "in", '("closed","completed")')
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("available_implant_batches")
      .select("id,scan_code,lot_number,expiry_date,quantity_on_hand,name,brand,system,diameter_mm,length_mm,connection,gtin,sku")
      .order("expiry_date", { ascending: true, nullsFirst: false })
      .order("received_at", { ascending: true })
      .limit(200),
  ]);

  const cases = (casesResult.data ?? []).map((record) => {
    const profile = Array.isArray(record.patient_profiles) ? record.patient_profiles[0] : record.patient_profiles;
    return {
      id: record.id,
      label: `JV-${record.case_number} · ${profile?.full_name ?? "Patient"}${profile?.country ? ` · ${profile.country}` : ""} · ${record.status.replaceAll("_", " ")}`,
    };
  });

  const batches = (batchesResult.data ?? []).map((batch) => {
    const dimensions = [batch.diameter_mm, batch.length_mm].filter((value) => value != null).join(" × ");
    return {
      id: batch.id,
      label: [batch.brand, batch.name, dimensions ? `${dimensions} mm` : null, batch.system, `Lot ${batch.lot_number}`, batch.expiry_date ? `Exp ${batch.expiry_date}` : "No expiry", `Qty ${batch.quantity_on_hand}`].filter(Boolean).join(" · "),
      scanCode: batch.scan_code ?? null,
      gtin: batch.gtin ?? null,
      expiryDate: batch.expiry_date ?? null,
      quantity: batch.quantity_on_hand,
    };
  });

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Implant placement</span></div>
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
          <p className="portal-overline">Surgical traceability</p>
          <h1 className="portal-title">One scan. One patient. One permanent implant record.</h1>
          <p className="portal-subtitle">Available implant batches are ordered by first expiry first out. Expired and zero-stock batches never appear as placement options, and the database re-checks both conditions at submission.</p>

          {params.placed === "1" ? <p className="form-note">Implant placement recorded, stock deducted and patient passport updated.</p> : null}
          {typeof params.error === "string" ? <p className="form-note">Placement could not be recorded: {params.error}</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Record implant placement</h2><span className="status-pill">Atomic</span></div>
            <div className="portal-card__body">
              {!cases.length ? <p>No active patient cases are available.</p> : !batches.length ? <div><strong>No usable implant stock is available.</strong><p style={{ color: "var(--muted)" }}>Receive an active implant batch before recording placement.</p><Link className="button" href="/clinic/inventory/receive">Receive implant stock →</Link></div> : <ImplantPlacementForm cases={cases} batches={batches} />}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
