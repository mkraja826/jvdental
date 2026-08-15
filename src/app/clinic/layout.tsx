import ClinicNavigation from "@/components/clinic-navigation";
import { requireStaff } from "@/lib/auth/guards";
import "../clinic-ux.css";
import "../clinic-navigation.css";
import "../clinic-shell.css";
import "../clinic-form-polish.css";
import "../clinic-interactions.css";

export default async function ClinicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { staff } = await requireStaff();
  const canManage = staff.role === "owner" || staff.role === "admin";

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
        />
      </aside>
      <div className="clinic-workspace-content">{children}</div>
    </div>
  );
}
