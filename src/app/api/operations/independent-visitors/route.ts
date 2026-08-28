import { readJsonBody } from "@/lib/http/read-json";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAssignments,
  createAssignment,
  updateAssignment,
  listVisits,
  createVisit,
  ASSIGNMENT_REASONS,
  VISIT_FREQUENCIES,
  ASSIGNMENT_STATUSES,
  VISIT_TYPES,
} from "@/lib/services/independent-visitors-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "assignment_reasons") {
    return NextResponse.json({ ok: true, data: ASSIGNMENT_REASONS });
  }
  if (type === "visit_frequencies") {
    return NextResponse.json({ ok: true, data: VISIT_FREQUENCIES });
  }
  if (type === "assignment_statuses") {
    return NextResponse.json({ ok: true, data: ASSIGNMENT_STATUSES });
  }
  if (type === "visit_types") {
    return NextResponse.json({ ok: true, data: VISIT_TYPES });
  }

  // Visits
  if (type === "visits") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listVisits(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      assignmentId: searchParams.get("assignmentId") ?? undefined,
      visitType: (searchParams.get("visitType") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Assignments (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listAssignments(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: (searchParams.get("status") ?? undefined) as never,
    assignmentReason: (searchParams.get("reason") ?? undefined) as never,
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

    // Judgements about what happened, not settings with a sensible default.
    // Each used to fall back to the compliant answer, so a partial POST built a
    // record asserting something nobody had stated. Checked here, before the
    // storage check: whether a request is complete does not depend on whether
    // Supabase happens to be configured.
    const CLAIM_FIELDS: Record<string, readonly string[]> = {
      create_visit: ["childAttended"],
    };
    const __claims = requireFields(body, CLAIM_FIELDS[String(action)] ?? []);
    if (__claims) return __claims;

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_assignment") {
      const result = await createAssignment({
        homeId,
        childId: body.childId,
        childName: body.childName,
        visitorName: body.visitorName,
        visitorOrganisation: body.visitorOrganisation,
        visitorContact: body.visitorContact,
        dbsCheckDate: body.dbsCheckDate,
        dbsReference: body.dbsReference,
        assignmentDate: body.assignmentDate,
        assignmentReason: body.assignmentReason,
        visitFrequency: body.visitFrequency ?? "monthly",
        nextVisitDue: body.nextVisitDue,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_assignment") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAssignment(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_visit") {
      const result = await createVisit({
        homeId,
        childId: body.childId,
        childName: body.childName,
        assignmentId: body.assignmentId,
        visitDate: body.visitDate,
        visitDurationMinutes: body.visitDurationMinutes,
        visitType: body.visitType,
        visitorName: body.visitorName,
        location: body.location,
        childAttended: body.childAttended,
        childViews: body.childViews,
        topicsDiscussed: body.topicsDiscussed ?? [],
        concernsRaised: body.concernsRaised ?? false,
        concernDetails: body.concernDetails,
        concernsEscalated: body.concernsEscalated ?? false,
        escalatedTo: body.escalatedTo,
        childWishesRecorded: body.childWishesRecorded ?? false,
        childWishes: body.childWishes,
        nextVisitDate: body.nextVisitDate,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_assignment, update_assignment, or create_visit" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
