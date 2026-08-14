import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_EVENTS = [
  "patient_registered",
  "patient_intake_completed",
  "patient_document_uploaded",
  "patient_message_sent",
  "treatment_plan_accepted",
  "treatment_plan_changes_requested",
  "booking_requested",
  "booking_confirmed",
  "booking_rescheduled",
  "booking_cancelled",
  "booking_completed",
  "payment_checkout_started",
  "payment_confirmed",
] as const;

type ProductEventName = (typeof PRODUCT_EVENTS)[number];
type ProductSurface = "public" | "patient" | "clinic";
type ActorType = "anonymous" | "patient" | "staff" | "system";

type TrackProductEventInput = {
  eventName: ProductEventName;
  surface: ProductSurface;
  actorType: ActorType;
  actorUserId?: string | null;
};

export async function trackProductEvent({ eventName, surface, actorType, actorUserId = null }: TrackProductEventInput) {
  try {
    const admin = createAdminClient();
    await admin.from("product_events").insert({
      event_name: eventName,
      surface,
      actor_type: actorType,
      actor_user_id: actorUserId,
    });
  } catch {
    // Analytics must never block a clinical, booking, payment, or portal workflow.
  }
}
