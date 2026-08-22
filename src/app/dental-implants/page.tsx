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
      { title: "Guided implant surgery · DIOnavi", body: "For suitable cases, JV Dental uses the DIOnavi digital workflow to connect 3D diagnostic records, virtual implant planning and a patient-specific surgical guide. The guide is used to transfer the approved digital plan to the clinical procedure; final decisions remain case-specific." },
      { title: "Digital planning & guide fabrication", body: "The DIOnavi workflow described by DIO combines CT information with intra-oral scan data, considers the planned crown and occlusion, and then proceeds through implant planning and surgical-guide design. JV Dental applies these digital planning principles where guided treatment is clinically appropriate." },
      { title: "Full-mouth rehabilitation (FMR)", body: "Full-mouth implant rehabilitation may include All-on-4, All-on-6 or implant overdenture concepts depending on anatomy, bite, restorative requirements and case selection." },
      { title: "Bone grafting in compromised cases", body: "Bone grafting may be considered when available bone is inadequate for the planned implant position and the procedure is clinically appropriate." },
      { title: "Implant prosthesis · Malo bridge", body: "Implant-supported crowns, bridges and full-arch prosthetic solutions, including Malo bridge concepts where clinically appropriate, are planned around function, appearance, cleansability and long-term maintenance." },
    ]}
    technologyReference={{
      label: "View the official DIOnavi workflow",
      href: "https://order.dionavi.com/dionavi-2.do",
      body: "DIO's official DIOnavi material describes a digital sequence that merges CT and intra-oral scan information, sets up the intended crown, evaluates prosthetic and anatomical factors, plans implant position and designs a surgical guide to transfer the plan. JV Dental uses DIOnavi as a planning and guided-surgery technology for selected cases; clinical suitability is determined by the treating implantologist.",
    }}
    technologyImage={{
      src: "https://www.dioimplant.co.in/img/digitalguide.png",
      alt: "DIOnavi patient-specific digital surgical guide from DIO Implant India",
      caption: "DIOnavi patient-specific surgical guide · DIO Implant India",
    }}
    steps={[
      { title: "Assessment", body: "The implantologist reviews the missing-tooth area, adjacent teeth, bite, periodontal condition, medical history and treatment goals." },
      { title: "Imaging & digital records", body: "Appropriate radiographic and digital records help evaluate bone volume, anatomical structures and restorative space. For DIOnavi cases, CT and intra-oral scan information form part of the digital planning workflow." },
      { title: "Restorative position", body: "The intended final tooth position guides implant planning so placement is considered together with crown position, occlusion, function, appearance and maintainability." },
      { title: "Implant planning & placement", body: "The surgical protocol is selected for the individual site. In suitable DIOnavi cases, the planned implant position and direction are transferred using a patient-specific surgical guide." },
      { title: "Healing & restoration", body: "Healing, temporary restoration where appropriate, and the final prosthetic stage are planned according to the individual case." },
    ]}
    considerations={["Bone and soft-tissue condition", "Position of nearby teeth, nerves and other anatomy", "Crown position, bite and restorative space", "Medical and periodontal factors", "Long-term hygiene and maintenance"]}
  />;
}
