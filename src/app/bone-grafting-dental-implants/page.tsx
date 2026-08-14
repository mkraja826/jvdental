import type { Metadata } from "next";
import { ImplantServicePage } from "@/components/implant-service-page";

export const metadata: Metadata = {
  title: "Bone Grafting for Dental Implants in Hyderabad",
  description: "Bone grafting and complex implant assessment at JV Dental near Ameerpet, Hyderabad, as part of diagnosis-led implant treatment planning.",
  alternates: { canonical: "/bone-grafting-dental-implants" },
};

export default function BoneGraftingPage() {
  return <ImplantServicePage
    eyebrow="Bone grafting & complex implant cases · Hyderabad"
    title="When implant planning depends on"
    accent="the foundation beneath it."
    description="Bone grafting may be considered when the available bone does not support the intended implant position or restorative plan. Whether grafting is needed, which approach is appropriate, and when implant placement can occur are case-specific decisions."
    suitability="Build the plan around anatomy, not assumptions."
    steps={[
      { title: "Clinical assessment", body: "The implantologist evaluates the missing-tooth area, soft tissues, periodontal condition, medical history and restorative requirements." },
      { title: "3D imaging", body: "Appropriate imaging helps assess bone volume, shape and nearby anatomical structures before grafting or implant options are discussed." },
      { title: "Defect and treatment planning", body: "The team considers whether augmentation is required for the intended implant position and whether an alternative restorative or surgical strategy is more appropriate." },
      { title: "Grafting or combined procedure", body: "Where grafting is indicated, the technique and whether it is staged or combined with implant placement depend on defect characteristics and clinical judgement." },
      { title: "Healing and implant restoration", body: "Healing, implant timing and restoration are reviewed according to the procedure performed and the patient's individual response." },
    ]}
    considerations={["Amount and shape of available bone", "Nearby anatomical structures", "Soft-tissue and periodontal condition", "Medical and healing factors", "Final implant and restorative position"]}
  />;
}
