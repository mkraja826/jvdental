import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedKinds = new Set(["clinic_consultation", "video_consultation"]);
const allowedWindows = new Set(["morning", "afternoon", "evening"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingKind = String(body.bookingKind ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const city = String(body.city ?? "").trim() || null;
    const preferredDate = String(body.preferredDate ?? "");
    const preferredTimeWindow = String(body.preferredTimeWindow ?? "");
    const dentalConcern = String(body.dentalConcern ?? "").trim() || null;

    if (!allowedKinds.has(bookingKind) || !allowedWindows.has(preferredTimeWindow) || !fullName || !phone || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json({ error: "Please complete the required booking details." }, { status: 400 });
    }

    if (fullName.length > 120 || phone.length > 30 || (email && email.length > 180) || (city && city.length > 100) || (dentalConcern && dentalConcern.length > 1500)) {
      return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("appointment_requests")
      .insert({
        booking_kind: bookingKind,
        full_name: fullName,
        phone,
        email,
        city,
        preferred_date: preferredDate,
        preferred_time_window: preferredTimeWindow,
        dental_concern: dentalConcern,
      })
      .select("id,status")
      .single();

    if (error) throw error;

    return NextResponse.json({ requestId: data.id, status: data.status });
  } catch (error) {
    console.error("booking request failed", error);
    return NextResponse.json({ error: "Booking could not be submitted right now." }, { status: 500 });
  }
}
