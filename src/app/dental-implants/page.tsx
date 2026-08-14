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
    faqs={[
      ["Can a dental implant replace one missing tooth?", "A dental implant may support replacement of one missing tooth when the site, bone, gums, bite and overall dental condition are clinically suitable. The treating implantologist confirms the appropriate option after assessment."],
      ["Do I need a scan before dental implant treatment?", "Appropriate imaging is commonly used to evaluate bone, nearby anatomy and restorative requirements. The exact records needed depend on the individual dental condition and treatment plan."],
      ["Are dental implants right for every missing tooth?", "No. Dental implants are one tooth-replacement option. The dental team considers the condition of the mouth, medical and periodontal factors, bite, bone, hygiene needs and patient goals before recommending a pathway."],
    ]}
  />;
}
