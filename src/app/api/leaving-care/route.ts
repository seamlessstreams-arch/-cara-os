// ══════════════════════════════════════════════════════════════════════════════
// API: /api/leaving-care
//
// Leaving Care Preparation Intelligence
//
// GET  — Returns leaving care assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateLeavingCareIntelligence,
  getSkillCategoryLabel,
  getSkillLevelLabel,
  getPathwayPlanStatusLabel,
  getAccommodationTypeLabel,
  getAccommodationStatusLabel,
  getSupportTypeLabel,
} from "@/lib/leaving-care";
import type {
  LeavingCareChild,
  PathwayPlan,
  IndependenceSkillAssessment,
  AccommodationPlan,
  SupportArrangement,
} from "@/lib/leaving-care";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_CHILDREN: LeavingCareChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    age: 14,
    placementStartDate: "2025-10-01",
    currentPlacement: true,
    isEligibleChild: false,
    isRelevantChild: false,
    hasPathwayPlan: false,
    keyWorkerId: "staff-sarah",
    keyWorkerName: "Sarah Johnson",
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    age: 13,
    placementStartDate: "2025-11-01",
    currentPlacement: true,
    isEligibleChild: false,
    isRelevantChild: false,
    hasPathwayPlan: false,
    keyWorkerId: "staff-tom",
    keyWorkerName: "Tom Richards",
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    age: 15,
    placementStartDate: "2026-01-10",
    currentPlacement: true,
    isEligibleChild: true,
    isRelevantChild: false,
    hasPathwayPlan: true,
    keyWorkerId: "staff-lisa",
    keyWorkerName: "Lisa Williams",
  },
];

const DEMO_PATHWAY_PLANS: PathwayPlan[] = [
  {
    id: "plan-morgan",
    childId: "child-morgan",
    status: "current",
    createdDate: "2026-01-15",
    lastReviewedDate: "2026-04-15",
    nextReviewDue: "2026-10-15",
    youngPersonInvolved: true,
    youngPersonViewsRecorded: true,
    personalAdviserAssigned: true,
    goalsSet: 8,
    goalsAchieved: 5,
    educationPlanIncluded: true,
    healthPlanIncluded: true,
    financePlanIncluded: true,
    accommodationPlanIncluded: true,
  },
];

const DEMO_ASSESSMENTS: IndependenceSkillAssessment[] = [
  // Morgan — comprehensive, most developed as oldest
  { id: "sk-m01", childId: "child-morgan", skill: "cooking", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
  { id: "sk-m02", childId: "child-morgan", skill: "budgeting", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
  { id: "sk-m03", childId: "child-morgan", skill: "cleaning", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
  { id: "sk-m04", childId: "child-morgan", skill: "laundry", currentLevel: "independent", previousLevel: "competent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
  { id: "sk-m05", childId: "child-morgan", skill: "shopping", currentLevel: "competent", previousLevel: "developing", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
  { id: "sk-m06", childId: "child-morgan", skill: "personal_hygiene", currentLevel: "independent", previousLevel: "competent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "independent" },
  { id: "sk-m07", childId: "child-morgan", skill: "using_public_transport", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
  { id: "sk-m08", childId: "child-morgan", skill: "managing_appointments", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
  { id: "sk-m09", childId: "child-morgan", skill: "basic_first_aid", currentLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "competent" },
  { id: "sk-m10", childId: "child-morgan", skill: "understanding_tenancy", currentLevel: "emerging", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", targetLevel: "developing" },
  // Alex — basic age-appropriate skills
  { id: "sk-a01", childId: "child-alex", skill: "cooking", currentLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "developing" },
  { id: "sk-a02", childId: "child-alex", skill: "cleaning", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "competent" },
  { id: "sk-a03", childId: "child-alex", skill: "personal_hygiene", currentLevel: "competent", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "independent" },
  { id: "sk-a04", childId: "child-alex", skill: "laundry", currentLevel: "emerging", assessedDate: "2026-03-15", assessedBy: "Sarah Johnson", targetLevel: "developing" },
  // Jordan — youngest, introductory
  { id: "sk-j01", childId: "child-jordan", skill: "cooking", currentLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "developing" },
  { id: "sk-j02", childId: "child-jordan", skill: "personal_hygiene", currentLevel: "developing", previousLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "competent" },
  { id: "sk-j03", childId: "child-jordan", skill: "cleaning", currentLevel: "emerging", assessedDate: "2026-03-20", assessedBy: "Tom Richards", targetLevel: "developing" },
];

const DEMO_ACCOMMODATION_PLANS: AccommodationPlan[] = [
  {
    id: "accom-morgan",
    childId: "child-morgan",
    preferredType: "staying_close",
    identifiedOption: "staying_close",
    status: "exploring",
    targetMoveDate: "2027-12-01",
    stayingPutAvailable: false,
    stayingCloseAvailable: true,
    transitionPlanInPlace: false,
    trialStayCompleted: false,
    localAreaPreference: "Within 5 miles of Chamberlain House",
  },
];

const DEMO_SUPPORT: SupportArrangement[] = [
  { id: "sup-m01", childId: "child-morgan", supportType: "personal_adviser", status: "active", providerName: "Jane Carter", startDate: "2026-01-20", frequency: "fortnightly", lastContactDate: "2026-05-10" },
  { id: "sup-m02", childId: "child-morgan", supportType: "mentor", status: "active", providerName: "David Park — Volunteer Mentor", startDate: "2026-02-01", frequency: "weekly", lastContactDate: "2026-05-12" },
  { id: "sup-m03", childId: "child-morgan", supportType: "education_support", status: "active", providerName: "Northfield College SENCO", startDate: "2026-01-10", frequency: "monthly" },
  { id: "sup-m04", childId: "child-morgan", supportType: "social_worker", status: "active", providerName: "David Williams SW", startDate: "2025-06-01", frequency: "monthly", lastContactDate: "2026-05-01" },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateLeavingCareIntelligence(
    DEMO_CHILDREN,
    DEMO_PATHWAY_PLANS,
    DEMO_ASSESSMENTS,
    DEMO_ACCOMMODATION_PLANS,
    DEMO_SUPPORT,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  const enrichedCategoryBreakdown = result.independenceSkills.categoryBreakdown.map((c) => ({
    ...c,
    skillLabel: getSkillCategoryLabel(c.skill),
  }));

  const enrichedProfiles = result.childProfiles.map((p) => ({
    ...p,
    pathwayPlanStatusLabel: p.pathwayPlanStatus
      ? getPathwayPlanStatusLabel(p.pathwayPlanStatus)
      : undefined,
    accommodationStatusLabel: p.accommodationStatus
      ? getAccommodationStatusLabel(p.accommodationStatus)
      : undefined,
    accommodationTypeLabel: p.accommodationType
      ? getAccommodationTypeLabel(p.accommodationType)
      : undefined,
  }));

  return NextResponse.json({
    data: {
      ...result,
      independenceSkills: {
        ...result.independenceSkills,
        categoryBreakdown: enrichedCategoryBreakdown,
      },
      childProfiles: enrichedProfiles,
      meta: {
        skillLevelLabels: Object.fromEntries(
          (["not_assessed", "emerging", "developing", "competent", "independent"] as const).map(
            (l) => [l, getSkillLevelLabel(l)],
          ),
        ),
        supportTypeLabels: Object.fromEntries(
          ([
            "personal_adviser", "mentor", "independent_visitor", "social_worker",
            "family_contact", "peer_support", "community_group",
            "education_support", "employment_support", "health_support",
          ] as const).map((t) => [t, getSupportTypeLabel(t)]),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    children,
    pathwayPlans,
    assessments,
    accommodationPlans,
    supportArrangements,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    children?: LeavingCareChild[];
    pathwayPlans?: PathwayPlan[];
    assessments?: IndependenceSkillAssessment[];
    accommodationPlans?: AccommodationPlan[];
    supportArrangements?: SupportArrangement[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json(
      { error: "children array is required and must not be empty" },
      { status: 400 },
    );
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateLeavingCareIntelligence(
    children,
    pathwayPlans ?? [],
    assessments ?? [],
    accommodationPlans ?? [],
    supportArrangements ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
