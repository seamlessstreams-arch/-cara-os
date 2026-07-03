import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listProfiles,
  createProfile,
  updateProfile,
  listActions,
  createAction,
  IDENTITY_ACTION_TYPES,
  CHILD_SATISFACTION_LEVELS,
  PROTECTED_CHARACTERISTICS,
  COMMON_DIETARY_REQUIREMENTS,
} from "@/lib/services/cultural-identity-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "action_types") {
    return NextResponse.json({ ok: true, data: IDENTITY_ACTION_TYPES });
  }
  if (type === "satisfaction_levels") {
    return NextResponse.json({ ok: true, data: CHILD_SATISFACTION_LEVELS });
  }
  if (type === "protected_characteristics") {
    return NextResponse.json({ ok: true, data: PROTECTED_CHARACTERISTICS });
  }
  if (type === "dietary_requirements") {
    return NextResponse.json({ ok: true, data: COMMON_DIETARY_REQUIREMENTS });
  }

  // Actions
  if (type === "actions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listActions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      actionType: (searchParams.get("actionType") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Profiles (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listProfiles(homeId, {
    childId: searchParams.get("childId") ?? undefined,
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

    if (action === "create_profile") {
      const result = await createProfile({
        homeId,
        childId: body.childId,
        childName: body.childName,
        ethnicity: body.ethnicity,
        religion: body.religion,
        firstLanguage: body.firstLanguage,
        additionalLanguages: body.additionalLanguages ?? [],
        culturalNeeds: body.culturalNeeds ?? "",
        dietaryRequirements: body.dietaryRequirements ?? "",
        religiousPractices: body.religiousPractices ?? "",
        identityNeeds: body.identityNeeds ?? "",
        hairSkinCareNeeds: body.hairSkinCareNeeds ?? "",
        clothingPreferences: body.clothingPreferences ?? "",
        festivalsCelebrated: body.festivalsCelebrated ?? [],
        communityLinks: body.communityLinks ?? [],
        childViewsOnIdentity: body.childViewsOnIdentity,
        supportPlan: body.supportPlan ?? "",
        lastReviewedDate: body.lastReviewedDate,
        reviewedBy: body.reviewedBy,
        nextReviewDate: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_profile") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateProfile(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_action") {
      const result = await createAction({
        homeId,
        childId: body.childId,
        childName: body.childName,
        actionDate: body.actionDate,
        recordedBy: body.recordedBy,
        actionType: body.actionType,
        description: body.description ?? "",
        outcome: body.outcome,
        childFeedback: body.childFeedback,
        childSatisfaction: body.childSatisfaction,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_profile, update_profile, or create_action" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
