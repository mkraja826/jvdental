export type GeneralTreatmentPage = {
  slug: "root-canal-treatment" | "dental-crowns-bridges" | "dentures" | "gum-treatment" | "tooth-extraction";
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  accent: string;
  intro: string;
  steps: ReadonlyArray<readonly [string, string]>;
  faqs: ReadonlyArray<readonly [string, string]>;
};

export const generalTreatmentPages: readonly GeneralTreatmentPage[] = [
  {
    slug: "root-canal-treatment",
    title: "Root Canal Treatment in Ameerpet, Hyderabad",
    description: "Root canal assessment and treatment at JV Dental near Ameerpet and S R Nagar, Hyderabad, with diagnosis-led care and restoration planning.",
    eyebrow: "Root canal treatment · Ameerpet / S R Nagar · Hyderabad",
    heading: "Save a damaged tooth with",
    accent: "diagnosis-led root canal care.",
    intro: "Root canal treatment may be considered when the dental pulp is inflamed or infected. The correct pathway depends on the tooth, the surrounding tissues, restorability, symptoms and the findings from clinical examination and appropriate imaging.",
    steps: [["Assessment", "The dentist examines the tooth, symptoms, surrounding tissues and relevant dental history."], ["Imaging and diagnosis", "Appropriate radiographic information helps assess the tooth, roots and surrounding bone before treatment is recommended."], ["Root canal treatment", "The procedure is planned to clean, disinfect and seal the root canal system where clinically indicated."], ["Restoration", "After treatment, the tooth is restored according to the remaining structure, bite and functional requirements."], ["Review and maintenance", "The dentist explains appropriate review and oral-health care after treatment."]],
    faqs: [["When might I need root canal treatment?", "Root canal treatment may be considered for a tooth affected by pulpal inflammation or infection. A dentist confirms the diagnosis after examination and appropriate imaging."], ["Will a crown be needed after root canal treatment?", "The restoration depends on the remaining tooth structure, location, bite and functional demands. The dentist will explain whether a crown or another restoration is appropriate."], ["Can I book for tooth pain without knowing the treatment?", "Yes. Book based on the problem, such as pain, swelling or a damaged tooth. The dental team can assess the cause and explain the appropriate next step."]],
  },
  {
    slug: "dental-crowns-bridges",
    title: "Dental Crowns and Bridges in Ameerpet, Hyderabad",
    description: "Dental crowns and bridges at JV Dental near Ameerpet and S R Nagar, Hyderabad, planned around tooth condition, bite, function and long-term maintenance.",
    eyebrow: "Crowns and bridges · Ameerpet / S R Nagar · Hyderabad",
    heading: "Restore teeth and replace gaps with",
    accent: "function-led planning.",
    intro: "Crowns and bridges can restore damaged teeth or replace selected missing teeth. The appropriate design depends on the condition of the teeth, gums, bite, available support, appearance goals and long-term hygiene needs.",
    steps: [["Dental assessment", "The dentist reviews damaged teeth, missing-tooth spaces, gums, bite and the existing restorations."], ["Treatment design", "The restoration is planned around function, support, appearance, cleansability and the condition of the supporting teeth."], ["Tooth preparation or support planning", "Where needed, teeth and supporting structures are prepared according to the selected restorative plan."], ["Temporary and final restoration", "The final crown or bridge is fitted and checked for comfort, bite and hygiene access."], ["Maintenance", "The team explains cleaning, review and the signs that should prompt a dental check-up."]],
    faqs: [["What is the difference between a crown and a bridge?", "A crown covers and restores a damaged tooth. A bridge is used to replace one or more missing teeth by using supporting teeth or implants, depending on the selected plan."], ["Can a crown be placed after a root canal?", "A crown may be recommended after root canal treatment when the tooth needs additional protection and restoration. The decision depends on the remaining tooth structure and bite."], ["How is a bridge planned?", "The dentist evaluates the gap, adjacent teeth, gums, bite, appearance goals and cleaning access before discussing suitable bridge or implant options."]],
  },
  {
    slug: "dentures",
    title: "Dentures in Ameerpet, Hyderabad",
    description: "Partial and complete denture planning at JV Dental near Ameerpet and S R Nagar, Hyderabad, designed around comfort, function, support and maintenance.",
    eyebrow: "Partial and complete dentures · Ameerpet / S R Nagar · Hyderabad",
    heading: "Replace missing teeth with",
    accent: "comfort and function in mind.",
    intro: "Dentures are removable tooth-replacement options for patients with one or more missing teeth. The right option depends on the number and position of missing teeth, remaining teeth, gums, bite, expectations and ability to maintain the appliance.",
    steps: [["Assessment", "The dentist reviews missing teeth, remaining teeth, gums, bite, oral-health history and treatment goals."], ["Denture design", "The type of denture and supporting design are planned around retention, comfort, appearance, function and cleansability."], ["Records and fitting", "Dental records are taken to create the denture and assess its fit, bite and appearance."], ["Adjustment", "Follow-up adjustments may be needed while the patient adapts to the new appliance."], ["Ongoing care", "The dental team explains denture cleaning, storage and regular review."]],
    faqs: [["What is the difference between partial and complete dentures?", "A partial denture replaces some missing teeth while a complete denture replaces all teeth in an arch. The appropriate option depends on the individual dental condition."], ["Are dentures the only option for missing teeth?", "No. Depending on the clinical situation, bridges or dental implants may also be considered. The dental team can explain the options after assessment."], ["Do new dentures need adjustments?", "Yes, an adjustment period is common. The clinic can review fit, comfort and bite after delivery as appropriate."]],
  },
  {
    slug: "gum-treatment",
    title: "Gum Treatment in Ameerpet, Hyderabad",
    description: "Gum-health assessment and periodontal treatment planning at JV Dental near Ameerpet and S R Nagar, Hyderabad, for bleeding gums, inflammation and supporting-tissue care.",
    eyebrow: "Gum and periodontal care · Ameerpet / S R Nagar · Hyderabad",
    heading: "Protect the foundation of your smile with",
    accent: "thoughtful gum care.",
    intro: "Gum treatment starts with understanding inflammation, plaque deposits, gum and bone support, tooth mobility, home-care habits and relevant medical factors. The dentist recommends care only after examining the cause and severity.",
    steps: [["Gum-health examination", "The dentist checks gums, plaque and calculus deposits, tooth support and symptoms such as bleeding, swelling or sensitivity."], ["Diagnosis and planning", "The appropriate level of cleaning and treatment is determined from the clinical findings and any required records."], ["Professional treatment", "Cleaning or periodontal care is performed according to the diagnosed condition."], ["Home-care guidance", "The team explains brushing, interdental cleaning and other individual maintenance steps."], ["Review", "Gum health is reviewed over time, particularly when there are risk factors or ongoing treatment needs."]],
    faqs: [["Why do gums bleed when brushing?", "Bleeding gums can have different causes, including inflammation. A dental assessment helps identify the reason and the appropriate care."], ["Can gum disease affect dental implants?", "Healthy gums and supporting tissues are important for natural teeth and implants. The dental team assesses periodontal condition as part of implant planning and maintenance."], ["Should I wait for gum pain before booking?", "No. Bleeding, swelling, bad breath, recession or loose teeth are reasons to arrange a dental check-up even if there is no pain."]],
  },
  {
    slug: "tooth-extraction",
    title: "Tooth Extraction in Ameerpet, Hyderabad",
    description: "Tooth-extraction assessment and aftercare at JV Dental near Ameerpet and S R Nagar, Hyderabad, with replacement options discussed where clinically appropriate.",
    eyebrow: "Tooth extraction and oral surgery · Ameerpet / S R Nagar · Hyderabad",
    heading: "When a tooth cannot be maintained, plan",
    accent: "the next step carefully.",
    intro: "Tooth extraction is considered when a tooth cannot be predictably maintained or when removal is the appropriate clinical option. The dentist assesses the tooth, surrounding tissues, symptoms, medical history and replacement needs before treatment.",
    steps: [["Clinical assessment", "The dentist assesses the tooth, symptoms, adjacent teeth, gums, medical history and relevant imaging."], ["Treatment discussion", "Options to maintain or remove the tooth are discussed when clinically appropriate, including the likely next steps after extraction."], ["Extraction planning", "The procedure is planned around the tooth, roots, surrounding anatomy and patient needs."], ["Aftercare", "The clinic provides individual aftercare instructions and explains when to contact the team."], ["Replacement planning", "For missing teeth, the dentist may discuss dentures, bridges or implants at an appropriate time."]],
    faqs: [["Will I need to replace a tooth after extraction?", "Replacement is often considered to support chewing, bite and adjacent teeth, but the best option and timing depend on the individual dental situation."], ["Can a dental implant be planned after extraction?", "An implant may be considered after extraction in suitable cases. Timing and suitability depend on the extraction site, bone, gums, healing and the overall treatment plan."], ["What should I do after a tooth extraction?", "Follow the individual aftercare instructions given by the clinic and contact the dental team if you have concerns about healing, bleeding, pain or swelling."]],
  },
] as const;

export function getGeneralTreatmentPage(slug: string) {
  return generalTreatmentPages.find((page) => page.slug === slug) ?? null;
}
