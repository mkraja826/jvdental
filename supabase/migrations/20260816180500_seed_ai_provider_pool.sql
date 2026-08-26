-- Seed provider definitions for the JV Dental public assistant.
-- They are intentionally disabled until the matching Edge Function secrets are configured.

insert into public.ai_provider_pool (
  provider_name,
  model_name,
  endpoint,
  api_key_env_name,
  priority,
  is_active,
  status,
  daily_request_limit
)
values
  (
    'groq',
    'llama-3.3-70b-versatile',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_API_KEY',
    10,
    false,
    'active',
    null
  ),
  (
    'gemini',
    'gemini-3.6-flash',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_API_KEY',
    20,
    false,
    'active',
    null
  ),
  (
    'openrouter',
    'openrouter/free',
    'https://openrouter.ai/api/v1/chat/completions',
    'OPENROUTER_API_KEY',
    30,
    false,
    'active',
    null
  )
on conflict (provider_name, model_name, endpoint, api_key_env_name)
do update set
  priority = excluded.priority,
  updated_at = now();
