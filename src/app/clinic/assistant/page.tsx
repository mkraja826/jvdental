import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createKnowledgeEntry, setKnowledgeState } from "./actions";

const MANAGER_ROLES = new Set(["owner", "admin"]);

export default async function ClinicAssistantPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { staff, supabase } = await requireStaff();
  if (!MANAGER_ROLES.has(staff.role)) redirect("/clinic");

  const [sessionsResult, highIntentResult, handoffsResult, messagesResult, knowledgeResult] = await Promise.all([
    supabase.from("assistant_sessions").select("id", { count: "exact", head: true }),
    supabase.from("assistant_sessions").select("id", { count: "exact", head: true }).eq("high_intent", true),
    supabase.from("assistant_handoffs").select("handoff_type,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("assistant_messages").select("safety_classification,model_provider,model_name,created_at").eq("role", "assistant").order("created_at", { ascending: false }).limit(300),
    supabase.from("assistant_knowledge").select("id,slug,title,category,content,keywords,is_verified,is_active,updated_at").order("category").order("title"),
  ]);

  const handoffs = handoffsResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const knowledge = knowledgeResult.data ?? [];
  const assessmentHandoffs = handoffs.filter((row) => row.handoff_type === "implant_assessment").length;
  const emergencyHandoffs = handoffs.filter((row) => row.handoff_type === "emergency_care").length;
  const modelBacked = messages.filter((row) => Boolean(row.model_provider)).length;
  const classifications = new Map<string, number>();
  for (const row of messages) {
    const key = row.safety_classification ?? "unclassified";
    classifications.set(key, (classifications.get(key) ?? 0) + 1);
  }

  const metrics = [
    { label: "Assistant sessions", value: String(sessionsResult.count ?? 0) },
    { label: "High-intent sessions", value: String(highIntentResult.count ?? 0) },
    { label: "Assessment handoffs", value: String(assessmentHandoffs) },
    { label: "Model-backed replies", value: String(modelBacked) },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right">
          <span>Public assistant control</span>
          <Link className="text-link" href="/clinic">Back to clinic</Link>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Assistant navigation">
            <Link href="/clinic/assistant">Overview</Link>
            <a href="#knowledge">Approved knowledge</a>
            <a href="#safety">Safety signals</a>
            <a href="#new-entry">Add knowledge</a>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Public AI assistant</p>
          <h1 className="portal-title">Controlled answers. Qualified implant leads.</h1>
          <p className="portal-subtitle">The public assistant is separate from secure doctor chat. Clinic-specific answers are grounded in verified entries below; personal diagnosis, scan interpretation and prescribing are blocked before any model call.</p>

          {query.error ? <p style={{ color: "var(--danger)" }}>The requested assistant update could not be saved.</p> : null}

          <div className="metric-grid">
            {metrics.map((metric) => <article className="metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}
          </div>

          <div className="portal-grid" style={{ marginTop: 24 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Provider state</h2><span className="status-pill">Swappable</span></div>
              <div className="portal-card__body">
                <p>{modelBacked > 0 ? "A configured AI provider has produced model-backed replies." : "No model-backed reply has been recorded yet. The assistant is currently safe to operate from verified knowledge and deterministic guardrails until an AI provider is configured."}</p>
                <p style={{ color: "var(--muted)", marginBottom: 0 }}>Provider credentials are environment secrets and are never stored in this table or shown to clinic users.</p>
              </div>
            </article>

            <article className="portal-card" id="safety">
              <div className="portal-card__header"><h2>Safety & intent signals</h2><span className="status-pill">Last {messages.length} replies</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  {[...classifications.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => (
                    <div className="status-row" key={name}><strong>{name.replaceAll("_", " ")}</strong><span>{count}</span><span /></div>
                  ))}
                  {!classifications.size ? <p>No public conversations yet.</p> : null}
                  <div className="status-row"><strong>Emergency handoffs</strong><span>{emergencyHandoffs}</span><span className="status-pill">Urgent-local-care</span></div>
                </div>
              </div>
            </article>
          </div>

          <article className="portal-card" id="knowledge" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Approved knowledge</h2><span className="status-pill">{knowledge.length} entries</span></div>
            <div className="portal-card__body">
              <p style={{ color: "var(--muted)" }}>Only active + verified entries can ground clinic-specific answers. Keep doctor credentials, technology claims, prices, services, travel support and guarantees out until the clinic has explicitly approved them.</p>
              <div className="status-list">
                {knowledge.map((entry) => (
                  <div key={entry.id} style={{ padding: "18px 0", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{entry.title}</strong>
                      <span className="status-pill">{entry.category.replaceAll("_", " ")}</span>
                      <span className="status-pill">{entry.is_verified ? "verified" : "unverified"}</span>
                      <span className="status-pill">{entry.is_active ? "active" : "inactive"}</span>
                    </div>
                    <p>{entry.content}</p>
                    <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>Keywords: {(entry.keywords ?? []).join(", ") || "—"}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <form action={setKnowledgeState}>
                        <input type="hidden" name="id" value={entry.id} /><input type="hidden" name="field" value="is_active" /><input type="hidden" name="value" value={String(!entry.is_active)} />
                        <button className="button button--ghost" type="submit">{entry.is_active ? "Deactivate" : "Activate"}</button>
                      </form>
                      <form action={setKnowledgeState}>
                        <input type="hidden" name="id" value={entry.id} /><input type="hidden" name="field" value="is_verified" /><input type="hidden" name="value" value={String(!entry.is_verified)} />
                        <button className="button button--ghost" type="submit">{entry.is_verified ? "Mark unverified" : "Verify entry"}</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="portal-card" id="new-entry" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Add approved clinic knowledge</h2><span className="status-pill">Owner / admin</span></div>
            <div className="portal-card__body">
              <form action={createKnowledgeEntry} style={{ display: "grid", gap: 16 }}>
                <label>Title<input name="title" required placeholder="Clinic opening hours" /></label>
                <label>Optional slug<input name="slug" placeholder="clinic-opening-hours" /></label>
                <label>Category<select name="category" defaultValue="clinic"><option value="clinic">Clinic</option><option value="implants">Implants</option><option value="guided_implants">Guided implants</option><option value="international">International patients</option><option value="travel">Travel</option><option value="appointments">Appointments</option><option value="pricing_policy">Pricing policy</option><option value="dental_education">Dental education</option><option value="safety">Safety</option></select></label>
                <label>Approved answer content<textarea name="content" rows={6} required placeholder="Write the exact factual information the assistant may rely on." /></label>
                <label>Keywords<input name="keywords" placeholder="hours, opening, appointment, sunday" /></label>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" name="is_verified" /> This information has been checked and may be used publicly</label>
                <button className="button" type="submit">Add knowledge entry</button>
              </form>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
