import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listStatements,
  createStatement,
  updateStatement,
  listReviews,
  createReview,
  listAmendments,
  createAmendment,
  DOCUMENT_STATUSES,
  REVIEW_OUTCOMES,
  AMENDMENT_TYPES,
  DISTRIBUTION_METHODS,
  SCHEDULE_SECTIONS,
} from "@/lib/services/statement-of-purpose-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "document_statuses") {
    return NextResponse.json({ ok: true, data: DOCUMENT_STATUSES });
  }
  if (type === "review_outcomes") {
    return NextResponse.json({ ok: true, data: REVIEW_OUTCOMES });
  }
  if (type === "amendment_types") {
    return NextResponse.json({ ok: true, data: AMENDMENT_TYPES });
  }
  if (type === "distribution_methods") {
    return NextResponse.json({ ok: true, data: DISTRIBUTION_METHODS });
  }
  if (type === "schedule_sections") {
    return NextResponse.json({ ok: true, data: SCHEDULE_SECTIONS });
  }

  // Reviews
  if (type === "reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listReviews(homeId, {
      statementId: searchParams.get("statementId") ?? undefined,
      outcome: (searchParams.get("outcome") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Amendments
  if (type === "amendments") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAmendments(homeId, {
      statementId: searchParams.get("statementId") ?? undefined,
      amendmentType: (searchParams.get("amendmentType") ?? undefined) as never,
      sectionAmended: (searchParams.get("sectionAmended") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Statements (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listStatements(homeId, {
    status: (searchParams.get("status") ?? undefined) as never,
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

    if (action === "create_statement") {
      const result = await createStatement({
        homeId,
        version: body.version,
        title: body.title,
        effectiveDate: body.effectiveDate,
        reviewDate: body.reviewDate,
        rangeOfNeeds: body.rangeOfNeeds,
        ethosAndPhilosophy: body.ethosAndPhilosophy,
        accommodationDetails: body.accommodationDetails,
        locationDetails: body.locationDetails,
        staffingStructure: body.staffingStructure,
        fireSafetyArrangements: body.fireSafetyArrangements,
        behaviourManagementApproach: body.behaviourManagementApproach,
        educationProvision: body.educationProvision,
        healthArrangements: body.healthArrangements,
        contactArrangements: body.contactArrangements,
        complaintsProcedure: body.complaintsProcedure,
        religiousCulturalNeeds: body.religiousCulturalNeeds,
        emergencyPlacementProcedure: body.emergencyPlacementProcedure,
        registeredManager: body.registeredManager,
        responsibleIndividual: body.responsibleIndividual,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_statement") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateStatement(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_review") {
      const result = await createReview({
        homeId,
        statementId: body.statementId,
        reviewDate: body.reviewDate,
        reviewerName: body.reviewerName,
        reviewerRole: body.reviewerRole,
        outcome: body.outcome,
        sectionsReviewed: body.sectionsReviewed,
        changesRequired: body.changesRequired,
        changesMade: body.changesMade,
        nextReviewDate: body.nextReviewDate,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_amendment") {
      const result = await createAmendment({
        homeId,
        statementId: body.statementId,
        amendmentDate: body.amendmentDate,
        amendmentType: body.amendmentType,
        amendedBy: body.amendedBy,
        sectionAmended: body.sectionAmended,
        previousContent: body.previousContent,
        newContent: body.newContent,
        reasonForChange: body.reasonForChange,
        approvedBy: body.approvedBy,
        ofstedNotified: body.ofstedNotified,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_statement, update_statement, create_review, or create_amendment" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
