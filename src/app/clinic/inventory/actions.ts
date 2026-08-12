"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

const ITEM_EDITORS = new Set(["owner", "admin", "implantologist", "dental_assistant"]);
const RECEIVERS = new Set(["owner", "admin", "implantologist", "receptionist", "dental_assistant"]);
const CLINICIANS = new Set(["owner", "admin", "implantologist", "doctor"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredPositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function createInventoryItem(formData: FormData) {
  const { supabase, staff } = await requireStaff();
  if (!ITEM_EDITORS.has(staff.role)) redirect("/clinic/inventory?error=role");

  const sku = text(formData, "sku");
  const category = text(formData, "category");
  const name = text(formData, "name");
  if (!sku || !category || !name) redirect("/clinic/inventory/catalog?error=required");

  const payload = {
    sku,
    category,
    name,
    brand: text(formData, "brand") || null,
    system: text(formData, "system") || null,
    manufacturer_reference: text(formData, "manufacturer_reference") || null,
    gtin: text(formData, "gtin") || null,
    diameter_mm: optionalNumber(text(formData, "diameter_mm")),
    length_mm: optionalNumber(text(formData, "length_mm")),
    connection: text(formData, "connection") || null,
    unit_of_measure: text(formData, "unit_of_measure") || "unit",
    min_stock: Math.max(0, Number.parseInt(text(formData, "min_stock") || "0", 10) || 0),
  };

  const { error } = await supabase.from("inventory_items").insert(payload);
  if (error) redirect("/clinic/inventory/catalog?error=create");

  revalidatePath("/clinic/inventory");
  revalidatePath("/clinic/inventory/catalog");
  redirect("/clinic/inventory/catalog?created=1");
}

export async function receiveInventory(formData: FormData) {
  const { supabase, staff } = await requireStaff();
  if (!RECEIVERS.has(staff.role)) redirect("/clinic/inventory?error=role");

  const itemId = text(formData, "item_id");
  const lotNumber = text(formData, "lot_number");
  const quantity = requiredPositiveInteger(text(formData, "quantity"));
  if (!validUuid(itemId) || !lotNumber || !quantity) redirect("/clinic/inventory/receive?error=required");

  const vendorId = text(formData, "vendor_id");
  const unitCost = optionalNumber(text(formData, "unit_cost"));
  const { error } = await supabase.rpc("receive_inventory_batch", {
    p_item_id: itemId,
    p_lot_number: lotNumber,
    p_quantity: quantity,
    p_expiry_date: text(formData, "expiry_date") || null,
    p_vendor_id: validUuid(vendorId) ? vendorId : null,
    p_unit_cost: unitCost,
    p_storage_location: text(formData, "storage_location") || null,
    p_scan_code: text(formData, "scan_code") || null,
    p_idempotency_key: null,
  });

  if (error) redirect(`/clinic/inventory/receive?error=${encodeURIComponent(error.message.slice(0, 80))}`);
  revalidatePath("/clinic/inventory");
  revalidatePath("/clinic/inventory/receive");
  redirect("/clinic/inventory/receive?received=1");
}

export async function placeImplant(formData: FormData) {
  const { supabase, staff } = await requireStaff();
  if (!CLINICIANS.has(staff.role)) redirect("/clinic/inventory?error=role");

  const batchId = text(formData, "batch_id");
  const caseId = text(formData, "case_id");
  const toothSite = text(formData, "tooth_site");
  if (!validUuid(batchId) || !validUuid(caseId) || !toothSite) redirect("/clinic/inventory/place?error=required");

  const { error } = await supabase.rpc("place_implant_from_inventory", {
    p_batch_id: batchId,
    p_case_id: caseId,
    p_tooth_site: toothSite,
    p_placement_date: text(formData, "placement_date") || new Date().toISOString().slice(0, 10),
    p_notes: text(formData, "notes") || null,
    p_idempotency_key: null,
  });

  if (error) redirect(`/clinic/inventory/place?error=${encodeURIComponent(error.message.slice(0, 80))}`);
  revalidatePath("/clinic/inventory");
  revalidatePath("/clinic/inventory/place");
  revalidatePath("/patient/passport");
  redirect("/clinic/inventory/place?placed=1");
}

export async function adjustInventory(formData: FormData) {
  const { supabase, staff } = await requireStaff();
  if (!ITEM_EDITORS.has(staff.role)) redirect("/clinic/inventory?error=role");

  const batchId = text(formData, "batch_id");
  const deltaRaw = Number.parseInt(text(formData, "quantity_delta"), 10);
  const movementType = text(formData, "movement_type");
  const reason = text(formData, "reason");
  if (!validUuid(batchId) || !Number.isInteger(deltaRaw) || deltaRaw === 0 || !movementType || !reason) {
    redirect("/clinic/inventory?error=adjustment");
  }

  const { error } = await supabase.rpc("adjust_inventory_batch", {
    p_batch_id: batchId,
    p_quantity_delta: deltaRaw,
    p_movement_type: movementType,
    p_reason: reason,
    p_idempotency_key: null,
  });

  if (error) redirect(`/clinic/inventory?error=${encodeURIComponent(error.message.slice(0, 80))}`);
  revalidatePath("/clinic/inventory");
  redirect("/clinic/inventory?adjusted=1");
}
