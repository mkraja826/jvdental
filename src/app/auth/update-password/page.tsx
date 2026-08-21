import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpdatePasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const audience = params.audience === "staff" ? "staff" : "patient";
  const isStaff = audience === "staff";
  const error = typeof params.error === "string" ? params.error : "";
  const message = error === "password-mismatch"
    ? "The two passwords do not match."
    : error === "weak-password"
      ? "Use a password with at least 8 characters."
      : error
        ? "Your password could not be updated. Request a new recovery link and try again."
        : "";

  return (
    <main className="login-shell">
      <section className="login-story">
        <Link className="wordmark" href="/" aria-label="JV Dental home"><span>JV</span><span>Dental</span></Link>
        <div>
          <p className="eyebrow" style={{ color: "#b8cec5" }}>{isStaff ? "Clinic team access" : "Secure patient access"}</p>
          <h1>Choose a new password.</h1>
          <p>Your recovery link has opened a secure session. Set a new password to continue to your {isStaff ? "clinic workspace" : "patient portal"}.</p>
        </div>
        <p>Use a password you do not reuse on other websites.</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <p className="portal-overline">Password recovery</p>
          <h2>Set new password</h2>
          <p>Enter the new password twice to confirm it.</p>

          {message ? (
            <div className="portal-card" style={{ marginBottom: 22, borderColor: "#cda8a4" }}>
              <div className="portal-card__body"><strong>Unable to update password.</strong><p style={{ marginBottom: 0, color: "var(--muted)" }}>{message}</p></div>
            </div>
          ) : null}

          <form action={updatePassword} style={{ display: "grid", gap: 16 }}>
            <input type="hidden" name="audience" value={audience} />
            <div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
            <div className="field"><label htmlFor="confirm_password">Confirm new password</label><input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required /></div>
            <button className="button" type="submit" style={{ width: "100%" }}>Update password →</button>
          </form>

          <p className="form-note"><Link className="text-link" href={isStaff ? "/staff/login" : "/patient/login"}>← Back to sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
