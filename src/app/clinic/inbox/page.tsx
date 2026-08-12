import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";

export default async function ClinicInboxPage() {
  const { supabase } = await requireStaff();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id,patient_id,case_id,subject,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const patientIds = [...new Set((conversations ?? []).map((item) => item.patient_id))];
  const caseIds = [...new Set((conversations ?? []).map((item) => item.case_id).filter((id): id is string => Boolean(id)))];

  const [{ data: profiles }, { data: cases }] = await Promise.all([
    patientIds.length
      ? supabase.from("patient_profiles").select("user_id,full_name,country").in("user_id", patientIds)
      : Promise.resolve({ data: [] }),
    caseIds.length
      ? supabase.from("patient_cases").select("id,case_number,status").in("id", caseIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  const caseMap = new Map((cases ?? []).map((item) => [item.id, item]));

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic">Back to overview</Link>
      </header>
      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic inbox navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/inbox">Inbox</Link>
            <Link href="/clinic/reviews">Doctor review</Link>
            <Link href="/clinic/inventory">Inventory</Link>
          </nav>
        </aside>
        <section className="portal-main">
          <p className="portal-overline">Secure patient inbox</p>
          <h1 className="portal-title">Every patient conversation, attached to the case.</h1>
          <p className="portal-subtitle">
            Use this inbox for patient-facing communication. Internal clinical notes remain inside the review record and are never shown here to the patient.
          </p>

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Conversations</h2><span className="status-pill">{conversations?.length ?? 0}</span></div>
            <div className="portal-card__body">
              {(conversations ?? []).length ? (
                <div className="status-list">
                  {(conversations ?? []).map((conversation) => {
                    const profile = profileMap.get(conversation.patient_id);
                    const caseRecord = conversation.case_id ? caseMap.get(conversation.case_id) : null;
                    return (
                      <Link className="status-row" href={`/clinic/inbox/${conversation.id}`} key={conversation.id}>
                        <strong>{profile?.full_name ?? "Patient"}<br /><small>{profile?.country ?? "Country not recorded"}</small></strong>
                        <span>{caseRecord ? `JV-${caseRecord.case_number}` : "General enquiry"}</span>
                        <span className="status-pill">{caseRecord?.status?.replaceAll("_", " ") ?? "Message"}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : <p>No patient conversations yet.</p>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
