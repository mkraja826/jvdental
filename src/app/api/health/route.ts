import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildIdentity() {
  return {
    commit: process.env.JV_BUILD_COMMIT_SHA ?? "unknown",
    branch: process.env.JV_BUILD_BRANCH ?? "unknown",
  };
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const build = buildIdentity();

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json(
      { status: "unavailable", service: "jv-dental", build },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/doctor_profiles?select=id&status=eq.published&limit=1`, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "degraded", service: "jv-dental", database: "unavailable", build },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { status: "ok", service: "jv-dental", database: "ok", build },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", service: "jv-dental", database: "unavailable", build },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
