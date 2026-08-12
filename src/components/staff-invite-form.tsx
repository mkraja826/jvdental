"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type StaffInviteFormProps = { actorRole: string };

const ROLE_OPTIONS = [
  ["owner", "Owner"],
  ["admin", "Admin"],
  ["implantologist", "Implantologist"],
  ["doctor", "Doctor"],
  ["coordinator", "International Coordinator"],
  ["receptionist", "Reception"],
  ["dental_assistant", "Dental Assistant"],
] as const;

export default function StaffInviteForm({ actorRole }: StaffInviteFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("full_name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      role: String(form.get("role") ?? ""),
      jobTitle: String(form.get("job_title") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      sendInvite: form.get("send_invite") === "on",
    };

    const { data, error: invokeError } = await supabase.functions.invoke("invite-staff", { body: payload });
    if (invokeError || data?.error) {
      setError(data?.detail || data?.error || invokeError?.message || "Staff access could not be created.");
      setBusy(false);
      return;
    }

    const target = event.currentTarget;
    target.reset();
    setMessage(data?.invited
      ? `Invitation sent to ${payload.email}. Staff access has been provisioned.`
      : `Staff access created for ${payload.email}. They can now sign in at /staff/login.`);
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <label>Full name<input name="full_name" required minLength={2} placeholder="Dr. / Mr. / Ms. Full Name" /></label>
      <label>Staff email<input name="email" type="email" required placeholder="name@example.com" /></label>
      <div className="form-grid-2">
        <label>Role
          <select name="role" defaultValue="doctor" required>
            {ROLE_OPTIONS.filter(([value]) => actorRole === "owner" || !["owner", "admin"].includes(value)).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>Job title<input name="job_title" placeholder="Senior Implantologist" /></label>
      </div>
      <label>Phone / internal contact<input name="phone" type="tel" placeholder="Optional" /></label>
      <label style={{ display: "flex", gridTemplateColumns: "auto 1fr", alignItems: "start", gap: 10 }}>
        <input name="send_invite" type="checkbox" />
        <span>Send Supabase invitation email now. Until the hosted invite template is switched to the SSR-safe JV Dental template, staff can instead use the secure <strong>/staff/login</strong> magic-link screen.</span>
      </label>
      {message ? <p className="form-note" style={{ color: "var(--mineral)" }}>{message}</p> : null}
      {error ? <p className="form-note" style={{ color: "var(--danger)" }}>{error}</p> : null}
      <button className="button" type="submit" disabled={busy}>{busy ? "Provisioning…" : "Create staff access →"}</button>
    </form>
  );
}
