import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  recordAdministration,
  listMAREntries,
  recordMedicationError,
  listMedicationErrors,
  MEDICATION_TYPES,
  ADMINISTRATION_OUTCOMES,
  MEDICATION_ROUTES,
  ERROR_CATEGORIES,
} from "@/lib/services/medication-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "medication_types") {
    return NextResponse.json({ ok: true, data: MEDICATION_TYPES });
  }
  if (type === "outcomes") {
    return NextResponse.json({ ok: true, data: ADMINISTRATION_OUTCOMES });
  }
  if (type === "routes") {
    return NextResponse.json({ ok: true, data: MEDICATION_ROUTES });
  }
  if (type === "error_categories") {
    return NextResponse.json({ ok: true, data: ERROR_CATEGORIES });
  }

  // MAR entries
  if (type === "mar") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMAREntries(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      prescriptionId: searchParams.get("prescriptionId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Medication errors
  if (type === "errors") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMedicationErrors(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single prescription
  const id = searchParams.get("id");
  if (id) {
    const result = await getPrescription(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List prescriptions
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPrescriptions(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    medicationType: searchParams.get("medicationType") ?? undefined,
    activeOnly: searchParams.get("activeOnly") !== "false",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_prescription") {
      const result = await createPrescription({
        home_id: homeId,
        child_id: body.childId,
        medication_name: body.medicationName,
        dosage: body.dosage,
        frequency: body.frequency,
        route: body.route,
        medication_type: body.medicationType,
        prescriber: body.prescriber,
        pharmacy: body.pharmacy ?? "",
        start_date: body.startDate,
        end_date: body.endDate,
        special_instructions: body.specialInstructions,
        requires_witness: body.requiresWitness ?? false,
        stock_count: body.stockCount,
        last_stock_check: body.lastStockCheck,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_prescription") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePrescription(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "administer") {
      const result = await recordAdministration({
        prescription_id: body.prescriptionId,
        child_id: body.childId,
        home_id: homeId,
        scheduled_time: body.scheduledTime,
        administered_at: body.administeredAt,
        administered_by: body.administeredBy,
        witnessed_by: body.witnessedBy,
        outcome: body.outcome,
        dosage_given: body.dosageGiven,
        stock_before: body.stockBefore,
        stock_after: body.stockAfter,
        prn_rationale: body.prnRationale,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "report_error") {
      const result = await recordMedicationError({
        home_id: homeId,
        child_id: body.childId,
        prescription_id: body.prescriptionId,
        error_category: body.errorCategory,
        severity: body.severity,
        description: body.description,
        action_taken: body.actionTaken ?? "",
        reported_by: body.reportedBy,
        reported_to_manager: body.reportedToManager ?? false,
        ofsted_notified: body.ofstedNotified ?? false,
        parent_notified: body.parentNotified ?? false,
        prescriber_notified: body.prescriberNotified ?? false,
        outcome: body.outcome ?? "",
        date_occurred: body.dateOccurred,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_prescription, update_prescription, administer, or report_error" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
