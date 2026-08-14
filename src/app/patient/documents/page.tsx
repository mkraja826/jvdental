import Link from "next/link";
import { redirect } from "next/navigation";
import PatientNavigation from "@/components/patient-navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploader } from "./document-uploader";

export default async function PatientDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const { data: caseRecord } = await supabase
    .from("patient_cases")
    .select("id,status,case_number")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!caseRecord) redirect("/patient/intake");

  const { data: documents } = await supabase
    .from("patient_documents")
    .select("id,category,storage_path,file_name,file_size_bytes,created_at")
    .eq("patient_id", user.id)
    .eq("case_id", caseRecord.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const records = await Promise.all((documents ?? []).map(async (document) => {
    const { data } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(document.storage_path, 300);
    return { ...document, signedUrl: data?.signedUrl ?? null };
  }));

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
          <p className="portal-overline">Private clinical vault · Case JV-{caseRecord.case_number}</p>
          <h1 className="portal-title">Send your records before you travel.</h1>
          <p className="portal-subtitle">
            Upload records already available from your dentist. These files are private to your case and authorised JV Dental staff.
          </p>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>Upload a record</h2><span className="status-pill">Private</span></div>
              <div className="portal-card__body">
                <DocumentUploader userId={user.id} caseId={caseRecord.id} />
              </div>
            </article>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Case status</h2><span className="status-pill">{caseRecord.status.replaceAll("_", " ")}</span></div>
              <div className="portal-card__body">
                <p>Once a clinical record is attached successfully, the case is automatically moved into the clinic review queue.</p>
                <p style={{ color: "var(--muted)" }}>Do not use this portal for urgent dental or medical emergencies.</p>
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 24 }}>
            <div className="portal-card__header"><h2>Your uploaded records</h2><span className="status-pill">{records.length}</span></div>
            <div className="portal-card__body">
              {records.length ? (
                <div className="status-list">
                  {records.map((record) => (
                    <div className="status-row" key={record.id}>
                      <strong>{record.file_name}</strong>
                      <span>{record.category.replaceAll("_", " ")}</span>
                      {record.signedUrl ? <a className="text-link" href={record.signedUrl} target="_blank" rel="noreferrer">Open →</a> : <span>Private</span>}
                    </div>
                  ))}
                </div>
              ) : <p>No clinical records uploaded yet.</p>}
              {records.length === 30 ? <p className="form-note">Showing your 30 most recent uploads.</p> : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
