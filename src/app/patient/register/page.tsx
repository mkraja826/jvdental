import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { signUpPatientWithPassword } from "@/app/auth/actions";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientRegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const hasError = typeof params.error === "string";
  const requestedNext = typeof params.next === "string" ? params.next : "/patient";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/patient";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>New patient account</p>
          <h1>Create secure access before sharing clinical records.</h1>
          <p>Your patient account keeps intake information, documents, messages, consultations and treatment updates inside the secure portal.</p>
        </div>
        <p>Use an email address you can access reliably. You may be asked to confirm the email before first sign-in.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Patient registration</p>
          <h2>Create your account</h2>
          <p>Choose a password with at least 8 characters.</p>

          {hasError ? <div className="portal-card" style={{ marginBottom: 22, borderColor: "#cda8a4" }}><div className="portal-card__body"><strong>Account could not be created.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>Check the email address, make sure both passwords match and use at least 8 characters.</p></div></div> : null}

          <form action={signUpPatientWithPassword} style={{ display: "grid", gap: 16 }}>
            <input type="hidden" name="next" value={next} />
            <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
            <div className="field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></div>
            <PendingSubmit className="button login-submit" label="Create patient account →" pendingLabel="Creating account…" />
          </form>

          <p className="form-note">Already registered? <Link className="text-link" href={`/patient/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
          <p className="form-note"><Link className="text-link" href="/">← Return to JV Dental</Link></p>
        </div>
      </section>
    </main>
  );
}
