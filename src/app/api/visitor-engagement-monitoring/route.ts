// ══════════════════════════════════════════════════════════════════════════════
// API: /api/visitor-engagement-monitoring
//
// Visitor Engagement Monitoring Intelligence
//
// GET  — Returns visitor engagement monitoring metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateVisitorEngagementMonitoringIntelligence,
  getVisitorTypeLabel,
  getVisitOutcomeLabel,
  getRatingLabel,
} from "@/lib/visitor-engagement-monitoring";
import type {
  VisitorRecord,
  VisitorPolicy,
  StaffVisitorTraining,
} from "@/lib/visitor-engagement-monitoring";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: VisitorRecord[];
  policy: VisitorPolicy;
  training: StaffVisitorTraining[];
} {
  const records: VisitorRecord[] = [
    {
      id: "vr-001",
      visitorType: "family_member",
      visitDate: "2026-01-20",
      visitOutcome: "very_positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-002",
      visitorType: "social_worker",
      visitDate: "2026-02-05",
      visitOutcome: "positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-003",
      visitorType: "therapist",
      visitDate: "2026-02-18",
      visitOutcome: "very_positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-004",
      visitorType: "independent_visitor",
      visitDate: "2026-03-01",
      visitOutcome: "positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-005",
      visitorType: "family_member",
      visitDate: "2026-03-15",
      visitOutcome: "positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: false,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-006",
      visitorType: "advocate",
      visitDate: "2026-03-28",
      visitOutcome: "positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-007",
      visitorType: "inspector",
      visitDate: "2026-04-10",
      visitOutcome: "neutral",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: false,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
    {
      id: "vr-008",
      visitorType: "professional",
      visitDate: "2026-04-25",
      visitOutcome: "very_positive",
      identityVerified: true,
      signedIn: true,
      dbsChecked: true,
      childConsented: true,
      supervisedAppropriately: true,
      feedbackRecorded: true,
      safeguardingFollowed: true,
      documentedInLog: true,
    },
  ];

  const policy: VisitorPolicy = {
    id: "pol-001",
    visitorManagementPolicy: true,
    identityVerification: true,
    dbsCheckingProcess: true,
    childConsentProtocol: true,
    supervisionGuidance: true,
    safeguardingProcedure: true,
    regularReview: true,
  };

  const training: StaffVisitorTraining[] = [
    {
      id: "tr-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      visitorManagement: true,
      safeguardingVisitors: true,
      identityChecking: true,
      childProtection: true,
      conflictManagement: true,
      recordKeeping: true,
    },
    {
      id: "tr-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      visitorManagement: true,
      safeguardingVisitors: true,
      identityChecking: true,
      childProtection: true,
      conflictManagement: true,
      recordKeeping: true,
    },
    {
      id: "tr-003",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      visitorManagement: true,
      safeguardingVisitors: true,
      identityChecking: true,
      childProtection: true,
      conflictManagement: true,
      recordKeeping: true,
    },
    {
      id: "tr-004",
      staffId: "staff-emma",
      staffName: "Emma Clarke",
      visitorManagement: true,
      safeguardingVisitors: true,
      identityChecking: true,
      childProtection: true,
      conflictManagement: false,
      recordKeeping: true,
    },
  ];

  return { records, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateVisitorEngagementMonitoringIntelligence(
    records,
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
        ratingLabel: getRatingLabel(result.rating),
        labelMaps: {
          visitorTypes: Object.fromEntries(
            (["family_member", "social_worker", "independent_visitor", "therapist", "advocate", "inspector", "professional", "other"] as const).map(
              (t) => [t, getVisitorTypeLabel(t)],
            ),
          ),
          visitOutcomes: Object.fromEntries(
            (["very_positive", "positive", "neutral", "concerning", "safeguarding_issue"] as const).map(
              (o) => [o, getVisitOutcomeLabel(o)],
            ),
          ),
        },
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
    records,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    records?: VisitorRecord[];
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

  const result = generateVisitorEngagementMonitoringIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { ratingLabel: getRatingLabel(result.rating) },
    },
  });
}
