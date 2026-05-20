import { NextResponse } from "next/server";
import {
  generateMedicationIntelligence,
} from "@/lib/medication";
import type { MedicationRecord, MedicationPolicy, StaffMedicationTraining } from "@/lib/medication";

// ── Demo Data: Oak House — 12 records across Alex/Jordan/Morgan, all 8 categories ──

const demoRecords: MedicationRecord[] = [
  // Alex — regular meds + PRN + consent review + competency assessment
  { id: "med-1", homeId: "oak-house", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "regular_administration", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-2", homeId: "oak-house", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "prn_administration", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-3", homeId: "oak-house", date: "2026-03-22", childId: "child-alex", childName: "Alex", category: "consent_review", outcome: "review_completed", administeredCorrectly: true, signedByTwoStaff: false, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-4", homeId: "oak-house", date: "2026-04-15", childId: "child-alex", childName: "Alex", category: "competency_assessment", outcome: "review_completed", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: false },

  // Jordan — controlled drugs + medication error + medication review
  { id: "med-5", homeId: "oak-house", date: "2026-02-18", childId: "child-jordan", childName: "Jordan", category: "controlled_drug", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-6", homeId: "oak-house", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "controlled_drug", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-7", homeId: "oak-house", date: "2026-04-02", childId: "child-jordan", childName: "Jordan", category: "medication_error", outcome: "error_identified", administeredCorrectly: false, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-8", homeId: "oak-house", date: "2026-04-25", childId: "child-jordan", childName: "Jordan", category: "medication_review", outcome: "review_completed", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },

  // Morgan — medication storage + regular + PRN + dose refused
  { id: "med-9", homeId: "oak-house", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "medication_storage", outcome: "not_applicable", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-10", homeId: "oak-house", date: "2026-04-08", childId: "child-morgan", childName: "Morgan", category: "regular_administration", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
  { id: "med-11", homeId: "oak-house", date: "2026-04-28", childId: "child-morgan", childName: "Morgan", category: "prn_administration", outcome: "dose_refused", administeredCorrectly: false, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: false },
  { id: "med-12", homeId: "oak-house", date: "2026-05-10", childId: "child-morgan", childName: "Morgan", category: "regular_administration", outcome: "administered_correctly", administeredCorrectly: true, signedByTwoStaff: true, consentOnFile: true, errorReported: true, documentationComplete: true, timelyRecording: true },
];

const demoPolicy: MedicationPolicy = {
  medicationPolicy: true,
  controlledDrugPolicy: true,
  administrationProcedure: true,
  consentFramework: true,
  errorReportingPolicy: true,
  storagePolicy: true,
  reviewSchedulePolicy: true,
};

const demoStaff: StaffMedicationTraining[] = [
  { staffId: "staff-sarah", medicationAdministration: true, controlledDrugHandling: true, errorReporting: true, consentProcess: true, storageChecks: true, medicationReview: true },
  { staffId: "staff-tom", medicationAdministration: true, controlledDrugHandling: true, errorReporting: true, consentProcess: true, storageChecks: true, medicationReview: false },
  { staffId: "staff-lisa", medicationAdministration: true, controlledDrugHandling: true, errorReporting: true, consentProcess: false, storageChecks: true, medicationReview: true },
  { staffId: "staff-darren", medicationAdministration: true, controlledDrugHandling: true, errorReporting: true, consentProcess: true, storageChecks: true, medicationReview: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateMedicationIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "medication",
        version: "2.0.0",
      },
    },
  });
}
