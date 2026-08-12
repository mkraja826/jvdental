import Link from "next/link";
import { requestMagicLink } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const hasError = typeof params.error === "string";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home">
          <span>JV</span>
          <span>Dental</span>
        </Link>

        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>
            Secure patient access
          </p>
          <h1>Your treatment journey, in one place.</h1>
          <p>
            Share records, complete your health information, follow your case review and
            communicate with the JV Dental team through your private patient account.
          </p>
        </div>

        <p>
          For urgent dental or medical problems, contact an appropriate local emergency or
          healthcare service rather than relying on portal messaging.
        </p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Patient portal</p>
          <h2>Sign in securely</h2>
          <p>Enter your email and we&apos;ll send you a secure sign-in link.</p>

          {sent ? (
            <div className="portal-card" style={{ marginBottom: 26 }}>
              <div className="portal-card__body">
                <strong>Check your inbox.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                  Your secure sign-in link has been sent. Open it on this device to continue.
                </p>
              </div>
            </div>
          ) : null}

          {hasError ? (
            <div className="portal-card" style={{ marginBottom: 26, borderColor: "#cda8a4" }}>
              <div className="portal-card__body">
                <strong>We couldn&apos;t complete sign-in.</strong>
                <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                  Check your email address and try again. If the problem continues, contact the clinic.
                </p>
              </div>
            </div>
          ) : null}

          <form action={requestMagicLink}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <button className="button" type="submit" style={{ width: "100%" }}>
              Email me a secure link <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="form-note">
            By continuing, you will be able to complete the clinic&apos;s patient intake and
            consent steps. Clinical records are not requested on this public sign-in screen.
          </p>

          <p className="form-note">
            <Link className="text-link" href="/">
              ← Return to JV Dental
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
