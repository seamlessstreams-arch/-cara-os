import { NextResponse } from "next/server";
import {
  generateMedicationIntelligence,
  getMedicationTypeLabel,
  getAdministrationOutcomeLabel,
  getRatingLabel,
} from "@/lib/medication";
import type {
  MedicationAdministration,
  MedicationPolicy,
  StaffMedicationTraining,
} from "@/lib/medication";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  administrations: MedicationAdministration[];
  policy: MedicationPolicy;
  training: StaffMedicationTraining[];
} {
  const administrations: MedicationAdministration[] = [
    // Alex — regular oral medications (morning and evening)
    { id: "admin-001", childId: "child-alex", childName: "Alex", administrationDate: "2026-01-15", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-002", childId: "child-alex", childName: "Alex", administrationDate: "2026-02-05", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-003", childId: "child-alex", childName: "Alex", administrationDate: "2026-02-20", medicationType: "inhaler", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: false, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-004", childId: "child-alex", childName: "Alex", administrationDate: "2026-03-10", medicationType: "liquid", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-005", childId: "child-alex", childName: "Alex", administrationDate: "2026-03-25", medicationType: "regular_oral", outcome: "refused_by_child", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: false, storageCompliant: true, marChartUpdated: true },
    { id: "admin-006", childId: "child-alex", childName: "Alex", administrationDate: "2026-04-05", medicationType: "topical", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: false, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-007", childId: "child-alex", childName: "Alex", administrationDate: "2026-04-18", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-008", childId: "child-alex", childName: "Alex", administrationDate: "2026-05-02", medicationType: "prn_as_needed", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },

    // Jordan — controlled drugs and regular medication
    { id: "admin-009", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-01-20", medicationType: "controlled_drug", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-010", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-02-10", medicationType: "controlled_drug", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-011", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-02-28", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-012", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-03-15", medicationType: "controlled_drug", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-013", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-04-01", medicationType: "injectable", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-014", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-04-20", medicationType: "controlled_drug", outcome: "error_occurred", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-015", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-05-05", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },

    // Morgan — patch and PRN medications
    { id: "admin-016", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-01-25", medicationType: "patch", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-017", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-02-15", medicationType: "patch", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-018", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-03-05", medicationType: "prn_as_needed", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: false, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-019", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-03-20", medicationType: "regular_oral", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-020", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-04-10", medicationType: "topical", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-021", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-04-28", medicationType: "patch", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
    { id: "admin-022", childId: "child-morgan", childName: "Morgan", administrationDate: "2026-05-10", medicationType: "inhaler", outcome: "administered_correctly", consentObtained: true, twoStaffWitnessed: true, documentedCorrectly: true, sideEffectsMonitored: true, storageCompliant: true, marChartUpdated: true },
  ];

  const policy: MedicationPolicy = {
    id: "pol-001",
    medicationManagementPolicy: true,
    controlledDrugsProcedure: true,
    administrationProtocol: true,
    storageAndDisposalPolicy: true,
    errorReportingProcess: true,
    consentFramework: true,
    regularReview: true,
  };

  const training: StaffMedicationTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", medicationAdministration: true, controlledDrugsHandling: true, errorRecognition: true, sideEffectsAwareness: true, storageRequirements: true, consentAndCapacity: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", medicationAdministration: true, controlledDrugsHandling: true, errorRecognition: true, sideEffectsAwareness: true, storageRequirements: true, consentAndCapacity: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", medicationAdministration: true, controlledDrugsHandling: true, errorRecognition: true, sideEffectsAwareness: false, storageRequirements: true, consentAndCapacity: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", medicationAdministration: true, controlledDrugsHandling: true, errorRecognition: true, sideEffectsAwareness: true, storageRequirements: true, consentAndCapacity: true },
  ];

  return { administrations, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { administrations, policy, training } = generateDemoData();

  const result = generateMedicationIntelligence(
    administrations,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "medication-intelligence",
        version: "1.0.0",
      },
    },
  });
}
