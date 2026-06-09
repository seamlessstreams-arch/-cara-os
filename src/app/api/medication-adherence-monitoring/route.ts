// ==============================================================================
// API: /api/medication-adherence-monitoring
//
// Medication Adherence Monitoring Intelligence
//
// GET  — Returns medication adherence assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateMedicationAdherenceMonitoringIntelligence,
  getMedicationTypeLabel,
  getAdministrationOutcomeLabel,
  getRatingLabel,
} from "@/lib/medication-adherence-monitoring";
import type {
  MedicationRecord,
  MedicationPolicy,
  StaffMedicationTraining,
} from "@/lib/medication-adherence-monitoring";

// -- Demo Data: Chamberlain House -----------------------------------------------------

const DEMO_RECORDS: MedicationRecord[] = [
  { id: "mr-1", childId: "child-alex", childName: "Alex", administrationDate: "2026-05-12", medicationType: "prescribed_regular", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-09-01" },
  { id: "mr-2", childId: "child-alex", childName: "Alex", administrationDate: "2026-05-13", medicationType: "controlled", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-09-01" },
  { id: "mr-3", childId: "child-alex", childName: "Alex", administrationDate: "2026-05-14", medicationType: "prescribed_regular", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-09-01" },
  { id: "mr-4", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-05-12", medicationType: "inhaler", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-10-01" },
  { id: "mr-5", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-05-13", medicationType: "inhaler", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-10-01" },
  { id: "mr-6", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-05-14", medicationType: "prescribed_prn", administrationOutcome: "refused", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: false, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-10-01" },
  { id: "mr-7", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-05-12", medicationType: "topical", administrationOutcome: "administered_correctly", twoStaffWitnessed: false, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-08-15" },
  { id: "mr-8", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-05-13", medicationType: "supplement", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: true, storageCorrect: true, reviewDue: "2026-08-15" },
  { id: "mr-9", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-05-14", medicationType: "over_counter", administrationOutcome: "administered_correctly", twoStaffWitnessed: true, consentObtained: true, sideEffectsMonitored: true, documentedImmediately: false, storageCorrect: true, reviewDue: "2026-08-15" },
];

const DEMO_POLICY: MedicationPolicy = {
  id: "pol-1",
  medicationAdministrationPolicy: true,
  controlledDrugsProtocol: true,
  consentFramework: true,
  errorReportingProcess: true,
  storageAuditSchedule: true,
  staffCompetencyCheck: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffMedicationTraining[] = [
  { id: "smt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", medicationAdministration: true, controlledDrugs: true, errorReporting: true, consentPractice: true, sideEffectRecognition: true, storageCompliance: true },
  { id: "smt-2", staffId: "staff-tom", staffName: "Tom Richards", medicationAdministration: true, controlledDrugs: true, errorReporting: true, consentPractice: true, sideEffectRecognition: true, storageCompliance: true },
  { id: "smt-3", staffId: "staff-lisa", staffName: "Lisa Williams", medicationAdministration: true, controlledDrugs: true, errorReporting: true, consentPractice: true, sideEffectRecognition: true, storageCompliance: true },
  { id: "smt-4", staffId: "staff-darren", staffName: "Darren Laville", medicationAdministration: true, controlledDrugs: true, errorReporting: true, consentPractice: true, sideEffectRecognition: true, storageCompliance: true },
];

// -- GET ----------------------------------------------------------------------

export async function GET() {
  const result = generateMedicationAdherenceMonitoringIntelligence(
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
        medicationTypeLabels: Object.fromEntries(
          (["prescribed_regular", "prescribed_prn", "over_counter", "supplement", "controlled", "topical", "inhaler", "injection"] as const).map(
            (t) => [t, getMedicationTypeLabel(t)],
          ),
        ),
        administrationOutcomeLabels: Object.fromEntries(
          (["administered_correctly", "refused", "missed", "delayed", "error"] as const).map(
            (o) => [o, getAdministrationOutcomeLabel(o)],
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

// -- POST ---------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: MedicationRecord[];
    policy?: MedicationPolicy | null;
    training?: StaffMedicationTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateMedicationAdherenceMonitoringIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
