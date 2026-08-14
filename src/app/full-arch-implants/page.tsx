import type { Metadata } from "next";
import { ImplantServicePage } from "@/components/implant-service-page";

export const metadata: Metadata = {
  title: "Full-Arch Dental Implants in Hyderabad",
  description: "Full-arch implant rehabilitation at JV Dental near Ameerpet, Hyderabad, with diagnosis-led surgical and prosthetic planning for complex tooth replacement.",
  alternates: { canonical: "/full-arch-implants" },
};

export default function FullArchImplantsPage() {
  return <ImplantServicePage
    eyebrow="Full-arch implant rehabilitation · Hyderabad"
    title="Rebuild an arch as"
    accent="one coordinated treatment plan."
    description="Full-arch rehabilitation combines surgical, restorative and maintenance decisions across an entire dental arch. Planning therefore considers more than implant placement alone: tooth position, bite, prosthetic space, bone, hygiene access and long-term maintainability all matter."
    suitability="Whole-arch decisions, planned together."
    steps={[
      { title: "Comprehensive diagnosis", body: "The implantologist evaluates the remaining teeth, supporting tissues, bite, smile, medical history and the reasons treatment is being considered." },
      { title: "Imaging & digital records", body: "Appropriate imaging and digital records support evaluation of available bone, anatomy, restorative space and the relationship between the jaws." },
      { title: "Prosthetic planning", body: "The planned tooth position, bite and cleansability are considered before implant positions and surgical strategy are finalized." },
      { title: "Surgical phase", body: "Implant placement, extraction decisions and any additional procedures are tailored to the clinical findings rather than assumed from a standard protocol." },
      { title: "Provisional & final restoration", body: "Where clinically appropriate, provisional and final prosthetic stages are sequenced with healing, function and maintenance requirements in mind." },
    ]}
    considerations={["Condition of remaining teeth and tissues", "Bone distribution and anatomy", "Bite and vertical space", "Prosthetic design and cleansability", "Healing, maintenance and follow-up needs"]}
    faqs={[
      ["What are full-arch dental implants?", "Full-arch implant rehabilitation is a treatment pathway for replacing teeth across an entire upper or lower dental arch. It connects diagnosis, implant planning, surgery, restorative design and long-term maintenance."],
      ["Can full-arch treatment be completed in one visit?", "The timing depends on the diagnosis, treatment sequence, healing requirements and the treating implantologist's assessment. A visit plan should be confirmed only after the clinical review and appropriate records."],
      ["How is a full-arch plan chosen?", "The team considers remaining teeth, gums, bone, bite, medical history, prosthetic space, hygiene access and treatment goals rather than applying a standard plan to every patient."],
    ]}
  />;
}
