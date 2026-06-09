// ==============================================================================
// API: /api/aftercare-outcomes-tracking
//
// Aftercare Outcomes Tracking Intelligence
//
// GET  — Returns aftercare outcomes assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateAftercareOutcomesTrackingIntelligence,
  getLeavingReasonLabel,
  getHousingStatusLabel,
  getEmploymentEducationStatusLabel,
  getWellbeingRatingLabel,
  getContactFrequencyLabel,
  getContactMethodLabel,
  getServiceTypeLabel,
  getRatingLabel,
} from "@/lib/aftercare-outcomes-tracking";
import type {
  CareLeaverProfile,
  AftercareContact,
  OutcomeAssessment,
  SupportService,
} from "@/lib/aftercare-outcomes-tracking";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_LEAVERS: CareLeaverProfile[] = [
  {
    id: "cl-1",
    childId: "child-alex",
    childName: "Alex",
    dateOfBirth: "2008-03-15",
    leavingDate: "2025-11-18",
    leavingReason: "aged_out",
    currentAge: 18,
    housingStatus: "stable",
    employmentEducationStatus: "in_education",
    hasPathwayPlan: true,
    pathwayPlanReviewDate: "2026-05-01",
    personalAdviserAssigned: true,
    personalAdviserName: "Mark Thompson",
  },
  {
    id: "cl-2",
    childId: "child-jordan",
    childName: "Jordan",
    dateOfBirth: "2008-09-22",
    leavingDate: "2026-02-18",
    leavingReason: "placement_move",
    currentAge: 17,
    housingStatus: "temporary",
    employmentEducationStatus: "neet",
    hasPathwayPlan: true,
    pathwayPlanReviewDate: "2025-12-01",
    personalAdviserAssigned: true,
    personalAdviserName: "Sarah Johnson",
  },
];

const DEMO_CONTACTS: AftercareContact[] = [
  { id: "ac-1", childId: "child-alex", childName: "Alex", date: "2026-02-10", contactMethod: "phone", initiatedBy: "home", purpose: "Monthly wellbeing check-in", wellbeingRating: "stable", concernsRaised: false, followUpRequired: false, followUpCompleted: false },
  { id: "ac-2", childId: "child-alex", childName: "Alex", date: "2026-03-14", contactMethod: "visit", initiatedBy: "home", purpose: "Pathway plan review visit", wellbeingRating: "stable", concernsRaised: false, followUpRequired: false, followUpCompleted: false },
  { id: "ac-3", childId: "child-alex", childName: "Alex", date: "2026-04-18", contactMethod: "phone", initiatedBy: "child", purpose: "Alex called for advice on college application", wellbeingRating: "thriving", concernsRaised: false, followUpRequired: false, followUpCompleted: false },
  { id: "ac-4", childId: "child-jordan", childName: "Jordan", date: "2026-03-20", contactMethod: "phone", initiatedBy: "home", purpose: "Wellbeing check-in", wellbeingRating: "struggling", concernsRaised: true, followUpRequired: true, followUpCompleted: true },
  { id: "ac-5", childId: "child-jordan", childName: "Jordan", date: "2026-04-15", contactMethod: "video", initiatedBy: "adviser", purpose: "Housing support discussion", wellbeingRating: "struggling", concernsRaised: true, followUpRequired: true, followUpCompleted: false },
  { id: "ac-6", childId: "child-jordan", childName: "Jordan", date: "2026-05-10", contactMethod: "visit", initiatedBy: "home", purpose: "Face-to-face wellbeing check", wellbeingRating: "stable", concernsRaised: false, followUpRequired: false, followUpCompleted: false },
];

const DEMO_ASSESSMENTS: OutcomeAssessment[] = [
  { id: "oa-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", housingStable: true, educationEmploymentEngaged: true, mentalHealthSupported: true, physicalHealthRegistered: true, financiallyCapable: true, socialNetworkPresent: true, overallWellbeing: "stable" },
  { id: "oa-2", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-15", housingStable: false, educationEmploymentEngaged: false, mentalHealthSupported: true, physicalHealthRegistered: true, financiallyCapable: false, socialNetworkPresent: false, overallWellbeing: "struggling" },
];

const DEMO_SERVICES: SupportService[] = [
  { id: "ss-1", childId: "child-alex", childName: "Alex", serviceType: "education", referralDate: "2025-12-01", accessedService: true, serviceOngoing: true },
  { id: "ss-2", childId: "child-jordan", childName: "Jordan", serviceType: "housing", referralDate: "2026-03-01", accessedService: true, serviceOngoing: true },
  { id: "ss-3", childId: "child-jordan", childName: "Jordan", serviceType: "employment", referralDate: "2026-03-15", accessedService: false, serviceOngoing: false },
  { id: "ss-4", childId: "child-jordan", childName: "Jordan", serviceType: "mental_health", referralDate: "2026-04-01", accessedService: true, serviceOngoing: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateAftercareOutcomesTrackingIntelligence(
    DEMO_LEAVERS,
    DEMO_CONTACTS,
    DEMO_ASSESSMENTS,
    DEMO_SERVICES,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        leavingReasonLabels: Object.fromEntries(
          (["aged_out", "reunification", "adoption", "placement_move", "independent_living", "other"] as const).map(
            (v) => [v, getLeavingReasonLabel(v)],
          ),
        ),
        housingStatusLabels: Object.fromEntries(
          (["stable", "temporary", "homeless", "supported_housing", "returned_home", "unknown"] as const).map(
            (v) => [v, getHousingStatusLabel(v)],
          ),
        ),
        employmentEducationStatusLabels: Object.fromEntries(
          (["employed", "in_education", "training", "neet", "volunteering", "unknown"] as const).map(
            (v) => [v, getEmploymentEducationStatusLabel(v)],
          ),
        ),
        wellbeingRatingLabels: Object.fromEntries(
          (["thriving", "stable", "struggling", "crisis", "unknown"] as const).map(
            (v) => [v, getWellbeingRatingLabel(v)],
          ),
        ),
        contactFrequencyLabels: Object.fromEntries(
          (["weekly", "fortnightly", "monthly", "quarterly", "none"] as const).map(
            (v) => [v, getContactFrequencyLabel(v)],
          ),
        ),
        contactMethodLabels: Object.fromEntries(
          (["visit", "phone", "video", "text", "email"] as const).map(
            (v) => [v, getContactMethodLabel(v)],
          ),
        ),
        serviceTypeLabels: Object.fromEntries(
          (["housing", "education", "employment", "mental_health", "financial", "social", "legal"] as const).map(
            (v) => [v, getServiceTypeLabel(v)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { leavers, contacts, assessments, services, homeId, periodStart, periodEnd } = body as {
    leavers?: CareLeaverProfile[];
    contacts?: AftercareContact[];
    assessments?: OutcomeAssessment[];
    services?: SupportService[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateAftercareOutcomesTrackingIntelligence(
    leavers ?? [],
    contacts ?? [],
    assessments ?? [],
    services ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
