export type InternationalJourneyStep = {
  id: string;
  title: string;
  timeframe: string;
  location: "Remote" | "Hyderabad" | "Remote + Hyderabad";
  patientAction: string;
  deliverable: string;
  role: string;
};

export const internationalJourney: InternationalJourneyStep[] = [
  {
    id: "records",
    title: "Share your records",
    timeframe: "[TO BE CONFIRMED BY CLINIC]",
    location: "Remote",
    patientAction: "Create a secure patient account and upload available dental scans, recent dental photographs, relevant reports and your medical history.",
    deliverable: "A complete case file ready for clinical review, with any missing-record request sent back through the patient portal.",
    role: "Patient coordinator",
  },
  {
    id: "review",
    title: "Implantologist review",
    timeframe: "[TO BE CONFIRMED BY CLINIC]",
    location: "Remote",
    patientAction: "Respond to any follow-up questions and provide additional records if the implantologist needs them before forming a preliminary view.",
    deliverable: "A preliminary assessment that explains what can and cannot be concluded remotely, plus the next recommended step.",
    role: "Implantologist",
  },
  {
    id: "consultation",
    title: "Online consultation",
    timeframe: "[TO BE CONFIRMED BY CLINIC]",
    location: "Remote",
    patientAction: "Join the scheduled video consultation and discuss your priorities, medical considerations, possible treatment pathways and travel constraints.",
    deliverable: "A documented consultation outcome and, where appropriate, a preliminary treatment pathway pending in-person examination.",
    role: "Implantologist + patient coordinator",
  },
  {
    id: "travel",
    title: "Plan your visit",
    timeframe: "[TO BE CONFIRMED BY CLINIC]",
    location: "Remote",
    patientAction: "Confirm preferred travel dates only after the clinic has explained the likely treatment sequence and what still requires in-person confirmation.",
    deliverable: "A coordinated visit plan covering appointment sequencing and clinic-side travel support that has been confirmed for your case.",
    role: "Patient coordinator",
  },
  {
    id: "treatment",
    title: "Treatment in Hyderabad",
    timeframe: "[TO BE CONFIRMED BY CLINIC BY CASE TYPE]",
    location: "Hyderabad",
    patientAction: "Attend the in-person clinical and radiographic assessment before definitive treatment begins.",
    deliverable: "A confirmed diagnosis and treatment plan followed by the agreed surgical/restorative stages where clinically appropriate.",
    role: "Treating implantologist + clinical team",
  },
  {
    id: "follow-up",
    title: "Remote follow-up",
    timeframe: "[TO BE CONFIRMED BY CLINIC]",
    location: "Remote + Hyderabad",
    patientAction: "Follow the post-treatment instructions, attend any required local or remote reviews and contact the clinic promptly if concerns arise.",
    deliverable: "Documented follow-up, maintenance guidance and an escalation pathway if further in-person assessment is required.",
    role: "Treating implantologist + patient coordinator",
  },
];

export const internationalCostCategories = [
  { treatment: "Single dental implant", range: "[TO BE CONFIRMED BY CLINIC]", includes: "[TO BE CONFIRMED BY CLINIC]" },
  { treatment: "Full-arch implant rehabilitation", range: "[TO BE CONFIRMED BY CLINIC]", includes: "[TO BE CONFIRMED BY CLINIC]" },
  { treatment: "All-on-4 / All-on-6 pathway", range: "[TO BE CONFIRMED BY CLINIC]", includes: "[TO BE CONFIRMED BY CLINIC]" },
  { treatment: "Bone grafting / augmentation", range: "[TO BE CONFIRMED BY CLINIC]", includes: "[TO BE CONFIRMED BY CLINIC]" },
];

export const internationalLogistics = [
  { title: "Typical stay in Hyderabad", body: "Single implant, full-arch and All-on-4/6 stay lengths must be confirmed by the treating clinic for each pathway. [TO BE CONFIRMED BY CLINIC]" },
  { title: "Visa guidance", body: "Visa eligibility and documentation depend on nationality and current Government of India rules. Patients should use the official India Visa Online portal and treat clinic guidance as administrative support, not legal advice." },
  { title: "Accommodation", body: "Recommended stay-near-clinic options or partner hotels: [TO BE CONFIRMED BY CLINIC]" },
  { title: "Airport & local transport", body: "Pickup assistance, airport transfer arrangements and distance guidance: [TO BE CONFIRMED BY CLINIC]" },
  { title: "Language support", body: "Languages available through the clinical and coordination team: [TO BE CONFIRMED BY CLINIC]" },
  { title: "Payments", body: "Accepted payment methods, currencies, deposits, refund/cancellation terms and what is included in pre-travel estimates: [TO BE CONFIRMED BY CLINIC]" },
  { title: "After you return home", body: "The clinic will define a documented escalation pathway for post-treatment concerns, including when remote advice is appropriate and when local or in-person assessment is required. [TO BE CONFIRMED BY CLINIC]" },
];
