import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listGuides,
  createGuide,
  updateGuide,
  listDistributions,
  createDistribution,
  listFeedback,
  createFeedback,
  GUIDE_STATUSES,
  ACCESSIBILITY_FORMATS,
  GUIDE_SECTIONS,
  FEEDBACK_RATINGS,
  REQUIRED_SECTIONS,
} from "@/lib/services/childrens-guide-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "guide_statuses") {
    return NextResponse.json({ ok: true, data: GUIDE_STATUSES });
  }
  if (type === "accessibility_formats") {
    return NextResponse.json({ ok: true, data: ACCESSIBILITY_FORMATS });
  }
  if (type === "guide_sections") {
    return NextResponse.json({ ok: true, data: GUIDE_SECTIONS });
  }
  if (type === "feedback_ratings") {
    return NextResponse.json({ ok: true, data: FEEDBACK_RATINGS });
  }
  if (type === "required_sections") {
    return NextResponse.json({ ok: true, data: REQUIRED_SECTIONS });
  }

  // Distributions
  if (type === "distributions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listDistributions(homeId, {
      guideId: searchParams.get("guideId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Feedback
  if (type === "feedback") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listFeedback(homeId, {
      guideId: searchParams.get("guideId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      rating: (searchParams.get("rating") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Guides (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listGuides(homeId, {
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

    if (action === "create_guide") {
      const result = await createGuide({
        homeId,
        version: body.version,
        title: body.title,
        effectiveDate: body.effectiveDate,
        reviewDate: body.reviewDate,
        sectionsIncluded: body.sectionsIncluded,
        formatsAvailable: body.formatsAvailable,
        languagesAvailable: body.languagesAvailable,
        ageRangeMinimum: body.ageRangeMinimum,
        ageRangeMaximum: body.ageRangeMaximum,
        keyContacts: body.keyContacts,
        ofstedContact: body.ofstedContact,
        childrensCommissionerContact: body.childrensCommissionerContact,
        advocacyServiceContact: body.advocacyServiceContact,
        complaintsSummary: body.complaintsSummary,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_guide") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateGuide(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_distribution") {
      const result = await createDistribution({
        homeId,
        guideId: body.guideId,
        childId: body.childId,
        childName: body.childName,
        distributionDate: body.distributionDate,
        formatProvided: body.formatProvided,
        languageProvided: body.languageProvided,
        distributedBy: body.distributedBy,
        childConfirmedReceipt: body.childConfirmedReceipt,
        childConfirmedUnderstanding: body.childConfirmedUnderstanding,
        discussedWithChild: body.discussedWithChild,
        discussionDate: body.discussionDate,
        discussedBy: body.discussedBy,
        followUpNeeded: body.followUpNeeded,
        followUpNotes: body.followUpNotes,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_feedback") {
      const result = await createFeedback({
        homeId,
        guideId: body.guideId,
        childId: body.childId,
        childName: body.childName,
        feedbackDate: body.feedbackDate,
        rating: body.rating,
        whatWasHelpful: body.whatWasHelpful,
        whatCouldImprove: body.whatCouldImprove,
        sectionsFoundConfusing: body.sectionsFoundConfusing,
        suggestions: body.suggestions,
        collectedBy: body.collectedBy,
        actionTaken: body.actionTaken,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_guide, update_guide, create_distribution, or create_feedback" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
