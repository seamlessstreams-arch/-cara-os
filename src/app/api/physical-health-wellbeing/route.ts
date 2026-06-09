// ==============================================================================
// API: /api/physical-health-wellbeing
//
// Physical Health & Wellbeing Intelligence
//
// GET  — Returns physical health assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generatePhysicalHealthWellbeingIntelligence,
  getHealthAreaLabel,
  getHealthOutcomeLabel,
  getRatingLabel,
} from "@/lib/physical-health-wellbeing";
import type {
  HealthRecord,
  HealthPolicy,
  StaffHealthTraining,
} from "@/lib/physical-health-wellbeing";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_RECORDS: HealthRecord[] = [
  { id: "hr-1", childId: "child-alex", childName: "Alex", recordDate: "2026-02-10", healthArea: "medical_appointment", healthOutcome: "excellent", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-2", childId: "child-alex", childName: "Alex", recordDate: "2026-03-15", healthArea: "dental_check", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-3", childId: "child-jordan", childName: "Jordan", recordDate: "2026-01-20", healthArea: "optician_visit", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-02-28", healthArea: "immunisation", healthOutcome: "excellent", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: false },
  { id: "hr-5", childId: "child-morgan", childName: "Morgan", recordDate: "2026-03-05", healthArea: "health_assessment", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-6", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-12", healthArea: "physical_activity", healthOutcome: "excellent", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-7", childId: "child-alex", childName: "Alex", recordDate: "2026-04-20", healthArea: "nutrition_review", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-8", childId: "child-jordan", childName: "Jordan", recordDate: "2026-05-01", healthArea: "mental_health_review", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-9", childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-10", healthArea: "medical_appointment", healthOutcome: "excellent", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
  { id: "hr-10", childId: "child-alex", childName: "Alex", recordDate: "2026-05-15", healthArea: "immunisation", healthOutcome: "good", appointmentAttended: true, healthPlanUpdated: true, consentObtained: true, staffAccompanied: true, documentedInRecord: true, followUpScheduled: true },
];

const DEMO_POLICY: HealthPolicy = {
  id: "hp-1",
  healthAssessmentFramework: true,
  appointmentManagement: true,
  consentProtocol: true,
  healthPassportScheme: true,
  physicalActivityPlan: true,
  nutritionGuidelines: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffHealthTraining[] = [
  { id: "sht-1", staffId: "staff-sarah", staffName: "Sarah Johnson", healthAwareness: true, mentalHealthFirstAid: true, consentAndCapacity: true, medicationManagement: true, appointmentSupport: true, healthDocumentation: true },
  { id: "sht-2", staffId: "staff-tom", staffName: "Tom Richards", healthAwareness: true, mentalHealthFirstAid: true, consentAndCapacity: true, medicationManagement: true, appointmentSupport: true, healthDocumentation: true },
  { id: "sht-3", staffId: "staff-lisa", staffName: "Lisa Williams", healthAwareness: true, mentalHealthFirstAid: true, consentAndCapacity: true, medicationManagement: true, appointmentSupport: true, healthDocumentation: true },
  { id: "sht-4", staffId: "staff-darren", staffName: "Darren Laville", healthAwareness: true, mentalHealthFirstAid: true, consentAndCapacity: true, medicationManagement: true, appointmentSupport: true, healthDocumentation: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generatePhysicalHealthWellbeingIntelligence(
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        healthAreaLabels: Object.fromEntries(
          (["medical_appointment", "dental_check", "optician_visit", "immunisation", "health_assessment", "physical_activity", "nutrition_review", "mental_health_review"] as const).map(
            (a) => [a, getHealthAreaLabel(a)],
          ),
        ),
        healthOutcomeLabels: Object.fromEntries(
          (["excellent", "good", "satisfactory", "concern_raised", "missed"] as const).map(
            (o) => [o, getHealthOutcomeLabel(o)],
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

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: HealthRecord[];
    policy?: HealthPolicy | null;
    training?: StaffHealthTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generatePhysicalHealthWellbeingIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
