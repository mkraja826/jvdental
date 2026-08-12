import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const journey = [
  { label: "Account", state: "Complete", active: false },
  { label: "Health & dental details", state: "Next step", active: true },
  { label: "Records & scans", state: "Not started", active: false },
  { label: "Doctor review", state: "Waiting", active: false },
  { label: "Consultation", state: "—", active: false },
  { label: "Treatment plan", state: "—", active: false },
];

export default async function PatientDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/patient/login");
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/">
          <span>JV</span>
          <span>Dental</span>
        </Link>
        <div className="portal-header__right">
          <span>{user.email}</span>
          <form action={signOut}>
            <button className="text-link" type="submit" style={{ background: "none", border: 0, cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Patient portal navigation">
            <Link href="/patient">Overview</Link>
            <Link href="/patient#details">My details</Link>
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
                <h2>Complete your case information</h2>
                <span className="status-pill">Next</span>
              </div>
              <div className="portal-card__body">
                <p>
                  Personal details, medical history, dental concerns and treatment goals will
                  be collected here through a structured intake rather than through chat.
                </p>
                <button className="button" type="button" disabled title="Intake workflow is the next implementation milestone">
                  Start health & dental details
                </button>
              </div>
            </article>

            <article className="portal-card" id="messages">
              <div className="portal-card__header">
                <h2>Clinic communication</h2>
              </div>
              <div className="portal-card__body">
                <p>
                  Secure doctor/coordinator messaging will appear here after the case intake
                  and conversation tables are connected.
                </p>
                <span className="status-pill">No messages yet</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
