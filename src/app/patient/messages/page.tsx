import Link from "next/link";
import { redirect } from "next/navigation";
import PendingSubmitButton from "@/components/pending-submit-button";
import PatientNavigation from "@/components/patient-navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPatientMessage } from "./actions";

export default async function PatientMessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id,subject,case_id")
    .eq("patient_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: messages } = conversation
    ? await supabase
        .from("messages")
        .select("id,sender_user_id,body,created_at")
        .eq("conversation_id", conversation.id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true })
    : { data: [] };

  const staffIds = [...new Set((messages ?? []).map((message) => message.sender_user_id).filter((id) => id !== user.id))];
  const { data: staffRows } = staffIds.length
    ? await supabase.from("staff_profiles").select("user_id,full_name,role").in("user_id", staffIds)
    : { data: [] };
  const staff = new Map((staffRows ?? []).map((row) => [row.user_id, row]));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/"><span>JV</span><span>Dental</span></Link>
        <Link className="text-link" href="/patient">Back to portal</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation />
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Secure clinic communication</p>
          <h1 className="portal-title">Your conversation with JV Dental.</h1>
          <p className="portal-subtitle">
            Use this conversation for your implant assessment, treatment planning questions and clinic coordination. It is separate from the public AI assistant.
          </p>

          {query.error ? <p style={{ color: "var(--danger)" }}>Your message could not be sent. Please retry.</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header">
              <h2>{conversation?.subject ?? "Implant assessment"}</h2>
              <span className="status-pill">Private</span>
            </div>
            <div className="portal-card__body">
              <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
                {(messages ?? []).length ? (messages ?? []).map((message) => {
                  const mine = message.sender_user_id === user.id;
                  const sender = staff.get(message.sender_user_id);
                  return (
                    <div key={message.id} style={{ maxWidth: "78%", marginLeft: mine ? "auto" : 0, padding: "14px 16px", border: "1px solid var(--line)", background: mine ? "var(--mineral-soft)" : "var(--white)" }}>
                      <small style={{ display: "block", marginBottom: 6, color: "var(--muted)" }}>
                        {mine ? "You" : `${sender?.full_name ?? "JV Dental team"}${sender?.role ? ` · ${sender.role.replaceAll("_", " ")}` : ""}`}
                      </small>
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.body}</p>
                    </div>
                  );
                }) : (
                  <p>No messages yet. Send a question to start the secure case conversation.</p>
                )}
              </div>

              <form action={sendPatientMessage} style={{ display: "grid", gap: 12 }}>
                <label>
                  Message the clinic
                  <textarea name="message" rows={5} maxLength={10000} required placeholder="Ask about your records, review, consultation or treatment planning." />
                </label>
                <PendingSubmitButton className="button" idleLabel="Send securely" pendingLabel="Sending…" />
              </form>
              <p style={{ color: "var(--muted)", fontSize: ".82rem", marginBottom: 0 }}>
                This portal is not intended for dental or medical emergencies.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
