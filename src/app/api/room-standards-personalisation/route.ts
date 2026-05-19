// ══════════════════════════════════════════════════════════════════════════════
// API: /api/room-standards-personalisation
//
// Room Standards & Personalisation Intelligence
//
// GET  — Returns room standards metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateRoomStandardsPersonalisationIntelligence,
  getRoomConditionLabel,
  getPersonalisationLevelLabel,
  getInspectionOutcomeLabel,
  getFurnitureConditionLabel,
  getRatingLabel,
} from "@/lib/room-standards-personalisation";
import type {
  RoomRecord,
  RoomInspection,
  RoomPolicy,
  StaffRoomTraining,
} from "@/lib/room-standards-personalisation";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  rooms: RoomRecord[];
  inspections: RoomInspection[];
  policy: RoomPolicy;
  training: StaffRoomTraining[];
} {
  const rooms: RoomRecord[] = [
    {
      id: "room-001",
      childId: "child-alex",
      childName: "Alex",
      lastInspectionDate: "2026-05-10",
      roomCondition: "good",
      personalisationLevel: "highly_personalised",
      childChosenDecor: true,
      adequateFurniture: true,
      furnitureCondition: "good",
      lockableStorage: true,
      adequateLighting: true,
      heatingAdequate: true,
      windowsSecure: true,
      privacyMeasures: true,
    },
    {
      id: "room-002",
      childId: "child-jordan",
      childName: "Jordan",
      lastInspectionDate: "2026-05-10",
      roomCondition: "excellent",
      personalisationLevel: "personalised",
      childChosenDecor: true,
      adequateFurniture: true,
      furnitureCondition: "new",
      lockableStorage: true,
      adequateLighting: true,
      heatingAdequate: true,
      windowsSecure: true,
      privacyMeasures: true,
    },
    {
      id: "room-003",
      childId: "child-morgan",
      childName: "Morgan",
      lastInspectionDate: "2026-04-28",
      roomCondition: "good",
      personalisationLevel: "personalised",
      childChosenDecor: true,
      adequateFurniture: true,
      furnitureCondition: "good",
      lockableStorage: true,
      adequateLighting: true,
      heatingAdequate: true,
      windowsSecure: true,
      privacyMeasures: true,
    },
  ];

  const inspections: RoomInspection[] = [
    {
      id: "insp-001",
      roomId: "room-001",
      inspectionDate: "2026-05-10",
      inspectedBy: "Darren Laville",
      outcome: "passed",
      issuesFound: [],
      repairsScheduled: false,
      repairsCompleted: false,
    },
    {
      id: "insp-002",
      roomId: "room-002",
      inspectionDate: "2026-05-10",
      inspectedBy: "Darren Laville",
      outcome: "passed",
      issuesFound: [],
      repairsScheduled: false,
      repairsCompleted: false,
    },
    {
      id: "insp-003",
      roomId: "room-003",
      inspectionDate: "2026-04-28",
      inspectedBy: "Sarah Johnson",
      outcome: "minor_issues",
      issuesFound: ["Small mark on wall near door"],
      repairsScheduled: true,
      repairsCompleted: true,
    },
    {
      id: "insp-004",
      roomId: "room-001",
      inspectionDate: "2026-03-15",
      inspectedBy: "Sarah Johnson",
      outcome: "passed",
      issuesFound: [],
      repairsScheduled: false,
      repairsCompleted: false,
    },
    {
      id: "insp-005",
      roomId: "room-002",
      inspectionDate: "2026-03-15",
      inspectedBy: "Tom Richards",
      outcome: "passed",
      issuesFound: [],
      repairsScheduled: false,
      repairsCompleted: false,
    },
    {
      id: "insp-006",
      roomId: "room-003",
      inspectionDate: "2026-03-15",
      inspectedBy: "Tom Richards",
      outcome: "passed",
      issuesFound: [],
      repairsScheduled: false,
      repairsCompleted: false,
    },
  ];

  const policy: RoomPolicy = {
    id: "rp-001",
    policyReviewDate: "2026-03-01",
    policyCurrent: true,
    minimumStandards: true,
    personalisationBudget: true,
    regularInspections: true,
    childInputRequired: true,
    repairTimescalesSet: true,
    safetyChecksIncluded: true,
  };

  const training: StaffRoomTraining[] = [
    {
      id: "srt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      roomStandards: true,
      personalisationImportance: true,
      privacyAwareness: true,
      maintenanceReporting: true,
      safetyChecks: true,
      childParticipation: true,
    },
    {
      id: "srt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      roomStandards: true,
      personalisationImportance: true,
      privacyAwareness: true,
      maintenanceReporting: true,
      safetyChecks: true,
      childParticipation: true,
    },
    {
      id: "srt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      roomStandards: true,
      personalisationImportance: true,
      privacyAwareness: true,
      maintenanceReporting: true,
      safetyChecks: true,
      childParticipation: false,
    },
    {
      id: "srt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      roomStandards: true,
      personalisationImportance: true,
      privacyAwareness: true,
      maintenanceReporting: true,
      safetyChecks: true,
      childParticipation: true,
    },
  ];

  return { rooms, inspections, policy, training };
}

// ── Label Maps for Meta ───────────────────────────────────────────────────

const roomConditionLabels = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  needs_repair: "Needs Repair",
};

const personalisationLevelLabels = {
  highly_personalised: "Highly Personalised",
  personalised: "Personalised",
  some_personalisation: "Some Personalisation",
  minimal: "Minimal",
  none: "None",
};

const inspectionOutcomeLabels = {
  passed: "Passed",
  minor_issues: "Minor Issues",
  major_issues: "Major Issues",
  failed: "Failed",
};

const furnitureConditionLabels = {
  new: "New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  replacement_needed: "Replacement Needed",
};

const ratingLabels = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { rooms, inspections, policy, training } = generateDemoData();

  const result = generateRoomStandardsPersonalisationIntelligence(
    rooms,
    inspections,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        roomConditionLabels,
        personalisationLevelLabels,
        inspectionOutcomeLabels,
        furnitureConditionLabels,
        ratingLabels,
        ratingLabel: getRatingLabel(result.rating),
        roomSummary: rooms.map((r) => ({
          id: r.id,
          childName: r.childName,
          condition: getRoomConditionLabel(r.roomCondition),
          personalisation: getPersonalisationLevelLabel(r.personalisationLevel),
          furniture: getFurnitureConditionLabel(r.furnitureCondition),
        })),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    rooms,
    inspections,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    rooms?: RoomRecord[];
    inspections?: RoomInspection[];
    policy?: RoomPolicy | null;
    training?: StaffRoomTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateRoomStandardsPersonalisationIntelligence(
    rooms ?? [],
    inspections ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
