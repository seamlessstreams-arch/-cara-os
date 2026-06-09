// ══════════════════════════════════════════════════════════════════════════════
// API: /api/visitor-management-safety
//
// Visitor Management Safety Intelligence
//
// GET  — Returns visitor management safety metrics with Chamberlain House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateVisitorManagementSafetyIntelligence,
  getVisitorTypeLabel,
  getVisitPurposeLabel,
  getVerificationStatusLabel,
  getVisitOutcomeLabel,
  getRatingLabel,
  getIncidentTypeLabel,
} from "@/lib/visitor-management-safety";
import type {
  VisitorRecord,
  VisitorPolicy,
  VisitorIncident,
  StaffVisitorTraining,
} from "@/lib/visitor-management-safety";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: VisitorRecord[];
  policies: VisitorPolicy[];
  incidents: VisitorIncident[];
  training: StaffVisitorTraining[];
  childIds: string[];
  childNames: Record<string, string>;
} {
  const records: VisitorRecord[] = [
    {
      id: "vr-001",
      visitorName: "Jane Smith",
      visitorType: "parent",
      visitDate: "2026-02-10",
      visitPurpose: "contact",
      childId: "child-alex",
      childName: "Alex",
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "verified",
      supervisedVisit: true,
      staffPresent: "Sarah Johnson",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
    {
      id: "vr-002",
      visitorName: "Dr Emily Carter",
      visitorType: "social_worker",
      visitDate: "2026-02-20",
      visitPurpose: "review",
      childId: "child-jordan",
      childName: "Jordan",
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "verified",
      supervisedVisit: true,
      staffPresent: "Tom Richards",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
    {
      id: "vr-003",
      visitorName: "Mark Thompson",
      visitorType: "professional",
      visitDate: "2026-03-05",
      visitPurpose: "therapy",
      childId: "child-morgan",
      childName: "Morgan",
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "verified",
      supervisedVisit: true,
      staffPresent: "Sarah Johnson",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
    {
      id: "vr-004",
      visitorName: "Jane Smith",
      visitorType: "parent",
      visitDate: "2026-03-18",
      visitPurpose: "contact",
      childId: "child-alex",
      childName: "Alex",
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "verified",
      supervisedVisit: true,
      staffPresent: "Darren Laville",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
    {
      id: "vr-005",
      visitorName: "Lisa Brown",
      visitorType: "family_member",
      visitDate: "2026-04-01",
      visitPurpose: "social",
      childId: "child-jordan",
      childName: "Jordan",
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "verified",
      supervisedVisit: true,
      staffPresent: "Tom Richards",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
    {
      id: "vr-006",
      visitorName: "James Wilson",
      visitorType: "inspector",
      visitDate: "2026-04-15",
      visitPurpose: "inspection",
      childId: undefined,
      childName: undefined,
      signedIn: true,
      signedOut: true,
      idChecked: true,
      dbsVerified: "not_required",
      supervisedVisit: true,
      staffPresent: "Darren Laville",
      visitOutcome: "completed",
      safeguardingBriefGiven: true,
    },
  ];

  const policies: VisitorPolicy[] = [
    {
      id: "pol-001",
      policyReviewDate: "2026-01-15",
      signInSystemInPlace: true,
      idCheckMandatory: true,
      dbsCheckRequired: true,
      safeguardingBriefRequired: true,
      visitorGuideAvailable: true,
      restrictedVisitorListMaintained: true,
    },
  ];

  const incidents: VisitorIncident[] = [];

  const training: StaffVisitorTraining[] = [
    {
      id: "tr-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      visitorPolicyTrained: true,
      safeguardingVisitors: true,
      signInProcedures: true,
      dbsCheckProcess: true,
      incidentReporting: true,
      restrictedVisitorAwareness: true,
    },
    {
      id: "tr-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      visitorPolicyTrained: true,
      safeguardingVisitors: true,
      signInProcedures: true,
      dbsCheckProcess: true,
      incidentReporting: true,
      restrictedVisitorAwareness: true,
    },
    {
      id: "tr-003",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      visitorPolicyTrained: true,
      safeguardingVisitors: true,
      signInProcedures: true,
      dbsCheckProcess: true,
      incidentReporting: true,
      restrictedVisitorAwareness: true,
    },
    {
      id: "tr-004",
      staffId: "staff-emma",
      staffName: "Emma Clarke",
      visitorPolicyTrained: true,
      safeguardingVisitors: true,
      signInProcedures: true,
      dbsCheckProcess: true,
      incidentReporting: true,
      restrictedVisitorAwareness: true,
    },
  ];

  const childIds = ["child-alex", "child-jordan", "child-morgan"];
  const childNames: Record<string, string> = {
    "child-alex": "Alex",
    "child-jordan": "Jordan",
    "child-morgan": "Morgan",
  };

  return { records, policies, incidents, training, childIds, childNames };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policies, incidents, training, childIds, childNames } =
    generateDemoData();

  const result = generateVisitorManagementSafetyIntelligence(
    records,
    policies,
    incidents,
    training,
    childIds,
    childNames,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        ratingLabel: getRatingLabel(result.rating),
        labelMaps: {
          visitorTypes: Object.fromEntries(
            (["parent", "social_worker", "professional", "family_member", "friend", "contractor", "inspector", "volunteer", "other"] as const).map(
              (t) => [t, getVisitorTypeLabel(t)],
            ),
          ),
          visitPurposes: Object.fromEntries(
            (["contact", "review", "assessment", "maintenance", "inspection", "therapy", "education", "social", "other"] as const).map(
              (p) => [p, getVisitPurposeLabel(p)],
            ),
          ),
          verificationStatuses: Object.fromEntries(
            (["verified", "pending", "expired", "not_required", "failed"] as const).map(
              (s) => [s, getVerificationStatusLabel(s)],
            ),
          ),
          visitOutcomes: Object.fromEntries(
            (["completed", "shortened", "cancelled", "refused", "supervised_throughout"] as const).map(
              (o) => [o, getVisitOutcomeLabel(o)],
            ),
          ),
          incidentTypes: Object.fromEntries(
            (["unauthorised_access", "safeguarding_concern", "policy_breach", "complaint", "other"] as const).map(
              (t) => [t, getIncidentTypeLabel(t)],
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
    policies,
    incidents,
    training,
    childIds,
    childNames,
    homeId,
    periodStart,
    periodEnd,
    assessedAt,
  } = body as {
    records?: VisitorRecord[];
    policies?: VisitorPolicy[];
    incidents?: VisitorIncident[];
    training?: StaffVisitorTraining[];
    childIds?: string[];
    childNames?: Record<string, string>;
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    assessedAt?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateVisitorManagementSafetyIntelligence(
    records ?? [],
    policies ?? [],
    incidents ?? [],
    training ?? [],
    childIds ?? [],
    childNames ?? {},
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    assessedAt ?? new Date().toISOString(),
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { ratingLabel: getRatingLabel(result.rating) },
    },
  });
}
