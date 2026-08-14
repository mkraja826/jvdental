import type { Metadata } from "next";
import { ImplantServicePage } from "@/components/implant-service-page";

export const metadata: Metadata = {
  title: "All-on-4 & All-on-6 Dental Implants in Hyderabad",
  description: "All-on-4 and All-on-6 assessment at JV Dental near Ameerpet, Hyderabad, using diagnosis-led full-arch restorative and surgical planning.",
  alternates: { canonical: "/all-on-4-all-on-6" },
};

export default function AllOnFourSixPage() {
  return <ImplantServicePage
    eyebrow="All-on-4 / All-on-6 planning · Hyderabad"
    title="A full-arch concept should begin with"
    accent="case selection, not a number."
    description="All-on-4 and All-on-6 describe full-arch implant concepts, but the appropriate implant number and configuration depend on anatomy, bone, restorative design, bite, medical factors and the treating implantologist's clinical assessment."
    suitability="The case determines the configuration."
    steps={[
      { title: "Full-arch assessment", body: "The clinical team evaluates the remaining dentition, tissues, bite, smile, medical history and the goals for fixed full-arch rehabilitation." },
      { title: "3D diagnostic records", body: "CBCT and appropriate digital records help assess anatomy, bone distribution, restorative space and potential implant positions." },
      { title: "Restorative design", body: "The intended tooth setup, support, cleansability and bite are considered before selecting implant positions or a four- versus six-implant concept." },
      { title: "Surgical strategy", body: "Implant number, position, angulation and any additional procedures are individualized to the case; a branded or numerical concept does not replace diagnosis." },
      { title: "Provisional, healing & final restoration", body: "The restorative sequence and loading approach are selected according to implant stability, clinical findings and prosthetic requirements." },
    ]}
    considerations={["Available bone and anatomical limitations", "Prosthetic space and tooth position", "Implant distribution and load", "Bite, parafunction and medical factors", "Maintenance access and long-term review"]}
    faqs={[
      ["What is the difference between All-on-4 and All-on-6?", "These terms describe full-arch implant concepts using different numbers of implants. The appropriate configuration depends on anatomy, bone distribution, restorative design, bite and clinical assessment."],
      ["Is All-on-4 suitable for everyone?", "No. A numerical implant concept does not replace diagnosis. The treating implantologist evaluates the individual clinical situation before recommending a suitable approach."],
      ["How do I know which full-arch implant option is appropriate?", "Begin with a clinical assessment and the records considered necessary by the dental team. Implant number, position and restoration are planned together around long-term function and maintenance."],
    ]}
  />;
}
