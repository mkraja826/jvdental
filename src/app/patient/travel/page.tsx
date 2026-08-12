import Link from "next/link";
import { redirect } from "next/navigation";
import { saveTravelPlan } from "@/app/patient/travel/actions";
import { createClient } from "@/lib/supabase/server";

export default async function PatientTravelPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: acceptedPlan } = await supabase
    .from("treatment_plans")
    .select("case_id,version,title")
    .eq("patient_id", user.id)
    .eq("status", "accepted")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: travel } = acceptedPlan ? await supabase
    .from("travel_plans")
    .select("id,status,arrival_date,departure_date,arrival_flight,departure_flight,accommodation_name,accommodation_address,airport_pickup_required,companion_name,companion_phone,patient_notes,coordinator_notes,confirmed_at")
    .eq("case_id", acceptedPlan.case_id)
    .maybeSingle() : { data: null };

  const locked = travel?.status === "confirmed" || travel?.status === "completed";

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/"><span>JV</span><span>Dental</span></Link>
        <Link className="text-link" href="/patient">Back to portal</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Patient travel navigation">
            <Link href="/patient">Overview</Link>
            <Link href="/patient/plan">Treatment plan</Link>
            <Link href="/patient/messages">Messages</Link>
            <Link href="/patient/travel">Travel</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">International patient journey</p>
          <h1 className="portal-title">Plan your visit to Hyderabad.</h1>
          <p className="portal-subtitle">Share practical travel details after accepting your preliminary plan. Treatment dates remain subject to clinic confirmation.</p>

          {params.saved === "1" ? <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__body"><strong>Your travel details were sent to the clinic.</strong></div></article> : null}
          {params.error === "dates" ? <p style={{ color: "var(--danger)" }}>Departure date cannot be before arrival date.</p> : null}

          {!acceptedPlan ? (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__body">
                <p>Travel planning opens after you accept a preliminary treatment plan.</p>
                <Link className="button button--ghost" href="/patient/plan">Review treatment plan →</Link>
              </div>
            </article>
          ) : <>
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__header"><h2>Visit details</h2><span className="status-pill">{travel?.status?.replaceAll("_", " ") ?? "Planning"}</span></div>
              <div className="portal-card__body">
                {locked ? (
                  <div className="status-list">
                    <div className="status-row"><strong>Arrival</strong><span>{travel?.arrival_date || "—"}</span><span>{travel?.arrival_flight || "—"}</span></div>
                    <div className="status-row"><strong>Departure</strong><span>{travel?.departure_date || "—"}</span><span>{travel?.departure_flight || "—"}</span></div>
                    <div className="status-row"><strong>Accommodation</strong><span>{travel?.accommodation_name || "—"}</span><span /></div>
                    <div className="status-row"><strong>Airport pickup requested</strong><span>{travel?.airport_pickup_required ? "Yes" : "No"}</span><span /></div>
                  </div>
                ) : (
                  <form action={saveTravelPlan} style={{ display: "grid", gap: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label>Arrival date<input name="arrival_date" type="date" defaultValue={travel?.arrival_date ?? ""} /></label>
                      <label>Departure date<input name="departure_date" type="date" defaultValue={travel?.departure_date ?? ""} /></label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label>Arrival flight<input name="arrival_flight" defaultValue={travel?.arrival_flight ?? ""} placeholder="Airline / flight number" /></label>
                      <label>Departure flight<input name="departure_flight" defaultValue={travel?.departure_flight ?? ""} placeholder="Airline / flight number" /></label>
                    </div>
                    <label>Accommodation<input name="accommodation_name" defaultValue={travel?.accommodation_name ?? ""} placeholder="Hotel / apartment name" /></label>
                    <label>Accommodation address<textarea name="accommodation_address" rows={2} defaultValue={travel?.accommodation_address ?? ""} /></label>
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input name="airport_pickup_required" type="checkbox" defaultChecked={travel?.airport_pickup_required ?? false} /> Request clinic assistance with airport pickup</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label>Companion name<input name="companion_name" defaultValue={travel?.companion_name ?? ""} /></label>
                      <label>Companion phone<input name="companion_phone" defaultValue={travel?.companion_phone ?? ""} /></label>
                    </div>
                    <label>Notes for the international patient coordinator<textarea name="patient_notes" rows={4} defaultValue={travel?.patient_notes ?? ""} placeholder="Mobility, arrival timing, accommodation questions or other practical details." /></label>
                    <button className="button" type="submit">Send travel details →</button>
                  </form>
                )}
              </div>
            </article>

            {travel?.coordinator_notes ? (
              <article className="portal-card" style={{ marginTop: 24 }}>
                <div className="portal-card__header"><h2>Coordinator note</h2><span className="status-pill">Clinic</span></div>
                <div className="portal-card__body"><p>{travel.coordinator_notes}</p></div>
              </article>
            ) : null}
          </>}
        </section>
      </div>
    </main>
  );
}
