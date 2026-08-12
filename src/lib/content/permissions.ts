import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const CLINICAL_PUBLISHING_ROLES = new Set(["owner", "admin", "implantologist", "doctor"]);

export async function requireClinicalPublisher() {
  const context = await requireStaff();

  if (!CLINICAL_PUBLISHING_ROLES.has(context.staff.role)) {
    redirect("/clinic");
  }

  return context;
}
