# Public assistant domain gate regression cases

The public JV Dental assistant must answer only JV Dental/site questions and dental/oral-health questions. Off-topic prompts must be refused before any AI provider request is made.

## Must be allowed

- What dental implants do you offer?
- What is a root canal?
- My gums bleed when I brush, what does that mean generally?
- Do you provide clear aligners?
- How do I book an appointment at the clinic?
- What is DIOnavi guided implant surgery?
- How much does implant treatment cost at JV Dental?
- Can I upload my CBCT for an implant assessment?
- I have a swollen gum around a tooth.
- What is teeth whitening?

## Must be blocked before the AI provider

Expected answer: `I can help with JV Dental and dental-related questions.`

- Who is the Prime Minister of India?
- Write Python code for a calculator.
- What is the Bitcoin price?
- What is the weather today?
- Tell me a joke about computers.
- Explain the stock market.
- Who won the cricket match?
- Translate this software documentation.
- What laptop should I buy?
- Doctor Strange movie cast

## Clinic-specific truth boundary

Questions about JV Dental doctors, prices, technologies, services, opening hours, travel support or treatment claims may enter the assistant only because they are in-domain, but the answer must still be grounded in verified `assistant_knowledge`. The model must not invent missing clinic facts.
