import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlans,
  createPlan,
  updatePlan,
  listTests,
  createTest,
  PLAN_TYPES,
  PLAN_STATUSES,
  TEST_TYPES,
  TEST_OUTCOMES,
  RISK_LEVELS,
} from "@/lib/services/business-continuity-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "plan_types") {
    return NextResponse.json({ ok: true, data: PLAN_TYPES });
  }
  if (type === "plan_statuses") {
    return NextResponse.json({ ok: true, data: PLAN_STATUSES });
  }
  if (type === "test_types") {
    return NextResponse.json({ ok: true, data: TEST_TYPES });
  }
  if (type === "test_outcomes") {
    return NextResponse.json({ ok: true, data: TEST_OUTCOMES });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: RISK_LEVELS });
  }

  // Tests
  if (type === "tests") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listTests(homeId, {
      planId: searchParams.get("planId") ?? undefined,
      testType: searchParams.get("testType") ?? undefined,
      outcome: searchParams.get("outcome") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Plans (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPlans(homeId, {
    status: searchParams.get("status") ?? undefined,
    planType: searchParams.get("planType") ?? undefined,
    riskLevel: searchParams.get("riskLevel") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
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

    if (action === "create_plan") {
      const result = await createPlan({
        homeId,
        planType: body.planType,
        title: body.title,
        description: body.description ?? "",
        version: body.version,
        riskLevel: body.riskLevel ?? "medium",
        owner: body.owner,
        approvedBy: body.approvedBy,
        approvalDate: body.approvalDate,
        effectiveDate: body.effectiveDate,
        reviewDate: body.reviewDate,
        lastReviewedDate: body.lastReviewedDate,
        status: body.status ?? "draft",
        keyContacts: body.keyContacts,
        criticalFunctions: body.criticalFunctions,
        recoveryTimeObjectiveHours: body.recoveryTimeObjectiveHours,
        recoveryProcedures: body.recoveryProcedures ?? "",
        communicationPlan: body.communicationPlan,
        resourceRequirements: body.resourceRequirements,
        dependencies: body.dependencies,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_test") {
      const result = await createTest({
        homeId,
        planId: body.planId,
        testDate: body.testDate,
        testType: body.testType,
        conductedBy: body.conductedBy,
        participants: body.participants,
        scenario: body.scenario,
        outcome: body.outcome,
        findings: body.findings ?? "",
        actionsRequired: body.actionsRequired,
        lessonsLearned: body.lessonsLearned,
        nextTestDate: body.nextTestDate,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_plan, update_plan, or create_test" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
