import Link from "next/link";
import { signInStaffWithPassword } from "@/app/auth/actions";

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const resetSent = params.reset === "sent";

  const errorMessage =
    error === "not-authorized"
      ? "This account is not an active JV Dental staff account. Contact the clinic owner if you believe this is incorrect."
      : error
        ? "Staff sign-in failed. Check your email address and password and try again."
        : "";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>Clinic team access</p>
          <h1>Secure access to the JV Dental clinic workspace.</h1>
          <p>Staff access is provisioned by the clinic owner or administrator. Sign in using the email address and password assigned to your JV Dental staff account.</p>
        </div>
        <p>Clinical and patient information is available only after your authenticated account is matched to an active JV Dental staff role.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Staff portal</p>
          <h2>Staff sign in</h2>
          <p>Email and password are required to access the clinic portal.</p>

          {resetSent ? (
            <div className="portal-card" style={{ marginBottom: 26 }}>
              <div className="portal-card__body">
                <strong>Check your inbox.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>If the account exists, a secure password-reset link has been sent.</p>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="portal-card" style={{ marginBottom: 26, borderColor: "#cda8a4" }}>
              <div className="portal-card__body">
                <strong>Unable to sign in.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <form action={signInStaffWithPassword}>
            <div className="field">
              <label htmlFor="email">Staff email address</label>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="username" placeholder="admin@jvdental.com" required />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required minLength={8} />
            </div>

            <button className="button" type="submit" style={{ width: "100%" }}>Sign in to clinic portal <span aria-hidden="true">→</span></button>
          </form>

          <p className="form-note"><Link className="text-link" href="/auth/forgot-password?audience=staff">Forgot password?</Link></p>
          <p className="form-note">Only accounts provisioned by the JV Dental owner or administrator can access this portal.</p>
          <p className="form-note"><Link className="text-link" href="/">← Return to JV Dental</Link></p>
        </div>
      </section>
    </main>
  );
}
