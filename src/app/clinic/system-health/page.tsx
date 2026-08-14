import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

type ErrorEvent = {
  id: string;
  surface: "patient" | "clinic";
  route: string;
  error_name: string | null;
  error_digest: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function SystemHealthPage() {
  const { supabase, staff } = await requireStaff();
  if (!["owner", "admin"].includes(staff.role)) redirect("/clinic");

  const { data } = await supabase
    .from("portal_error_events")
    .select("id,surface,route,error_name,error_digest,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const recent = (data ?? []) as ErrorEvent[];
  const patientErrors = recent.filter((event) => event.surface === "patient").length;
  const clinicErrors = recent.filter((event) => event.surface === "clinic").length;
  const uniqueFingerprints = new Set(recent.map((event) => event.error_digest)).size;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="portal-overline">Administration</p>
          <h1 className="portal-title">System health</h1>
          <p className="portal-subtitle">Privacy-safe operational errors from authenticated clinic and patient portal sessions.</p>
        </div>
      </header>

      <section className="portal-main">
        <div className="portal-grid">
          <article className="portal-card">
            <div className="portal-card__header"><h2>Recent errors</h2><span className="status-pill">{recent.length}</span></div>
            <div className="portal-card__body"><p>Up to the latest 50 authenticated portal failures are shown below.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Unique fingerprints</h2><span className="status-pill">{uniqueFingerprints}</span></div>
            <div className="portal-card__body"><p>Repeated fingerprints help identify recurring production regressions without storing raw errors.</p></div>
          </article>
          <article className="portal-card">
            <div className="portal-card__header"><h2>Portal surfaces</h2><span className="status-pill">50 max</span></div>
            <div className="portal-card__body"><p>Patient: <strong>{patientErrors}</strong> · Clinic: <strong>{clinicErrors}</strong></p></div>
          </article>
        </div>

        <article className="portal-card" style={{ marginTop: 24 }}>
          <div className="portal-card__header">
            <h2>Recent portal errors</h2>
            <span className="status-pill">Privacy safe</span>
          </div>
          <div className="portal-card__body">
            {!recent.length ? (
              <p>No authenticated portal errors have been recorded yet.</p>
            ) : (
              <div className="status-list">
                {recent.map((event) => (
                  <div className="status-row" key={event.id}>
                    <strong>{event.surface === "patient" ? "Patient portal" : "Clinic portal"}</strong>
                    <span>{event.route}</span>
                    <span>
                      {event.error_name ?? "Error"} · {formatDate(event.created_at)} · {event.error_digest.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="form-note" style={{ marginTop: 20 }}>
              This monitor intentionally excludes clinical content, form values, raw exception messages and stack traces.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
