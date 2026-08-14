"use server";

import { redirect } from "next/navigation";
import { trackProductEvent } from "@/lib/product-analytics";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = typeof value === "string" ? value.trim() : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function readEmail(formData: FormData) {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function readPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

function validEmail(email: string) {
  return Boolean(email && email.includes("@"));
}

function validPassword(password: string) {
  return password.length >= 8;
}

export async function signInPatientWithPassword(formData: FormData) {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const next = safeNext(formData.get("next"), "/patient");

  if (!validEmail(email) || !password) {
    redirect(`/patient/login?error=invalid-credentials&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/patient/login?error=password&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signUpPatientWithPassword(formData: FormData) {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmPasswordValue = formData.get("confirm_password");
  const confirmPassword = typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";
  const next = safeNext(formData.get("next"), "/patient");

  if (!validEmail(email)) {
    redirect(`/patient/login?mode=signup&error=invalid-email&next=${encodeURIComponent(next)}`);
  }
  if (!validPassword(password)) {
    redirect(`/patient/login?mode=signup&error=weak-password&next=${encodeURIComponent(next)}`);
  }
  if (password !== confirmPassword) {
    redirect(`/patient/login?mode=signup&error=password-mismatch&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/patient/login?mode=signup&error=signup&next=${encodeURIComponent(next)}`);
  }

  await trackProductEvent({
    eventName: "patient_registered",
    surface: "patient",
    actorType: "patient",
    actorUserId: data.user?.id ?? null,
  });

  if (data.session) {
    redirect(next);
  }

  redirect(`/patient/login?created=1&next=${encodeURIComponent(next)}`);
}

export async function signInStaffWithPassword(formData: FormData) {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!validEmail(email) || !password) {
    redirect("/staff/login?error=invalid-credentials");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/staff/login?error=password");
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff_profiles")
    .select("user_id,is_active")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (staffError || !staff) {
    await supabase.auth.signOut();
    redirect("/staff/login?error=not-authorized");
  }

  redirect("/clinic");
}

export async function requestPasswordReset(formData: FormData) {
  const email = readEmail(formData);
  const audienceValue = formData.get("audience");
  const audience = audienceValue === "staff" ? "staff" : "patient";
  const loginPath = audience === "staff" ? "/staff/login" : "/patient/login";

  if (!validEmail(email)) {
    redirect(`${loginPath}?error=invalid-email`);
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(`/auth/update-password?audience=${audience}`)}`,
  });

  if (error) {
    redirect(`${loginPath}?error=reset`);
  }

  redirect(`${loginPath}?reset=sent`);
}

export async function updatePassword(formData: FormData) {
  const password = readPassword(formData);
  const confirmPasswordValue = formData.get("confirm_password");
  const confirmPassword = typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";
  const audience = formData.get("audience") === "staff" ? "staff" : "patient";

  if (!validPassword(password)) {
    redirect(`/auth/update-password?audience=${audience}&error=weak-password`);
  }
  if (password !== confirmPassword) {
    redirect(`/auth/update-password?audience=${audience}&error=password-mismatch`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(audience === "staff" ? "/staff/login?error=recovery-session" : "/patient/login?error=recovery-session");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/auth/update-password?audience=${audience}&error=update-password`);
  }

  if (audience === "staff") {
    const { data: staff } = await supabase
      .from("staff_profiles")
      .select("user_id,is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!staff) {
      await supabase.auth.signOut();
      redirect("/staff/login?error=not-authorized");
    }
    redirect("/clinic");
  }

  redirect("/patient");
}

export async function requestMagicLink(formData: FormData) {
  const email = readEmail(formData);
  const next = safeNext(formData.get("next"), "/patient");

  if (!validEmail(email)) {
    redirect(`/patient/login?error=invalid-email&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/patient/login?error=auth&next=${encodeURIComponent(next)}`);
  }

  redirect(`/patient/login?sent=1&next=${encodeURIComponent(next)}`);
}

export async function requestStaffMagicLink(formData: FormData) {
  const email = readEmail(formData);

  if (!validEmail(email)) {
    redirect("/staff/login?error=invalid-email");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/clinic")}`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    redirect("/staff/login?error=auth");
  }

  redirect("/staff/login?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
