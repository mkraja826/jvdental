import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";
import PatientNavigation from "@/components/patient-navigation";
import PendingSubmit from "@/components/pending-submit";
import { createClient } from "@/lib/supabase/server";

function destination(eventType: string) {
  if (eventType.startsWith("consultation_")) return "/patient#appointments";
  if (eventType.startsWith("treatment_plan_")) return "/patient/plan";
  if (eventType === "new_staff_message") return "/patient/messages";
  if (eventType === "travel_update") return "/patient/travel";
  return "/patient";
}

export default async function PatientNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,event_type,title,body,created_at,read_at,case_id,appointment_id")
    .eq("recipient_user_id", user.id)
    .eq("recipient_type", "patient")
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (notifications ?? []).filter((item) => !item.read_at).length;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/patient"><span>JV</span><span>Dental</span></Link>
        <div className="portal-header__right">
          <Link className="text-link" href="/patient">Back to portal</Link>
          <span className="status-pill">{unread} unread</span>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation unreadNotifications={unread} />
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Secure patient notifications</p>
          <h1 className="portal-title">Updates that belong to your case.</h1>
          <p className="portal-subtitle">Notifications contain only brief workflow information. Clinical details, documents and messages remain inside their protected portal sections.</p>

          {unread ? (
            <form action={markAllNotificationsRead} style={{ margin: "24px 0" }}>
              <PendingSubmit label="Mark all as read" pendingLabel="Marking…" className="button button--ghost" />
            </form>
          ) : null}

          <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
            {(notifications ?? []).map((item) => (
              <article className="portal-card" key={item.id} style={{ boxShadow: "none" }}>
                <div className="portal-card__body" style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                    <div>
                      <p className="portal-overline" style={{ marginBottom: 6 }}>{item.read_at ? "Read" : "New"}</p>
                      <h2 style={{ margin: 0 }}>{item.title}</h2>
                    </div>
                    <span className="status-pill">{new Date(item.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--muted)" }}>{item.body}</p>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <Link className="text-link" href={destination(item.event_type)} prefetch>Open relevant section →</Link>
                    {!item.read_at ? (
                      <form action={markNotificationRead}>
                        <input type="hidden" name="notification_id" value={item.id} />
                        <PendingSubmit label="Mark read" pendingLabel="Marking…" className="text-link" />
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            {!notifications?.length ? <p>No notifications yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
