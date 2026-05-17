// ══════════════════════════════════════════════════════════════════════════════
// Medication Management API Route
//
// GET  ?homeId=...&mode=dashboard|metrics|child&childId=...
// POST { action: "evaluate"|"metrics", ... }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildMedicationCompliance,
  calculateHomeMedicationMetrics,
  getMedicationTypeLabel,
  getAdministrationStatusLabel,
} from "@/lib/medication";
import type { Medication, Administration, MedicationError, StockCheck } from "@/lib/medication";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_MEDICATIONS: Medication[] = [
  {
    id: "med-001",
    childId: "child-alex",
    childName: "Alex Turner",
    name: "Methylphenidate 10mg",
    dose: "10mg",
    route: "oral",
    frequency: "Twice daily (morning & lunchtime)",
    type: "regular",
    prescribedBy: "Dr Patel",
    prescribedDate: "2026-01-15T10:00:00Z",
    reviewDueDate: "2026-07-15T10:00:00Z",
    startDate: "2026-01-15T10:00:00Z",
    storage: "locked_cabinet",
    specialInstructions: "Give with food. Do not give after 2pm.",
    sideEffects: ["Reduced appetite", "Difficulty sleeping"],
    allergiesChecked: true,
    consentObtained: true,
    active: true,
  },
  {
    id: "med-002",
    childId: "child-alex",
    childName: "Alex Turner",
    name: "Melatonin 3mg",
    dose: "3mg",
    route: "oral",
    frequency: "Once at bedtime",
    type: "regular",
    prescribedBy: "Dr Patel",
    prescribedDate: "2026-02-01T10:00:00Z",
    reviewDueDate: "2026-08-01T10:00:00Z",
    startDate: "2026-02-01T10:00:00Z",
    storage: "locked_cabinet",
    allergiesChecked: true,
    consentObtained: true,
    selfAdminLevel: "level_2",
    selfAdminAssessmentDate: "2026-02-01T10:00:00Z",
    active: true,
  },
  {
    id: "med-003",
    childId: "child-jordan",
    childName: "Jordan Clarke",
    name: "Fluoxetine 20mg",
    dose: "20mg",
    route: "oral",
    frequency: "Once daily (morning)",
    type: "regular",
    prescribedBy: "Dr Ahmed",
    prescribedDate: "2026-03-10T10:00:00Z",
    reviewDueDate: "2026-06-10T10:00:00Z",
    startDate: "2026-03-10T10:00:00Z",
    storage: "locked_cabinet",
    allergiesChecked: true,
    consentObtained: true,
    active: true,
  },
  {
    id: "med-004",
    childId: "child-jordan",
    childName: "Jordan Clarke",
    name: "Ibuprofen 200mg",
    dose: "200mg",
    route: "oral",
    frequency: "PRN — max 3 doses in 24h",
    type: "prn",
    prescribedBy: "Dr Ahmed",
    prescribedDate: "2026-03-10T10:00:00Z",
    reviewDueDate: "2026-09-10T10:00:00Z",
    startDate: "2026-03-10T10:00:00Z",
    storage: "locked_cabinet",
    allergiesChecked: true,
    consentObtained: true,
    prnProtocol: {
      indication: "Headaches or period pain",
      maxDoseIn24h: "3 doses",
      minTimeBetweenDoses: "6 hours",
      whenToSeekHelp: "If pain persists after 2 doses, or if new symptoms",
      approvedBy: "Dr Ahmed",
      approvedDate: "2026-03-10T10:00:00Z",
    },
    active: true,
  },
  {
    id: "med-005",
    childId: "child-jordan",
    childName: "Jordan Clarke",
    name: "Methylphenidate 20mg MR",
    dose: "20mg",
    route: "oral",
    frequency: "Once daily (morning)",
    type: "controlled",
    prescribedBy: "Dr Ahmed",
    prescribedDate: "2026-04-01T10:00:00Z",
    reviewDueDate: "2026-07-01T10:00:00Z",
    startDate: "2026-04-01T10:00:00Z",
    storage: "controlled_drugs_cabinet",
    specialInstructions: "Controlled drug — dual witness required. Give before 9am.",
    allergiesChecked: true,
    consentObtained: true,
    active: true,
  },
  {
    id: "med-006",
    childId: "child-sam",
    childName: "Sam Patel",
    name: "Salbutamol Inhaler",
    dose: "2 puffs",
    route: "inhaled",
    frequency: "PRN — as needed for wheeze",
    type: "inhaler",
    prescribedBy: "Dr Williams",
    prescribedDate: "2025-11-20T10:00:00Z",
    reviewDueDate: "2026-05-20T10:00:00Z",
    startDate: "2025-11-20T10:00:00Z",
    storage: "child_possession",
    allergiesChecked: true,
    consentObtained: true,
    selfAdminLevel: "level_3",
    selfAdminAssessmentDate: "2025-11-20T10:00:00Z",
    prnProtocol: {
      indication: "Shortness of breath, wheeze, or before exercise",
      maxDoseIn24h: "10 puffs",
      minTimeBetweenDoses: "4 hours (routine), can repeat after 15 mins if acute",
      whenToSeekHelp: "If needing inhaler more than 3x daily or no relief after 10 puffs — call 999",
      approvedBy: "Dr Williams",
      approvedDate: "2025-11-20T10:00:00Z",
    },
    active: true,
  },
];

const DEMO_ADMINISTRATIONS: Administration[] = [
  // Alex — methylphenidate morning doses (last 7 days)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `admin-alex-am-${i}`,
    medicationId: "med-001",
    childId: "child-alex",
    scheduledTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:00:00Z`,
    actualTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:05:00Z`,
    status: "given" as const,
    administeredBy: "staff-sw-01",
  })),
  // Alex — methylphenidate lunch doses
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `admin-alex-pm-${i}`,
    medicationId: "med-001",
    childId: "child-alex",
    scheduledTime: `2026-05-${String(11 + i).padStart(2, "0")}T12:00:00Z`,
    actualTime: `2026-05-${String(11 + i).padStart(2, "0")}T12:10:00Z`,
    status: (i === 4 ? "refused" : "given") as const,
    administeredBy: "staff-sw-01",
    refusalReason: i === 4 ? "Said it makes him feel sick" : undefined,
  })),
  // Alex — melatonin (bedtime)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `admin-alex-mel-${i}`,
    medicationId: "med-002",
    childId: "child-alex",
    scheduledTime: `2026-05-${String(11 + i).padStart(2, "0")}T21:00:00Z`,
    actualTime: `2026-05-${String(11 + i).padStart(2, "0")}T21:00:00Z`,
    status: "self_administered" as const,
    administeredBy: "staff-sw-01",
  })),
  // Jordan — fluoxetine
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `admin-jordan-flu-${i}`,
    medicationId: "med-003",
    childId: "child-jordan",
    scheduledTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:00:00Z`,
    actualTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:10:00Z`,
    status: "given" as const,
    administeredBy: "staff-sw-02",
  })),
  // Jordan — controlled drug (methylphenidate MR)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `admin-jordan-cd-${i}`,
    medicationId: "med-005",
    childId: "child-jordan",
    scheduledTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:30:00Z`,
    actualTime: `2026-05-${String(11 + i).padStart(2, "0")}T08:35:00Z`,
    status: "given" as const,
    administeredBy: "staff-sw-02",
    witnessedBy: "staff-rm-01",
    stockBefore: 28 - i,
    stockAfter: 27 - i,
  })),
  // Jordan — PRN ibuprofen (used twice this week)
  {
    id: "admin-jordan-prn-1",
    medicationId: "med-004",
    childId: "child-jordan",
    scheduledTime: "2026-05-13T15:00:00Z",
    actualTime: "2026-05-13T15:00:00Z",
    status: "given",
    administeredBy: "staff-sw-02",
    prnReason: "Headache after school",
    prnOutcome: "Pain resolved within 30 minutes",
  },
  {
    id: "admin-jordan-prn-2",
    medicationId: "med-004",
    childId: "child-jordan",
    scheduledTime: "2026-05-16T10:00:00Z",
    actualTime: "2026-05-16T10:00:00Z",
    status: "given",
    administeredBy: "staff-sw-01",
    prnReason: "Period pain",
    prnOutcome: "Settled within 1 hour",
  },
];

const DEMO_ERRORS: MedicationError[] = [
  {
    id: "err-001",
    childId: "child-alex",
    childName: "Alex Turner",
    medicationName: "Methylphenidate 10mg",
    date: "2026-05-08T12:30:00Z",
    errorType: "Delayed administration",
    severity: "minor",
    description: "Lunchtime dose given 30 minutes late due to school trip return",
    discoveredBy: "staff-rm-01",
    actionsTaken: ["Recorded in MAR", "Staff reminded about trip planning"],
    rootCause: "Poor advance planning for off-site activity",
    preventativeMeasures: ["Medication taken on trips", "Trip medication protocol updated"],
    reportedToGP: false,
    reportedToOfsted: false,
    investigatedBy: "staff-rm-01",
    investigationCompleted: true,
    outcome: "No harm. Protocol updated.",
  },
];

const DEMO_STOCK_CHECKS: StockCheck[] = [
  {
    id: "sc-001",
    medicationId: "med-005",
    date: "2026-05-16T20:00:00Z",
    expectedCount: 21,
    actualCount: 21,
    discrepancy: false,
    checkedBy: "staff-sw-02",
    witnessedBy: "staff-rm-01",
  },
  {
    id: "sc-002",
    medicationId: "med-001",
    date: "2026-05-16T20:00:00Z",
    expectedCount: 42,
    actualCount: 42,
    discrepancy: false,
    checkedBy: "staff-sw-01",
  },
];

// ── GET Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "home-oak";
  const mode = searchParams.get("mode") ?? "dashboard";
  const childId = searchParams.get("childId");

  const now = new Date().toISOString();

  if (mode === "child" && childId) {
    const childMeds = DEMO_MEDICATIONS.filter(m => m.childId === childId);
    const childAdmins = DEMO_ADMINISTRATIONS.filter(a => a.childId === childId);
    const childErrors = DEMO_ERRORS.filter(e => e.childId === childId);
    const compliance = evaluateChildMedicationCompliance(childMeds, childAdmins, childErrors, childId, now);
    return NextResponse.json({
      compliance,
      medications: childMeds.filter(m => m.active).map(m => ({
        id: m.id,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        type: m.type,
        typeLabel: getMedicationTypeLabel(m.type),
        selfAdminLevel: m.selfAdminLevel,
        reviewDueDate: m.reviewDueDate,
      })),
      recentAdministrations: childAdmins.slice(-10).map(a => ({
        ...a,
        statusLabel: getAdministrationStatusLabel(a.status),
      })),
    });
  }

  if (mode === "metrics") {
    const metrics = calculateHomeMedicationMetrics(
      DEMO_MEDICATIONS, DEMO_ADMINISTRATIONS, DEMO_ERRORS, DEMO_STOCK_CHECKS,
      homeId, 8, 10, now,
    );
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const metrics = calculateHomeMedicationMetrics(
    DEMO_MEDICATIONS, DEMO_ADMINISTRATIONS, DEMO_ERRORS, DEMO_STOCK_CHECKS,
    homeId, 8, 10, now,
  );

  const childIds = [...new Set(DEMO_MEDICATIONS.filter(m => m.active).map(m => m.childId))];
  const childResults = childIds.map(cId => {
    const meds = DEMO_MEDICATIONS.filter(m => m.childId === cId);
    const admins = DEMO_ADMINISTRATIONS.filter(a => a.childId === cId);
    const errs = DEMO_ERRORS.filter(e => e.childId === cId);
    return evaluateChildMedicationCompliance(meds, admins, errs, cId, now);
  });

  return NextResponse.json({
    metrics: {
      totalActiveMedications: metrics.totalActiveMedications,
      controlledDrugCount: metrics.controlledDrugCount,
      overallMarCompletionRate: metrics.overallMarCompletionRate,
      overallComplianceRate: metrics.overallComplianceRate,
      errorCount30Days: metrics.errorCount30Days,
      nearMissCount30Days: metrics.nearMissCount30Days,
      refusalRate: metrics.refusalRate,
      overdueReviews: metrics.overdueReviews,
      stockDiscrepancies: metrics.stockDiscrepancies,
      controlledDrugCompliant: metrics.controlledDrugCompliant,
      staffTrainingCompliant: metrics.staffTrainingCompliant,
      selfAdminChildCount: metrics.selfAdminChildCount,
      childCount: metrics.childCount,
    },
    children: childResults.map(r => ({
      childId: r.childId,
      childName: r.childName,
      activeMedications: r.activeMedications,
      isCompliant: r.isCompliant,
      marCompletionRate: r.marCompletionRate,
      issueCount: r.issues.length,
      warningCount: r.warnings.length,
      refusalRate: r.refusalRate,
    })),
    recentErrors: metrics.recentErrors,
    complianceIssues: metrics.complianceIssues,
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "evaluate") {
    const { medications, administrations, errors, childId } = body;
    if (!medications || !childId) {
      return NextResponse.json({ error: "medications and childId required" }, { status: 400 });
    }
    const result = evaluateChildMedicationCompliance(
      medications, administrations ?? [], errors ?? [], childId,
    );
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const { medications, administrations, errors, stockChecks, homeId, staffTrained, totalStaff } = body;
    if (!medications || !homeId) {
      return NextResponse.json({ error: "medications and homeId required" }, { status: 400 });
    }
    const result = calculateHomeMedicationMetrics(
      medications, administrations ?? [], errors ?? [], stockChecks ?? [],
      homeId, staffTrained ?? 0, totalStaff ?? 1,
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
