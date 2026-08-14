export type InternationalMarket = {
  slug: "uk" | "australia" | "uae";
  name: string;
  hreflang: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  planningFocus: readonly string[];
  questions: readonly [string, string][];
};

export const internationalMarkets: readonly InternationalMarket[] = [
  {
    slug: "uk",
    name: "United Kingdom",
    hreflang: "en-GB",
    title: "Dental Treatment in India for UK Patients",
    description:
      "Plan dental treatment in Hyderabad, India from the UK with JV Dental, including remote review, treatment scheduling, airport pickup, hotel coordination, local assistance and connected follow-up.",
    eyebrow: "International dental care · United Kingdom to Hyderabad",
    intro:
      "Patients travelling from the United Kingdom can begin with records and an online consultation, then coordinate treatment dates, accommodation and local support around the clinical plan before travelling to Hyderabad.",
    planningFocus: [
      "Share available dental records before travel so the clinic can identify what still needs in-person assessment.",
      "Plan treatment dates before arranging leave, accommodation and return travel wherever the clinical pathway allows.",
      "For staged treatment, confirm which parts must happen in Hyderabad and which follow-up can continue remotely after returning to the UK.",
      "Keep treatment records, messages and follow-up connected through the patient portal where appropriate.",
    ],
    questions: [
      ["Can I start my dental assessment from the UK?", "Yes. An online consultation can be used to discuss the concern and available records before travel. Final diagnosis and treatment decisions still require the clinical information considered necessary by the treating dentist."],
      ["Can JV Dental coordinate airport pickup and accommodation?", "JV Dental can coordinate airport pickup, hotel planning, local assistance and return transfer around the planned treatment journey. These are travel and patient-support services rather than medical escort services."],
      ["What happens after I return to the UK?", "Where clinically appropriate, follow-up communication can continue remotely. The treating dentist will explain which reviews must be completed in person and what records should be shared after returning home."],
    ],
  },
  {
    slug: "australia",
    name: "Australia",
    hreflang: "en-AU",
    title: "Dental Treatment in India for Australian Patients",
    description:
      "Plan dental treatment in Hyderabad, India from Australia with JV Dental, including remote review, coordinated treatment scheduling, accommodation support and post-travel follow-up.",
    eyebrow: "International dental care · Australia to Hyderabad",
    intro:
      "For patients travelling from Australia, detailed pre-travel planning is especially important. JV Dental can review available records remotely, clarify the likely clinical sequence and coordinate the practical parts of the Hyderabad visit around that plan.",
    planningFocus: [
      "Use remote review to clarify which imaging or records may be useful before committing to a long-distance treatment trip.",
      "Build the travel schedule around the expected clinical sequence rather than compressing treatment into a fixed holiday window.",
      "Discuss whether treatment may require staged visits, healing intervals or local reviews before booking return travel.",
      "Plan remote follow-up after returning to Australia while recognising that some clinical reviews may still need in-person care.",
    ],
    questions: [
      ["Can treatment planning begin before I fly from Australia?", "Yes. You can begin with an online consultation and available dental records. This helps organise the visit, but final treatment planning remains subject to in-person examination and any additional imaging required."],
      ["Does JV Dental help with the Hyderabad stay?", "The international patient team can coordinate airport pickup, accommodation planning, local assistance, clinic travel coordination and return transfer around the agreed treatment schedule."],
      ["Can all dental treatment be completed in one trip?", "Not always. The number and timing of visits depend on diagnosis, healing, the treatment selected and the treating dentist's clinical judgement. The clinic should confirm the expected sequence before travel arrangements are finalised."],
    ],
  },
  {
    slug: "uae",
    name: "United Arab Emirates",
    hreflang: "en-AE",
    title: "Dental Treatment in India for UAE Patients",
    description:
      "Plan dental treatment in Hyderabad, India from the UAE with JV Dental, including online consultation, treatment scheduling, airport pickup, hotel coordination and connected follow-up.",
    eyebrow: "International dental care · UAE to Hyderabad",
    intro:
      "Patients based in the UAE can begin remotely, coordinate the clinical schedule before travelling and use JV Dental's international patient support for arrival, accommodation, clinic visits and return planning in Hyderabad.",
    planningFocus: [
      "Discuss the dental concern and available records before selecting travel dates.",
      "Coordinate treatment around work and family commitments only after the clinical team has explained the expected visit sequence.",
      "Use one point of coordination for airport pickup, accommodation planning, clinic transport and return transfer.",
      "Continue appropriate follow-up communication remotely after returning to the UAE.",
    ],
    questions: [
      ["Can I book an online consultation from the UAE?", "Yes. The online consultation can be used to discuss your dental concern, available records and what may need assessment once you reach Hyderabad."],
      ["Is international support only for implant patients?", "No. JV Dental provides complete dental care as well as advanced implant dentistry. International support can be coordinated for patients travelling for other suitable dental treatments too."],
      ["Will a representative stay with me during the visit?", "A JV Dental representative can support patient and travel coordination during the stay and clinic journey. This should not be understood as a medical escort unless the clinic specifically confirms a separate clinical service."],
    ],
  },
] as const;

export function getInternationalMarket(slug: string) {
  return internationalMarkets.find((market) => market.slug === slug) ?? null;
}
