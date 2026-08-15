# JV Dental public assistant boundary

The assistant is restricted to two domains only:

1. Verified JV Dental website/clinic information.
2. General dental and oral-health education.

Any unrelated topic is rejected by the Edge Function before the external AI provider is called.

Clinic-specific facts remain grounded exclusively in verified `assistant_knowledge` rows. The AI provider must not invent doctors, prices, technologies, services, opening hours, guarantees, travel arrangements or treatment claims.
