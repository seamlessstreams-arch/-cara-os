// ══════════════════════════════════════════════════════════════════════════════
// Complaints & Compliments Intelligence — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateComplaintCompliance,
  calculateComplaintsMetrics,
} from "@/lib/complaints/complaints-engine";
import type {
  Complaint,
  Compliment,
} from "@/lib/complaints/complaints-engine";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = "2025-06-15T12:00:00Z";

const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: "comp-001",
    homeId: "oak-house",
    title: "Concerns about bedtime routine support",
    description:
      "Alex feels that night staff are not consistent with the agreed bedtime routine and do not always check in before lights out.",
    category: "care_quality",
    stage: "informal",
    status: "open",
    complainantType: "child",
    complainantName: "Alex",
    childId: "child-alex",
    childName: "Alex",
    receivedAt: "2025-06-10T09:00:00Z",
    acknowledgedAt: "2025-06-10T10:30:00Z",
    investigatorAssigned: undefined,
    targetResponseDate: "2025-06-24T09:00:00Z",
    resolvedAt: undefined,
    outcome: undefined,
    outcomeDescription: undefined,
    actionsTaken: ["Spoke with Alex about concerns", "Night staff briefed on routine expectations"],
    lessonsLearned: undefined,
    complainantSatisfied: undefined,
    ofstedNotified: false,
    loggedBy: "Sarah Johnson",
  },
  {
    id: "comp-002",
    homeId: "oak-house",
    title: "Staff member raised voice during disagreement",
    description:
      "Jordan reported that a staff member raised their voice during a disagreement about screen time. Jordan felt it was unfair and intimidating.",
    category: "staff_conduct",
    stage: "stage_1",
    status: "investigating",
    complainantType: "child",
    complainantName: "Jordan",
    childId: "child-jordan",
    childName: "Jordan",
    receivedAt: "2025-06-05T14:00:00Z",
    acknowledgedAt: "2025-06-05T15:00:00Z",
    investigatorAssigned: "Sarah Johnson",
    targetResponseDate: "2025-06-19T14:00:00Z",
    resolvedAt: undefined,
    outcome: undefined,
    outcomeDescription: undefined,
    actionsTaken: [
      "Acknowledged complaint to Jordan",
      "Spoke with staff member concerned",
      "Reviewing CCTV for common area",
    ],
    lessonsLearned: undefined,
    complainantSatisfied: undefined,
    ofstedNotified: false,
    loggedBy: "Sarah Johnson",
  },
  {
    id: "comp-003",
    homeId: "oak-house",
    title: "Meal options not meeting dietary needs",
    description:
      "Parent raised concerns that Morgan's cultural dietary preferences are not consistently being accommodated at mealtimes.",
    category: "food_nutrition",
    stage: "stage_1",
    status: "resolved",
    complainantType: "parent_carer",
    complainantName: "Mrs Abara (Morgan's mother)",
    childId: "child-morgan",
    childName: "Morgan",
    receivedAt: "2025-05-20T11:00:00Z",
    acknowledgedAt: "2025-05-20T13:00:00Z",
    investigatorAssigned: "Tom Richards",
    targetResponseDate: "2025-06-03T11:00:00Z",
    resolvedAt: "2025-05-30T16:00:00Z",
    outcome: "upheld",
    outcomeDescription:
      "Investigation confirmed gaps in meal planning for cultural preferences. Menu updated and kitchen staff briefed on Morgan's dietary requirements.",
    actionsTaken: [
      "Reviewed meal plans for past 4 weeks",
      "Consulted with Morgan and parent about preferences",
      "Updated kitchen menu and briefed catering team",
      "Added cultural dietary checklist to meal planning process",
    ],
    lessonsLearned:
      "Cultural dietary needs must be documented clearly and reviewed at each placement planning meeting. Kitchen checklist updated.",
    complainantSatisfied: true,
    ofstedNotified: false,
    loggedBy: "Tom Richards",
  },
  {
    id: "comp-004",
    homeId: "oak-house",
    title: "Broken window in shared area not repaired",
    description:
      "Social worker noted during visit that a window in the shared lounge has been cracked for several weeks and has not been repaired, raising safety concerns.",
    category: "environment",
    stage: "stage_1",
    status: "resolved",
    complainantType: "social_worker",
    complainantName: "Clare Davies (SW)",
    childId: undefined,
    childName: undefined,
    receivedAt: "2025-05-15T10:00:00Z",
    acknowledgedAt: "2025-05-15T11:00:00Z",
    investigatorAssigned: "Lisa Williams",
    targetResponseDate: "2025-05-29T10:00:00Z",
    resolvedAt: "2025-05-22T14:00:00Z",
    outcome: "upheld",
    outcomeDescription:
      "Window was reported to maintenance three weeks prior but not actioned. Repair completed and maintenance tracking improved.",
    actionsTaken: [
      "Contacted maintenance contractor urgently",
      "Window repaired within 48 hours",
      "Reviewed maintenance request log",
      "Implemented weekly maintenance follow-up checks",
    ],
    lessonsLearned:
      "Maintenance requests now have a 5-day escalation trigger if not actioned. Weekly check added to RM duties.",
    complainantSatisfied: true,
    ofstedNotified: false,
    loggedBy: "Lisa Williams",
  },
  {
    id: "comp-005",
    homeId: "oak-house",
    title: "Staff discussed child's background in communal area",
    description:
      "A staff member reported overhearing a colleague discuss confidential details about Alex's placement history in the kitchen while children were nearby.",
    category: "privacy",
    stage: "stage_2",
    status: "escalated",
    complainantType: "staff",
    complainantName: "Tom Richards",
    childId: "child-alex",
    childName: "Alex",
    receivedAt: "2025-06-01T08:30:00Z",
    acknowledgedAt: "2025-06-01T09:00:00Z",
    investigatorAssigned: "External Investigator — J. Patel",
    targetResponseDate: "2025-06-29T08:30:00Z",
    resolvedAt: undefined,
    outcome: undefined,
    outcomeDescription: undefined,
    actionsTaken: [
      "Incident documented",
      "Referred to independent investigator",
      "Staff member spoken to informally pending investigation",
      "All-staff confidentiality reminder issued",
    ],
    lessonsLearned: undefined,
    complainantSatisfied: undefined,
    ofstedNotified: true,
    escalatedTo: "stage_2",
    escalatedAt: "2025-06-03T10:00:00Z",
    loggedBy: "Sarah Johnson",
  },
  {
    id: "comp-006",
    homeId: "oak-house",
    title: "Medication given 2 hours late",
    description:
      "Advocate for Jordan raised concerns that prescribed evening medication was administered 2 hours late on two occasions in the past week.",
    category: "safety",
    stage: "informal",
    status: "open",
    complainantType: "advocate",
    complainantName: "Priya Shah (Independent Advocate)",
    childId: "child-jordan",
    childName: "Jordan",
    receivedAt: "2025-06-12T16:00:00Z",
    acknowledgedAt: "2025-06-12T17:00:00Z",
    investigatorAssigned: undefined,
    targetResponseDate: "2025-06-26T16:00:00Z",
    resolvedAt: undefined,
    outcome: undefined,
    outcomeDescription: undefined,
    actionsTaken: [
      "Reviewed medication log for past 7 days",
      "Identified two late administrations — shift handover gaps",
    ],
    lessonsLearned: undefined,
    complainantSatisfied: undefined,
    ofstedNotified: false,
    loggedBy: "Sarah Johnson",
  },
];

const DEMO_COMPLIMENTS: Compliment[] = [
  {
    id: "cmpl-001",
    homeId: "oak-house",
    source: "child",
    sourceName: "Alex",
    childId: "child-alex",
    childName: "Alex",
    description:
      "Alex said the trip to the climbing centre was brilliant and thanked staff for organising it.",
    category: "activities",
    receivedAt: "2025-06-08T18:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Sarah Johnson",
  },
  {
    id: "cmpl-002",
    homeId: "oak-house",
    source: "parent_carer",
    sourceName: "Mrs Abara",
    childId: "child-morgan",
    childName: "Morgan",
    description:
      "Mrs Abara thanked the team for how well Morgan has settled and for keeping her informed about school progress.",
    category: "care_quality",
    receivedAt: "2025-06-02T10:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Tom Richards",
  },
  {
    id: "cmpl-003",
    homeId: "oak-house",
    source: "social_worker",
    sourceName: "Clare Davies",
    childId: "child-jordan",
    childName: "Jordan",
    description:
      "Social worker praised the home's key-work sessions with Jordan, noting significant progress in emotional regulation.",
    category: "care_quality",
    receivedAt: "2025-05-28T14:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Sarah Johnson",
  },
  {
    id: "cmpl-004",
    homeId: "oak-house",
    source: "child",
    sourceName: "Jordan",
    childId: "child-jordan",
    childName: "Jordan",
    description:
      "Jordan told the Reg 44 visitor that staff always listen to him and he feels safe at Oak House.",
    category: "safety",
    receivedAt: "2025-05-25T11:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Lisa Williams",
  },
  {
    id: "cmpl-005",
    homeId: "oak-house",
    source: "advocate",
    sourceName: "Priya Shah",
    childId: "child-alex",
    childName: "Alex",
    description:
      "Advocate noted that Alex is well-supported with life story work and feels listened to by the team.",
    category: "care_quality",
    receivedAt: "2025-06-10T09:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Tom Richards",
  },
  {
    id: "cmpl-006",
    homeId: "oak-house",
    source: "staff",
    sourceName: "Lisa Williams",
    description:
      "Lisa praised the team's handling of a difficult evening, noting everyone remained calm and followed de-escalation approaches.",
    category: "staff_conduct",
    receivedAt: "2025-06-05T20:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Sarah Johnson",
  },
  {
    id: "cmpl-007",
    homeId: "oak-house",
    source: "child",
    sourceName: "Morgan",
    childId: "child-morgan",
    childName: "Morgan",
    description:
      "Morgan said the food has been much better recently and she loves the new Friday pizza night.",
    category: "food_nutrition",
    receivedAt: "2025-06-11T19:00:00Z",
    sharedWithTeam: true,
    loggedBy: "Tom Richards",
  },
  {
    id: "cmpl-008",
    homeId: "oak-house",
    source: "external",
    sourceName: "School Head Teacher — Oakwood Academy",
    childId: "child-alex",
    childName: "Alex",
    description:
      "Head teacher emailed to commend the home's support for Alex's attendance and homework, noting a marked improvement this term.",
    category: "education",
    receivedAt: "2025-05-30T08:30:00Z",
    sharedWithTeam: true,
    loggedBy: "Sarah Johnson",
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const homeId = "oak-house";

  const metrics = calculateComplaintsMetrics(
    DEMO_COMPLAINTS,
    DEMO_COMPLIMENTS,
    homeId,
    NOW,
  );

  const complianceResults = DEMO_COMPLAINTS.filter(
    (c) => c.homeId === homeId,
  ).map((c) => evaluateComplaintCompliance(c, NOW));

  return NextResponse.json({ metrics, complianceResults });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { complaints, compliments, homeId, now } = body;

  if (!complaints || !compliments || !homeId) {
    return NextResponse.json(
      { error: "Missing required fields: complaints, compliments, homeId" },
      { status: 400 },
    );
  }

  if (!Array.isArray(complaints) || !Array.isArray(compliments)) {
    return NextResponse.json(
      { error: "complaints and compliments must be arrays" },
      { status: 400 },
    );
  }

  if (typeof homeId !== "string" || homeId.length === 0) {
    return NextResponse.json(
      { error: "homeId must be a non-empty string" },
      { status: 400 },
    );
  }

  const metrics = calculateComplaintsMetrics(
    complaints as Complaint[],
    compliments as Compliment[],
    homeId,
    now ?? undefined,
  );

  return NextResponse.json(metrics);
}
