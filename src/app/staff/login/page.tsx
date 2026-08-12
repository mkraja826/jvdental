import Link from "next/link";
import { requestStaffMagicLink } from "@/app/auth/actions";

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const hasError = typeof params.error === "string";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>Clinic team access</p>
          <h1>One secure entrance to the clinic workspace.</h1>
          <p>Staff access is provisioned by the clinic owner or administrator. Use the same email address assigned to your JV Dental staff account.</p>
        </div>
        <p>Clinical and patient information is available only after your authenticated account is matched to an active JV Dental staff role.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Staff portal</p>
          <h2>Sign in securely</h2>
          <p>No password is required. We&apos;ll send a one-time sign-in link to your approved staff email.</p>

          {sent ? (
            <div className="portal-card" style={{ marginBottom: 26 }}>
              <div className="portal-card__body">
                <strong>Check your staff inbox.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>Open the secure sign-in link on this device to enter the JV Dental clinic portal.</p>
              </div>
            </div>
          ) : null}

          {hasError ? (
            <div className="portal-card" style={{ marginBottom: 26, borderColor: "#cda8a4" }}>
              <div className="portal-card__body">
                <strong>Staff sign-in could not be started.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>Use the exact email provisioned by the clinic owner. If access was recently removed, contact the clinic owner.</p>
              </div>
            </div>
          ) : null}

          <form action={requestStaffMagicLink}>
            <div className="field">
              <label htmlFor="email">Staff email address</label>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="doctor@clinic.com" required />
            </div>
            <button className="button" type="submit" style={{ width: "100%" }}>Email my secure staff link <span aria-hidden="true">→</span></button>
          </form>

          <p className="form-note">Unprovisioned email addresses are not allowed to create staff accounts from this screen.</p>
          <p className="form-note"><Link className="text-link" href="/">← Return to JV Dental</Link></p>
        </div>
      </section>
    </main>
  );
}
