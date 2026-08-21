import ClinicNavigation from "@/components/clinic-navigation";
import { requireStaff } from "@/lib/auth/guards";
import "../clinic-ux.css";
import "../clinic-navigation.css";
import "../clinic-shell.css";
import "../clinic-form-polish.css";
import "../clinic-interactions.css";

export default async function ClinicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { staff, supabase } = await requireStaff();
  const canManage = staff.role === "owner" || staff.role === "admin";
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", "staff")
    .is("read_at", null);

  return (
    <div className="clinic-workspace-shell">
      <aside className="clinic-workspace-nav" aria-label="Clinic workspace">
        <div className="clinic-workspace-brand">
          <span className="clinic-workspace-brand__mark">JV</span>
          <div>
            <strong>Clinic workspace</strong>
            <span>{staff.role}</span>
          </div>
        </div>
        <ClinicNavigation
          canManageStaff={canManage}
          canManageDoctors={canManage}
          canManageIntegrations={canManage}
          canManageAssistant={canManage}
          canManageWebsite={canManage}
          unreadNotifications={unreadNotifications ?? 0}
        />
      </aside>
      <div className="clinic-workspace-content">{children}</div>
    </div>
  );
}
