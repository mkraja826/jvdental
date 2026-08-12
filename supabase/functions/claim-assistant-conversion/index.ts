import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authorization = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRole) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let input: { visitorToken?: string };
  try {
    input = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const visitorToken = typeof input.visitorToken === "string" && /^[0-9a-f-]{36}$/i.test(input.visitorToken)
    ? input.visitorToken
    : null;
  if (!visitorToken) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: existing } = await admin
    .from("assistant_sessions")
    .select("id,converted_patient_id")
    .eq("visitor_token", visitorToken)
    .maybeSingle();

  if (!existing) {
    return new Response(JSON.stringify({ claimed: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (existing.converted_patient_id && existing.converted_patient_id !== user.id) {
    return new Response(JSON.stringify({ error: "already_claimed" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await admin
    .from("assistant_sessions")
    .update({
      converted_to_patient: true,
      converted_patient_id: user.id,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    return new Response(JSON.stringify({ error: "claim_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ claimed: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
