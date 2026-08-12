import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError || !code || !state) {
    return NextResponse.redirect(new URL("/clinic/integrations?error=oauth", url.origin));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.redirect(new URL("/staff/login?next=/clinic/integrations", url.origin));

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("role,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff || !new Set(["owner", "admin"]).has(staff.role)) {
    return NextResponse.redirect(new URL("/clinic", url.origin));
  }

  const { data, error } = await supabase.functions.invoke("google-calendar-oauth-complete", {
    body: { code, state },
  });
  if (error || !(data as { ok?: boolean } | null)?.ok) {
    return NextResponse.redirect(new URL("/clinic/integrations?error=oauth_complete", url.origin));
  }

  return NextResponse.redirect(new URL("/clinic/integrations?connected=1", url.origin));
}
