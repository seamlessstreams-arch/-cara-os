import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listContacts,
  createContact,
  updateContact,
  listLACReviews,
  createLACReview,
  updateLACReview,
  listMeetings,
  createMeeting,
  updateMeeting,
  PROFESSIONAL_ROLES,
  CONTACT_STATUSES,
  LAC_REVIEW_TYPES,
  CONTRIBUTION_METHODS,
  REVIEW_STATUSES,
  MEETING_TYPES,
  MEETING_STATUSES,
} from "@/lib/services/multi-agency-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "professional_roles") {
    return NextResponse.json({ ok: true, data: PROFESSIONAL_ROLES });
  }
  if (type === "contact_statuses") {
    return NextResponse.json({ ok: true, data: CONTACT_STATUSES });
  }
  if (type === "review_types") {
    return NextResponse.json({ ok: true, data: LAC_REVIEW_TYPES });
  }
  if (type === "contribution_methods") {
    return NextResponse.json({ ok: true, data: CONTRIBUTION_METHODS });
  }
  if (type === "review_statuses") {
    return NextResponse.json({ ok: true, data: REVIEW_STATUSES });
  }
  if (type === "meeting_types") {
    return NextResponse.json({ ok: true, data: MEETING_TYPES });
  }
  if (type === "meeting_statuses") {
    return NextResponse.json({ ok: true, data: MEETING_STATUSES });
  }

  // LAC Reviews
  if (type === "lac_reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listLACReviews(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      reviewType: (searchParams.get("reviewType") ?? undefined) as never,
      status: (searchParams.get("status") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Meetings
  if (type === "meetings") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMeetings(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      meetingType: (searchParams.get("meetingType") ?? undefined) as never,
      status: (searchParams.get("status") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Contacts (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listContacts(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    role: (searchParams.get("role") ?? undefined) as never,
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

    if (action === "create_contact") {
      const result = await createContact({
        homeId,
        childId: body.childId,
        childName: body.childName,
        professionalName: body.professionalName,
        role: body.role,
        organisation: body.organisation,
        email: body.email,
        phone: body.phone,
        isPrimaryContact: body.isPrimaryContact ?? false,
        relationshipStartDate: body.relationshipStartDate,
        lastContactDate: body.lastContactDate,
        nextContactDue: body.nextContactDue,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_contact") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateContact(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_lac_review") {
      const result = await createLACReview({
        homeId,
        childId: body.childId,
        childName: body.childName,
        reviewDate: body.reviewDate,
        reviewType: body.reviewType,
        chairedBy: body.chairedBy,
        venue: body.venue,
        childAttended: body.childAttended ?? false,
        childContributed: body.childContributed ?? false,
        contributionMethod: body.contributionMethod,
        carePlanAgreed: body.carePlanAgreed ?? false,
        placementConfirmed: body.placementConfirmed ?? false,
        keyDecisions: body.keyDecisions ?? [],
        actions: body.actions ?? [],
        nextReviewDate: body.nextReviewDate,
        nextReviewType: body.nextReviewType,
        homeReportSubmitted: body.homeReportSubmitted ?? false,
        homeReportSubmittedDate: body.homeReportSubmittedDate,
        status: body.status ?? "scheduled",
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_lac_review") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateLACReview(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_meeting") {
      const result = await createMeeting({
        homeId,
        childId: body.childId,
        childName: body.childName,
        meetingDate: body.meetingDate,
        meetingType: body.meetingType,
        purpose: body.purpose ?? "",
        location: body.location,
        attendees: body.attendees ?? [],
        apologies: body.apologies ?? [],
        homeRepresentative: body.homeRepresentative,
        keyDecisions: body.keyDecisions ?? [],
        actions: body.actions ?? [],
        followUpDate: body.followUpDate,
        followUpCompleted: body.followUpCompleted ?? false,
        status: body.status ?? "scheduled",
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_meeting") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateMeeting(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_contact, update_contact, create_lac_review, update_lac_review, create_meeting, or update_meeting" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
