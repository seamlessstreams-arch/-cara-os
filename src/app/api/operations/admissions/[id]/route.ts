import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  getAdmissionWorkflow, updateAdmissionWorkflow,
  advancePhase, withdrawWorkflow,
  getChecklistItems, completeChecklistItem, addChecklistItem,
  getMatchingFactors, addMatchingFactor,
  createYoungPersonFromWorkflow,
  generateCaraMatchingFactors,
} from "@/lib/services/yp-admission-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: null, persisted: false });
  }

  // Checklist items
  if (type === "checklist") {
    const result = await getChecklistItems(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Matching factors
  if (type === "matching") {
    const result = await getMatchingFactors(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Full workflow with history, checklist, factors
  const result = await getAdmissionWorkflow(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    // Phase advance
    if (action === "advance_phase") {
      const { toPhase, userId, reason, notes } = body;
      if (!toPhase || !userId) {
        return NextResponse.json({ error: "toPhase and userId required" }, { status: 400 });
      }
      const result = await advancePhase(id, toPhase, userId, { reason, notes });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Withdraw
    if (action === "withdraw") {
      const { userId, reason } = body;
      if (!userId || !reason) {
        return NextResponse.json({ error: "userId and reason required" }, { status: 400 });
      }
      const result = await withdrawWorkflow(id, userId, reason);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Complete checklist item
    if (action === "complete_checklist") {
      const { itemId, userId, evidenceRef, notes } = body;
      if (!itemId || !userId) {
        return NextResponse.json({ error: "itemId and userId required" }, { status: 400 });
      }
      const result = await completeChecklistItem(itemId, userId, { evidenceRef, notes });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Add checklist item
    if (action === "add_checklist") {
      const { category, itemText, isMandatory } = body;
      if (!category || !itemText) {
        return NextResponse.json({ error: "category and itemText required" }, { status: 400 });
      }
      const result = await addChecklistItem(id, { category, itemText, isMandatory });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Add matching factor
    if (action === "add_matching_factor") {
      const { factorType, score, rationale, riskLevel, mitigations, assessedBy } = body;
      if (!factorType || !score || !rationale) {
        return NextResponse.json({ error: "factorType, score, rationale required" }, { status: 400 });
      }
      const result = await addMatchingFactor(id, { factorType, score, rationale, riskLevel, mitigations, assessedBy });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Cara matching analysis
    if (action === "aria_matching") {
      const { incomingChild, currentYoungPeople, homeCapacity } = body;
      if (!incomingChild || !homeCapacity) {
        return NextResponse.json({ error: "incomingChild and homeCapacity required" }, { status: 400 });
      }
      const analysis = generateCaraMatchingFactors({
        incomingChild,
        currentYoungPeople: currentYoungPeople ?? [],
        homeCapacity,
      });
      return NextResponse.json({ ok: true, data: analysis });
    }

    // Create young person profile
    if (action === "create_yp") {
      const { userId, keyWorkerId, secondaryWorkerId, placementStart } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
      }
      const result = await createYoungPersonFromWorkflow(id, userId, { keyWorkerId, secondaryWorkerId, placementStart });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Default: update workflow fields
    const updates = { ...body };
    delete updates.action;
    const result = await updateAdmissionWorkflow(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
