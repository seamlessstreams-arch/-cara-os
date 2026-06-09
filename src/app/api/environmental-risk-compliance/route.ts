// ==============================================================================
// API: /api/environmental-risk-compliance
//
// Environmental Risk Compliance Intelligence
//
// GET  — Returns environmental risk assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateEnvironmentalRiskComplianceIntelligence,
  getHazardTypeLabel,
  getRiskLevelLabel,
  getCheckStatusLabel,
  getAreaTypeLabel,
  getRemediationStatusLabel,
  getRatingLabel,
} from "@/lib/environmental-risk-compliance";
import type {
  RiskAssessment,
  SafetyCheck,
  RemediationAction,
  StaffSafetyTraining,
} from "@/lib/environmental-risk-compliance";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_ASSESSMENTS: RiskAssessment[] = [
  // Ligature points — bathrooms
  { id: "ra-1", areaType: "bathroom", areaName: "Main Bathroom", assessmentDate: "2026-04-01", assessedBy: "Sarah Johnson", hazardType: "ligature_point", riskLevel: "high", mitigationInPlace: true, mitigationDescription: "Anti-ligature fittings installed on all fixtures", nextReviewDate: "2026-07-01", reviewCurrent: true },
  { id: "ra-2", areaType: "bathroom", areaName: "Main Bathroom", assessmentDate: "2026-04-01", assessedBy: "Sarah Johnson", hazardType: "water_temperature", riskLevel: "medium", mitigationInPlace: true, mitigationDescription: "TMV valves fitted, max 44C at outlet", nextReviewDate: "2026-07-01", reviewCurrent: true },
  // Water temp — kitchen + bathroom
  { id: "ra-3", areaType: "kitchen", areaName: "Kitchen", assessmentDate: "2026-04-05", assessedBy: "Tom Richards", hazardType: "water_temperature", riskLevel: "medium", mitigationInPlace: true, mitigationDescription: "TMV valves fitted, regular temperature checks", nextReviewDate: "2026-07-05", reviewCurrent: true },
  // COSHH — utility + kitchen
  { id: "ra-4", areaType: "utility", areaName: "Utility Room", assessmentDate: "2026-03-20", assessedBy: "Lisa Williams", hazardType: "coshh", riskLevel: "high", mitigationInPlace: true, mitigationDescription: "Locked COSHH cabinet, inventory maintained", nextReviewDate: "2026-06-20", reviewCurrent: true },
  { id: "ra-5", areaType: "kitchen", areaName: "Kitchen", assessmentDate: "2026-03-20", assessedBy: "Lisa Williams", hazardType: "coshh", riskLevel: "medium", mitigationInPlace: true, mitigationDescription: "Cleaning products stored in locked cupboard", nextReviewDate: "2026-06-20", reviewCurrent: true },
  // Window restrictors — all bedrooms
  { id: "ra-6", areaType: "bedroom", areaName: "Alex's Bedroom", assessmentDate: "2026-04-10", assessedBy: "Darren Laville", hazardType: "window_restrictor", riskLevel: "high", mitigationInPlace: true, mitigationDescription: "Window restrictors fitted, max 100mm opening", nextReviewDate: "2026-07-10", reviewCurrent: true },
  { id: "ra-7", areaType: "bedroom", areaName: "Jordan's Bedroom", assessmentDate: "2026-04-10", assessedBy: "Darren Laville", hazardType: "window_restrictor", riskLevel: "high", mitigationInPlace: true, mitigationDescription: "Window restrictors fitted, max 100mm opening", nextReviewDate: "2026-07-10", reviewCurrent: true },
  { id: "ra-8", areaType: "bedroom", areaName: "Morgan's Bedroom", assessmentDate: "2026-04-10", assessedBy: "Darren Laville", hazardType: "window_restrictor", riskLevel: "high", mitigationInPlace: true, mitigationDescription: "Window restrictors fitted, max 100mm opening", nextReviewDate: "2026-07-10", reviewCurrent: true },
  // Garden
  { id: "ra-9", areaType: "garden", areaName: "Garden", assessmentDate: "2026-04-15", assessedBy: "Tom Richards", hazardType: "slip_trip", riskLevel: "low", mitigationInPlace: true, mitigationDescription: "Paths maintained, lighting adequate", nextReviewDate: "2026-07-15", reviewCurrent: true },
  { id: "ra-10", areaType: "garden", areaName: "Garden", assessmentDate: "2026-04-15", assessedBy: "Tom Richards", hazardType: "structural", riskLevel: "medium", mitigationInPlace: true, mitigationDescription: "Fencing secure, gate latch functional", nextReviewDate: "2026-07-15", reviewCurrent: true },
  // Communal area
  { id: "ra-11", areaType: "communal", areaName: "Living Room", assessmentDate: "2026-04-12", assessedBy: "Sarah Johnson", hazardType: "fire_equipment", riskLevel: "low", mitigationInPlace: true, mitigationDescription: "Smoke detectors tested, fire blanket accessible", nextReviewDate: "2026-07-12", reviewCurrent: true },
  { id: "ra-12", areaType: "communal", areaName: "Living Room", assessmentDate: "2026-04-12", assessedBy: "Sarah Johnson", hazardType: "electrical", riskLevel: "low", mitigationInPlace: true, mitigationDescription: "PAT tested, socket covers in place", nextReviewDate: "2026-07-12", reviewCurrent: true },
];

const DEMO_CHECKS: SafetyCheck[] = [
  // Water temperature checks
  { id: "sc-1", areaType: "bathroom", areaName: "Main Bathroom", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", checkType: "water_temperature", status: "compliant", reading: 43.2, notes: "Hot water at 43.2C — within safe range", actionRequired: false, actionCompleted: false },
  { id: "sc-2", areaType: "kitchen", areaName: "Kitchen", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", checkType: "water_temperature", status: "compliant", reading: 42.8, notes: "Hot water at 42.8C — within safe range", actionRequired: false, actionCompleted: false },
  { id: "sc-3", areaType: "bathroom", areaName: "Main Bathroom", checkDate: "2026-05-08", checkedBy: "Tom Richards", checkType: "water_temperature", status: "compliant", reading: 43.5, notes: "Within safe range", actionRequired: false, actionCompleted: false },
  { id: "sc-4", areaType: "kitchen", areaName: "Kitchen", checkDate: "2026-05-08", checkedBy: "Tom Richards", checkType: "water_temperature", status: "compliant", reading: 43.0, notes: "Within safe range", actionRequired: false, actionCompleted: false },
  { id: "sc-5", areaType: "bathroom", areaName: "Main Bathroom", checkDate: "2026-05-15", checkedBy: "Lisa Williams", checkType: "water_temperature", status: "compliant", reading: 43.1, notes: "Within safe range", actionRequired: false, actionCompleted: false },
  // Fire equipment checks
  { id: "sc-6", areaType: "communal", areaName: "Living Room", checkDate: "2026-05-01", checkedBy: "Darren Laville", checkType: "fire_equipment", status: "compliant", reading: null, notes: "Smoke detectors tested — all functional", actionRequired: false, actionCompleted: false },
  { id: "sc-7", areaType: "kitchen", areaName: "Kitchen", checkDate: "2026-05-01", checkedBy: "Darren Laville", checkType: "fire_equipment", status: "compliant", reading: null, notes: "Fire blanket accessible, extinguisher in date", actionRequired: false, actionCompleted: false },
  // Window restrictor checks
  { id: "sc-8", areaType: "bedroom", areaName: "Alex's Bedroom", checkDate: "2026-05-05", checkedBy: "Tom Richards", checkType: "window_restrictor", status: "compliant", reading: null, notes: "Restrictors secure, max 100mm confirmed", actionRequired: false, actionCompleted: false },
  { id: "sc-9", areaType: "bedroom", areaName: "Jordan's Bedroom", checkDate: "2026-05-05", checkedBy: "Tom Richards", checkType: "window_restrictor", status: "compliant", reading: null, notes: "Restrictors secure", actionRequired: false, actionCompleted: false },
  { id: "sc-10", areaType: "bedroom", areaName: "Morgan's Bedroom", checkDate: "2026-05-05", checkedBy: "Tom Richards", checkType: "window_restrictor", status: "compliant", reading: null, notes: "Restrictors secure", actionRequired: false, actionCompleted: false },
  // COSHH checks
  { id: "sc-11", areaType: "utility", areaName: "Utility Room", checkDate: "2026-05-03", checkedBy: "Lisa Williams", checkType: "coshh", status: "compliant", reading: null, notes: "Cabinet locked, inventory current, MSDS available", actionRequired: false, actionCompleted: false },
  { id: "sc-12", areaType: "kitchen", areaName: "Kitchen", checkDate: "2026-05-03", checkedBy: "Lisa Williams", checkType: "coshh", status: "compliant", reading: null, notes: "Products secured", actionRequired: false, actionCompleted: false },
  // Garden checks
  { id: "sc-13", areaType: "garden", areaName: "Garden", checkDate: "2026-05-10", checkedBy: "Tom Richards", checkType: "structural", status: "minor_issue", reading: null, notes: "Gate latch slightly loose — tightened but monitor", actionRequired: true, actionCompleted: true },
  // Additional checks
  { id: "sc-14", areaType: "communal", areaName: "Living Room", checkDate: "2026-05-10", checkedBy: "Sarah Johnson", checkType: "electrical", status: "compliant", reading: null, notes: "All sockets and appliances safe", actionRequired: false, actionCompleted: false },
  { id: "sc-15", areaType: "garden", areaName: "Garden", checkDate: "2026-05-12", checkedBy: "Darren Laville", checkType: "slip_trip", status: "compliant", reading: null, notes: "Paths clear, lighting working", actionRequired: false, actionCompleted: false },
];

const DEMO_REMEDIATIONS: RemediationAction[] = [
  { id: "rem-1", assessmentId: "ra-10", hazardType: "structural", areaType: "garden", description: "Replace garden gate latch — current latch loosening", assignedTo: "Tom Richards", targetDate: "2026-05-15", completionDate: "2026-05-12", status: "completed", verified: true },
  { id: "rem-2", assessmentId: "ra-4", hazardType: "coshh", areaType: "utility", description: "Fit additional lock to COSHH cabinet — secondary security measure", assignedTo: "Darren Laville", targetDate: "2026-05-30", completionDate: null, status: "in_progress", verified: false },
  { id: "rem-3", assessmentId: "ra-1", hazardType: "ligature_point", areaType: "bathroom", description: "Install improved extractor fan cover — anti-ligature design", assignedTo: "Sarah Johnson", targetDate: "2026-06-15", completionDate: null, status: "planned", verified: false },
];

const DEMO_TRAINING: StaffSafetyTraining[] = [
  { id: "sst-1", staffId: "staff-sarah", staffName: "Sarah Johnson", ligatureAwareness: true, coshhTrained: true, fireSafetyTrained: true, waterSafetyTrained: true, manualHandling: true, riskAssessmentCompetent: true },
  { id: "sst-2", staffId: "staff-tom", staffName: "Tom Richards", ligatureAwareness: true, coshhTrained: false, fireSafetyTrained: true, waterSafetyTrained: true, manualHandling: true, riskAssessmentCompetent: true },
  { id: "sst-3", staffId: "staff-lisa", staffName: "Lisa Williams", ligatureAwareness: true, coshhTrained: true, fireSafetyTrained: true, waterSafetyTrained: true, manualHandling: true, riskAssessmentCompetent: true },
  { id: "sst-4", staffId: "staff-darren", staffName: "Darren Laville", ligatureAwareness: true, coshhTrained: true, fireSafetyTrained: true, waterSafetyTrained: true, manualHandling: true, riskAssessmentCompetent: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateEnvironmentalRiskComplianceIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_CHECKS,
    DEMO_REMEDIATIONS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        hazardTypeLabels: Object.fromEntries(
          (["ligature_point", "water_temperature", "coshh", "window_restrictor", "sharp_object", "electrical", "slip_trip", "fire_equipment", "structural", "other"] as const).map(
            (t) => [t, getHazardTypeLabel(t)],
          ),
        ),
        riskLevelLabels: Object.fromEntries(
          (["low", "medium", "high", "critical"] as const).map(
            (l) => [l, getRiskLevelLabel(l)],
          ),
        ),
        checkStatusLabels: Object.fromEntries(
          (["compliant", "minor_issue", "major_issue", "non_compliant"] as const).map(
            (s) => [s, getCheckStatusLabel(s)],
          ),
        ),
        areaTypeLabels: Object.fromEntries(
          (["bedroom", "bathroom", "kitchen", "communal", "garden", "utility", "office", "corridor"] as const).map(
            (a) => [a, getAreaTypeLabel(a)],
          ),
        ),
        remediationStatusLabels: Object.fromEntries(
          (["completed", "in_progress", "planned", "overdue", "not_started"] as const).map(
            (s) => [s, getRemediationStatusLabel(s)],
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

  const { assessments, checks, remediations, training, homeId, periodStart, periodEnd } = body as {
    assessments?: RiskAssessment[];
    checks?: SafetyCheck[];
    remediations?: RemediationAction[];
    training?: StaffSafetyTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateEnvironmentalRiskComplianceIntelligence(
    assessments ?? [],
    checks ?? [],
    remediations ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
