import Link from "next/link";
import PendingSubmit from "@/components/pending-submit";
import { requestPasswordReset } from "@/app/auth/actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const audience = params.audience === "staff" ? "staff" : "patient";
  const isStaff = audience === "staff";
  const hasError = typeof params.error === "string";
  const returnHref = isStaff ? "/staff/login" : "/patient/login";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>{isStaff ? "Clinic team access" : "Secure patient access"}</p>
          <h1>Reset your password securely.</h1>
          <p>Enter the email address connected to your {isStaff ? "JV Dental staff" : "patient"} account. We will send a secure recovery link to that address.</p>
        </div>
        <p>For your security, the recovery link should only be opened on a device you trust.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Password recovery</p>
          <h2>Request reset link</h2>
          <p>We will email instructions if the address can be used for account recovery.</p>

          {hasError ? (
            <div className="portal-card" style={{ marginBottom: 22, borderColor: "#cda8a4" }}>
              <div className="portal-card__body">
                <strong>Reset link could not be sent.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>Check the email address and try again.</p>
              </div>
            </div>
          ) : null}

          <form action={requestPasswordReset} style={{ display: "grid", gap: 16 }}>
            <input type="hidden" name="audience" value={audience} />
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
            </div>
            <PendingSubmit className="button login-submit" label="Send reset link →" pendingLabel="Sending reset link…" />
          </form>

          <p className="form-note"><Link className="text-link" href={returnHref}>← Back to sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
