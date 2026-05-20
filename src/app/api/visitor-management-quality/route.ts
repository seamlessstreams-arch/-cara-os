// ══════════════════════════════════════════════════════════════════════════════
// API: /api/visitor-management-quality
//
// Visitor Management Quality Intelligence
//
// GET  — Returns visitor management quality metrics with Oak House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateVisitorManagementQualityIntelligence,
  getVisitorTypeLabels,
  getVisitQualityLabels,
  getRatingLabels,
} from "@/lib/visitor-management-quality";
import type {
  VisitorRecord,
  VisitorPolicy,
  StaffVisitorTraining,
} from "@/lib/visitor-management-quality";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_VISITS: VisitorRecord[] = [
  // Alex — family member visit (excellent)
  { id: "vr-001", childId: "child-alex", childName: "Alex", visitDate: "2026-02-10", visitorType: "family_member", visitQuality: "excellent", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Alex — social worker visit (good)
  { id: "vr-002", childId: "child-alex", childName: "Alex", visitDate: "2026-03-05", visitorType: "social_worker", visitQuality: "good", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Alex — therapist visit (excellent)
  { id: "vr-003", childId: "child-alex", childName: "Alex", visitDate: "2026-04-12", visitorType: "therapist", visitQuality: "excellent", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — independent visitor (good)
  { id: "vr-004", childId: "child-jordan", childName: "Jordan", visitDate: "2026-02-20", visitorType: "independent_visitor", visitQuality: "good", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — advocate visit (excellent)
  { id: "vr-005", childId: "child-jordan", childName: "Jordan", visitDate: "2026-03-15", visitorType: "advocate", visitQuality: "excellent", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — friend visit (good)
  { id: "vr-006", childId: "child-jordan", childName: "Jordan", visitDate: "2026-04-20", visitorType: "friend", visitQuality: "good", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Morgan — professional visitor (excellent)
  { id: "vr-007", childId: "child-morgan", childName: "Morgan", visitDate: "2026-03-01", visitorType: "professional_visitor", visitQuality: "excellent", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
  // Morgan — inspector visit (good)
  { id: "vr-008", childId: "child-morgan", childName: "Morgan", visitDate: "2026-04-08", visitorType: "inspector", visitQuality: "good", childConsulted: true, safeguardingChecked: true, privacyMaintained: true, documentedInLog: true, staffSupervised: true, feedbackRecorded: true },
];

const DEMO_POLICY: VisitorPolicy = {
  id: "pol-oak",
  visitorManagementStrategy: true,
  safeguardingCheckProcedure: true,
  childConsentProtocol: true,
  privacyAndDignityGuidance: true,
  professionalVisitorFramework: true,
  emergencyVisitProtocol: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffVisitorTraining[] = [
  { id: "tr-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson", visitorManagement: true, safeguardingChecks: true, childConsentPractice: true, privacyProtocol: true, conflictResolution: true, recordKeeping: true },
  { id: "tr-tom", staffId: "staff-tom", staffName: "Tom Richards", visitorManagement: true, safeguardingChecks: true, childConsentPractice: true, privacyProtocol: true, conflictResolution: true, recordKeeping: true },
  { id: "tr-lisa", staffId: "staff-lisa", staffName: "Lisa Williams", visitorManagement: true, safeguardingChecks: true, childConsentPractice: true, privacyProtocol: true, conflictResolution: true, recordKeeping: true },
  { id: "tr-darren", staffId: "staff-darren", staffName: "Darren Laville", visitorManagement: true, safeguardingChecks: true, childConsentPractice: true, privacyProtocol: true, conflictResolution: true, recordKeeping: true },
];

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateVisitorManagementQualityIntelligence(
    DEMO_VISITS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        visitorTypeLabels: getVisitorTypeLabels(),
        visitQualityLabels: getVisitQualityLabels(),
        ratingLabels: getRatingLabels(),
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { visits, policy, training, homeId, periodStart, periodEnd } = body as {
    visits?: VisitorRecord[];
    policy?: VisitorPolicy | null;
    training?: StaffVisitorTraining[];
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

  const result = generateVisitorManagementQualityIntelligence(
    visits ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
