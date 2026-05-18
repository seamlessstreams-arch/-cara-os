// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Medication Error Prevention Intelligence API Route
//
// GET  → returns Oak House demo medication error prevention intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateMedicationErrorPreventionIntelligence } from "@/lib/medication-error-prevention/medication-error-prevention-engine";
import type {
  MedicationAdministration,
  MedicationError,
  StorageAudit,
  StaffMedicationTraining,
} from "@/lib/medication-error-prevention/medication-error-prevention-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const administrations: MedicationAdministration[] = [
    // Alex — daily Sertraline 50mg (prescribed), all on time
    {
      id: "admin-a1", childId: "child-alex", childName: "Alex",
      medicationName: "Sertraline 50mg", medicationType: "prescribed",
      scheduledTime: "2025-02-10T08:00:00", actualTime: "2025-02-10T08:05:00",
      status: "given_on_time", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    {
      id: "admin-a2", childId: "child-alex", childName: "Alex",
      medicationName: "Sertraline 50mg", medicationType: "prescribed",
      scheduledTime: "2025-02-11T08:00:00", actualTime: "2025-02-11T07:58:00",
      status: "given_on_time", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Alex — PRN Ibuprofen (as needed), on time
    {
      id: "admin-a3", childId: "child-alex", childName: "Alex",
      medicationName: "Ibuprofen 200mg", medicationType: "prn",
      scheduledTime: "2025-03-05T14:30:00", actualTime: "2025-03-05T14:35:00",
      status: "given_on_time", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Jordan — prescribed Methylphenidate 10mg (controlled), on time
    {
      id: "admin-j1", childId: "child-jordan", childName: "Jordan",
      medicationName: "Methylphenidate 10mg", medicationType: "controlled",
      scheduledTime: "2025-02-10T07:30:00", actualTime: "2025-02-10T07:32:00",
      status: "given_on_time", administeredBy: "Lisa Williams", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Jordan — prescribed Melatonin 3mg, given late
    {
      id: "admin-j2", childId: "child-jordan", childName: "Jordan",
      medicationName: "Melatonin 3mg", medicationType: "prescribed",
      scheduledTime: "2025-02-10T20:00:00", actualTime: "2025-02-10T21:15:00",
      status: "given_late", administeredBy: "Tom Richards", witnessedBy: null,
      twoPersonCheck: false, documentedImmediately: false, childConsent: true, sideEffectsMonitored: false,
    },
    // Morgan — self-administering Vitamin D 1000IU (supplement) with oversight
    {
      id: "admin-m1", childId: "child-morgan", childName: "Morgan",
      medicationName: "Vitamin D 1000IU", medicationType: "supplement",
      scheduledTime: "2025-02-10T08:00:00", actualTime: "2025-02-10T08:10:00",
      status: "self_administered", administeredBy: "Morgan (self)", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    {
      id: "admin-m2", childId: "child-morgan", childName: "Morgan",
      medicationName: "Vitamin D 1000IU", medicationType: "supplement",
      scheduledTime: "2025-02-11T08:00:00", actualTime: "2025-02-11T08:05:00",
      status: "self_administered", administeredBy: "Morgan (self)", witnessedBy: "Tom Richards",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
  ];

  const errors: MedicationError[] = [
    // Jordan — near-miss error (wrong time caught before administration)
    {
      id: "err-j1", childId: "child-jordan", childName: "Jordan",
      errorType: "near_miss", severity: "no_harm", date: "2025-03-15",
      discoveredBy: "Sarah Johnson",
      reportedImmediately: true, parentNotified: true, gpNotified: false,
      rootCauseIdentified: true, preventiveActionTaken: true, dutyOfCandourMet: true,
    },
  ];

  const audits: StorageAudit[] = [
    // Fully compliant audit
    {
      id: "audit-1", homeId: "oak-house", auditDate: "2025-02-01", auditor: "Sarah Johnson",
      controlledDrugsSecure: true, temperatureMonitored: true, temperatureInRange: true,
      expiryDatesChecked: true, expiredMedicationFound: false,
      marChartAccurate: true, stockReconciled: true, overallCompliance: "fully_compliant",
    },
    // Minor issues audit — temperature out of range
    {
      id: "audit-2", homeId: "oak-house", auditDate: "2025-04-01", auditor: "Lisa Williams",
      controlledDrugsSecure: true, temperatureMonitored: true, temperatureInRange: false,
      expiryDatesChecked: true, expiredMedicationFound: false,
      marChartAccurate: true, stockReconciled: true, overallCompliance: "minor_issues",
    },
  ];

  const training: StaffMedicationTraining[] = [
    // Sarah — current, fully trained
    {
      id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      trainingDate: "2025-01-10", expiryDate: "2026-01-10",
      trainingStatus: "current", competencyAssessed: true,
      controlledDrugsTraining: true, errorReportingTraining: true,
    },
    // Tom — expiring soon
    {
      id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards",
      trainingDate: "2024-07-15", expiryDate: "2025-07-15",
      trainingStatus: "expiring_soon", competencyAssessed: true,
      controlledDrugsTraining: false, errorReportingTraining: true,
    },
    // Lisa — current with controlled drugs training
    {
      id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams",
      trainingDate: "2025-02-01", expiryDate: "2026-02-01",
      trainingStatus: "current", competencyAssessed: true,
      controlledDrugsTraining: true, errorReportingTraining: true,
    },
  ];

  return { administrations, errors, audits, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { administrations, errors, audits, training } = getDemoData();
    const result = generateMedicationErrorPreventionIntelligence(
      administrations, errors, audits, training,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate medication error prevention intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { administrations, errors, audits, training, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(administrations) || !Array.isArray(errors) || !Array.isArray(audits) || !Array.isArray(training)) {
      return NextResponse.json(
        { error: "administrations, errors, audits, and training must be arrays" },
        { status: 400 },
      );
    }

    const result = generateMedicationErrorPreventionIntelligence(
      administrations, errors, audits, training,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process medication error prevention data", details: String(error) },
      { status: 500 },
    );
  }
}
