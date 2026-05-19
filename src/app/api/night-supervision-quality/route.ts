// ══════════════════════════════════════════════════════════════════════════════
// API: /api/night-supervision-quality
//
// Night Supervision Quality Intelligence
//
// GET  — Returns night supervision quality metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateNightSupervisionQualityIntelligence,
  getNightCheckTypeLabel,
  getCheckOutcomeLabel,
  getRatingLabel,
} from "@/lib/night-supervision-quality";
import type {
  NightCheck,
  NightPolicy,
  StaffNightTraining,
} from "@/lib/night-supervision-quality";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  checks: NightCheck[];
  policy: NightPolicy;
  training: StaffNightTraining[];
} {
  const checks: NightCheck[] = [
    {
      id: "nc-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      checkDate: "2026-03-15",
      nightCheckType: "welfare_check",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-002",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      checkDate: "2026-03-16",
      nightCheckType: "bed_check",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-003",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      checkDate: "2026-03-17",
      nightCheckType: "room_check",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-004",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      checkDate: "2026-03-18",
      nightCheckType: "perimeter_check",
      checkOutcome: "concern_noted",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: false,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-005",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      checkDate: "2026-03-19",
      nightCheckType: "medication_check",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-006",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      checkDate: "2026-03-20",
      nightCheckType: "fire_safety",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-007",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      checkDate: "2026-04-01",
      nightCheckType: "emergency_response",
      checkOutcome: "intervention_needed",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-008",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      checkDate: "2026-04-05",
      nightCheckType: "handover",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-009",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      checkDate: "2026-04-10",
      nightCheckType: "welfare_check",
      checkOutcome: "child_awake",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
    {
      id: "nc-010",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      checkDate: "2026-04-15",
      nightCheckType: "bed_check",
      checkOutcome: "satisfactory",
      childrenAccountedFor: true,
      documentedImmediately: true,
      environmentSafe: true,
      responseTimeAdequate: true,
      handoverCompleted: true,
      incidentsReported: true,
    },
  ];

  const policy: NightPolicy = {
    id: "pol-001",
    nightStaffingPolicy: true,
    checkFrequencyStandard: true,
    wakingNightCriteria: true,
    sleepingNightProtocol: true,
    emergencyResponsePlan: true,
    handoverProcedure: true,
    regularReview: true,
  };

  const training: StaffNightTraining[] = [
    {
      id: "snt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      nightSupervisionSkills: true,
      safeguardingAtNight: true,
      emergencyFirstAid: true,
      fireEvacuation: true,
      childProtocol: true,
      documentationSkills: true,
    },
    {
      id: "snt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      nightSupervisionSkills: true,
      safeguardingAtNight: true,
      emergencyFirstAid: true,
      fireEvacuation: true,
      childProtocol: true,
      documentationSkills: true,
    },
    {
      id: "snt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      nightSupervisionSkills: true,
      safeguardingAtNight: true,
      emergencyFirstAid: true,
      fireEvacuation: true,
      childProtocol: true,
      documentationSkills: false,
    },
    {
      id: "snt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      nightSupervisionSkills: true,
      safeguardingAtNight: true,
      emergencyFirstAid: true,
      fireEvacuation: true,
      childProtocol: true,
      documentationSkills: true,
    },
  ];

  return { checks, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { checks, policy, training } = generateDemoData();

  const result = generateNightSupervisionQualityIntelligence(
    checks,
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
        checkSummary: checks.map((c) => ({
          id: c.id,
          staffName: c.staffName,
          date: c.checkDate,
          type: getNightCheckTypeLabel(c.nightCheckType),
          outcome: getCheckOutcomeLabel(c.checkOutcome),
        })),
        ratingLabel: getRatingLabel(result.rating),
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
    checks,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    checks?: NightCheck[];
    policy?: NightPolicy | null;
    training?: StaffNightTraining[];
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

  const result = generateNightSupervisionQualityIntelligence(
    checks ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
