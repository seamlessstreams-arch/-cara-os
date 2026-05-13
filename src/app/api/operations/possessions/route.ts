import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPossessions,
  createPossession,
  updatePossession,
  listMoneyRecords,
  createMoneyRecord,
  POSSESSION_CATEGORIES,
  POSSESSION_STATUS,
  CONDITION_OPTIONS,
} from "@/lib/services/possessions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: POSSESSION_CATEGORIES });
  }
  if (type === "statuses") {
    return NextResponse.json({ ok: true, data: POSSESSION_STATUS });
  }
  if (type === "conditions") {
    return NextResponse.json({ ok: true, data: CONDITION_OPTIONS });
  }

  // Money records
  if (type === "money") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMoneyRecords(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Possessions (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPossessions(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_possession") {
      const result = await createPossession({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        item_description: body.itemDescription,
        category: body.category,
        estimated_value: body.estimatedValue,
        condition_on_arrival: body.conditionOnArrival ?? "good",
        condition_on_departure: body.conditionOnDeparture,
        stored_location: body.storedLocation,
        photo_reference: body.photoReference,
        recorded_date: body.recordedDate,
        recorded_by: body.recordedBy,
        child_signed: body.childSigned ?? false,
        staff_signed: body.staffSigned ?? false,
        status: body.status ?? "with_child",
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_possession") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePossession(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_money_record") {
      const result = await createMoneyRecord({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        transaction_type: body.transactionType,
        amount: body.amount,
        description: body.description,
        balance_after: body.balanceAfter,
        recorded_date: body.recordedDate,
        recorded_by: body.recordedBy,
        child_signed: body.childSigned ?? false,
        receipt_reference: body.receiptReference,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_possession, update_possession, or create_money_record" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
