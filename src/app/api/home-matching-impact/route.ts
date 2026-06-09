// ══════════════════════════════════════════════════════════════════════════════
// API: /api/home-matching-impact
//
// Home Matching Impact Intelligence
//
// GET  — Returns Chamberlain House demo data with full intelligence analysis
// POST — Accepts custom assessment/monitoring/consultation/outcome data
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateHomeMatchingImpactIntelligence } from "@/lib/home-matching-impact";
import type {
  MatchingAssessment,
  ImpactMonitoring,
  ResidentConsultation,
  AdmissionOutcome,
} from "@/lib/home-matching-impact";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): {
  assessments: MatchingAssessment[];
  monitoring: ImpactMonitoring[];
  consultations: ResidentConsultation[];
  outcomes: AdmissionOutcome[];
} {
  const assessments: MatchingAssessment[] = [
    {
      id: "ma-001",
      homeId: "oak-house",
      childId: "child-001",
      childName: "Alex",
      assessmentDate: "2026-04-05",
      admissionType: "planned",
      assessedBy: "Sarah Johnson",
      existingChildrenConsulted: true,
      existingChildrenIds: ["child-002"],
      riskFactorsIdentified: ["absconding history"],
      protectiveFactors: ["positive peer relationships", "engaged in education"],
      compatibilityScore: 8,
      decision: "proceed",
      conditionsApplied: [],
      reviewDate: "2026-05-05",
    },
    {
      id: "ma-002",
      homeId: "oak-house",
      childId: "child-003",
      childName: "Morgan",
      assessmentDate: "2026-04-15",
      admissionType: "emergency",
      assessedBy: "Lisa Williams",
      existingChildrenConsulted: false,
      existingChildrenIds: [],
      riskFactorsIdentified: ["self-harm", "peer conflict", "substance misuse"],
      protectiveFactors: ["responsive to boundaries"],
      compatibilityScore: 5,
      decision: "proceed_with_conditions",
      conditionsApplied: ["daily risk review", "enhanced staffing for first 7 days"],
      reviewDate: "2026-04-22",
    },
    {
      id: "ma-003",
      homeId: "oak-house",
      childId: "child-004",
      childName: "Riley",
      assessmentDate: "2026-04-25",
      admissionType: "planned",
      assessedBy: "Sarah Johnson",
      existingChildrenConsulted: true,
      existingChildrenIds: ["child-001", "child-002", "child-003"],
      riskFactorsIdentified: ["criminal exploitation", "violence to peers", "county lines"],
      protectiveFactors: [],
      compatibilityScore: 3,
      decision: "decline",
      conditionsApplied: [],
      reviewDate: "",
    },
  ];

  const monitoring: ImpactMonitoring[] = [
    {
      id: "im-001",
      homeId: "oak-house",
      newChildId: "child-001",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-15",
      impactArea: "peer_dynamics",
      impactLevel: "positive",
      evidence: "Jordan and Alex have formed a positive friendship, engaging in shared activities",
      mitigationAction: "",
      resolved: true,
    },
    {
      id: "im-002",
      homeId: "oak-house",
      newChildId: "child-001",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-20",
      impactArea: "emotional_wellbeing",
      impactLevel: "positive",
      evidence: "Jordan appears happier since Alex's arrival, more engaged in house activities",
      mitigationAction: "",
      resolved: true,
    },
    {
      id: "im-003",
      homeId: "oak-house",
      newChildId: "child-003",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-20",
      impactArea: "behaviour",
      impactLevel: "negative",
      evidence: "Jordan showing increased anxiety and withdrawn behaviour since Morgan arrived",
      mitigationAction: "Increased 1:1 keyworker sessions for Jordan, calming strategies reinforced",
      resolved: false,
    },
    {
      id: "im-004",
      homeId: "oak-house",
      newChildId: "child-003",
      existingChildId: "child-001",
      existingChildName: "Alex",
      monitoringDate: "2026-04-20",
      impactArea: "routines",
      impactLevel: "neutral",
      evidence: "Alex's routines have not been significantly affected by Morgan's admission",
      mitigationAction: "",
      resolved: true,
    },
    {
      id: "im-005",
      homeId: "oak-house",
      newChildId: "child-003",
      existingChildId: "child-001",
      existingChildName: "Alex",
      monitoringDate: "2026-04-25",
      impactArea: "safety",
      impactLevel: "significant_negative",
      evidence: "Alex reported feeling unsafe after Morgan's aggressive outburst in communal area",
      mitigationAction: "Safety plan updated, staff debriefing completed, incident reported to placing authority",
      resolved: true,
    },
    {
      id: "im-006",
      homeId: "oak-house",
      newChildId: "child-003",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-28",
      impactArea: "education",
      impactLevel: "negative",
      evidence: "Jordan missed school twice, citing not wanting to leave the house while Morgan is there",
      mitigationAction: "School transport arranged, discussion with Jordan about safety measures in place",
      resolved: true,
    },
  ];

  const consultations: ResidentConsultation[] = [
    {
      id: "rc-001",
      homeId: "oak-house",
      childId: "child-001",
      childName: "Jordan",
      consultationDate: "2026-04-03",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Jordan is excited about having someone close in age to share activities with",
      viewsActedUpon: true,
    },
    {
      id: "rc-002",
      homeId: "oak-house",
      childId: "child-003",
      childName: "Jordan",
      consultationDate: "2026-04-16",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Jordan expressed worry about the new person, asked questions about what would happen",
      viewsActedUpon: false,
    },
    {
      id: "rc-003",
      homeId: "oak-house",
      childId: "child-003",
      childName: "Alex",
      consultationDate: "2026-04-16",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Alex felt neutral about new admission but wanted reassurance about personal space",
      viewsActedUpon: true,
    },
  ];

  const outcomes: AdmissionOutcome[] = [
    {
      id: "ao-001",
      homeId: "oak-house",
      childId: "child-001",
      childName: "Alex",
      admissionDate: "2026-04-10",
      matchingAssessmentId: "ma-001",
      placementStable: true,
      daysToSettle: 5,
      disruptionOccurred: false,
      disruptionReason: "",
    },
    {
      id: "ao-002",
      homeId: "oak-house",
      childId: "child-003",
      childName: "Morgan",
      admissionDate: "2026-04-16",
      matchingAssessmentId: "ma-002",
      placementStable: false,
      daysToSettle: 14,
      disruptionOccurred: true,
      disruptionReason: "aggressive outburst towards peer",
    },
  ];

  return { assessments, monitoring, consultations, outcomes };
}

// ── Validation ─────────────────────────────────────────────────────────────

function validatePostBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    assessments: MatchingAssessment[];
    monitoring: ImpactMonitoring[];
    consultations: ResidentConsultation[];
    outcomes: AdmissionOutcome[];
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

  if (!Array.isArray(b.assessments)) {
    return { valid: false, error: "assessments must be an array" };
  }

  if (!Array.isArray(b.monitoring)) {
    return { valid: false, error: "monitoring must be an array" };
  }

  if (!Array.isArray(b.consultations)) {
    return { valid: false, error: "consultations must be an array" };
  }

  if (!Array.isArray(b.outcomes)) {
    return { valid: false, error: "outcomes must be an array" };
  }

  return {
    valid: true,
    data: {
      assessments: b.assessments as MatchingAssessment[],
      monitoring: b.monitoring as ImpactMonitoring[],
      consultations: b.consultations as ResidentConsultation[],
      outcomes: b.outcomes as AdmissionOutcome[],
      homeId: typeof b.homeId === "string" ? b.homeId : undefined,
      periodStart: typeof b.periodStart === "string" ? b.periodStart : undefined,
      periodEnd: typeof b.periodEnd === "string" ? b.periodEnd : undefined,
      referenceDate: typeof b.referenceDate === "string" ? b.referenceDate : undefined,
    },
  };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { assessments, monitoring, consultations, outcomes } = generateDemoData();

  const intelligence = generateHomeMatchingImpactIntelligence(
    assessments,
    monitoring,
    consultations,
    outcomes,
    "oak-house",
    "2026-04-01",
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

    const { assessments, monitoring, consultations, outcomes, homeId, periodStart, periodEnd, referenceDate } =
      validation.data!;

    const now = new Date().toISOString().split("T")[0];
    const intelligence = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
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
