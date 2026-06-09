// ==============================================================================
// API: /api/health-screening-compliance
//
// Health Screening Compliance Intelligence
//
// GET  — Returns health screening assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateHealthScreeningComplianceIntelligence,
  getScreeningTypeLabel,
  getScreeningStatusLabel,
  getScreeningOutcomeLabel,
  getGPRegistrationStatusLabel,
  getConsentStatusLabel,
  getRatingLabel,
} from "@/lib/health-screening-compliance";
import type {
  HealthScreeningRecord,
  GPRegistration,
  HealthActionPlan,
  HealthTraining,
} from "@/lib/health-screening-compliance";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_SCREENINGS: HealthScreeningRecord[] = [
  // Alex — all on time, good outcomes
  { id: "hs-a1", childId: "child-alex", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-02-15", completedDate: "2026-02-15", outcome: "no_concerns", provider: "NHS Community Dental", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  { id: "hs-a2", childId: "child-alex", childName: "Alex", screeningType: "optical_check", status: "completed_on_time", scheduledDate: "2026-03-10", completedDate: "2026-03-10", outcome: "minor_concerns", provider: "Specsavers", consentStatus: "consent_given", referralMade: true, referralFollowedUp: true, documentedInCareFile: true },
  { id: "hs-a3", childId: "child-alex", childName: "Alex", screeningType: "annual_health_assessment", status: "completed_on_time", scheduledDate: "2026-01-20", completedDate: "2026-01-20", outcome: "no_concerns", provider: "LAC Nurse Team", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  { id: "hs-a4", childId: "child-alex", childName: "Alex", screeningType: "immunisation", status: "completed_on_time", scheduledDate: "2026-04-01", completedDate: "2026-04-01", outcome: "no_concerns", provider: "GP Surgery", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  // Jordan — some late, one overdue
  { id: "hs-j1", childId: "child-jordan", childName: "Jordan", screeningType: "dental_check", status: "completed_late", scheduledDate: "2026-02-01", completedDate: "2026-02-20", outcome: "treatment_required", provider: "NHS Community Dental", consentStatus: "consent_given", referralMade: true, referralFollowedUp: true, documentedInCareFile: true },
  { id: "hs-j2", childId: "child-jordan", childName: "Jordan", screeningType: "mental_health_screening", status: "completed_on_time", scheduledDate: "2026-03-15", completedDate: "2026-03-15", outcome: "referral_made", provider: "CAMHS Liaison", consentStatus: "gillick_competent", referralMade: true, referralFollowedUp: true, documentedInCareFile: true },
  { id: "hs-j3", childId: "child-jordan", childName: "Jordan", screeningType: "optical_check", status: "overdue", scheduledDate: "2026-04-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
  // Morgan — good compliance
  { id: "hs-m1", childId: "child-morgan", childName: "Morgan", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-02-10", completedDate: "2026-02-10", outcome: "no_concerns", provider: "NHS Community Dental", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  { id: "hs-m2", childId: "child-morgan", childName: "Morgan", screeningType: "annual_health_assessment", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "LAC Nurse Team", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  { id: "hs-m3", childId: "child-morgan", childName: "Morgan", screeningType: "hearing_test", status: "completed_on_time", scheduledDate: "2026-04-15", completedDate: "2026-04-15", outcome: "no_concerns", provider: "Audiology", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
];

const DEMO_REGISTRATIONS: GPRegistration[] = [
  { id: "gp-a", childId: "child-alex", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Oak Lane Surgery", registeredDate: "2025-09-01", lastAppointment: "2026-04-01", namedNurse: true, healthPassportUpToDate: true },
  { id: "gp-j", childId: "child-jordan", childName: "Jordan", gpRegistrationStatus: "registered", gpPractice: "Oak Lane Surgery", registeredDate: "2025-11-15", lastAppointment: "2026-03-15", namedNurse: true, healthPassportUpToDate: true },
  { id: "gp-m", childId: "child-morgan", childName: "Morgan", gpRegistrationStatus: "registered", gpPractice: "Riverside Medical Centre", registeredDate: "2025-10-01", lastAppointment: "2026-03-01", namedNurse: false, healthPassportUpToDate: true },
];

const DEMO_PLANS: HealthActionPlan[] = [
  { id: "hp-a", childId: "child-alex", childName: "Alex", planDate: "2026-01-20", reviewDate: "2026-04-20", healthNeedsIdentified: 2, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 8 },
  { id: "hp-j", childId: "child-jordan", childName: "Jordan", planDate: "2026-02-01", reviewDate: "2026-05-01", healthNeedsIdentified: 4, healthNeedsAddressed: 3, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 18 },
  { id: "hp-m", childId: "child-morgan", childName: "Morgan", planDate: "2026-03-01", reviewDate: "2026-06-01", healthNeedsIdentified: 1, healthNeedsAddressed: 1, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 6 },
];

const DEMO_TRAINING: HealthTraining[] = [
  { id: "ht-dl", staffId: "staff-darren", staffName: "Darren Laville", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
  { id: "ht-sj", staffId: "staff-sarah", staffName: "Sarah Johnson", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: false, allergyAwareness: true, healthPromotionTrained: true },
  { id: "ht-tr", staffId: "staff-tom", staffName: "Tom Richards", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: false, epilepsyTrained: false, allergyAwareness: true, healthPromotionTrained: false },
  { id: "ht-lw", staffId: "staff-lisa", staffName: "Lisa Williams", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateHealthScreeningComplianceIntelligence(
    DEMO_SCREENINGS,
    DEMO_REGISTRATIONS,
    DEMO_PLANS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        screeningTypeLabels: Object.fromEntries(
          (["dental_check", "optical_check", "hearing_test", "immunisation", "developmental_check", "annual_health_assessment", "initial_health_assessment", "review_health_assessment", "mental_health_screening", "sexual_health"] as const).map(
            (t) => [t, getScreeningTypeLabel(t)],
          ),
        ),
        screeningStatusLabels: Object.fromEntries(
          (["completed_on_time", "completed_late", "overdue", "scheduled", "declined", "not_applicable"] as const).map(
            (s) => [s, getScreeningStatusLabel(s)],
          ),
        ),
        screeningOutcomeLabels: Object.fromEntries(
          (["no_concerns", "minor_concerns", "referral_made", "treatment_required", "follow_up_needed", "awaiting_results"] as const).map(
            (o) => [o, getScreeningOutcomeLabel(o)],
          ),
        ),
        gpRegistrationLabels: Object.fromEntries(
          (["registered", "pending_registration", "not_registered", "transferring"] as const).map(
            (g) => [g, getGPRegistrationStatusLabel(g)],
          ),
        ),
        consentStatusLabels: Object.fromEntries(
          (["consent_given", "consent_refused", "gillick_competent", "awaiting_consent", "delegated_authority"] as const).map(
            (c) => [c, getConsentStatusLabel(c)],
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

  const { screenings, registrations, plans, training, homeId, periodStart, periodEnd } = body as {
    screenings?: HealthScreeningRecord[];
    registrations?: GPRegistration[];
    plans?: HealthActionPlan[];
    training?: HealthTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateHealthScreeningComplianceIntelligence(
    screenings ?? [],
    registrations ?? [],
    plans ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
