import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SURFACES = new Set(["patient", "clinic"]);
const DIGEST_RE = /^[a-f0-9]{16,128}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 204 });

    const body = await request.json();
    const surface = String(body.surface ?? "");
    const route = String(body.route ?? "").slice(0, 240);
    const errorName = String(body.errorName ?? "Error").slice(0, 80);
    const errorDigest = String(body.errorDigest ?? "").slice(0, 128);

    if (!SURFACES.has(surface) || !route.startsWith(`/${surface}`) || !DIGEST_RE.test(errorDigest)) {
      return NextResponse.json({ error: "invalid_telemetry" }, { status: 400 });
    }

    const admin = createAdminClient();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("portal_error_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", hourAgo);

    if ((count ?? 0) >= 50) return new NextResponse(null, { status: 202 });

    await admin.from("portal_error_events").insert({
      user_id: user.id,
      surface,
      route,
      error_name: errorName,
      error_digest: errorDigest,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
