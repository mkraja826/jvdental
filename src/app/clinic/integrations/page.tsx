import Link from "next/link";
import { redirect } from "next/navigation";
import { disconnectGoogleCalendar, startGoogleCalendarConnection } from "@/app/clinic/integrations/actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicIntegrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { supabase, staff } = await requireStaff();
  if (!new Set(["owner", "admin"]).has(staff.role)) redirect("/clinic");

  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("id,provider,account_email,calendar_summary,status,connected_at,disconnected_at,last_sync_at,last_error,scopes")
    .eq("provider", "google")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const connected = integration?.status === "connected";

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href="/clinic">Back to clinic</Link>
          <span className="status-pill">Integrations</span>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Integration navigation">
            <Link href="/clinic/integrations">Integrations</Link>
            <Link href="/clinic/staff">Staff access</Link>
            <Link href="/clinic/notifications">Notifications</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinic infrastructure</p>
          <h1 className="portal-title">External systems, deliberately connected.</h1>
          <p className="portal-subtitle">JV Dental remains the source of truth. Google Calendar is used only for consultation scheduling, attendee invitations and Google Meet joining information.</p>

          {query.connected ? <p className="form-note">Google Calendar connected successfully.</p> : null}
          {query.disconnected ? <p className="form-note">Google Calendar disconnected.</p> : null}
          {query.error === "google_not_configured" ? (
            <p className="form-note">Google OAuth credentials are not configured yet. Add the required Supabase Edge Function secrets before connecting.</p>
          ) : null}
          {query.error && query.error !== "google_not_configured" ? <p className="form-note">The Google Calendar operation could not be completed.</p> : null}

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header">
                <h2>Google Calendar + Meet</h2>
                <span className="status-pill">{connected ? "Connected" : integration?.status ?? "Not connected"}</span>
              </div>
              <div className="portal-card__body">
                <p>When connected, a scheduled JV Dental video consultation creates a Google Calendar event with a unique Google Meet conference and sends Calendar attendee updates. Rescheduling patches the same event; cancellation removes it.</p>

                <div className="status-list" style={{ marginTop: 18 }}>
                  <div className="status-row"><strong>Google account</strong><span>{integration?.account_email ?? "—"}</span><span /></div>
                  <div className="status-row"><strong>Connected</strong><span>{integration?.connected_at ? new Date(integration.connected_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                  <div className="status-row"><strong>Last sync</strong><span>{integration?.last_sync_at ? new Date(integration.last_sync_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                  <div className="status-row"><strong>Sync health</strong><span>{integration?.last_error ?? "No recorded error"}</span><span /></div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                  {connected ? (
                    <form action={disconnectGoogleCalendar}>
                      <button className="button button--ghost" type="submit">Disconnect Google Calendar</button>
                    </form>
                  ) : (
                    <form action={startGoogleCalendarConnection}>
                      <button className="button" type="submit">Connect Google Calendar →</button>
                    </form>
                  )}
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Privacy boundary</h2><span className="status-pill">Clinical data stays private</span></div>
              <div className="portal-card__body">
                <p>Calendar events contain only a generic JV Dental consultation title, date/time, attendees and meeting information. Diagnoses, X-rays, CBCT files, notes, estimates and treatment details never leave the protected JV Dental portal through this integration.</p>
                <p className="form-note">Manual meeting links remain supported when Google Calendar is disconnected or temporarily unavailable.</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
