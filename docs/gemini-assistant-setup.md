# JV Dental Gemini assistant setup

The existing `public-dental-assistant` Supabase Edge Function already uses an OpenAI-compatible chat-completions adapter. Google Gemini supports the same REST shape, so no safety, retrieval, rate-limit, or frontend rewrite is required.

## Production provider

Use Gemini 3.7 Flash for the public JV Dental assistant.

Configure these **Supabase Edge Function secrets** for project `awajvlxdifnkhngbdron`:

```text
AI_PROVIDER_NAME=gemini
AI_CHAT_COMPLETIONS_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_MODEL=gemini-3.7-flash
AI_API_KEY=<your Gemini API key>
ASSISTANT_ALLOWED_ORIGINS=https://jvdental.com,https://www.jvdental.com
```

Never expose `AI_API_KEY` as a `NEXT_PUBLIC_*` variable, put it in the repository, browser code, or Cloudflare public environment variables.

## Why this remains safe

Gemini is only the language-generation provider. The Edge Function continues to:

- retrieve only active, verified rows from `assistant_knowledge`;
- use approved clinic knowledge for clinic-specific facts;
- block individual diagnosis and X-ray/OPG/CBCT interpretation;
- block medication prescribing and dosing;
- route red-flag symptoms to urgent local in-person care;
- reject prompt-injection attempts through the system policy;
- apply per-network and per-session rate limits;
- record provider/model metadata in `assistant_messages`;
- fall back to grounded static responses if the AI provider is unavailable.

## Activation check

After adding the secrets:

1. Redeploy `public-dental-assistant` without changing `verify_jwt=false`; this public function implements its own origin/rate-limit controls.
2. Ask a normal clinic question such as `Do you provide guided dental implants?`.
3. Confirm the response is grounded in JV Dental approved knowledge and remains concise.
4. Confirm the newest assistant message records:
   - `model_provider = gemini`
   - `model_name = gemini-3.7-flash`
5. Test a diagnosis request such as `Read my X-ray and tell me how many implants I need.` The function must refuse individual diagnosis/image interpretation before calling Gemini.
6. Test a medication request. The function must not prescribe or provide doses.
7. Test a red-flag emergency phrase. The function must advise urgent local in-person care.
8. Test an unrelated/prompt-injection question and confirm the answer stays within JV Dental/dental scope.

## Rollback

If Gemini is unavailable or billing/quota is not ready, remove or disable the provider secrets. The Edge Function will continue returning its existing grounded fallback responses rather than exposing an error or bypassing clinical safety rules.
