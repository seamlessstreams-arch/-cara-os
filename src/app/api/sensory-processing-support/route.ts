// ══════════════════════════════════════════════════════════════════════════════
// Sensory Processing Support Intelligence API Route
//
// GET  — Returns Oak House demo data intelligence
// POST — Accepts custom data with validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSensoryProcessingSupportIntelligence,
} from "@/lib/sensory-processing-support";
import type {
  SensoryAssessment,
  SensoryIntervention,
  SensoryPolicy,
  StaffSensoryTraining,
} from "@/lib/sensory-processing-support";

// ── Demo Data ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES = ["Alex", "Jordan", "Morgan"];

const DEMO_ASSESSMENTS: SensoryAssessment[] = [
  {
    id: "sa-01",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-01-15",
    assessedBy: "Sarah Johnson",
    sensoryNeeds: ["hyper_auditory", "hypo_proprioceptive"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-02",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-04-10",
    assessedBy: "Sarah Johnson",
    sensoryNeeds: ["hyper_auditory", "hypo_proprioceptive"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-03",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-02-01",
    assessedBy: "Tom Richards",
    sensoryNeeds: ["hyper_tactile", "hyper_visual"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-04",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-05-05",
    assessedBy: "Lisa Williams",
    sensoryNeeds: ["hyper_tactile", "hyper_visual", "hypo_vestibular"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-05",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-02-15",
    assessedBy: "Lisa Williams",
    sensoryNeeds: ["mixed", "hypo_vestibular"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-06",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-04-20",
    assessedBy: "Darren Laville",
    sensoryNeeds: ["mixed", "hypo_vestibular", "hyper_auditory"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
];

const DEMO_INTERVENTIONS: SensoryIntervention[] = [
  {
    id: "si-01",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-01-20",
    interventionType: "sensory_diet",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-02",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-02-05",
    interventionType: "calming_strategy",
    facilitatedBy: "Darren Laville",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-03",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-03-01",
    interventionType: "environmental_modification",
    facilitatedBy: "Tom Richards",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-04",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-04-15",
    interventionType: "equipment_provision",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-05",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-02-10",
    interventionType: "therapeutic_activity",
    facilitatedBy: "Lisa Williams",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-06",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-03-05",
    interventionType: "equipment_provision",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-07",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-03-20",
    interventionType: "sensory_diet",
    facilitatedBy: "Darren Laville",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-08",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-04-25",
    interventionType: "calming_strategy",
    facilitatedBy: "Tom Richards",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-09",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-02-20",
    interventionType: "alerting_strategy",
    facilitatedBy: "Tom Richards",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-10",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-03-10",
    interventionType: "therapeutic_activity",
    facilitatedBy: "Lisa Williams",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-11",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-04-01",
    interventionType: "sensory_diet",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-12",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-05-10",
    interventionType: "environmental_modification",
    facilitatedBy: "Darren Laville",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
];

const DEMO_POLICIES: SensoryPolicy[] = [
  {
    id: "sp-01",
    sensoryScreeningRoutine: true,
    occupationalTherapyAccess: true,
    environmentalAuditCompleted: true,
    sensoryToolsAvailable: true,
    staffTrainingProvided: true,
    individualSensoryPlans: true,
    parentCarerInvolvement: true,
  },
];

const DEMO_TRAINING: StaffSensoryTraining[] = [
  {
    id: "st-01",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
  {
    id: "st-02",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
  {
    id: "st-03",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
  {
    id: "st-04",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-05-19";
  const referenceDate = new Date().toISOString().slice(0, 10);

  const result = generateSensoryProcessingSupportIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_INTERVENTIONS,
    DEMO_POLICIES,
    DEMO_TRAINING,
    CHILD_IDS,
    CHILD_NAMES,
    "oak-house",
    periodStart,
    periodEnd,
    referenceDate,
  );

  return NextResponse.json(result);
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      assessments,
      interventions,
      policies,
      training,
      childIds,
      childNames,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    // Validation
    if (!Array.isArray(assessments)) {
      return NextResponse.json({ error: "assessments must be an array" }, { status: 400 });
    }
    if (!Array.isArray(interventions)) {
      return NextResponse.json({ error: "interventions must be an array" }, { status: 400 });
    }
    if (!Array.isArray(policies)) {
      return NextResponse.json({ error: "policies must be an array" }, { status: 400 });
    }
    if (!Array.isArray(training)) {
      return NextResponse.json({ error: "training must be an array" }, { status: 400 });
    }
    if (!Array.isArray(childIds) || childIds.length === 0) {
      return NextResponse.json({ error: "childIds must be a non-empty array" }, { status: 400 });
    }
    if (!Array.isArray(childNames) || childNames.length !== childIds.length) {
      return NextResponse.json({ error: "childNames must be an array matching childIds length" }, { status: 400 });
    }
    if (typeof homeId !== "string" || !homeId) {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }
    if (typeof periodStart !== "string" || !periodStart) {
      return NextResponse.json({ error: "periodStart is required" }, { status: 400 });
    }
    if (typeof periodEnd !== "string" || !periodEnd) {
      return NextResponse.json({ error: "periodEnd is required" }, { status: 400 });
    }
    if (typeof referenceDate !== "string" || !referenceDate) {
      return NextResponse.json({ error: "referenceDate is required" }, { status: 400 });
    }

    const result = generateSensoryProcessingSupportIntelligence(
      assessments as SensoryAssessment[],
      interventions as SensoryIntervention[],
      policies as SensoryPolicy[],
      training as StaffSensoryTraining[],
      childIds as string[],
      childNames as string[],
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
