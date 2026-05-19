// ==============================================================================
// API: /api/complaint-resolution-effectiveness
//
// Complaint Resolution Effectiveness Intelligence
//
// GET  -- Returns complaint resolution effectiveness metrics with demo data (Oak House)
// POST -- Accepts custom data and returns analysis
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateComplaintResolutionEffectivenessIntelligence,
  getComplaintSourceLabel,
  getResolutionOutcomeLabel,
  getRatingLabel,
} from "@/lib/complaint-resolution-effectiveness";
import type {
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
} from "@/lib/complaint-resolution-effectiveness";

// -- Demo Data: Oak House -----------------------------------------------------

function generateDemoData(): {
  records: ComplaintRecord[];
  policy: ComplaintPolicy;
  training: StaffComplaintTraining[];
} {
  const records: ComplaintRecord[] = [
    {
      id: "cre-001",
      childId: "child-alex",
      childName: "Alex",
      complaintDate: "2026-01-20",
      complaintSource: "child",
      resolutionOutcome: "fully_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: true,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: true,
    },
    {
      id: "cre-002",
      childId: "child-alex",
      childName: "Alex",
      complaintDate: "2026-02-14",
      complaintSource: "parent_carer",
      resolutionOutcome: "fully_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: true,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: true,
    },
    {
      id: "cre-003",
      childId: "child-jordan",
      childName: "Jordan",
      complaintDate: "2026-02-28",
      complaintSource: "professional",
      resolutionOutcome: "fully_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: true,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: true,
    },
    {
      id: "cre-004",
      childId: "child-jordan",
      childName: "Jordan",
      complaintDate: "2026-03-10",
      complaintSource: "child",
      resolutionOutcome: "partially_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: true,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: false,
    },
    {
      id: "cre-005",
      childId: "child-morgan",
      childName: "Morgan",
      complaintDate: "2026-03-22",
      complaintSource: "advocate",
      resolutionOutcome: "fully_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: true,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: true,
    },
    {
      id: "cre-006",
      childId: "child-morgan",
      childName: "Morgan",
      complaintDate: "2026-04-05",
      complaintSource: "staff",
      resolutionOutcome: "fully_resolved",
      resolvedWithinTimescale: true,
      childInformed: true,
      lessonsLearned: false,
      actionsTaken: true,
      documentedInRecord: true,
      complainantSatisfied: true,
    },
    {
      id: "cre-007",
      childId: "child-alex",
      childName: "Alex",
      complaintDate: "2026-04-18",
      complaintSource: "regulator",
      resolutionOutcome: "escalated",
      resolvedWithinTimescale: false,
      childInformed: false,
      lessonsLearned: false,
      actionsTaken: false,
      documentedInRecord: true,
      complainantSatisfied: false,
    },
    {
      id: "cre-008",
      childId: "child-jordan",
      childName: "Jordan",
      complaintDate: "2026-05-02",
      complaintSource: "anonymous",
      resolutionOutcome: "unresolved",
      resolvedWithinTimescale: false,
      childInformed: false,
      lessonsLearned: false,
      actionsTaken: false,
      documentedInRecord: false,
      complainantSatisfied: false,
    },
  ];

  const policy: ComplaintPolicy = {
    id: "policy-001",
    complaintsProcedure: true,
    timescaleStandards: true,
    childFriendlyProcess: true,
    independentAdvocacy: true,
    escalationPathway: true,
    learningFromComplaints: true,
    regularReview: true,
  };

  const training: StaffComplaintTraining[] = [
    {
      id: "sct-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      complaintHandling: true,
      childFocusedResolution: true,
      conflictResolution: true,
      documentationSkills: true,
      advocacyAwareness: true,
      regulatoryRequirements: true,
    },
    {
      id: "sct-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      complaintHandling: true,
      childFocusedResolution: true,
      conflictResolution: true,
      documentationSkills: true,
      advocacyAwareness: false,
      regulatoryRequirements: true,
    },
    {
      id: "sct-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      complaintHandling: true,
      childFocusedResolution: true,
      conflictResolution: true,
      documentationSkills: true,
      advocacyAwareness: true,
      regulatoryRequirements: false,
    },
    {
      id: "sct-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      complaintHandling: true,
      childFocusedResolution: true,
      conflictResolution: true,
      documentationSkills: true,
      advocacyAwareness: true,
      regulatoryRequirements: true,
    },
  ];

  return { records, policy, training };
}

// -- GET ----------------------------------------------------------------------

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateComplaintResolutionEffectivenessIntelligence(
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
        recordSummary: records.map((r) => ({
          id: r.id,
          childName: r.childName,
          date: r.complaintDate,
          source: getComplaintSourceLabel(r.complaintSource),
          outcome: getResolutionOutcomeLabel(r.resolutionOutcome),
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// -- POST ---------------------------------------------------------------------

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
    records?: ComplaintRecord[];
    policy?: ComplaintPolicy | null;
    training?: StaffComplaintTraining[];
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

  const result = generateComplaintResolutionEffectivenessIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
