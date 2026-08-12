import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type PatientDashboardProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientDashboard({ searchParams }: PatientDashboardProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/patient/login");

  const [profileResult, caseResult, documentResult, conversationResult, appointmentResult, planResult] = await Promise.all([
    supabase.from("patient_profiles").select("full_name,intake_completed_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("patient_cases").select("id,status,case_number").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("patient_documents").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
    supabase.from("appointments").select("id,appointment_type,starts_at,status").eq("patient_id", user.id).eq("status", "scheduled").order("starts_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("treatment_plans").select("id,status").eq("patient_id", user.id).in("status", ["preliminary", "sent", "accepted"]).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const profile = profileResult.data;
  const caseRecord = caseResult.data;
  const documentCount = documentResult.count ?? 0;
  const conversationCount = conversationResult.count ?? 0;
  const appointment = appointmentResult.data;
  const treatmentPlan = planResult.data;

  const intakeComplete = Boolean(profile?.intake_completed_at);
  const hasDocuments = documentCount > 0;
  const reviewStarted = Boolean(caseRecord?.status && !["new", "records_requested", "records_received"].includes(caseRecord.status));

  const journey = [
    { label: "Account", state: "Complete", active: false },
    { label: "Health & dental details", state: intakeComplete ? "Complete" : "Next step", active: !intakeComplete },
    { label: "Records & scans", state: hasDocuments ? `${documentCount} uploaded` : intakeComplete ? "Next step" : "Not started", active: intakeComplete && !hasDocuments },
    { label: "Doctor review", state: reviewStarted ? caseRecord?.status.replaceAll("_", " ") ?? "In progress" : hasDocuments ? "Waiting" : "Not started", active: reviewStarted },
    { label: "Consultation", state: appointment ? new Date(appointment.starts_at).toLocaleDateString() : "—", active: Boolean(appointment) },
    { label: "Treatment plan", state: treatmentPlan ? treatmentPlan.status : "—", active: Boolean(treatmentPlan) },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/"><span>JV</span><span>Dental</span></Link>
        <div className="portal-header__right">
          <span>{profile?.full_name || user.email}</span>
          {caseRecord ? <span className="status-pill">JV-{caseRecord.case_number}</span> : null}
          <form action={signOut}>
            <button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>Sign out</button>
          </form>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Patient portal navigation">
            <Link href="/patient">Overview</Link>
            <Link href="/patient/intake">My details</Link>
            <Link href="/patient/documents">Documents</Link>
            <Link href="/patient/messages">Messages</Link>
            <Link href="/patient#appointments">Appointments</Link>
            <Link href="/patient#travel">Travel</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Patient portal</p>
          <h1 className="portal-title">Your implant journey</h1>
          <p className="portal-subtitle">Complete your information step by step. Your records, doctor communication and treatment journey stay attached to one case.</p>

          {params.intake === "complete" ? (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__body">
                <strong>Your health and dental details were saved.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>The next stage is to add any OPG, CBCT, X-rays or clinical photographs that are available for your case.</p>
              </div>
            </article>
          ) : null}

          <div className="timeline" aria-label="Patient journey progress">
            {journey.map((item, index) => (
              <div className="timeline-row" key={item.label}>
                <span className="timeline-index">0{index + 1}</span>
                <strong>{item.label}</strong>
                <span className={`timeline-state${item.active ? " timeline-state--active" : ""}`}>{item.state}</span>
              </div>
            ))}
          </div>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__header"><h2>{intakeComplete ? "Your case information" : "Complete your case information"}</h2><span className="status-pill">{intakeComplete ? "Saved" : "Next"}</span></div>
              <div className="portal-card__body">
                <p>Personal details, medical history, dental concerns and treatment goals are collected through structured intake rather than through chat.</p>
                <Link className="button" href="/patient/intake">{intakeComplete ? "Review my details" : "Start health & dental details"}<span aria-hidden="true">→</span></Link>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinical records</h2><span className="status-pill">{documentCount}</span></div>
              <div className="portal-card__body">
                <p>Upload OPGs, X-rays, PDFs, photographs and resumable CBCT/DICOM archives into your private case vault.</p>
                <Link className="button button--ghost" href="/patient/documents">Open documents →</Link>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Clinic communication</h2><span className="status-pill">{conversationCount ? "Active" : "Ready"}</span></div>
              <div className="portal-card__body">
                <p>Secure communication with the JV Dental clinical and international-patient team. This is separate from the public AI assistant.</p>
                <Link className="button button--ghost" href="/patient/messages">Open messages →</Link>
              </div>
            </article>

            <article className="portal-card" id="appointments">
              <div className="portal-card__header"><h2>Next consultation</h2></div>
              <div className="portal-card__body">
                {appointment ? <p><strong>{appointment.appointment_type.replaceAll("_", " ")}</strong><br />{new Date(appointment.starts_at).toLocaleString()}</p> : <p>No consultation has been scheduled yet.</p>}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
