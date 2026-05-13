import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPathwayPlans,
  createPathwayPlan,
  updatePathwayPlan,
  listIndependenceAssessments,
  createIndependenceAssessment,
  listEntitlements,
  createEntitlement,
  updateEntitlement,
  ACCOMMODATION_TYPES,
  EDUCATION_STATUS_OPTIONS,
  INDEPENDENCE_SKILL_AREAS,
  ENTITLEMENT_TYPES,
  PATHWAY_PLAN_STATUS,
} from "@/lib/services/leaving-care-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "accommodation_types") {
    return NextResponse.json({ ok: true, data: ACCOMMODATION_TYPES });
  }
  if (type === "education_statuses") {
    return NextResponse.json({ ok: true, data: EDUCATION_STATUS_OPTIONS });
  }
  if (type === "skill_areas") {
    return NextResponse.json({ ok: true, data: INDEPENDENCE_SKILL_AREAS });
  }
  if (type === "entitlement_types") {
    return NextResponse.json({ ok: true, data: ENTITLEMENT_TYPES });
  }
  if (type === "plan_statuses") {
    return NextResponse.json({ ok: true, data: PATHWAY_PLAN_STATUS });
  }

  // Independence assessments
  if (type === "assessments") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listIndependenceAssessments(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Entitlements
  if (type === "entitlements") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listEntitlements(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Pathway plans (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPathwayPlans(homeId, {
    childId: searchParams.get("childId") ?? undefined,
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

    if (action === "create_plan") {
      const result = await createPathwayPlan({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        plan_type: body.planType ?? "initial",
        status: body.status ?? "draft",
        start_date: body.startDate,
        target_leaving_date: body.targetLeavingDate,
        accommodation_plan: body.accommodationPlan ?? "",
        accommodation_type: body.accommodationType,
        education_training_plan: body.educationTrainingPlan ?? "",
        education_status: body.educationStatus,
        employment_plan: body.employmentPlan ?? "",
        financial_plan: body.financialPlan ?? "",
        benefit_entitlements: body.benefitEntitlements ?? [],
        health_plan: body.healthPlan ?? "",
        registered_gp: body.registeredGp ?? false,
        registered_dentist: body.registeredDentist ?? false,
        emotional_support_plan: body.emotionalSupportPlan ?? "",
        social_network: body.socialNetwork ?? [],
        life_skills_assessment: body.lifeSkillsAssessment ?? {},
        personal_advisor_name: body.personalAdvisorName,
        personal_advisor_contact: body.personalAdvisorContact,
        reviewed_by: body.reviewedBy,
        review_date: body.reviewDate,
        next_review_date: body.nextReviewDate,
        version: body.version ?? 1,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePathwayPlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_assessment") {
      const result = await createIndependenceAssessment({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        assessment_date: body.assessmentDate,
        assessed_by: body.assessedBy,
        skills: body.skills ?? [],
        overall_readiness_score: body.overallReadinessScore ?? 0,
        areas_of_strength: body.areasOfStrength ?? [],
        areas_needing_development: body.areasNeedingDevelopment ?? [],
        recommended_actions: body.recommendedActions ?? [],
        next_assessment_date: body.nextAssessmentDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_entitlement") {
      const result = await createEntitlement({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        entitlement_type: body.entitlementType,
        description: body.description ?? "",
        amount: body.amount ?? 0,
        frequency: body.frequency ?? "one_off",
        start_date: body.startDate,
        end_date: body.endDate,
        status: body.status ?? "pending",
        claimed_date: body.claimedDate,
        claimed_amount: body.claimedAmount,
        recorded_by: body.recordedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_entitlement") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateEntitlement(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_plan, update_plan, create_assessment, create_entitlement, or update_entitlement" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
