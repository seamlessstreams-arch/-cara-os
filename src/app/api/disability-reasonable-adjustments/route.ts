// ==============================================================================
// Cornerstone -- Disability & Reasonable Adjustments Intelligence API Route
//
// GET  -> returns Chamberlain House demo disability & reasonable adjustments intelligence
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateDisabilityReasonableAdjustmentsIntelligence,
  disabilityTypeLabels,
  adjustmentStatusLabels,
  equipmentConditionLabels,
  reviewOutcomeLabels,
  ratingLabels,
} from "@/lib/disability-reasonable-adjustments/disability-reasonable-adjustments-engine";
import type {
  AdjustmentRecord,
  AccessibilityAudit,
  EquipmentRecord,
  StaffDisabilityTraining,
} from "@/lib/disability-reasonable-adjustments/disability-reasonable-adjustments-engine";

// -- Chamberlain House Demo Data ------------------------------------------------------

function getDemoData() {
  const adjustments: AdjustmentRecord[] = [
    {
      id: "adj-01",
      childId: "child-alex",
      childName: "Alex",
      disabilityType: "autism_spectrum",
      adjustmentDescription:
        "Visual timetable and low-arousal environment in bedroom; transition warnings 10 minutes before changes",
      adjustmentStatus: "in_place",
      dateImplemented: "2025-09-15",
      reviewDate: "2026-03-15",
      reviewCurrent: true,
      ehcpInPlace: true,
      professionalInvolved: true,
    },
    {
      id: "adj-02",
      childId: "child-alex",
      childName: "Alex",
      disabilityType: "autism_spectrum",
      adjustmentDescription:
        "Noise-cancelling headphones available in communal areas; sensory box in quiet room",
      adjustmentStatus: "in_place",
      dateImplemented: "2025-10-01",
      reviewDate: "2026-04-01",
      reviewCurrent: true,
      ehcpInPlace: true,
      professionalInvolved: true,
    },
    {
      id: "adj-03",
      childId: "child-jordan",
      childName: "Jordan",
      disabilityType: "learning",
      adjustmentDescription:
        "Easy-read care plan and house rules; simplified daily schedule with picture prompts",
      adjustmentStatus: "in_place",
      dateImplemented: "2025-08-20",
      reviewDate: "2026-02-20",
      reviewCurrent: true,
      ehcpInPlace: true,
      professionalInvolved: true,
    },
    {
      id: "adj-04",
      childId: "child-jordan",
      childName: "Jordan",
      disabilityType: "learning",
      adjustmentDescription:
        "Additional time provided for completing daily living tasks; key worker provides verbal reminders",
      adjustmentStatus: "in_place",
      dateImplemented: "2025-08-20",
      reviewDate: "2026-02-20",
      reviewCurrent: true,
      ehcpInPlace: true,
      professionalInvolved: false,
    },
    {
      id: "adj-05",
      childId: "child-morgan",
      childName: "Morgan",
      disabilityType: "sensory_visual",
      adjustmentDescription:
        "Large-print materials provided; high-contrast signage installed throughout home",
      adjustmentStatus: "in_place",
      dateImplemented: "2025-11-01",
      reviewDate: "2026-05-01",
      reviewCurrent: true,
      ehcpInPlace: false,
      professionalInvolved: true,
    },
    {
      id: "adj-06",
      childId: "child-morgan",
      childName: "Morgan",
      disabilityType: "sensory_visual",
      adjustmentDescription:
        "Referral to local authority for EHCP assessment submitted; awaiting panel decision",
      adjustmentStatus: "pending",
      dateImplemented: undefined,
      reviewDate: "2026-06-01",
      reviewCurrent: true,
      ehcpInPlace: false,
      professionalInvolved: true,
    },
  ];

  const audits: AccessibilityAudit[] = [
    {
      id: "audit-01",
      auditDate: "2026-01-15",
      auditor: "Sarah Johnson",
      physicalAccessCompliant: true,
      sensoryEnvironmentAdapted: true,
      communicationAidsAvailable: true,
      signageAccessible: true,
      overallCompliant: true,
    },
    {
      id: "audit-02",
      auditDate: "2026-02-15",
      auditor: "Tom Richards",
      physicalAccessCompliant: true,
      sensoryEnvironmentAdapted: true,
      communicationAidsAvailable: true,
      signageAccessible: true,
      overallCompliant: true,
    },
    {
      id: "audit-03",
      auditDate: "2026-03-15",
      auditor: "Lisa Williams",
      physicalAccessCompliant: true,
      sensoryEnvironmentAdapted: true,
      communicationAidsAvailable: true,
      signageAccessible: true,
      overallCompliant: true,
    },
  ];

  const equipment: EquipmentRecord[] = [
    {
      id: "equip-01",
      childId: "child-alex",
      childName: "Alex",
      equipmentType: "Noise-cancelling headphones",
      condition: "good",
      lastChecked: "2026-04-01",
      maintenanceCurrent: true,
      replacementNeeded: false,
    },
    {
      id: "equip-02",
      childId: "child-alex",
      childName: "Alex",
      equipmentType: "Weighted blanket",
      condition: "good",
      lastChecked: "2026-03-15",
      maintenanceCurrent: true,
      replacementNeeded: false,
    },
    {
      id: "equip-03",
      childId: "child-morgan",
      childName: "Morgan",
      equipmentType: "Desktop magnifier",
      condition: "good",
      lastChecked: "2026-04-10",
      maintenanceCurrent: true,
      replacementNeeded: false,
    },
    {
      id: "equip-04",
      childId: "child-morgan",
      childName: "Morgan",
      equipmentType: "High-contrast keyboard",
      condition: "fair",
      lastChecked: "2026-02-20",
      maintenanceCurrent: true,
      replacementNeeded: false,
    },
  ];

  const training: StaffDisabilityTraining[] = [
    {
      id: "train-01",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      disabilityAwareness: true,
      reasonableAdjustmentsTrained: true,
      ehcpUnderstanding: true,
      communicationStrategies: true,
      personalCareTrained: true,
      emergencyEvacuationTrained: true,
    },
    {
      id: "train-02",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      disabilityAwareness: true,
      reasonableAdjustmentsTrained: true,
      ehcpUnderstanding: true,
      communicationStrategies: true,
      personalCareTrained: true,
      emergencyEvacuationTrained: true,
    },
    {
      id: "train-03",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      disabilityAwareness: true,
      reasonableAdjustmentsTrained: true,
      ehcpUnderstanding: true,
      communicationStrategies: true,
      personalCareTrained: true,
      emergencyEvacuationTrained: true,
    },
    {
      id: "train-04",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      disabilityAwareness: true,
      reasonableAdjustmentsTrained: true,
      ehcpUnderstanding: true,
      communicationStrategies: true,
      personalCareTrained: true,
      emergencyEvacuationTrained: true,
    },
  ];

  return { adjustments, audits, equipment, training };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { adjustments, audits, equipment, training } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];

    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      adjustments,
      audits,
      equipment,
      training,
      "oak-house",
      "2026-01-01",
      "2026-06-30",
      referenceDate,
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          disabilityTypeLabels,
          adjustmentStatusLabels,
          equipmentConditionLabels,
          reviewOutcomeLabels,
          ratingLabels,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Failed to generate disability & reasonable adjustments intelligence",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adjustments,
      audits,
      equipment,
      training,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    if (
      !adjustments ||
      !audits ||
      !equipment ||
      !training ||
      !homeId ||
      !periodStart ||
      !periodEnd ||
      !referenceDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: adjustments, audits, equipment, training, homeId, periodStart, periodEnd, referenceDate",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(adjustments) ||
      !Array.isArray(audits) ||
      !Array.isArray(equipment) ||
      !Array.isArray(training)
    ) {
      return NextResponse.json(
        {
          error:
            "adjustments, audits, equipment, and training must be arrays",
        },
        { status: 400 },
      );
    }

    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      adjustments as AdjustmentRecord[],
      audits as AccessibilityAudit[],
      equipment as EquipmentRecord[],
      training as StaffDisabilityTraining[],
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          disabilityTypeLabels,
          adjustmentStatusLabels,
          equipmentConditionLabels,
          reviewOutcomeLabels,
          ratingLabels,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process disability & reasonable adjustments data",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
