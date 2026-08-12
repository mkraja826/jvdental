import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { sendClinicMessage } from "../actions";

export default async function ClinicConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireStaff();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id,patient_id,case_id,subject")
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();

  const [{ data: profile }, { data: caseRecord }, { data: messages }] = await Promise.all([
    supabase.from("patient_profiles").select("full_name,country,preferred_language,preferred_contact_method").eq("user_id", conversation.patient_id).maybeSingle(),
    conversation.case_id
      ? supabase.from("patient_cases").select("id,case_number,status,treatment_interest").eq("id", conversation.case_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("messages").select("id,sender_user_id,body,created_at").eq("conversation_id", id).eq("is_internal", false).order("created_at", { ascending: true }),
  ]);

  const senderIds = [...new Set((messages ?? []).map((message) => message.sender_user_id).filter((senderId) => senderId !== conversation.patient_id))];
  const { data: staffRows } = senderIds.length
    ? await supabase.from("staff_profiles").select("user_id,full_name,role").in("user_id", senderIds)
    : { data: [] };
  const staffMap = new Map((staffRows ?? []).map((row) => [row.user_id, row]));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic/inbox">Back to inbox</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Conversation navigation">
            <Link href="/clinic/inbox">Inbox</Link>
            {caseRecord ? <Link href={`/clinic/reviews/${caseRecord.id}`}>Clinical review</Link> : null}
            <Link href="/clinic">Overview</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Patient conversation {caseRecord ? `· JV-${caseRecord.case_number}` : ""}</p>
          <h1 className="portal-title">{profile?.full_name ?? "Patient"}</h1>
          <p className="portal-subtitle">
            {profile?.country ?? "Country not recorded"} · {caseRecord?.treatment_interest ?? conversation.subject ?? "Implant assessment"}
          </p>

          {query.error ? <p style={{ color: "var(--danger)" }}>Message could not be sent.</p> : null}

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>{conversation.subject ?? "Implant assessment"}</h2><span className="status-pill">Patient-visible</span></div>
            <div className="portal-card__body">
              <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
                {(messages ?? []).map((message) => {
                  const fromPatient = message.sender_user_id === conversation.patient_id;
                  const staff = staffMap.get(message.sender_user_id);
                  return (
                    <div key={message.id} style={{ maxWidth: "78%", marginLeft: fromPatient ? 0 : "auto", padding: "14px 16px", border: "1px solid var(--line)", background: fromPatient ? "var(--white)" : "var(--mineral-soft)" }}>
                      <small style={{ display: "block", marginBottom: 6, color: "var(--muted)" }}>
                        {fromPatient ? profile?.full_name ?? "Patient" : `${staff?.full_name ?? "JV Dental team"}${staff?.role ? ` · ${staff.role.replaceAll("_", " ")}` : ""}`}
                      </small>
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.body}</p>
                    </div>
                  );
                })}
                {!messages?.length ? <p>No messages yet.</p> : null}
              </div>

              <form action={sendClinicMessage} style={{ display: "grid", gap: 12 }}>
                <input type="hidden" name="conversation_id" value={conversation.id} />
                <label>
                  Reply to patient
                  <textarea name="message" rows={5} maxLength={10000} required placeholder="Write a patient-visible reply." />
                </label>
                <button className="button" type="submit">Send to patient</button>
              </form>
              <p style={{ color: "var(--muted)", fontSize: ".82rem", marginBottom: 0 }}>
                Clinical/internal notes must be added from the review screen, not here.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
