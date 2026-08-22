import type { Metadata } from "next";
import { ImplantServicePage } from "@/components/implant-service-page";

export const metadata: Metadata = {
  title: "Dental Implants in Hyderabad | Near Ameerpet",
  description: "Dental implant treatment at JV Dental near Ameerpet and S R Nagar, Hyderabad, including conventional and DIOnavi guided surgery, digital planning, full-mouth rehabilitation, bone grafting, Malo bridge concepts and implant prosthesis.",
  alternates: { canonical: "/dental-implants" },
};

export default function DentalImplantsPage() {
  return <ImplantServicePage
    eyebrow="Single, multiple & full-mouth dental implants · Hyderabad"
    title="Replace missing teeth with"
    accent="restoration-led planning."
    description="Dental implants can support replacement of one, several or a full arch of missing teeth. At JV Dental, planning begins with the intended tooth position, bite, hygiene access, available bone and relevant anatomy before the surgical approach is selected."
    suitability="One plan connecting surgery and restoration."
    showBookingActions={false}
    services={[
      { title: "Conventional implant surgery", body: "Conventional implant placement is selected for suitable cases after clinical examination, imaging and restorative planning." },
      { title: "Guided implant surgery · DIOnavi", body: "For suitable cases, DIOnavi guided surgery connects digital planning with a patient-specific surgical guide." },
      { title: "Digital planning & guide fabrication", body: "Digital records and 3D planning are used to plan implant position and fabricate a surgical guide when guided treatment is indicated." },
      { title: "Full-mouth rehabilitation (FMR)", body: "Full-mouth implant rehabilitation may include All-on-4, All-on-6 or implant overdenture concepts depending on anatomy, bite, restorative requirements and case selection." },
      { title: "Bone grafting in compromised cases", body: "Bone grafting may be considered when available bone is inadequate for the planned implant position and the procedure is clinically appropriate." },
      { title: "Implant prosthesis · Malo bridge", body: "Implant-supported crowns, bridges and full-arch prosthetic solutions, including Malo bridge concepts where clinically appropriate, are planned around function, appearance, cleansability and long-term maintenance." },
    ]}
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
