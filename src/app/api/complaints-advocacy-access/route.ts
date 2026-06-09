// ==============================================================================
// API: /api/complaints-advocacy-access
//
// Complaints & Advocacy Access Intelligence
//
// GET  — Returns complaints/advocacy assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateComplaintsAdvocacyAccessIntelligence,
  getComplaintTypeLabel,
  getComplaintStatusLabel,
  getResolutionOutcomeLabel,
  getAdvocacyTypeLabel,
  getSatisfactionLevelLabel,
  getRatingLabel,
} from "@/lib/complaints-advocacy-access";
import type {
  ComplaintRecord,
  AdvocacyRecord,
  ComplaintsPolicy,
  StaffComplaintsTraining,
} from "@/lib/complaints-advocacy-access";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_COMPLAINTS: ComplaintRecord[] = [
  {
    id: "comp-1",
    childId: "child-alex",
    childName: "Alex",
    complaintDate: "2026-02-10",
    complaintType: "food",
    description: "Not happy with variety of evening meals",
    status: "resolved",
    resolutionOutcome: "upheld",
    resolvedWithinTimescale: true,
    daysToResolve: 5,
    childSatisfaction: "satisfied",
    advocacyOffered: true,
    advocacyAccepted: false,
    learningIdentified: true,
    policyChangeRequired: false,
  },
  {
    id: "comp-2",
    childId: "child-jordan",
    childName: "Jordan",
    complaintDate: "2026-03-05",
    complaintType: "privacy",
    description: "Staff knocked but entered bedroom without waiting",
    status: "resolved",
    resolutionOutcome: "upheld",
    resolvedWithinTimescale: true,
    daysToResolve: 3,
    childSatisfaction: "very_satisfied",
    advocacyOffered: true,
    advocacyAccepted: true,
    learningIdentified: true,
    policyChangeRequired: true,
  },
  {
    id: "comp-3",
    childId: "child-morgan",
    childName: "Morgan",
    complaintDate: "2026-04-12",
    complaintType: "activities",
    description: "Weekend activities not varied enough",
    status: "resolved",
    resolutionOutcome: "partially_upheld",
    resolvedWithinTimescale: true,
    daysToResolve: 7,
    childSatisfaction: "satisfied",
    advocacyOffered: true,
    advocacyAccepted: false,
    learningIdentified: true,
    policyChangeRequired: false,
  },
];

const DEMO_ADVOCACY: AdvocacyRecord[] = [
  {
    id: "adv-1",
    childId: "child-jordan",
    childName: "Jordan",
    advocacyType: "independent_advocate",
    referralDate: "2026-03-06",
    contactMade: true,
    independentFromHome: true,
    childInformed: true,
    accessWithinTimescale: true,
    ongoingSupport: true,
  },
  {
    id: "adv-2",
    childId: "child-alex",
    childName: "Alex",
    advocacyType: "childrens_rights_officer",
    referralDate: "2026-01-15",
    contactMade: true,
    independentFromHome: true,
    childInformed: true,
    accessWithinTimescale: true,
    ongoingSupport: false,
  },
  {
    id: "adv-3",
    childId: "child-morgan",
    childName: "Morgan",
    advocacyType: "childline",
    referralDate: "2026-02-20",
    contactMade: true,
    independentFromHome: true,
    childInformed: true,
    accessWithinTimescale: true,
    ongoingSupport: true,
  },
];

const DEMO_POLICIES: ComplaintsPolicy[] = [
  {
    id: "pol-1",
    policyReviewDate: "2026-01-10",
    policyCurrent: true,
    childFriendlyVersion: true,
    displayedInHome: true,
    advocacyInfoDisplayed: true,
    complaintFormAccessible: true,
    externalContactsDisplayed: true,
    regularlyReviewedWithChildren: true,
  },
];

const DEMO_TRAINING: StaffComplaintsTraining[] = [
  { id: "ct-1", staffId: "staff-sarah", staffName: "Sarah Johnson", complaintsProcedure: true, advocacyReferral: true, childRightsAwareness: true, conflictResolution: true, recordKeeping: true, escalationProcess: true },
  { id: "ct-2", staffId: "staff-tom", staffName: "Tom Richards", complaintsProcedure: true, advocacyReferral: true, childRightsAwareness: true, conflictResolution: true, recordKeeping: true, escalationProcess: true },
  { id: "ct-3", staffId: "staff-lisa", staffName: "Lisa Williams", complaintsProcedure: true, advocacyReferral: true, childRightsAwareness: true, conflictResolution: true, recordKeeping: true, escalationProcess: true },
  { id: "ct-4", staffId: "staff-darren", staffName: "Darren Laville", complaintsProcedure: true, advocacyReferral: true, childRightsAwareness: true, conflictResolution: true, recordKeeping: true, escalationProcess: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateComplaintsAdvocacyAccessIntelligence(
    DEMO_COMPLAINTS,
    DEMO_ADVOCACY,
    DEMO_POLICIES,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        complaintTypeLabels: Object.fromEntries(
          (["care_quality", "staff_conduct", "food", "activities", "contact", "privacy", "safety", "property", "discrimination", "other"] as const).map(
            (t) => [t, getComplaintTypeLabel(t)],
          ),
        ),
        complaintStatusLabels: Object.fromEntries(
          (["open", "investigating", "resolved", "escalated", "withdrawn"] as const).map(
            (s) => [s, getComplaintStatusLabel(s)],
          ),
        ),
        resolutionOutcomeLabels: Object.fromEntries(
          (["upheld", "partially_upheld", "not_upheld", "withdrawn", "pending"] as const).map(
            (o) => [o, getResolutionOutcomeLabel(o)],
          ),
        ),
        advocacyTypeLabels: Object.fromEntries(
          (["independent_advocate", "childrens_rights_officer", "irp", "ofsted_direct", "childline", "peer_advocacy"] as const).map(
            (t) => [t, getAdvocacyTypeLabel(t)],
          ),
        ),
        satisfactionLevelLabels: Object.fromEntries(
          (["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied", "not_recorded"] as const).map(
            (l) => [l, getSatisfactionLevelLabel(l)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { complaints, advocacy, policies, training, homeId, periodStart, periodEnd } = body as {
    complaints?: ComplaintRecord[];
    advocacy?: AdvocacyRecord[];
    policies?: ComplaintsPolicy[];
    training?: StaffComplaintsTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateComplaintsAdvocacyAccessIntelligence(
    complaints ?? [],
    advocacy ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
