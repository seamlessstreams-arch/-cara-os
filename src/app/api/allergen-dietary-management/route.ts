// ==============================================================================
// API: /api/allergen-dietary-management
//
// Allergen & Dietary Management Intelligence
//
// GET  — Returns allergen/dietary assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateAllergenDietaryManagementIntelligence,
  getAllergenTypeLabel,
  getDietaryRequirementLabel,
  getSeverityLevelLabel,
  getEmergencyPlanStatusLabel,
  getMealComplianceStatusLabel,
  getTrainingCompetenceLabel,
  getRatingLabel,
} from "@/lib/allergen-dietary-management";
import type {
  ChildAllergenProfile,
  AllergenIncident,
  MealPlanRecord,
  StaffAllergenTraining,
} from "@/lib/allergen-dietary-management";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PROFILES: ChildAllergenProfile[] = [
  {
    id: "ap-1",
    childId: "child-alex",
    childName: "Alex",
    allergens: ["nuts", "sesame"],
    severities: { nuts: "severe", sesame: "moderate" },
    dietaryRequirements: ["none"],
    emergencyPlanStatus: "current",
    epiPenAvailable: true,
    epiPenExpiryDate: "2027-03-01",
    gpNotified: true,
    socialWorkerNotified: true,
    lastReviewDate: "2026-03-01",
    reviewDue: "2026-09-01",
  },
  {
    id: "ap-2",
    childId: "child-jordan",
    childName: "Jordan",
    allergens: ["dairy"],
    severities: { dairy: "moderate" },
    dietaryRequirements: ["dairy_free"],
    emergencyPlanStatus: "current",
    epiPenAvailable: null,
    epiPenExpiryDate: null,
    gpNotified: true,
    socialWorkerNotified: true,
    lastReviewDate: "2026-02-15",
    reviewDue: "2026-08-15",
  },
  {
    id: "ap-3",
    childId: "child-morgan",
    childName: "Morgan",
    allergens: [],
    severities: {},
    dietaryRequirements: ["vegetarian"],
    emergencyPlanStatus: "current",
    epiPenAvailable: null,
    epiPenExpiryDate: null,
    gpNotified: false,
    socialWorkerNotified: false,
    lastReviewDate: "2026-04-01",
    reviewDue: "2026-10-01",
  },
];

const DEMO_MEALS: MealPlanRecord[] = [
  { id: "mp-1", date: "2026-05-12", mealType: "breakfast", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-2", date: "2026-05-12", mealType: "lunch", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-3", date: "2026-05-12", mealType: "dinner", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: false, complianceStatus: "fully_compliant" },
  { id: "mp-4", date: "2026-05-13", mealType: "breakfast", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-5", date: "2026-05-13", mealType: "lunch", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-6", date: "2026-05-13", mealType: "dinner", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-7", date: "2026-05-14", mealType: "breakfast", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-8", date: "2026-05-14", mealType: "lunch", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-9", date: "2026-05-14", mealType: "dinner", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-10", date: "2026-05-15", mealType: "breakfast", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-11", date: "2026-05-15", mealType: "lunch", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
  { id: "mp-12", date: "2026-05-15", mealType: "dinner", allergenLabelled: true, dietaryRequirementsMet: true, crossContaminationPrevented: true, childConsulted: true, complianceStatus: "fully_compliant" },
];

const DEMO_INCIDENTS: AllergenIncident[] = [];

const DEMO_TRAINING: StaffAllergenTraining[] = [
  { id: "sat-1", staffId: "staff-sarah", staffName: "Sarah Johnson", allergenAwareness: true, epiPenTrained: true, epiPenExpiryDate: "2027-01-10", foodHygieneCertified: true, crossContaminationTrained: true, anaphylaxisTrained: true, competenceLevel: "fully_competent" },
  { id: "sat-2", staffId: "staff-tom", staffName: "Tom Richards", allergenAwareness: true, epiPenTrained: true, epiPenExpiryDate: "2027-01-10", foodHygieneCertified: true, crossContaminationTrained: true, anaphylaxisTrained: true, competenceLevel: "fully_competent" },
  { id: "sat-3", staffId: "staff-lisa", staffName: "Lisa Williams", allergenAwareness: true, epiPenTrained: true, epiPenExpiryDate: "2027-01-10", foodHygieneCertified: true, crossContaminationTrained: true, anaphylaxisTrained: true, competenceLevel: "fully_competent" },
  { id: "sat-4", staffId: "staff-darren", staffName: "Darren Laville", allergenAwareness: true, epiPenTrained: true, epiPenExpiryDate: "2027-01-10", foodHygieneCertified: true, crossContaminationTrained: true, anaphylaxisTrained: true, competenceLevel: "fully_competent" },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateAllergenDietaryManagementIntelligence(
    DEMO_PROFILES,
    DEMO_MEALS,
    DEMO_INCIDENTS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        allergenTypeLabels: Object.fromEntries(
          (["nuts", "peanuts", "dairy", "eggs", "gluten", "soya", "shellfish", "fish", "sesame", "celery", "mustard", "lupin", "sulphites", "molluscs", "other"] as const).map(
            (t) => [t, getAllergenTypeLabel(t)],
          ),
        ),
        dietaryRequirementLabels: Object.fromEntries(
          (["halal", "kosher", "vegetarian", "vegan", "gluten_free", "dairy_free", "medical_diet", "cultural_preference", "none"] as const).map(
            (d) => [d, getDietaryRequirementLabel(d)],
          ),
        ),
        severityLevelLabels: Object.fromEntries(
          (["mild", "moderate", "severe", "life_threatening"] as const).map(
            (s) => [s, getSeverityLevelLabel(s)],
          ),
        ),
        emergencyPlanStatusLabels: Object.fromEntries(
          (["current", "expired", "not_in_place", "under_review"] as const).map(
            (e) => [e, getEmergencyPlanStatusLabel(e)],
          ),
        ),
        mealComplianceStatusLabels: Object.fromEntries(
          (["fully_compliant", "partially_compliant", "non_compliant", "not_assessed"] as const).map(
            (m) => [m, getMealComplianceStatusLabel(m)],
          ),
        ),
        trainingCompetenceLabels: Object.fromEntries(
          (["fully_competent", "needs_refresher", "not_trained", "in_training"] as const).map(
            (tc) => [tc, getTrainingCompetenceLabel(tc)],
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

  const { profiles, meals, incidents, training, homeId, periodStart, periodEnd } = body as {
    profiles?: ChildAllergenProfile[];
    meals?: MealPlanRecord[];
    incidents?: AllergenIncident[];
    training?: StaffAllergenTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateAllergenDietaryManagementIntelligence(
    profiles ?? [],
    meals ?? [],
    incidents ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
