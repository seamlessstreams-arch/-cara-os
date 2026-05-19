// ══════════════════════════════════════════════════════════════════════════════
// API: /api/professional-boundary-compliance
//
// Professional Boundary Compliance Intelligence
//
// GET  — Returns boundary compliance metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateProfessionalBoundaryComplianceIntelligence,
  getBoundaryAreaLabel,
  getComplianceLevelLabel,
  getRatingLabel,
} from "@/lib/professional-boundary-compliance";
import type {
  BoundaryAudit,
  BoundaryPolicy,
  StaffBoundaryTraining,
} from "@/lib/professional-boundary-compliance";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  audits: BoundaryAudit[];
  policy: BoundaryPolicy;
  training: StaffBoundaryTraining[];
} {
  const audits: BoundaryAudit[] = [
    {
      id: "pbc-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      auditDate: "2026-02-10",
      boundaryArea: "physical_contact",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-002",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      auditDate: "2026-03-18",
      boundaryArea: "gift_giving",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-003",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      auditDate: "2026-02-15",
      boundaryArea: "social_media",
      complianceLevel: "mostly_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-004",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      auditDate: "2026-04-01",
      boundaryArea: "personal_disclosure",
      complianceLevel: "partially_compliant",
      supervisorVerified: false,
      documentedAppropriately: true,
      childFeedbackSought: false,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-005",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      auditDate: "2026-02-20",
      boundaryArea: "confidentiality",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-006",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      auditDate: "2026-04-10",
      boundaryArea: "professional_language",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-007",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      auditDate: "2026-03-01",
      boundaryArea: "favouritism",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
    {
      id: "pbc-008",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      auditDate: "2026-04-20",
      boundaryArea: "dual_relationships",
      complianceLevel: "fully_compliant",
      supervisorVerified: true,
      documentedAppropriately: true,
      childFeedbackSought: true,
      correctiveActionTaken: true,
      reflectivePracticeCompleted: true,
      riskAssessed: true,
    },
  ];

  const policy: BoundaryPolicy = {
    id: "bp-001",
    boundaryFramework: true,
    socialMediaPolicy: true,
    giftGivingGuidance: true,
    physicalContactPolicy: true,
    whistleblowingProcedure: true,
    confidentialityProtocol: true,
    regularReview: true,
  };

  const training: StaffBoundaryTraining[] = [
    {
      id: "sbt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      professionalBoundaries: true,
      safeguardingAwareness: true,
      ethicalConduct: true,
      socialMediaSafety: true,
      reportingProcedures: true,
      reflectivePractice: true,
    },
    {
      id: "sbt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      professionalBoundaries: true,
      safeguardingAwareness: true,
      ethicalConduct: true,
      socialMediaSafety: true,
      reportingProcedures: true,
      reflectivePractice: false,
    },
    {
      id: "sbt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      professionalBoundaries: true,
      safeguardingAwareness: true,
      ethicalConduct: true,
      socialMediaSafety: true,
      reportingProcedures: true,
      reflectivePractice: true,
    },
    {
      id: "sbt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      professionalBoundaries: true,
      safeguardingAwareness: true,
      ethicalConduct: true,
      socialMediaSafety: true,
      reportingProcedures: true,
      reflectivePractice: true,
    },
  ];

  return { audits, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { audits, policy, training } = generateDemoData();

  const result = generateProfessionalBoundaryComplianceIntelligence(
    audits,
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
        auditSummary: audits.map((a) => ({
          id: a.id,
          staffName: a.staffName,
          date: a.auditDate,
          area: getBoundaryAreaLabel(a.boundaryArea),
          compliance: getComplianceLevelLabel(a.complianceLevel),
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
    audits,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    audits?: BoundaryAudit[];
    policy?: BoundaryPolicy | null;
    training?: StaffBoundaryTraining[];
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

  const result = generateProfessionalBoundaryComplianceIntelligence(
    audits ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
