// ==============================================================================
// API: /api/pet-therapy-animal-interaction
//
// Pet Therapy & Animal Interaction Intelligence
//
// GET  — Returns pet therapy assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generatePetTherapyAnimalInteractionIntelligence,
  getAnimalTypeLabel,
  getSessionTypeLabel,
  getTherapeuticBenefitLabel,
  getWelfareStatusLabel,
  getRatingLabel,
} from "@/lib/pet-therapy-animal-interaction";
import type {
  AnimalSession,
  AnimalWelfareCheck,
  AnimalRiskAssessment,
  StaffAnimalTraining,
} from "@/lib/pet-therapy-animal-interaction";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_SESSIONS: AnimalSession[] = [
  { id: "as-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-01", animalType: "dog", sessionType: "structured_therapy", facilitatedBy: "Sarah Johnson", therapeuticBenefit: "significant", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
  { id: "as-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-15", animalType: "dog", sessionType: "informal_interaction", facilitatedBy: "Tom Richards", therapeuticBenefit: "moderate", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
  { id: "as-3", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-05", animalType: "horse", sessionType: "equine_therapy", facilitatedBy: "Lisa Williams", therapeuticBenefit: "significant", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
  { id: "as-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-02", animalType: "horse", sessionType: "equine_therapy", facilitatedBy: "Lisa Williams", therapeuticBenefit: "significant", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
  { id: "as-5", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-10", animalType: "rabbit", sessionType: "care_responsibility", facilitatedBy: "Sarah Johnson", therapeuticBenefit: "moderate", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
  { id: "as-6", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-10", animalType: "dog", sessionType: "structured_therapy", facilitatedBy: "Darren Laville", therapeuticBenefit: "moderate", childEngaged: true, riskAssessmentCompleted: true, supervisedThroughout: true, hygieneProtocolFollowed: true },
];

const DEMO_WELFARE: AnimalWelfareCheck[] = [
  { id: "aw-1", animalType: "dog", animalName: "Buddy", checkDate: "2026-04-01", checkedBy: "Tom Richards", welfareStatus: "excellent", veterinaryUpToDate: true, vaccinationsCurrentt: true, livingConditionsAdequate: true, dietAppropriate: true, exerciseProvided: true },
  { id: "aw-2", animalType: "rabbit", animalName: "Flopsy", checkDate: "2026-04-01", checkedBy: "Sarah Johnson", welfareStatus: "good", veterinaryUpToDate: true, vaccinationsCurrentt: true, livingConditionsAdequate: true, dietAppropriate: true, exerciseProvided: true },
];

const DEMO_RISK: AnimalRiskAssessment[] = [
  { id: "ar-1", assessmentDate: "2026-01-15", assessedBy: "Darren Laville", allergyScreeningCompleted: true, zoonoticRiskAssessed: true, biteRiskAssessed: true, hygieneProtocolInPlace: true, insuranceCurrent: true, emergencyPlanInPlace: true },
  { id: "ar-2", assessmentDate: "2026-04-01", assessedBy: "Sarah Johnson", allergyScreeningCompleted: true, zoonoticRiskAssessed: true, biteRiskAssessed: true, hygieneProtocolInPlace: true, insuranceCurrent: true, emergencyPlanInPlace: true },
];

const DEMO_TRAINING: StaffAnimalTraining[] = [
  { id: "at-1", staffId: "staff-sarah", staffName: "Sarah Johnson", animalHandling: true, therapeuticAnimalUse: true, animalWelfare: true, riskAssessment: true, hygieneProtocols: true, allergyAwareness: true },
  { id: "at-2", staffId: "staff-tom", staffName: "Tom Richards", animalHandling: true, therapeuticAnimalUse: true, animalWelfare: true, riskAssessment: true, hygieneProtocols: true, allergyAwareness: true },
  { id: "at-3", staffId: "staff-lisa", staffName: "Lisa Williams", animalHandling: true, therapeuticAnimalUse: true, animalWelfare: true, riskAssessment: true, hygieneProtocols: true, allergyAwareness: true },
  { id: "at-4", staffId: "staff-darren", staffName: "Darren Laville", animalHandling: true, therapeuticAnimalUse: true, animalWelfare: true, riskAssessment: true, hygieneProtocols: true, allergyAwareness: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generatePetTherapyAnimalInteractionIntelligence(
    DEMO_SESSIONS,
    DEMO_WELFARE,
    DEMO_RISK,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        animalTypeLabels: Object.fromEntries(
          (["dog", "cat", "horse", "rabbit", "guinea_pig", "fish", "bird", "farm_animal", "other"] as const).map(
            (t) => [t, getAnimalTypeLabel(t)],
          ),
        ),
        sessionTypeLabels: Object.fromEntries(
          (["structured_therapy", "informal_interaction", "equine_therapy", "animal_assisted_learning", "care_responsibility", "visiting_animal", "other"] as const).map(
            (t) => [t, getSessionTypeLabel(t)],
          ),
        ),
        therapeuticBenefitLabels: Object.fromEntries(
          (["significant", "moderate", "some", "minimal", "not_assessed"] as const).map(
            (b) => [b, getTherapeuticBenefitLabel(b)],
          ),
        ),
        welfareStatusLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor", "concern_raised"] as const).map(
            (s) => [s, getWelfareStatusLabel(s)],
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

  const { sessions, welfareChecks, riskAssessments, training, homeId, periodStart, periodEnd } = body as {
    sessions?: AnimalSession[];
    welfareChecks?: AnimalWelfareCheck[];
    riskAssessments?: AnimalRiskAssessment[];
    training?: StaffAnimalTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generatePetTherapyAnimalInteractionIntelligence(
    sessions ?? [],
    welfareChecks ?? [],
    riskAssessments ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
