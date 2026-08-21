import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmTravelPlan } from "@/app/clinic/commercial/actions";
import { requireStaff } from "@/lib/auth/guards";

const TRAVEL_CONFIRM_ROLES = new Set(["owner", "admin", "coordinator", "receptionist"]);

export default async function ClinicTravelDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, staff } = await requireStaff();
  const canConfirmTravel = TRAVEL_CONFIRM_ROLES.has(staff.role);

  const { data: travel } = await supabase
    .from("travel_plans")
    .select("id,case_id,status,arrival_date,departure_date,arrival_flight,departure_flight,accommodation_name,accommodation_address,airport_pickup_required,companion_name,companion_phone,patient_notes,coordinator_notes,confirmed_at,patient_profiles(full_name,country,phone,whatsapp),patient_cases(case_number,status)")
    .eq("id", id)
    .maybeSingle();
  if (!travel) notFound();

  const patient = Array.isArray(travel.patient_profiles) ? travel.patient_profiles[0] : travel.patient_profiles;
  const caseRecord = Array.isArray(travel.patient_cases) ? travel.patient_cases[0] : travel.patient_cases;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic/travel">Back to travel</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Travel detail navigation">
            <Link href={`/clinic/travel/${travel.id}`}>Travel details</Link>
            <Link href={`/clinic/commercial/${travel.case_id}`}>Consultation & estimate</Link>
            <Link href={`/clinic/reviews/${travel.case_id}`}>Clinical review</Link>
            <Link href="/clinic/inbox">Inbox</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">JV-{caseRecord?.case_number ?? "—"} · {patient?.country ?? "International patient"}</p>
          <h1 className="portal-title">{patient?.full_name ?? "Patient"}</h1>
          <p className="portal-subtitle">Travel coordination · {travel.status.replaceAll("_", " ")}</p>

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Journey</h2><span className="status-pill">Patient submitted</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row"><strong>Arrival</strong><span>{travel.arrival_date || "—"}</span><span>{travel.arrival_flight || "—"}</span></div>
                  <div className="status-row"><strong>Departure</strong><span>{travel.departure_date || "—"}</span><span>{travel.departure_flight || "—"}</span></div>
                  <div className="status-row"><strong>Accommodation</strong><span>{travel.accommodation_name || "—"}</span><span /></div>
                  <div className="status-row"><strong>Airport pickup</strong><span>{travel.airport_pickup_required ? "Requested" : "Not requested"}</span><span /></div>
                </div>
                {travel.accommodation_address ? <p><strong>Accommodation address</strong><br />{travel.accommodation_address}</p> : null}
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Companion & contact</h2></div>
              <div className="portal-card__body">
                <p><strong>Patient contact</strong><br />{patient?.whatsapp || patient?.phone || "—"}</p>
                <p><strong>Companion</strong><br />{travel.companion_name || "—"}{travel.companion_phone ? ` · ${travel.companion_phone}` : ""}</p>
                {travel.patient_notes ? <p><strong>Patient notes</strong><br />{travel.patient_notes}</p> : null}
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Clinic confirmation</h2><span className="status-pill">{travel.status}</span></div>
            <div className="portal-card__body">
              {travel.status === "confirmed" || travel.status === "completed" ? (
                <><p><strong>Travel plan confirmed.</strong></p>{travel.coordinator_notes ? <p>{travel.coordinator_notes}</p> : null}{travel.confirmed_at ? <p style={{ color: "var(--muted)" }}>Confirmed {new Date(travel.confirmed_at).toLocaleString("en-IN")}</p> : null}</>
              ) : canConfirmTravel ? (
                <form action={confirmTravelPlan} style={{ display: "grid", gap: 16 }}>
                  <input type="hidden" name="travel_id" value={travel.id} />
                  <input type="hidden" name="case_id" value={travel.case_id} />
                  <label>Coordinator note to patient<textarea name="coordinator_notes" rows={4} placeholder="Confirm practical arrangements and any clinic instructions for arrival." /></label>
                  <button className="button" type="submit">Confirm travel plan →</button>
                </form>
              ) : (
                <p className="form-note">Travel details are read-only for your role. An owner, admin, coordinator or receptionist must confirm international logistics.</p>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
