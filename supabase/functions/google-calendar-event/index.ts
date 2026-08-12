import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
}

async function decrypt(ciphertext: string, iv: string, secret: string) {
  const key = await encryptionKey(secret);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );
  return new TextDecoder().decode(plain);
}

function validEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function googleEventId(appointmentId: string) {
  return `jv${appointmentId.replaceAll("-", "")}`;
}

function meetingUrl(event: Record<string, unknown>) {
  if (typeof event.hangoutLink === "string") return event.hangoutLink;
  const conferenceData = event.conferenceData as { entryPoints?: Array<{ entryPointType?: string; uri?: string }> } | undefined;
  return conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? null;
}

async function googleRequest(url: string, accessToken: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const tokenEncryptionKey = Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);
  if (!clientId || !clientSecret || !tokenEncryptionKey) return json({ error: "google_not_configured" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const actor = userData.user;
  if (userError || !actor) return json({ error: "unauthorized" }, 401);

  const { data: actorStaff } = await adminClient
    .from("staff_profiles")
    .select("role,is_active")
    .eq("user_id", actor.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!actorStaff || !["owner", "admin", "implantologist", "doctor", "coordinator"].includes(actorStaff.role)) {
    return json({ error: "forbidden" }, 403);
  }

  let input: { appointmentId?: string; action?: "create" | "update" | "cancel" | "refresh" };
  try {
    input = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const appointmentId = String(input.appointmentId ?? "").trim();
  const action = input.action ?? "create";
  if (!appointmentId || !["create", "update", "cancel", "refresh"].includes(action)) return json({ error: "invalid_input" }, 400);

  const { data: appointment } = await adminClient
    .from("appointments")
    .select("id,patient_id,case_id,clinician_user_id,starts_at,ends_at,timezone,meeting_url,status,calendar_integration_id,external_event_id,conference_request_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment) return json({ error: "appointment_not_found" }, 404);

  const { data: integration } = await adminClient
    .from("calendar_integrations")
    .select("id,calendar_id,status")
    .eq("provider", "google")
    .eq("status", "connected")
    .maybeSingle();

  if (!integration) {
    await adminClient.from("appointments").update({ external_sync_status: "not_configured", external_sync_error: null }).eq("id", appointment.id);
    return json({ ok: false, status: "not_configured" });
  }

  const { data: secretRow } = await adminClient
    .from("calendar_integration_secrets")
    .select("refresh_token_ciphertext,refresh_token_iv")
    .eq("integration_id", integration.id)
    .maybeSingle();
  if (!secretRow) return json({ error: "calendar_secret_missing" }, 503);

  let refreshToken: string;
  try {
    refreshToken = await decrypt(secretRow.refresh_token_ciphertext, secretRow.refresh_token_iv, tokenEncryptionKey);
  } catch {
    return json({ error: "calendar_secret_unreadable" }, 503);
  }

  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const refreshData = await refreshResponse.json() as { access_token?: string; error?: string };
  if (!refreshResponse.ok || !refreshData.access_token) {
    await adminClient.from("calendar_integrations").update({ status: "error", last_error: refreshData.error ?? "token_refresh_failed" }).eq("id", integration.id);
    return json({ error: "google_token_refresh_failed" }, 502);
  }
  const accessToken = refreshData.access_token;
  const calendarId = encodeURIComponent(integration.calendar_id || "primary");
  const eventId = appointment.external_event_id || googleEventId(appointment.id);
  const eventBase = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  const saveFailure = async (message: string) => {
    const detail = message.slice(0, 500);
    await adminClient.from("appointments").update({
      calendar_integration_id: integration.id,
      external_sync_status: "failed",
      external_sync_error: detail,
    }).eq("id", appointment.id);
    await adminClient.from("calendar_integrations").update({ last_error: detail }).eq("id", integration.id);
  };

  if (action === "cancel") {
    if (appointment.external_event_id) {
      const cancelResponse = await googleRequest(
        `${eventBase}/${encodeURIComponent(appointment.external_event_id)}?sendUpdates=all`,
        accessToken,
        { method: "DELETE" },
      );
      if (!cancelResponse.ok && cancelResponse.status !== 404 && cancelResponse.status !== 410) {
        const detail = await cancelResponse.text();
        await saveFailure(`calendar_cancel_failed:${cancelResponse.status}:${detail}`);
        return json({ error: "calendar_cancel_failed" }, 502);
      }
    }
    await adminClient.from("appointments").update({
      calendar_integration_id: integration.id,
      external_sync_status: "cancelled",
      external_sync_error: null,
    }).eq("id", appointment.id);
    await adminClient.from("calendar_integrations").update({ last_sync_at: new Date().toISOString(), last_error: null }).eq("id", integration.id);
    return json({ ok: true, status: "cancelled" });
  }

  if (action === "refresh") {
    if (!appointment.external_event_id) return json({ error: "event_not_created" }, 400);
    const getResponse = await googleRequest(`${eventBase}/${encodeURIComponent(appointment.external_event_id)}?conferenceDataVersion=1`, accessToken);
    if (!getResponse.ok) {
      const detail = await getResponse.text();
      await saveFailure(`calendar_refresh_failed:${getResponse.status}:${detail}`);
      return json({ error: "calendar_refresh_failed" }, 502);
    }
    const event = await getResponse.json() as Record<string, unknown>;
    const meet = meetingUrl(event);
    await adminClient.from("appointments").update({
      calendar_integration_id: integration.id,
      external_event_id: String(event.id ?? appointment.external_event_id),
      external_event_html_url: typeof event.htmlLink === "string" ? event.htmlLink : null,
      meeting_url: meet ?? appointment.meeting_url,
      conference_provider: meet ? "google_meet" : appointment.meeting_url ? "manual" : "google_meet_pending",
      external_sync_status: "synced",
      external_sync_error: null,
    }).eq("id", appointment.id);
    return json({ ok: true, status: "synced", meetingUrl: meet });
  }

  const { data: patientAuth } = await adminClient.auth.admin.getUserById(appointment.patient_id);
  const patientEmail = patientAuth.user?.email ?? null;
  const { data: clinician } = appointment.clinician_user_id
    ? await adminClient.from("staff_profiles").select("email").eq("user_id", appointment.clinician_user_id).maybeSingle()
    : { data: null };

  const attendees = Array.from(new Set([patientEmail, clinician?.email].filter(validEmail) as string[])).map((email) => ({ email }));
  const conferenceRequestId = appointment.conference_request_id || crypto.randomUUID().replaceAll("-", "");
  const eventBody: Record<string, unknown> = {
    summary: "JV Dental video consultation",
    description: "Secure JV Dental consultation. Clinical information, patient records and treatment details remain inside the protected JV Dental portal.",
    start: { dateTime: appointment.starts_at, timeZone: appointment.timezone || "Asia/Kolkata" },
    end: { dateTime: appointment.ends_at, timeZone: appointment.timezone || "Asia/Kolkata" },
    attendees,
  };

  let eventResponse: Response;
  if (action === "create" && !appointment.external_event_id) {
    eventBody.id = eventId;
    eventBody.conferenceData = {
      createRequest: {
        requestId: conferenceRequestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
    eventResponse = await googleRequest(
      `${eventBase}?conferenceDataVersion=1&sendUpdates=all`,
      accessToken,
      { method: "POST", body: JSON.stringify(eventBody) },
    );

    if (eventResponse.status === 409) {
      eventResponse = await googleRequest(`${eventBase}/${encodeURIComponent(eventId)}?conferenceDataVersion=1`, accessToken);
    }
  } else {
    eventResponse = await googleRequest(
      `${eventBase}/${encodeURIComponent(eventId)}?conferenceDataVersion=1&sendUpdates=all`,
      accessToken,
      { method: "PATCH", body: JSON.stringify(eventBody) },
    );
  }

  if (!eventResponse.ok) {
    const detail = await eventResponse.text();
    await saveFailure(`calendar_sync_failed:${eventResponse.status}:${detail}`);
    return json({ error: "calendar_sync_failed" }, 502);
  }

  let event = await eventResponse.json() as Record<string, unknown>;
  let meet = meetingUrl(event);
  if (!meet && action === "create") {
    for (let attempt = 0; attempt < 2 && !meet; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const poll = await googleRequest(`${eventBase}/${encodeURIComponent(String(event.id ?? eventId))}?conferenceDataVersion=1`, accessToken);
      if (poll.ok) {
        event = await poll.json() as Record<string, unknown>;
        meet = meetingUrl(event);
      }
    }
  }

  await adminClient.from("appointments").update({
    calendar_integration_id: integration.id,
    external_event_id: String(event.id ?? eventId),
    external_event_html_url: typeof event.htmlLink === "string" ? event.htmlLink : null,
    external_sync_status: "synced",
    external_sync_error: null,
    meeting_url: meet ?? appointment.meeting_url,
    conference_provider: meet ? "google_meet" : appointment.meeting_url ? "manual" : "google_meet_pending",
    conference_request_id: conferenceRequestId,
  }).eq("id", appointment.id);

  await adminClient.from("calendar_integrations").update({ last_sync_at: new Date().toISOString(), last_error: null }).eq("id", integration.id);
  await adminClient.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: action === "create" ? "calendar_event_created" : "calendar_event_updated",
    entity_type: "appointment",
    entity_id: appointment.id,
    metadata: { provider: "google", google_event_id: String(event.id ?? eventId), conference: meet ? "google_meet" : "pending" },
  });

  return json({ ok: true, status: "synced", eventId: String(event.id ?? eventId), meetingUrl: meet });
});