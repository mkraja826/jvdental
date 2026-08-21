import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { requestMagicLink, signInPatientWithPassword } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const created = params.created === "1";
  const hasError = typeof params.error === "string";
  const requestedNext = typeof params.next === "string" ? params.next : "/patient";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/patient";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>Secure patient access</p>
          <h1>Your treatment journey, in one place.</h1>
          <p>Share records, complete your health information, follow your case review and communicate with the JV Dental team through your private patient account.</p>
        </div>
        <p>For urgent dental or medical problems, contact an appropriate local emergency or healthcare service rather than relying on portal messaging.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Patient portal</p>
          <h2>Sign in</h2>
          <p>Use your email and password. Secure email-link sign-in remains available below.</p>

          {created ? <div className="portal-card" style={{ marginBottom: 22 }}><div className="portal-card__body"><strong>Account created.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>If email confirmation is enabled, confirm your email first, then sign in.</p></div></div> : null}
          {sent ? <div className="portal-card" style={{ marginBottom: 22 }}><div className="portal-card__body"><strong>Check your inbox.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>Your secure sign-in link has been sent.</p></div></div> : null}
          {hasError ? <div className="portal-card" style={{ marginBottom: 22, borderColor: "#cda8a4" }}><div className="portal-card__body"><strong>Sign-in could not be completed.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>Check your email and password and try again.</p></div></div> : null}

          <form action={signInPatientWithPassword} style={{ display: "grid", gap: 16 }}>
            <input type="hidden" name="next" value={next} />
            <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
            <PendingSubmit className="button login-submit" label="Sign in →" pendingLabel="Signing in…" />
          </form>

          <p className="form-note"><Link className="text-link" href={`/patient/register?next=${encodeURIComponent(next)}`}>Create a patient account →</Link></p>
          <p className="form-note"><Link className="text-link" href="/auth/forgot-password?audience=patient">Forgot password?</Link></p>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            <p className="form-note" style={{ marginTop: 0 }}>Prefer passwordless sign-in?</p>
            <form action={requestMagicLink} style={{ display: "grid", gap: 12 }}>
              <input type="hidden" name="next" value={next} />
              <div className="field"><label htmlFor="magic-email">Email address</label><input id="magic-email" name="email" type="email" inputMode="email" autoComplete="email" required /></div>
              <PendingSubmit className="button button--ghost login-submit" label="Email me a secure link" pendingLabel="Sending secure link…" />
            </form>
          </div>

          <p className="form-note">Clinical records are requested only after secure sign-in.</p>
          <p className="form-note"><Link className="text-link" href="/">← Return to JV Dental</Link></p>
        </div>
      </section>
    </main>
  );
}
