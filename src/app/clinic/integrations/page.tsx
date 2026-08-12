import Link from "next/link";
import { redirect } from "next/navigation";
import {
  disconnectBlogger,
  disconnectGoogleCalendar,
  selectBloggerBlog,
  startBloggerConnection,
  startGoogleCalendarConnection,
} from "@/app/clinic/integrations/actions";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicIntegrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { supabase, staff } = await requireStaff();
  if (!new Set(["owner", "admin"]).has(staff.role)) redirect("/clinic");

  const [calendarResult, bloggerResult, choicesResult, queuedEmailResult, sentEmailResult, failedEmailResult] = await Promise.all([
    supabase
      .from("calendar_integrations")
      .select("id,provider,account_email,calendar_summary,status,connected_at,disconnected_at,last_sync_at,last_error,scopes")
      .eq("provider", "google")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("publishing_integrations")
      .select("id,provider,account_email,external_blog_id,external_blog_name,external_blog_url,status,connected_at,disconnected_at,last_sync_at,last_error,scopes")
      .eq("provider", "blogger")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("publishing_integration_blogs")
      .select("id,integration_id,external_blog_id,name,url,is_selected")
      .order("name"),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).in("status", ["queued", "retry", "processing"]),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  const calendar = calendarResult.data;
  const blogger = bloggerResult.data;
  const calendarConnected = calendar?.status === "connected";
  const bloggerConnected = blogger?.status === "connected";
  const bloggerChoices = (choicesResult.data ?? []).filter((choice) => !blogger?.id || choice.integration_id === blogger.id);

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
            <Link href="/clinic/publishing">Publishing</Link>
            <Link href="/clinic/staff">Staff access</Link>
            <Link href="/clinic/notifications">Notifications</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinic infrastructure</p>
          <h1 className="portal-title">External systems, deliberately connected.</h1>
          <p className="portal-subtitle">JV Dental remains the source of truth. Calendar, publishing and transactional email are narrow integrations around the protected clinical platform rather than places where patient records are copied.</p>

          {query.connected ? <p className="form-note">Google Calendar connected successfully.</p> : null}
          {query.disconnected ? <p className="form-note">Google Calendar disconnected.</p> : null}
          {query.blogger === "connected" ? <p className="form-note">Blogger connected and the publication target is ready.</p> : null}
          {query.blogger === "select" ? <p className="form-note">Blogger connected. Choose the exact Blogspot publication target below.</p> : null}
          {query.blogger_selected ? <p className="form-note">Blogger publication target selected.</p> : null}
          {query.blogger_disconnected ? <p className="form-note">Blogger disconnected.</p> : null}
          {query.error === "google_not_configured" ? <p className="form-note">Google OAuth credentials are not configured yet. Add the required Supabase Edge Function secrets before connecting Calendar.</p> : null}
          {query.error === "blogger_not_configured" ? <p className="form-note">Google OAuth credentials are not configured yet for Blogger.</p> : null}
          {query.error && !["google_not_configured", "blogger_not_configured"].includes(String(query.error)) ? <p className="form-note">The requested integration operation could not be completed ({String(query.error)}).</p> : null}

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header">
                <h2>Google Calendar + Meet</h2>
                <span className="status-pill">{calendarConnected ? "Connected" : calendar?.status ?? "Not connected"}</span>
              </div>
              <div className="portal-card__body">
                <p>When connected, a scheduled JV Dental video consultation creates a Google Calendar event with a unique Google Meet conference and sends Calendar attendee updates. Rescheduling patches the same event; cancellation removes it.</p>
                <div className="status-list" style={{ marginTop: 18 }}>
                  <div className="status-row"><strong>Google account</strong><span>{calendar?.account_email ?? "—"}</span><span /></div>
                  <div className="status-row"><strong>Connected</strong><span>{calendar?.connected_at ? new Date(calendar.connected_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                  <div className="status-row"><strong>Last sync</strong><span>{calendar?.last_sync_at ? new Date(calendar.last_sync_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                  <div className="status-row"><strong>Sync health</strong><span>{calendar?.last_error ?? "No recorded error"}</span><span /></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                  {calendarConnected ? <form action={disconnectGoogleCalendar}><button className="button button--ghost" type="submit">Disconnect Google Calendar</button></form> : <form action={startGoogleCalendarConnection}><button className="button" type="submit">Connect Google Calendar →</button></form>}
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header">
                <h2>Blogger / Blogspot</h2>
                <span className="status-pill">{bloggerConnected ? "Connected" : blogger?.status?.replaceAll("_", " ") ?? "Not connected"}</span>
              </div>
              <div className="portal-card__body">
                <p>Connect the clinic&apos;s Google/Blogger account once. Published JV Dental Journal articles can then be pushed to the selected Blogspot blog and synchronized back to the same external post after edits.</p>
                <div className="status-list" style={{ marginTop: 18 }}>
                  <div className="status-row"><strong>Google account</strong><span>{blogger?.account_email ?? "—"}</span><span /></div>
                  <div className="status-row"><strong>Publication target</strong><span>{blogger?.external_blog_name ?? "Not selected"}</span><span>{blogger?.external_blog_url ? <a className="text-link" href={blogger.external_blog_url} target="_blank" rel="noreferrer">Open ↗</a> : null}</span></div>
                  <div className="status-row"><strong>Last sync</strong><span>{blogger?.last_sync_at ? new Date(blogger.last_sync_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</span><span /></div>
                  <div className="status-row"><strong>Sync health</strong><span>{blogger?.last_error ?? "No recorded error"}</span><span /></div>
                </div>

                {blogger?.status === "needs_selection" && bloggerChoices.length ? (
                  <form action={selectBloggerBlog} style={{ display: "grid", gap: 12, marginTop: 18 }}>
                    <label>Choose Blogspot target
                      <select name="blog_choice_id" required defaultValue="">
                        <option value="" disabled>Select a blog</option>
                        {bloggerChoices.map((choice) => <option value={choice.id} key={choice.id}>{choice.name}{choice.url ? ` · ${choice.url}` : ""}</option>)}
                      </select>
                    </label>
                    <button className="button" type="submit">Use this blog</button>
                  </form>
                ) : null}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                  {blogger && ["connected", "needs_selection", "error"].includes(blogger.status)
                    ? <form action={disconnectBlogger}><button className="button button--ghost" type="submit">Disconnect Blogger</button></form>
                    : <form action={startBloggerConnection}><button className="button" type="submit">Connect Blogger →</button></form>}
                  {bloggerConnected ? <Link className="button button--ghost" href="/clinic/publishing">Open publishing →</Link> : null}
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Transactional email</h2><span className="status-pill">Queue + dispatcher ready</span></div>
              <div className="portal-card__body">
                <p>Patient and staff workflow events create privacy-minimised email jobs. The dispatcher resolves the authenticated user&apos;s email server-side and sends only a generic notification plus a secure portal link—never clinical records, scan content, treatment details or secure-message text.</p>
                <div className="status-list" style={{ marginTop: 18 }}>
                  <div className="status-row"><strong>Queued / retrying</strong><span>{queuedEmailResult.count ?? 0}</span><span /></div>
                  <div className="status-row"><strong>Sent</strong><span>{sentEmailResult.count ?? 0}</span><span /></div>
                  <div className="status-row"><strong>Failed</strong><span>{failedEmailResult.count ?? 0}</span><span /></div>
                </div>
                <p className="form-note">The first provider adapter is Resend. Sender-domain verification and the API key remain external production configuration; the automatic cron should be enabled only after those credentials are present.</p>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Privacy boundary</h2><span className="status-pill">Clinical data stays private</span></div>
              <div className="portal-card__body">
                <p>Calendar events carry only scheduling information. Blogger receives only explicitly published educational Journal content. Transactional email contains a generic event notice and portal link. Diagnoses, X-rays, CBCT files, clinical notes, treatment-plan line items and secure-message bodies stay inside the protected JV Dental platform.</p>
                <p className="form-note">Manual Meet links and in-app notifications continue working when external integrations are disconnected.</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
