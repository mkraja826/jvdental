import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";
import { requireStaff } from "@/lib/auth/guards";

function destination(eventType: string, caseId: string | null) {
  if (eventType.startsWith("consultation_")) return caseId ? `/clinic/commercial/${caseId}` : "/clinic/commercial";
  if (eventType === "new_patient_message") return "/clinic/inbox";
  if (eventType === "new_patient_document" || eventType === "records_received") return caseId ? `/clinic/reviews/${caseId}` : "/clinic/reviews";
  if (eventType === "treatment_plan_response") return caseId ? `/clinic/commercial/${caseId}` : "/clinic/commercial";
  if (eventType === "travel_update") return "/clinic/travel";
  if (eventType.startsWith("inventory_")) return "/clinic/inventory";
  return "/clinic";
}

export default async function ClinicNotificationsPage() {
  const { supabase, user, staff } = await requireStaff();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,event_type,title,body,created_at,read_at,case_id,appointment_id")
    .eq("recipient_user_id", user.id)
    .eq("recipient_type", "staff")
    .order("created_at", { ascending: false })
    .limit(75);

  const unread = (notifications ?? []).filter((item) => !item.read_at).length;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <span>{staff.full_name ?? "JV Dental staff"}</span>
          <span className="status-pill">{unread} unread</span>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic notification navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/notifications">Notifications</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/reviews">Doctor review</Link>
            <Link href="/clinic/commercial">Consultations</Link>
            <Link href="/clinic/inventory">Inventory</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Operational notifications</p>
          <h1 className="portal-title">The right signal, without exposing the record.</h1>
          <p className="portal-subtitle">Notifications identify the workflow event only. Open the protected case, inbox, travel or inventory workspace for the actual details.</p>

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
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <Link className="text-link" href={destination(item.event_type, item.case_id)} prefetch>Open workflow →</Link>
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
            {!notifications?.length ? <p>No operational notifications yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
