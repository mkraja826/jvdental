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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/patient/login");
  }

  const [{ data: profile }, { data: caseRecord }, { count: documentCount }] = await Promise.all([
    supabase
      .from("patient_profiles")
      .select("full_name, intake_completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("patient_cases")
      .select("id, status")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("patient_documents")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", user.id),
  ]);

  const intakeComplete = Boolean(profile?.intake_completed_at);
  const hasDocuments = (documentCount ?? 0) > 0;
  const reviewStarted = Boolean(
    caseRecord?.status &&
      !["new", "records_requested", "records_received"].includes(caseRecord.status),
  );

  const journey = [
    { label: "Account", state: "Complete", active: false },
    {
      label: "Health & dental details",
      state: intakeComplete ? "Complete" : "Next step",
      active: !intakeComplete,
    },
    {
      label: "Records & scans",
      state: hasDocuments ? `${documentCount} uploaded` : intakeComplete ? "Next step" : "Not started",
      active: intakeComplete && !hasDocuments,
    },
    {
      label: "Doctor review",
      state: reviewStarted ? "In progress" : "Waiting",
      active: reviewStarted,
    },
    { label: "Consultation", state: "—", active: false },
    { label: "Treatment plan", state: "—", active: false },
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/">
          <span>JV</span>
          <span>Dental</span>
        </Link>
        <div className="portal-header__right">
          <span>{profile?.full_name || user.email}</span>
          <form action={signOut}>
            <button
              className="text-link"
              type="submit"
              style={{ background: "none", border: 0, cursor: "pointer" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Patient portal navigation">
            <Link href="/patient">Overview</Link>
            <Link href="/patient/intake">My details</Link>
            <Link href="/patient#documents">Documents</Link>
            <Link href="/patient#messages">Messages</Link>
            <Link href="/patient#appointments">Appointments</Link>
            <Link href="/patient#travel">Travel</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Patient portal</p>
          <h1 className="portal-title">Your implant journey</h1>
          <p className="portal-subtitle">
            Complete your information step by step. You will not need to repeat the same
            records in different parts of the clinic workflow.
          </p>

          {params.intake === "complete" ? (
            <article className="portal-card" style={{ marginTop: 28 }}>
              <div className="portal-card__body">
                <strong>Your health and dental details were saved.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                  The next stage is to add any OPG, CBCT, X-rays or clinical photographs that
                  are available for your case.
                </p>
              </div>
            </article>
          ) : null}

          <div className="timeline" aria-label="Patient journey progress">
            {journey.map((item, index) => (
              <div className="timeline-row" key={item.label}>
                <span className="timeline-index">0{index + 1}</span>
                <strong>{item.label}</strong>
                <span className={`timeline-state${item.active ? " timeline-state--active" : ""}`}>
                  {item.state}
                </span>
              </div>
            ))}
          </div>

          <div className="portal-grid">
            <article className="portal-card" id="details">
              <div className="portal-card__header">
                <h2>{intakeComplete ? "Your case information" : "Complete your case information"}</h2>
                <span className="status-pill">{intakeComplete ? "Saved" : "Next"}</span>
              </div>
              <div className="portal-card__body">
                <p>
                  Personal details, medical history, dental concerns and treatment goals are
                  collected through a structured intake rather than through chat.
                </p>
                <Link className="button" href="/patient/intake">
                  {intakeComplete ? "Review my details" : "Start health & dental details"}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <article className="portal-card" id="messages">
              <div className="portal-card__header">
                <h2>Clinic communication</h2>
              </div>
              <div className="portal-card__body">
                <p>
                  Secure doctor/coordinator messaging is the next connected workflow. Clinical
                  communication will remain separate from the public AI information assistant.
                </p>
                <span className="status-pill">Messaging foundation ready</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
