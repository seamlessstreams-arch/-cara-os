// ══════════════════════════════════════════════════════════════════════════════
// API: /api/risk-assessment-quality
//
// Risk Assessment Quality Intelligence
//
// GET  — Demo mode: returns risk assessment quality metrics with Chamberlain
//        House demo data. Live mode: returns an empty response (was leaking
//        demo child names unconditionally until 2026-07-29).
// POST — Accepts custom data and returns analysis; unaffected by the gate.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { isLiveTenant } from "@/lib/db/live-mode";
import {
  generateRiskAssessmentQualityIntelligence,
  getRiskCategoryLabel,
  getRiskLevelLabel,
  getRatingLabel,
} from "@/lib/risk-assessment-quality";
import type {
  RiskAssessment,
  RiskAssessmentPolicy,
  StaffRiskAssessmentTraining,
} from "@/lib/risk-assessment-quality";
import { readJsonBody } from "@/lib/http/read-json";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  assessments: RiskAssessment[];
  policy: RiskAssessmentPolicy;
  training: StaffRiskAssessmentTraining[];
} {
  const assessments: RiskAssessment[] = [
    {
      id: "ra-001",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-05-05",
      riskCategory: "self_harm",
      riskLevel: "medium",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-002",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-05-08",
      riskCategory: "absconding",
      riskLevel: "low",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-003",
      childId: "child-alex",
      childName: "Alex",
      assessmentDate: "2026-05-10",
      riskCategory: "online_safety",
      riskLevel: "low",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-004",
      childId: "child-jordan",
      childName: "Jordan",
      assessmentDate: "2026-05-06",
      riskCategory: "aggression",
      riskLevel: "high",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-005",
      childId: "child-jordan",
      childName: "Jordan",
      assessmentDate: "2026-05-09",
      riskCategory: "bullying",
      riskLevel: "medium",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-006",
      childId: "child-morgan",
      childName: "Morgan",
      assessmentDate: "2026-05-07",
      riskCategory: "exploitation",
      riskLevel: "critical",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-007",
      childId: "child-morgan",
      childName: "Morgan",
      assessmentDate: "2026-05-11",
      riskCategory: "substance_misuse",
      riskLevel: "medium",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
    {
      id: "ra-008",
      childId: "child-morgan",
      childName: "Morgan",
      assessmentDate: "2026-05-12",
      riskCategory: "fire_setting",
      riskLevel: "low",
      mitigationPlanInPlace: true,
      childConsulted: true,
      reviewScheduled: true,
      documentedInPlan: true,
      staffAware: true,
      feedbackGiven: true,
    },
  ];

  const policy: RiskAssessmentPolicy = {
    id: "policy-001",
    riskManagementFramework: true,
    dynamicAssessmentProcedure: true,
    positiveRiskTakingPolicy: true,
    incidentResponseProtocol: true,
    multiAgencyRiskSharing: true,
    staffRiskTrainingRequirement: true,
    regularReview: true,
  };

  const training: StaffRiskAssessmentTraining[] = [
    {
      id: "srt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      riskIdentification: true,
      mitigationPlanning: true,
      dynamicRiskAssessment: true,
      positiveRiskTaking: true,
      incidentManagement: true,
      multiAgencyWorking: true,
    },
    {
      id: "srt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      riskIdentification: true,
      mitigationPlanning: true,
      dynamicRiskAssessment: true,
      positiveRiskTaking: true,
      incidentManagement: true,
      multiAgencyWorking: true,
    },
    {
      id: "srt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      riskIdentification: true,
      mitigationPlanning: true,
      dynamicRiskAssessment: true,
      positiveRiskTaking: true,
      incidentManagement: true,
      multiAgencyWorking: true,
    },
    {
      id: "srt-004",
      staffId: "staff-darren",
      staffName: "Olivia Hayes",
      riskIdentification: true,
      mitigationPlanning: true,
      dynamicRiskAssessment: true,
      positiveRiskTaking: true,
      incidentManagement: true,
      multiAgencyWorking: true,
    },
  ];

  return { assessments, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  // Live tenants have no risk-assessment source wired to this route yet —
  // return an empty response instead of Chamberlain-named demo child data.
  // Was leaking demo data unconditionally until 2026-07-29.
  if (isLiveTenant()) {
    const emptyPolicy: RiskAssessmentPolicy = {
      id: "policy-empty",
      riskManagementFramework: false,
      dynamicAssessmentProcedure: false,
      positiveRiskTakingPolicy: false,
      incidentResponseProtocol: false,
      multiAgencyRiskSharing: false,
      staffRiskTrainingRequirement: false,
      regularReview: false,
    };
    const result = generateRiskAssessmentQualityIntelligence(
      [], emptyPolicy, [], "home_oak", "2026-04-01", "2026-05-20",
    );
    return NextResponse.json({
      data: {
        ...result,
        meta: {
          assessmentSummary: [],
          ratingLabel: getRatingLabel(result.rating),
        },
      },
      live_no_data: true,
    });
  }

  const { assessments, policy, training } = generateDemoData();

  const result = generateRiskAssessmentQualityIntelligence(
    assessments,
    policy,
    training,
    "oak-house",
    "2026-04-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        assessmentSummary: assessments.map((a) => ({
          id: a.id,
          date: a.assessmentDate,
          child: a.childName,
          category: getRiskCategoryLabel(a.riskCategory),
          level: getRiskLevelLabel(a.riskLevel),
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
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    assessments,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    assessments?: RiskAssessment[];
    policy?: RiskAssessmentPolicy | null;
    training?: StaffRiskAssessmentTraining[];
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

  const result = generateRiskAssessmentQualityIntelligence(
    assessments ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
