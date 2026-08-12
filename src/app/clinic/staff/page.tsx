import Link from "next/link";
import { redirect } from "next/navigation";
import { updateStaffMember } from "@/app/clinic/staff/actions";
import StaffInviteForm from "@/components/staff-invite-form";
import { requireStaff } from "@/lib/auth/guards";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  implantologist: "Implantologist",
  doctor: "Doctor",
  coordinator: "International Coordinator",
  receptionist: "Reception",
  dental_assistant: "Dental Assistant",
};

const ALL_ROLES = Object.entries(ROLE_LABELS);

export default async function StaffManagementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, user, staff } = await requireStaff();
  if (!["owner", "admin"].includes(staff.role)) redirect("/clinic");

  const { data: members } = await supabase
    .from("staff_profiles")
    .select("user_id,full_name,email,phone,job_title,role,is_active,invited_at,deactivated_at,created_at")
    .order("is_active", { ascending: false })
    .order("role")
    .order("full_name");

  const rows = members ?? [];
  const active = rows.filter((member) => member.is_active);
  const clinical = active.filter((member) => ["owner", "implantologist", "doctor"].includes(member.role));
  const operations = active.filter((member) => ["coordinator", "receptionist", "dental_assistant"].includes(member.role));
  const inactive = rows.filter((member) => !member.is_active);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <div className="portal-header__right"><span>{staff.full_name ?? "JV Dental staff"}</span><span className="status-pill">Staff management</span></div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Staff management navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic/staff">Staff access</Link>
            <Link href="/clinic/doctors">Doctor portfolios</Link>
            <Link href="/staff/login">Staff sign-in</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Access governance</p>
          <h1 className="portal-title">Right person. Right role. Revocable access.</h1>
          <p className="portal-subtitle">Provision staff without sharing passwords, keep role changes auditable, deactivate access without deleting clinical history, and protect the clinic from losing its final active owner.</p>

          {params.saved === "1" ? <p className="form-note" style={{ color: "var(--mineral)" }}>Staff access updated.</p> : null}
          {params.error ? <p className="form-note" style={{ color: "var(--danger)" }}>That staff change was blocked. Check your role permissions, self-deactivation rule and last-owner protection.</p> : null}

          <div className="metric-grid">
            <article className="metric"><span>Active staff</span><strong>{active.length}</strong></article>
            <article className="metric"><span>Clinical team</span><strong>{clinical.length}</strong></article>
            <article className="metric"><span>Operations team</span><strong>{operations.length}</strong></article>
            <article className="metric"><span>Inactive access</span><strong>{inactive.length}</strong></article>
          </div>

          <div className="portal-grid" style={{ marginTop: 28 }}>
            <article className="portal-card">
              <div className="portal-card__header"><h2>Provision staff access</h2><span className="status-pill">Owner / Admin</span></div>
              <div className="portal-card__body">
                <StaffInviteForm actorRole={staff.role} />
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header"><h2>Access rules</h2><span className="status-pill">Database enforced</span></div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row"><strong>Owner</strong><span>Full governance</span><span className="status-pill">Can grant admin</span></div>
                  <div className="status-row"><strong>Admin</strong><span>Operational governance</span><span className="status-pill">Cannot manage owners/admins</span></div>
                  <div className="status-row"><strong>Self protection</strong><span>No self-deactivation</span><span className="status-pill">Guarded</span></div>
                  <div className="status-row"><strong>Owner continuity</strong><span>At least one active owner</span><span className="status-pill">Guarded</span></div>
                </div>
                <p className="form-note">Staff records are deactivated rather than deleted because clinical cases, messages, implant records and audit history may reference the staff user permanently.</p>
              </div>
            </article>
          </div>

          <article className="portal-card" style={{ marginTop: 28 }}>
            <div className="portal-card__header"><h2>Clinic team access</h2><span className="status-pill">{rows.length} provisioned</span></div>
            <div className="portal-card__body">
              {rows.length ? (
                <div style={{ display: "grid", gap: 18 }}>
                  {rows.map((member) => {
                    const protectedFromAdmin = staff.role === "admin" && ["owner", "admin"].includes(member.role);
                    const isSelf = member.user_id === user.id;
                    const editable = !protectedFromAdmin;
                    const allowedRoles = staff.role === "owner" ? ALL_ROLES : ALL_ROLES.filter(([role]) => !["owner", "admin"].includes(role));
                    return (
                      <article className="staff-access-row" key={member.user_id}>
                        <div className="staff-access-row__identity">
                          <strong>{member.full_name ?? member.email ?? "Staff member"}</strong>
                          <span>{member.email ?? "Email unavailable"}</span>
                          <small>{member.job_title || ROLE_LABELS[member.role] || member.role}{member.invited_at ? ` · invited ${new Date(member.invited_at).toLocaleDateString("en-IN")}` : ""}</small>
                        </div>

                        {editable ? (
                          <form action={updateStaffMember} className="staff-access-row__form">
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <label>Name<input name="full_name" defaultValue={member.full_name ?? ""} required /></label>
                            <label>Role
                              <select name="role" defaultValue={member.role}>
                                {allowedRoles.map(([role, label]) => <option value={role} key={role}>{label}</option>)}
                              </select>
                            </label>
                            <label>Job title<input name="job_title" defaultValue={member.job_title ?? ""} /></label>
                            <label>Phone<input name="phone" type="tel" defaultValue={member.phone ?? ""} /></label>
                            <label className="staff-active-toggle">
                              <input name="is_active" type="checkbox" defaultChecked={member.is_active} disabled={isSelf} />
                              <span>{member.is_active ? "Active access" : "Access disabled"}{isSelf ? " · your account" : ""}</span>
                              {isSelf && member.is_active ? <input type="hidden" name="is_active" value="on" /> : null}
                            </label>
                            <button className="button button--ghost" type="submit">Save access</button>
                          </form>
                        ) : (
                          <div className="staff-access-row__locked">
                            <span className="status-pill">{ROLE_LABELS[member.role] ?? member.role}</span>
                            <p>Only an owner can change owner or admin access.</p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <strong>No staff profiles exist yet.</strong>
                  <p style={{ color: "var(--muted)" }}>The first owner must be bootstrapped once before this console can be used. After that, all staff provisioning happens here.</p>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
