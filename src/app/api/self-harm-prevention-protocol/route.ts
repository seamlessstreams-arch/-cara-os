// ==============================================================================
// API: /api/self-harm-prevention-protocol
//
// Self-Harm Prevention Protocol Intelligence
//
// GET  — Returns self-harm prevention assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateSelfHarmPreventionProtocolIntelligence,
  getRiskLevelLabel,
  getSelfHarmTypeLabel,
  getInterventionOutcomeLabel,
  getSafetyPlanStatusLabel,
  getRatingLabel,
} from "@/lib/self-harm-prevention-protocol";
import type {
  ChildRiskProfile,
  SelfHarmIncident,
  EnvironmentalSafetyCheck,
  StaffSelfHarmTraining,
} from "@/lib/self-harm-prevention-protocol";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PROFILES: ChildRiskProfile[] = [
  {
    id: "rp-1",
    childId: "child-alex",
    childName: "Alex",
    riskLevel: "low",
    assessmentDate: "2026-04-01",
    assessedBy: "Darren Laville",
    reviewDate: "2026-05-01",
    reviewCurrent: true,
    safetyPlanStatus: "current",
    triggersIdentified: ["anxiety", "peer conflict"],
    copingStrategiesDocumented: ["breathing exercises", "talk to keyworker", "quiet time in room"],
    emergencyContactsRecorded: true,
    professionalSupportInPlace: true,
  },
  {
    id: "rp-2",
    childId: "child-jordan",
    childName: "Jordan",
    riskLevel: "medium",
    assessmentDate: "2026-03-15",
    assessedBy: "Darren Laville",
    reviewDate: "2026-04-15",
    reviewCurrent: true,
    safetyPlanStatus: "current",
    triggersIdentified: ["peer conflict", "homesickness", "sleep disruption"],
    copingStrategiesDocumented: ["talk to keyworker", "journaling", "physical activity"],
    emergencyContactsRecorded: true,
    professionalSupportInPlace: true,
  },
  {
    id: "rp-3",
    childId: "child-morgan",
    childName: "Morgan",
    riskLevel: "low",
    assessmentDate: "2026-04-10",
    assessedBy: "Darren Laville",
    reviewDate: "2026-05-10",
    reviewCurrent: true,
    safetyPlanStatus: "current",
    triggersIdentified: ["transitions", "loud environments"],
    copingStrategiesDocumented: ["music", "drawing", "sensory toolkit"],
    emergencyContactsRecorded: true,
    professionalSupportInPlace: true,
  },
];

const DEMO_INCIDENTS: SelfHarmIncident[] = [
  {
    id: "inc-1",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-20",
    selfHarmType: "cutting",
    severity: "low",
    interventionOutcome: "prevented",
    staffResponded: ["Sarah Johnson", "Tom Richards"],
    immediateActionTaken: true,
    medicalAssessmentCompleted: true,
    parentNotified: true,
    socialWorkerNotified: true,
    debriefCompleted: true,
    safetyPlanUpdated: true,
  },
];

const DEMO_CHECKS: EnvironmentalSafetyCheck[] = [
  {
    id: "esc-1",
    checkDate: "2026-04-01",
    checkedBy: "Sarah Johnson",
    ligaturePointsAssessed: true,
    sharpObjectsSecured: true,
    medicationSecured: true,
    bathroomProductsSecured: true,
    windowRestrictorsChecked: true,
    overallCompliant: true,
  },
  {
    id: "esc-2",
    checkDate: "2026-04-15",
    checkedBy: "Tom Richards",
    ligaturePointsAssessed: true,
    sharpObjectsSecured: true,
    medicationSecured: true,
    bathroomProductsSecured: true,
    windowRestrictorsChecked: true,
    overallCompliant: true,
  },
  {
    id: "esc-3",
    checkDate: "2026-05-01",
    checkedBy: "Lisa Williams",
    ligaturePointsAssessed: true,
    sharpObjectsSecured: true,
    medicationSecured: true,
    bathroomProductsSecured: true,
    windowRestrictorsChecked: true,
    overallCompliant: true,
  },
];

const DEMO_TRAINING: StaffSelfHarmTraining[] = [
  { id: "sht-1", staffId: "staff-sarah", staffName: "Sarah Johnson", selfHarmAwareness: true, riskAssessmentTrained: true, safetyPlanningTrained: true, crisisInterventionTrained: true, postventionTrained: true, mentalHealthFirstAid: true },
  { id: "sht-2", staffId: "staff-tom", staffName: "Tom Richards", selfHarmAwareness: true, riskAssessmentTrained: true, safetyPlanningTrained: true, crisisInterventionTrained: true, postventionTrained: true, mentalHealthFirstAid: true },
  { id: "sht-3", staffId: "staff-lisa", staffName: "Lisa Williams", selfHarmAwareness: true, riskAssessmentTrained: true, safetyPlanningTrained: true, crisisInterventionTrained: true, postventionTrained: true, mentalHealthFirstAid: true },
  { id: "sht-4", staffId: "staff-darren", staffName: "Darren Laville", selfHarmAwareness: true, riskAssessmentTrained: true, safetyPlanningTrained: true, crisisInterventionTrained: true, postventionTrained: true, mentalHealthFirstAid: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateSelfHarmPreventionProtocolIntelligence(
    DEMO_PROFILES,
    DEMO_INCIDENTS,
    DEMO_CHECKS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        riskLevelLabels: Object.fromEntries(
          (["low", "medium", "high", "very_high"] as const).map(
            (r) => [r, getRiskLevelLabel(r)],
          ),
        ),
        selfHarmTypeLabels: Object.fromEntries(
          (["cutting", "burning", "overdose", "head_banging", "hair_pulling", "poisoning", "ligature", "other"] as const).map(
            (t) => [t, getSelfHarmTypeLabel(t)],
          ),
        ),
        interventionOutcomeLabels: Object.fromEntries(
          (["prevented", "interrupted", "required_medical", "hospitalised"] as const).map(
            (o) => [o, getInterventionOutcomeLabel(o)],
          ),
        ),
        safetyPlanStatusLabels: Object.fromEntries(
          (["current", "overdue", "not_in_place"] as const).map(
            (s) => [s, getSafetyPlanStatusLabel(s)],
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

  const { profiles, incidents, checks, training, homeId, periodStart, periodEnd } = body as {
    profiles?: ChildRiskProfile[];
    incidents?: SelfHarmIncident[];
    checks?: EnvironmentalSafetyCheck[];
    training?: StaffSelfHarmTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateSelfHarmPreventionProtocolIntelligence(
    profiles ?? [],
    incidents ?? [],
    checks ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
