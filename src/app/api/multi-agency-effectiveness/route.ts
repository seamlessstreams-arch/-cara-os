// ══════════════════════════════════════════════════════════════════════════════
// API: /api/multi-agency-effectiveness
//
// Multi-Agency Effectiveness Intelligence
//
// GET  — Returns Oak House demo data with full effectiveness analysis
// POST — Accepts custom data with validation and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiAgencyEffectivenessIntelligence,
} from "@/lib/multi-agency-effectiveness";
import type {
  MultiAgencyMeeting,
  InformationSharingRecord,
  ProfessionalRelationship,
  Escalation,
} from "@/lib/multi-agency-effectiveness";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  meetings: MultiAgencyMeeting[];
  sharing: InformationSharingRecord[];
  relationships: ProfessionalRelationship[];
  escalations: Escalation[];
  childIds: string[];
} {
  const meetings: MultiAgencyMeeting[] = [
    {
      id: "mtg-001",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-04-15",
      meetingType: "LAC_review",
      chairedBy: "IRO Jane Smith",
      agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
      agenciesAttended: ["social_worker", "CAMHS", "education", "IRO"],
      childParticipated: true,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "all_actions_agreed",
      actionsAgreed: 6,
      actionsCompleted: 5,
      minutesCirculated: true,
      minutesTimely: true,
    },
    {
      id: "mtg-002",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-04-22",
      meetingType: "PEP",
      chairedBy: "Virtual Head Mrs Clarke",
      agenciesInvited: ["social_worker", "education"],
      agenciesAttended: ["social_worker", "education"],
      childParticipated: true,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "all_actions_agreed",
      actionsAgreed: 4,
      actionsCompleted: 4,
      minutesCirculated: true,
      minutesTimely: true,
    },
    {
      id: "mtg-003",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-04-18",
      meetingType: "CIN",
      chairedBy: "SW Team Manager",
      agenciesInvited: ["social_worker", "CAMHS", "education", "YOT"],
      agenciesAttended: ["social_worker", "education", "YOT"],
      childParticipated: false,
      parentParticipated: true,
      homeStaffAttended: true,
      outcome: "partial_agreement",
      actionsAgreed: 5,
      actionsCompleted: 3,
      minutesCirculated: true,
      minutesTimely: false,
    },
    {
      id: "mtg-004",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-01",
      meetingType: "strategy",
      chairedBy: "MASH Manager",
      agenciesInvited: ["social_worker", "police", "CAMHS"],
      agenciesAttended: ["social_worker", "police"],
      childParticipated: false,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "escalated",
      actionsAgreed: 3,
      actionsCompleted: 2,
      minutesCirculated: true,
      minutesTimely: true,
    },
    {
      id: "mtg-005",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-04-20",
      meetingType: "LAC_review",
      chairedBy: "IRO Dr Ahmed",
      agenciesInvited: ["social_worker", "CAMHS", "education", "health_visitor", "IRO"],
      agenciesAttended: ["social_worker", "CAMHS", "health_visitor", "IRO"],
      childParticipated: true,
      parentParticipated: true,
      homeStaffAttended: true,
      outcome: "all_actions_agreed",
      actionsAgreed: 7,
      actionsCompleted: 6,
      minutesCirculated: true,
      minutesTimely: true,
    },
    {
      id: "mtg-006",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-03",
      meetingType: "health_review",
      chairedBy: "Dr Patel",
      agenciesInvited: ["health_visitor", "CAMHS"],
      agenciesAttended: ["health_visitor", "CAMHS"],
      childParticipated: true,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "all_actions_agreed",
      actionsAgreed: 3,
      actionsCompleted: 3,
      minutesCirculated: true,
      minutesTimely: true,
    },
    {
      id: "mtg-007",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-06",
      meetingType: "professionals",
      chairedBy: "Sarah Johnson",
      agenciesInvited: ["social_worker", "CAMHS", "education", "therapist"],
      agenciesAttended: ["social_worker", "CAMHS", "therapist"],
      childParticipated: false,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "partial_agreement",
      actionsAgreed: 4,
      actionsCompleted: 2,
      minutesCirculated: false,
      minutesTimely: false,
    },
    {
      id: "mtg-008",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-10",
      meetingType: "risk_management",
      chairedBy: "Darren Laville",
      agenciesInvited: ["social_worker", "police", "YOT", "CAMHS"],
      agenciesAttended: ["social_worker", "police", "YOT", "CAMHS"],
      childParticipated: true,
      parentParticipated: false,
      homeStaffAttended: true,
      outcome: "all_actions_agreed",
      actionsAgreed: 5,
      actionsCompleted: 5,
      minutesCirculated: true,
      minutesTimely: true,
    },
  ];

  const sharing: InformationSharingRecord[] = [
    {
      id: "share-001",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-04-16",
      fromAgency: "social_worker",
      toAgency: "CAMHS",
      informationType: "Care plan update",
      quality: "timely_complete",
    },
    {
      id: "share-002",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-04-20",
      fromAgency: "CAMHS",
      toAgency: "social_worker",
      informationType: "CAMHS assessment summary",
      quality: "timely_complete",
    },
    {
      id: "share-003",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-04-19",
      fromAgency: "education",
      toAgency: "social_worker",
      informationType: "School attendance report",
      quality: "timely_incomplete",
    },
    {
      id: "share-004",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-04-25",
      fromAgency: "YOT",
      toAgency: "social_worker",
      informationType: "YOT intervention report",
      quality: "delayed_complete",
    },
    {
      id: "share-005",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-04-21",
      fromAgency: "health_visitor",
      toAgency: "social_worker",
      informationType: "Health assessment",
      quality: "timely_complete",
    },
    {
      id: "share-006",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-01",
      fromAgency: "CAMHS",
      toAgency: "education",
      informationType: "Emotional wellbeing report",
      quality: "timely_complete",
    },
    {
      id: "share-007",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-03",
      fromAgency: "therapist",
      toAgency: "social_worker",
      informationType: "Therapy progress report",
      quality: "delayed_incomplete",
    },
    {
      id: "share-008",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-05",
      fromAgency: "police",
      toAgency: "social_worker",
      informationType: "Missing episode debrief",
      quality: "timely_complete",
    },
    {
      id: "share-009",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-07",
      fromAgency: "education",
      toAgency: "CAMHS",
      informationType: "EHCP review notes",
      quality: "delayed_complete",
    },
    {
      id: "share-010",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-08",
      fromAgency: "social_worker",
      toAgency: "YOT",
      informationType: "Placement plan update",
      quality: "not_shared",
    },
    {
      id: "share-011",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-10",
      fromAgency: "education",
      toAgency: "social_worker",
      informationType: "PEP follow-up",
      quality: "timely_complete",
    },
  ];

  const relationships: ProfessionalRelationship[] = [
    {
      id: "rel-001",
      agencyType: "social_worker",
      contactName: "Jane Adams",
      relationship: "strong",
      lastContact: "2026-05-10",
      responsiveness: "excellent",
      jointWorkingQuality: "Excellent collaborative working on care plans",
    },
    {
      id: "rel-002",
      agencyType: "CAMHS",
      contactName: "Dr Sarah Mitchell",
      relationship: "strong",
      lastContact: "2026-05-08",
      responsiveness: "good",
      jointWorkingQuality: "Regular joint sessions for children with complex needs",
    },
    {
      id: "rel-003",
      agencyType: "education",
      contactName: "Mrs Helen Clarke",
      relationship: "adequate",
      lastContact: "2026-05-06",
      responsiveness: "good",
      jointWorkingQuality: "Good PEP attendance but follow-up could improve",
    },
    {
      id: "rel-004",
      agencyType: "health_visitor",
      contactName: "Nurse Thompson",
      relationship: "developing",
      lastContact: "2026-04-28",
      responsiveness: "adequate",
    },
    {
      id: "rel-005",
      agencyType: "IRO",
      contactName: "Dr Ahmed",
      relationship: "strong",
      lastContact: "2026-05-10",
      responsiveness: "excellent",
    },
    {
      id: "rel-006",
      agencyType: "YOT",
      contactName: "Mark Davies",
      relationship: "adequate",
      lastContact: "2026-05-05",
      responsiveness: "adequate",
    },
  ];

  const escalations: Escalation[] = [
    {
      id: "esc-001",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-04-25",
      escalatedTo: "social_worker",
      reason: "Social worker not responding to CIN review requests",
      responseReceived: true,
      responseTimelyDays: 3,
      outcomeAchieved: true,
      resolution: "Meeting rescheduled within 5 working days",
    },
    {
      id: "esc-002",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-02",
      escalatedTo: "CAMHS",
      reason: "CAMHS appointment repeatedly cancelled",
      responseReceived: true,
      responseTimelyDays: 7,
      outcomeAchieved: true,
      resolution: "Priority appointment arranged",
    },
    {
      id: "esc-003",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-06",
      escalatedTo: "police",
      reason: "Inadequate response to missing episode",
      responseReceived: true,
      responseTimelyDays: 1,
      outcomeAchieved: false,
      resolution: "Under review with senior officer",
    },
    {
      id: "esc-004",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-09",
      escalatedTo: "education",
      reason: "EHCP provision not being delivered",
      responseReceived: false,
      outcomeAchieved: false,
    },
  ];

  const childIds = ["child-alex", "child-jordan", "child-morgan"];

  return { meetings, sharing, relationships, escalations, childIds };
}

// ── Validation helpers ────────────────────────────────────────────────────

const VALID_AGENCY_TYPES = new Set([
  "social_worker", "CAMHS", "education", "health_visitor", "police",
  "YOT", "LADO", "IRO", "therapist", "substance_misuse", "housing", "other",
]);

const VALID_MEETING_TYPES = new Set([
  "strategy", "CIN", "LAC_review", "PEP", "health_review",
  "professionals", "discharge_planning", "risk_management", "other",
]);

const VALID_OUTCOMES = new Set([
  "all_actions_agreed", "partial_agreement", "deferred", "escalated",
]);

const VALID_QUALITIES = new Set([
  "timely_complete", "timely_incomplete", "delayed_complete",
  "delayed_incomplete", "not_shared",
]);

function validateMeeting(m: unknown, idx: number): string | null {
  if (!m || typeof m !== "object") return `meetings[${idx}]: must be an object`;
  const obj = m as Record<string, unknown>;
  if (typeof obj.id !== "string") return `meetings[${idx}].id: required string`;
  if (typeof obj.childId !== "string") return `meetings[${idx}].childId: required string`;
  if (typeof obj.date !== "string") return `meetings[${idx}].date: required string`;
  if (!VALID_MEETING_TYPES.has(obj.meetingType as string))
    return `meetings[${idx}].meetingType: invalid value`;
  if (!VALID_OUTCOMES.has(obj.outcome as string))
    return `meetings[${idx}].outcome: invalid value`;
  return null;
}

function validateSharing(r: unknown, idx: number): string | null {
  if (!r || typeof r !== "object") return `sharing[${idx}]: must be an object`;
  const obj = r as Record<string, unknown>;
  if (typeof obj.id !== "string") return `sharing[${idx}].id: required string`;
  if (typeof obj.childId !== "string") return `sharing[${idx}].childId: required string`;
  if (!VALID_AGENCY_TYPES.has(obj.fromAgency as string))
    return `sharing[${idx}].fromAgency: invalid value`;
  if (!VALID_AGENCY_TYPES.has(obj.toAgency as string))
    return `sharing[${idx}].toAgency: invalid value`;
  if (!VALID_QUALITIES.has(obj.quality as string))
    return `sharing[${idx}].quality: invalid value`;
  return null;
}

function validateRelationship(r: unknown, idx: number): string | null {
  if (!r || typeof r !== "object") return `relationships[${idx}]: must be an object`;
  const obj = r as Record<string, unknown>;
  if (typeof obj.id !== "string") return `relationships[${idx}].id: required string`;
  if (!VALID_AGENCY_TYPES.has(obj.agencyType as string))
    return `relationships[${idx}].agencyType: invalid value`;
  if (!["strong", "adequate", "developing", "poor"].includes(obj.relationship as string))
    return `relationships[${idx}].relationship: invalid value`;
  if (!["excellent", "good", "adequate", "poor"].includes(obj.responsiveness as string))
    return `relationships[${idx}].responsiveness: invalid value`;
  return null;
}

function validateEscalation(e: unknown, idx: number): string | null {
  if (!e || typeof e !== "object") return `escalations[${idx}]: must be an object`;
  const obj = e as Record<string, unknown>;
  if (typeof obj.id !== "string") return `escalations[${idx}].id: required string`;
  if (typeof obj.childId !== "string") return `escalations[${idx}].childId: required string`;
  if (!VALID_AGENCY_TYPES.has(obj.escalatedTo as string))
    return `escalations[${idx}].escalatedTo: invalid value`;
  if (typeof obj.responseReceived !== "boolean")
    return `escalations[${idx}].responseReceived: required boolean`;
  if (typeof obj.outcomeAchieved !== "boolean")
    return `escalations[${idx}].outcomeAchieved: required boolean`;
  return null;
}

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { meetings, sharing, relationships, escalations, childIds } =
      generateDemoData();

    const result = generateMultiAgencyEffectivenessIntelligence(
      meetings,
      sharing,
      relationships,
      escalations,
      childIds,
      "oak-house",
      "2026-04-15",
      "2026-05-15",
      "2026-05-15",
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const {
      meetings = [],
      sharing = [],
      relationships = [],
      escalations = [],
      childIds = [],
      homeId = "unknown",
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    if (!periodStart || typeof periodStart !== "string") {
      return NextResponse.json(
        { error: "periodStart is required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (!periodEnd || typeof periodEnd !== "string") {
      return NextResponse.json(
        { error: "periodEnd is required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    if (!Array.isArray(meetings)) {
      return NextResponse.json(
        { error: "meetings must be an array" },
        { status: 400 },
      );
    }
    if (!Array.isArray(sharing)) {
      return NextResponse.json(
        { error: "sharing must be an array" },
        { status: 400 },
      );
    }
    if (!Array.isArray(relationships)) {
      return NextResponse.json(
        { error: "relationships must be an array" },
        { status: 400 },
      );
    }
    if (!Array.isArray(escalations)) {
      return NextResponse.json(
        { error: "escalations must be an array" },
        { status: 400 },
      );
    }
    if (!Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "childIds must be an array" },
        { status: 400 },
      );
    }

    // Validate each item
    const errors: string[] = [];
    (meetings as unknown[]).forEach((m, i) => {
      const err = validateMeeting(m, i);
      if (err) errors.push(err);
    });
    (sharing as unknown[]).forEach((r, i) => {
      const err = validateSharing(r, i);
      if (err) errors.push(err);
    });
    (relationships as unknown[]).forEach((r, i) => {
      const err = validateRelationship(r, i);
      if (err) errors.push(err);
    });
    (escalations as unknown[]).forEach((e, i) => {
      const err = validateEscalation(e, i);
      if (err) errors.push(err);
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    const result = generateMultiAgencyEffectivenessIntelligence(
      meetings as MultiAgencyMeeting[],
      sharing as InformationSharingRecord[],
      relationships as ProfessionalRelationship[],
      escalations as Escalation[],
      childIds as string[],
      homeId as string,
      periodStart,
      periodEnd,
      referenceDate,
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
