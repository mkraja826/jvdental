import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const safeNext = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/patient";
  const isStaffFlow = safeNext === "/clinic"
    || safeNext.startsWith("/clinic/")
    || (safeNext.startsWith("/auth/update-password") && safeNext.includes("audience=staff"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  const loginPath = isStaffFlow ? "/staff/login?error=callback" : "/patient/login?error=callback";
  return NextResponse.redirect(new URL(loginPath, requestUrl.origin));
}
