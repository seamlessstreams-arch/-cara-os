// ══════════════════════════════════════════════════════════════════════════════
// API: /api/admissions-matching
//
// Admissions & Matching Intelligence
//
// GET  — Returns Chamberlain House demo data with full intelligence analysis
// POST — Accepts custom referral/assessment/plan/outcome data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateAdmissionsMatchingIntelligence } from "@/lib/admissions-matching";
import type {
  Referral,
  MatchingAssessment,
  MatchingScore,
  IntroductionPlan,
  AdmissionOutcome,
} from "@/lib/admissions-matching";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): {
  referrals: Referral[];
  assessments: MatchingAssessment[];
  plans: IntroductionPlan[];
  outcomes: AdmissionOutcome[];
} {
  const fullCriteria = (baseScore: number): MatchingScore[] => {
    const criteria = [
      "age_compatibility",
      "gender_dynamics",
      "needs_compatibility",
      "risk_assessment",
      "cultural_needs",
      "educational_needs",
      "therapeutic_needs",
      "group_dynamics",
      "location_proximity",
      "statement_of_purpose_fit",
    ] as const;
    return criteria.map((criterion) => ({
      criterion,
      score: baseScore,
      rationale: `Assessed as ${baseScore}/5 for ${criterion}`,
    }));
  };

  const referrals: Referral[] = [
    {
      id: "ref-001",
      childName: "Alex",
      childAge: 14,
      referringAuthority: "Manchester City Council",
      referralDate: "2026-04-01",
      currentStatus: "accepted",
      keyNeeds: ["emotional support", "education continuity"],
      riskFactors: ["absconding history"],
      screeningCompletedDate: "2026-04-02",
      assessmentCompletedDate: "2026-04-05",
      decisionDate: "2026-04-07",
      decisionBy: "Darren Laville",
    },
    {
      id: "ref-002",
      childName: "Jordan",
      childAge: 13,
      referringAuthority: "Salford City Council",
      referralDate: "2026-04-10",
      currentStatus: "accepted",
      keyNeeds: ["therapeutic support", "social skills"],
      riskFactors: ["peer conflict"],
      screeningCompletedDate: "2026-04-11",
      assessmentCompletedDate: "2026-04-14",
      decisionDate: "2026-04-16",
      decisionBy: "Darren Laville",
    },
    {
      id: "ref-003",
      childName: "Riley",
      childAge: 16,
      referringAuthority: "Bolton Council",
      referralDate: "2026-04-15",
      currentStatus: "declined",
      declineReason: "risk_to_group",
      keyNeeds: ["substance misuse support", "anger management"],
      riskFactors: ["violence to peers", "substance misuse", "criminal exploitation"],
      screeningCompletedDate: "2026-04-16",
      assessmentCompletedDate: "2026-04-18",
      decisionDate: "2026-04-19",
      decisionBy: "Darren Laville",
    },
    {
      id: "ref-004",
      childName: "Sam",
      childAge: 12,
      referringAuthority: "Wigan Council",
      referralDate: "2026-04-20",
      currentStatus: "withdrawn",
      keyNeeds: ["attachment support"],
      riskFactors: [],
      screeningCompletedDate: "2026-04-21",
      decisionDate: "2026-04-23",
      decisionBy: "Darren Laville",
    },
    {
      id: "ref-005",
      childName: "Casey",
      childAge: 14,
      referringAuthority: "Trafford Council",
      referralDate: "2026-05-01",
      currentStatus: "assessment",
      keyNeeds: ["mental health support", "education"],
      riskFactors: ["self-harm"],
      screeningCompletedDate: "2026-05-02",
    },
  ];

  const assessments: MatchingAssessment[] = [
    {
      id: "ma-001",
      referralId: "ref-001",
      assessedBy: "Sarah Johnson",
      assessmentDate: "2026-04-05",
      criteria: fullCriteria(4),
      overallScore: 4.0,
      recommendation: "accept",
      impactOnExistingChildren: "Minimal disruption expected given age compatibility",
      impactOnNewChild: "Good match with existing group interests and needs",
      groupDynamicsAnalysis: "Current group dynamics stable; Alex would integrate well",
    },
    {
      id: "ma-002",
      referralId: "ref-002",
      assessedBy: "Lisa Williams",
      assessmentDate: "2026-04-14",
      criteria: fullCriteria(3),
      overallScore: 3.0,
      recommendation: "accept",
      impactOnExistingChildren: "Some adjustment expected for existing children",
      impactOnNewChild: "Jordan would benefit from therapeutic milieu",
      groupDynamicsAnalysis: "Group dynamics will need monitoring during transition",
    },
    {
      id: "ma-003",
      referralId: "ref-003",
      assessedBy: "Sarah Johnson",
      assessmentDate: "2026-04-18",
      criteria: [
        { criterion: "age_compatibility", score: 2, rationale: "Older than current group" },
        { criterion: "risk_assessment", score: 1, rationale: "Significant risk to existing children" },
        { criterion: "group_dynamics", score: 1, rationale: "Would destabilise current group" },
        { criterion: "needs_compatibility", score: 2, rationale: "Specialist substance misuse needs exceed home capabilities" },
        { criterion: "statement_of_purpose_fit", score: 2, rationale: "Profile outside statement of purpose" },
      ],
      overallScore: 1.6,
      recommendation: "decline",
      impactOnExistingChildren: "High risk of negative impact on younger residents",
      impactOnNewChild: "Home cannot meet specialist needs",
      groupDynamicsAnalysis: "Significant disruption likely given risk profile",
    },
    {
      id: "ma-004",
      referralId: "ref-005",
      assessedBy: "Lisa Williams",
      assessmentDate: "2026-05-05",
      criteria: [
        { criterion: "age_compatibility", score: 4, rationale: "Good age fit" },
        { criterion: "needs_compatibility", score: 3, rationale: "Needs can be met with additional support" },
        { criterion: "risk_assessment", score: 3, rationale: "Manageable risk with safety plan" },
        { criterion: "group_dynamics", score: 4, rationale: "Would benefit from current group" },
      ],
      overallScore: 3.5,
      recommendation: "further_info_needed",
      impactOnExistingChildren: "Further assessment needed on impact",
      impactOnNewChild: "Would benefit from structure in the home",
      groupDynamicsAnalysis: "Positive potential but needs further exploration",
    },
  ];

  const plans: IntroductionPlan[] = [
    {
      id: "ip-001",
      referralId: "ref-001",
      childName: "Alex",
      phases: [
        { phase: "pre_visit_info", plannedDate: "2026-04-08", completedDate: "2026-04-08", status: "completed", outcome: "Information pack sent", childFeedback: "Excited to visit" },
        { phase: "initial_visit", plannedDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", outcome: "Positive visit", childFeedback: "Liked the house" },
        { phase: "overnight_stay", plannedDate: "2026-04-12", completedDate: "2026-04-12", status: "completed", outcome: "Settled well overnight" },
        { phase: "extended_stay", plannedDate: "2026-04-14", completedDate: "2026-04-15", status: "completed", outcome: "Positive extended stay" },
        { phase: "full_admission", plannedDate: "2026-04-17", completedDate: "2026-04-17", status: "completed", outcome: "Full admission completed" },
      ],
      keyWorkerAssigned: "Sarah Johnson",
      welcomePack: true,
      childrenConsulted: true,
      childVoiceRecorded: true,
    },
    {
      id: "ip-002",
      referralId: "ref-002",
      childName: "Jordan",
      phases: [
        { phase: "pre_visit_info", plannedDate: "2026-04-17", completedDate: "2026-04-17", status: "completed", outcome: "Pack provided" },
        { phase: "initial_visit", plannedDate: "2026-04-19", completedDate: "2026-04-19", status: "completed", outcome: "Visit went well" },
        { phase: "overnight_stay", plannedDate: "2026-04-21", completedDate: "2026-04-21", status: "completed", outcome: "Some anxiety but settled" },
        { phase: "extended_stay", plannedDate: "2026-04-23", status: "pending" },
        { phase: "full_admission", plannedDate: "2026-04-26", completedDate: "2026-04-26", status: "completed", outcome: "Admitted" },
      ],
      keyWorkerAssigned: "Tom Richards",
      welcomePack: true,
      childrenConsulted: true,
      childVoiceRecorded: false,
    },
  ];

  const outcomes: AdmissionOutcome[] = [
    {
      id: "ao-001",
      referralId: "ref-001",
      childName: "Alex",
      admissionDate: "2026-04-17",
      settlingInReviewDate: "2026-04-19",
      settlingInCompleted: true,
      initialCareplanCreated: true,
      placementPlanSigned: true,
      existingChildrenFeedback: "Children welcomed Alex warmly and helped with settling in",
    },
    {
      id: "ao-002",
      referralId: "ref-002",
      childName: "Jordan",
      admissionDate: "2026-04-26",
      settlingInCompleted: false,
      initialCareplanCreated: true,
      placementPlanSigned: false,
    },
  ];

  return { referrals, assessments, plans, outcomes };
}

// ── Validation ─────────────────────────────────────────────────────────────

function validatePostBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    referrals: Referral[];
    assessments: MatchingAssessment[];
    plans: IntroductionPlan[];
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

  if (!Array.isArray(b.referrals)) {
    return { valid: false, error: "referrals must be an array" };
  }

  if (!Array.isArray(b.assessments)) {
    return { valid: false, error: "assessments must be an array" };
  }

  if (!Array.isArray(b.plans)) {
    return { valid: false, error: "plans must be an array" };
  }

  if (!Array.isArray(b.outcomes)) {
    return { valid: false, error: "outcomes must be an array" };
  }

  return {
    valid: true,
    data: {
      referrals: b.referrals as Referral[],
      assessments: b.assessments as MatchingAssessment[],
      plans: b.plans as IntroductionPlan[],
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
  const { referrals, assessments, plans, outcomes } = generateDemoData();

  const intelligence = generateAdmissionsMatchingIntelligence(
    referrals,
    assessments,
    plans,
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

    const { referrals, assessments, plans, outcomes, homeId, periodStart, periodEnd, referenceDate } =
      validation.data!;

    const now = new Date().toISOString().split("T")[0];
    const intelligence = generateAdmissionsMatchingIntelligence(
      referrals,
      assessments,
      plans,
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
