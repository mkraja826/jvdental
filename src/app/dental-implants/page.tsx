import type { Metadata } from "next";
import { ImplantServicePage } from "@/components/implant-service-page";

export const metadata: Metadata = {
  title: "Dental Implants in Hyderabad | Near Ameerpet",
  description: "Dental implant treatment at JV Dental near Ameerpet and S R Nagar, Hyderabad. Learn about diagnosis-led planning for single and multiple missing teeth.",
  alternates: { canonical: "/dental-implants" },
};

export default function DentalImplantsPage() {
  return <ImplantServicePage
    eyebrow="Single & multiple dental implants · Hyderabad"
    title="Replace missing teeth with"
    accent="restoration-led planning."
    description="Dental implants can support replacement of one or several missing teeth. At JV Dental, planning begins with the intended tooth position, bite, hygiene access, available bone and relevant anatomy before the surgical approach is selected."
    suitability="One plan connecting surgery and restoration."
    steps={[
      { title: "Assessment", body: "The implantologist reviews the missing-tooth area, adjacent teeth, bite, periodontal condition, medical history and treatment goals." },
      { title: "Imaging & records", body: "Appropriate radiographic and digital records help evaluate bone volume, anatomical structures and the restorative space available." },
      { title: "Restorative position", body: "The intended final tooth position guides implant planning so placement is considered together with function, appearance and maintainability." },
      { title: "Implant placement", body: "The surgical protocol is selected for the individual site and may include conventional or guided approaches when clinically appropriate." },
      { title: "Healing & restoration", body: "Healing, temporary restoration where appropriate, and the final prosthetic stage are planned according to the individual case." },
    ]}
    considerations={["Bone and soft-tissue condition", "Position of nearby teeth and anatomy", "Bite and restorative space", "Medical and periodontal factors", "Long-term hygiene and maintenance"]}
  />;
}
