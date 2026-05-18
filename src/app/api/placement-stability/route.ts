// ══════════════════════════════════════════════════════════════════════════════
// API: /api/placement-stability
//
// Placement Stability Intelligence
//
// GET  — Returns Oak House demo data with full intelligence analysis
// POST — Accepts custom placement/disruption/support/matching/outcome data
//        and returns analysis
//
// CHR 2015 Reg 36 — Assessment of prospective placements
// CHR 2015 Reg 14 — Care planning (matching)
// SCCIF — Stability and permanence
// Children Act 1989 s22C
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generatePlacementStabilityIntelligence } from "@/lib/placement-stability";
import type {
  Placement,
  DisruptionEvent,
  StabilitySupport,
  MatchingRecord,
  MatchingFactorScore,
  PlacementOutcome,
} from "@/lib/placement-stability";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): {
  placements: Placement[];
  disruptions: DisruptionEvent[];
  supports: StabilitySupport[];
  matchingRecords: MatchingRecord[];
  outcomes: PlacementOutcome[];
} {
  const fullFactors = (baseScore: number): MatchingFactorScore[] => {
    const factors = [
      "age_compatibility",
      "needs_compatibility",
      "risk_compatibility",
      "peer_dynamics",
      "cultural_needs",
      "statement_of_purpose_fit",
      "location_suitability",
      "therapeutic_alignment",
    ] as const;
    return factors.map((factor) => ({
      factor,
      score: baseScore,
      rationale: `Assessed as ${baseScore}/5 for ${factor}`,
    }));
  };

  const placements: Placement[] = [
    {
      id: "plc-001",
      childId: "child-alex",
      childName: "Alex",
      childAge: 14,
      homeId: "oak-house",
      startDate: "2025-09-01",
      status: "active",
      isEmergencyPlacement: false,
      placingAuthority: "Manchester City Council",
      keyWorker: "Sarah Johnson",
      plannedDurationMonths: 12,
    },
    {
      id: "plc-002",
      childId: "child-jordan",
      childName: "Jordan",
      childAge: 13,
      homeId: "oak-house",
      startDate: "2025-11-15",
      status: "active",
      isEmergencyPlacement: false,
      placingAuthority: "Salford City Council",
      keyWorker: "Tom Richards",
      plannedDurationMonths: 18,
    },
    {
      id: "plc-003",
      childId: "child-morgan",
      childName: "Morgan",
      childAge: 15,
      homeId: "oak-house",
      startDate: "2026-01-10",
      status: "active",
      isEmergencyPlacement: false,
      placingAuthority: "Bolton Council",
      keyWorker: "Lisa Williams",
      plannedDurationMonths: 12,
    },
  ];

  const disruptions: DisruptionEvent[] = [
    {
      id: "dis-001",
      placementId: "plc-002",
      childId: "child-jordan",
      date: "2026-02-10",
      factors: ["peer_conflict", "behavioural_escalation"],
      severity: "medium",
      wasAnticipated: true,
      preventionAttempted: true,
      preventionSuccessful: true,
      supportProvided: ["key_worker_session", "peer_mediation"],
      outcome: "Resolved through structured mediation between Jordan and Alex",
      recordedBy: "Tom Richards",
    },
    {
      id: "dis-002",
      placementId: "plc-003",
      childId: "child-morgan",
      date: "2026-03-05",
      factors: ["education_breakdown"],
      severity: "low",
      wasAnticipated: false,
      preventionAttempted: true,
      preventionSuccessful: false,
      supportProvided: ["education_support", "multi_agency_meeting"],
      outcome: "Alternative education provision identified and PEP updated",
      recordedBy: "Lisa Williams",
    },
    {
      id: "dis-003",
      placementId: "plc-001",
      childId: "child-alex",
      date: "2026-04-01",
      factors: ["family_contact_issues", "mental_health_crisis"],
      severity: "high",
      wasAnticipated: true,
      preventionAttempted: true,
      preventionSuccessful: true,
      supportProvided: ["therapeutic_intervention", "crisis_intervention", "key_worker_session"],
      outcome: "Family contact arrangements renegotiated and therapeutic support increased",
      recordedBy: "Sarah Johnson",
    },
  ];

  const supports: StabilitySupport[] = [
    {
      id: "sup-001",
      placementId: "plc-001",
      childId: "child-alex",
      date: "2026-01-15",
      type: "key_worker_session",
      description: "Weekly key worker session — reviewed placement goals and education progress",
      providedBy: "Sarah Johnson",
      childEngaged: true,
      outcomePositive: true,
    },
    {
      id: "sup-002",
      placementId: "plc-002",
      childId: "child-jordan",
      date: "2026-02-12",
      type: "peer_mediation",
      description: "Structured mediation session following peer conflict with Alex",
      providedBy: "Tom Richards",
      childEngaged: true,
      outcomePositive: true,
    },
    {
      id: "sup-003",
      placementId: "plc-003",
      childId: "child-morgan",
      date: "2026-03-10",
      type: "education_support",
      description: "PEP review with virtual school head and alternative provision planning",
      providedBy: "Lisa Williams",
      childEngaged: true,
      outcomePositive: true,
    },
    {
      id: "sup-004",
      placementId: "plc-001",
      childId: "child-alex",
      date: "2026-04-02",
      type: "therapeutic_intervention",
      description: "Additional therapeutic session following family contact issues",
      providedBy: "Sarah Johnson",
      childEngaged: true,
      outcomePositive: true,
    },
    {
      id: "sup-005",
      placementId: "plc-002",
      childId: "child-jordan",
      date: "2026-04-15",
      type: "placement_review_meeting",
      description: "6-month placement review with social worker and IRO",
      providedBy: "Darren Laville",
      childEngaged: true,
      outcomePositive: true,
    },
  ];

  const matchingRecords: MatchingRecord[] = [
    {
      id: "mr-001",
      placementId: "plc-001",
      childId: "child-alex",
      assessedBy: "Lisa Williams",
      assessmentDate: "2025-08-25",
      factors: fullFactors(4),
      overallScore: 4.0,
      impactAssessmentCompleted: true,
      existingChildrenConsulted: true,
      childViewsRecorded: true,
      riskAssessmentCompleted: true,
      notes: "Alex is a good match for Oak House. Emotional support needs align with the home's therapeutic approach.",
    },
    {
      id: "mr-002",
      placementId: "plc-002",
      childId: "child-jordan",
      assessedBy: "Lisa Williams",
      assessmentDate: "2025-11-01",
      factors: fullFactors(3),
      overallScore: 3.0,
      impactAssessmentCompleted: true,
      existingChildrenConsulted: true,
      childViewsRecorded: false,
      riskAssessmentCompleted: true,
      notes: "Jordan's therapeutic needs can be met. Peer dynamics will need monitoring given existing group.",
    },
    {
      id: "mr-003",
      placementId: "plc-003",
      childId: "child-morgan",
      assessedBy: "Lisa Williams",
      assessmentDate: "2026-01-05",
      factors: [
        { factor: "age_compatibility", score: 4, rationale: "Good age fit with current group" },
        { factor: "needs_compatibility", score: 3, rationale: "Education needs require additional support" },
        { factor: "risk_compatibility", score: 3, rationale: "Manageable risk with existing safety plan" },
        { factor: "peer_dynamics", score: 4, rationale: "Good fit with existing group dynamics" },
        { factor: "statement_of_purpose_fit", score: 4, rationale: "Matches home's statement of purpose" },
      ],
      overallScore: 3.6,
      impactAssessmentCompleted: true,
      existingChildrenConsulted: false,
      childViewsRecorded: true,
      riskAssessmentCompleted: true,
      notes: "Morgan is a reasonable match. Education support will be key to placement success.",
    },
  ];

  const outcomes: PlacementOutcome[] = [
    {
      id: "out-001",
      placementId: "plc-001",
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-04-01",
      areas: [
        { area: "education_engagement", rating: "some_improvement", evidence: "Attendance improved from 70% to 88% since placement" },
        { area: "health_wellbeing", rating: "significant_improvement", evidence: "Registered with GP, attending CAMHS fortnightly, dental check completed" },
        { area: "behaviour_progress", rating: "some_improvement", evidence: "Reduced incidents from 3/week to 1/week since January" },
        { area: "emotional_regulation", rating: "stable", evidence: "Maintaining use of strategies learned in therapy" },
        { area: "social_relationships", rating: "some_improvement", evidence: "Developed positive friendship with Jordan. Attending youth club." },
        { area: "independent_skills", rating: "stable", evidence: "Cooking and cleaning skills developing. Manages pocket money." },
      ],
      overallProgress: "some_improvement",
      educationAttendancePercent: 88,
      healthAppointmentsAttended: true,
      carePlanUpToDate: true,
      reviewedBy: "Darren Laville",
    },
    {
      id: "out-002",
      placementId: "plc-002",
      childId: "child-jordan",
      childName: "Jordan",
      reviewDate: "2026-04-01",
      areas: [
        { area: "education_engagement", rating: "stable", evidence: "Maintaining 75% attendance at school" },
        { area: "health_wellbeing", rating: "some_improvement", evidence: "Engaging with CAMHS. Physical health improving." },
        { area: "behaviour_progress", rating: "some_improvement", evidence: "Fewer incidents since peer mediation in February" },
        { area: "emotional_regulation", rating: "some_improvement", evidence: "Using breathing techniques and key worker support" },
        { area: "social_relationships", rating: "stable", evidence: "Peer relationships stable. Building trust with staff." },
        { area: "independent_skills", rating: "some_improvement", evidence: "Learning budgeting and cooking with key worker support" },
      ],
      overallProgress: "some_improvement",
      educationAttendancePercent: 75,
      healthAppointmentsAttended: true,
      carePlanUpToDate: true,
      reviewedBy: "Darren Laville",
    },
    {
      id: "out-003",
      placementId: "plc-003",
      childId: "child-morgan",
      childName: "Morgan",
      reviewDate: "2026-04-01",
      areas: [
        { area: "education_engagement", rating: "some_decline", evidence: "Attendance dropped to 60% after education breakdown in March" },
        { area: "health_wellbeing", rating: "stable", evidence: "Physical health stable. CAMHS referral pending." },
        { area: "behaviour_progress", rating: "stable", evidence: "Consistent behaviour at home. No significant incidents." },
        { area: "emotional_regulation", rating: "some_improvement", evidence: "Engaging well with key worker. Using grounding techniques." },
        { area: "social_relationships", rating: "some_improvement", evidence: "Building friendships at home. Starting youth club." },
        { area: "independent_skills", rating: "significant_improvement", evidence: "Excellent progress with cooking and self-care. Very motivated." },
      ],
      overallProgress: "stable",
      educationAttendancePercent: 60,
      healthAppointmentsAttended: false,
      carePlanUpToDate: true,
      reviewedBy: "Darren Laville",
    },
  ];

  return { placements, disruptions, supports, matchingRecords, outcomes };
}

// ── Validation ─────────────────────────────────────────────────────────────

function validatePostBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    placements: Placement[];
    disruptions: DisruptionEvent[];
    supports: StabilitySupport[];
    matchingRecords: MatchingRecord[];
    outcomes: PlacementOutcome[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.placements)) {
    return { valid: false, error: "placements must be an array" };
  }

  if (!Array.isArray(b.disruptions)) {
    return { valid: false, error: "disruptions must be an array" };
  }

  if (!Array.isArray(b.supports)) {
    return { valid: false, error: "supports must be an array" };
  }

  if (!Array.isArray(b.matchingRecords)) {
    return { valid: false, error: "matchingRecords must be an array" };
  }

  if (!Array.isArray(b.outcomes)) {
    return { valid: false, error: "outcomes must be an array" };
  }

  return {
    valid: true,
    data: {
      placements: b.placements as Placement[],
      disruptions: b.disruptions as DisruptionEvent[],
      supports: b.supports as StabilitySupport[],
      matchingRecords: b.matchingRecords as MatchingRecord[],
      outcomes: b.outcomes as PlacementOutcome[],
      homeId: typeof b.homeId === "string" ? b.homeId : undefined,
      periodStart: typeof b.periodStart === "string" ? b.periodStart : undefined,
      periodEnd: typeof b.periodEnd === "string" ? b.periodEnd : undefined,
      referenceDate: typeof b.referenceDate === "string" ? b.referenceDate : undefined,
    },
  };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { placements, disruptions, supports, matchingRecords, outcomes } = generateDemoData();

  const intelligence = generatePlacementStabilityIntelligence(
    placements,
    disruptions,
    supports,
    matchingRecords,
    outcomes,
    "oak-house",
    "2025-09-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({ data: intelligence });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validatePostBody(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const { placements, disruptions, supports, matchingRecords, outcomes, homeId, periodStart, periodEnd, referenceDate } =
      validation.data!;

    const now = new Date().toISOString().split("T")[0];
    const intelligence = generatePlacementStabilityIntelligence(
      placements,
      disruptions,
      supports,
      matchingRecords,
      outcomes,
      homeId ?? "unknown",
      periodStart ?? now,
      periodEnd ?? now,
      referenceDate ?? now,
    );

    return NextResponse.json({ data: intelligence });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
