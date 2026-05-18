// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Handover & Communication Quality Intelligence API Route
//
// GET  → returns Oak House demo handover & communication quality intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateHandoverCommunicationQualityIntelligence } from "@/lib/handover-communication-quality/handover-communication-quality-engine";
import type {
  HandoverRecord,
  CommunicationRecord,
  TeamMeetingRecord,
  InformationGovernance,
} from "@/lib/handover-communication-quality/handover-communication-quality-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

const STAFF_IDS = ["darren", "sarah", "tom", "lisa"];
const STAFF_NAMES: Record<string, string> = {
  darren: "Darren",
  sarah: "Sarah",
  tom: "Tom",
  lisa: "Lisa",
};

function getDemoData() {
  // ── Handovers ──
  const handovers: HandoverRecord[] = [
    {
      id: "h-01",
      date: "2025-03-01",
      handoverType: "shift_handover",
      format: "face_to_face",
      outgoingStaff: "darren",
      incomingStaff: "sarah",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      appointmentsNoted: true,
      completionQuality: "thorough",
      duration: 20,
      timeliness: true,
    },
    {
      id: "h-02",
      date: "2025-03-02",
      handoverType: "shift_handover",
      format: "combined",
      outgoingStaff: "sarah",
      incomingStaff: "tom",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      appointmentsNoted: true,
      completionQuality: "thorough",
      duration: 18,
      timeliness: true,
    },
    {
      id: "h-03",
      date: "2025-03-03",
      handoverType: "shift_handover",
      format: "face_to_face",
      outgoingStaff: "tom",
      incomingStaff: "lisa",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: false,
      medicationUpdatesIncluded: true,
      appointmentsNoted: true,
      completionQuality: "adequate",
      duration: 10,
      timeliness: true,
    },
    {
      id: "h-04",
      date: "2025-03-04",
      handoverType: "on_call_handover",
      format: "digital_record",
      outgoingStaff: "lisa",
      incomingStaff: "darren",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: false,
      appointmentsNoted: false,
      completionQuality: "adequate",
      duration: 8,
      timeliness: false,
    },
    {
      id: "h-05",
      date: "2025-03-05",
      handoverType: "management_handover",
      format: "combined",
      outgoingStaff: "darren",
      incomingStaff: "sarah",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      appointmentsNoted: true,
      completionQuality: "thorough",
      duration: 25,
      timeliness: true,
    },
    {
      id: "h-06",
      date: "2025-03-06",
      handoverType: "shift_handover",
      format: "face_to_face",
      outgoingStaff: "sarah",
      incomingStaff: "tom",
      childUpdatesIncluded: true,
      riskUpdatesIncluded: true,
      medicationUpdatesIncluded: true,
      appointmentsNoted: true,
      completionQuality: "thorough",
      duration: 15,
      timeliness: true,
    },
  ];

  // ── Communications ──
  const communications: CommunicationRecord[] = [
    {
      id: "comm-01",
      date: "2025-03-01",
      channel: "email",
      sender: "darren",
      priority: "critical",
      acknowledged: true,
      actionRequired: true,
      actionCompleted: true,
      responseTime: 15,
      relatedToChild: true,
    },
    {
      id: "comm-02",
      date: "2025-03-01",
      channel: "daily_log",
      sender: "sarah",
      priority: "medium",
      acknowledged: true,
      actionRequired: false,
      actionCompleted: null,
      responseTime: 30,
      relatedToChild: true,
    },
    {
      id: "comm-03",
      date: "2025-03-02",
      channel: "staff_message_board",
      sender: "tom",
      priority: "high",
      acknowledged: true,
      actionRequired: true,
      actionCompleted: true,
      responseTime: 25,
      relatedToChild: false,
    },
    {
      id: "comm-04",
      date: "2025-03-02",
      channel: "phone",
      sender: "lisa",
      priority: "critical",
      acknowledged: true,
      actionRequired: true,
      actionCompleted: true,
      responseTime: 10,
      relatedToChild: true,
    },
    {
      id: "comm-05",
      date: "2025-03-03",
      channel: "email",
      sender: "darren",
      priority: "medium",
      acknowledged: true,
      actionRequired: true,
      actionCompleted: false,
      responseTime: 45,
      relatedToChild: true,
    },
    {
      id: "comm-06",
      date: "2025-03-04",
      channel: "digital_system",
      sender: "sarah",
      priority: "low",
      acknowledged: false,
      actionRequired: false,
      actionCompleted: null,
      responseTime: null,
      relatedToChild: false,
    },
    {
      id: "comm-07",
      date: "2025-03-05",
      channel: "handover_book",
      sender: "tom",
      priority: "high",
      acknowledged: true,
      actionRequired: true,
      actionCompleted: true,
      responseTime: 20,
      relatedToChild: true,
    },
    {
      id: "comm-08",
      date: "2025-03-06",
      channel: "email",
      sender: "lisa",
      priority: "medium",
      acknowledged: true,
      actionRequired: false,
      actionCompleted: null,
      responseTime: 35,
      relatedToChild: true,
    },
  ];

  // ── Team Meetings ──
  const meetings: TeamMeetingRecord[] = [
    {
      id: "m-01",
      date: "2025-03-03",
      facilitator: "darren",
      attendeeCount: 4,
      totalStaff: 4,
      agendaUsed: true,
      minutesTaken: true,
      actionPointsGenerated: 6,
      actionPointsCompleted: 5,
      childrenDiscussed: true,
      safeguardingDiscussed: true,
      duration: 60,
    },
    {
      id: "m-02",
      date: "2025-03-10",
      facilitator: "sarah",
      attendeeCount: 3,
      totalStaff: 4,
      agendaUsed: true,
      minutesTaken: true,
      actionPointsGenerated: 4,
      actionPointsCompleted: 4,
      childrenDiscussed: true,
      safeguardingDiscussed: true,
      duration: 45,
    },
  ];

  // ── Information Governance Assessments ──
  const assessments: InformationGovernance[] = [
    {
      id: "ig-01",
      assessmentDate: "2025-02-15",
      assessor: "darren",
      dataProtectionCompliant: true,
      secureStorageUsed: true,
      needToKnowApplied: true,
      consentRecorded: true,
      thirdPartySharingProtocol: true,
      breachReportingProcess: true,
      staffTrainedIG: true,
    },
    {
      id: "ig-02",
      assessmentDate: "2025-03-15",
      assessor: "sarah",
      dataProtectionCompliant: true,
      secureStorageUsed: true,
      needToKnowApplied: true,
      consentRecorded: true,
      thirdPartySharingProtocol: true,
      breachReportingProcess: true,
      staffTrainedIG: false,
    },
  ];

  return { handovers, communications, meetings, assessments };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { handovers, communications, meetings, assessments } = getDemoData();
    const result = generateHandoverCommunicationQualityIntelligence(
      handovers,
      communications,
      meetings,
      assessments,
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Failed to generate handover & communication quality intelligence",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      handovers,
      communications,
      meetings,
      assessments,
      staffIds,
      staffNames,
      homeId,
      periodStart,
      periodEnd,
    } = body;

    if (
      !handovers ||
      !communications ||
      !staffIds ||
      !staffNames ||
      !homeId ||
      !periodStart ||
      !periodEnd
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: handovers, communications, staffIds, staffNames, homeId, periodStart, periodEnd",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(handovers) ||
      !Array.isArray(communications) ||
      !Array.isArray(staffIds)
    ) {
      return NextResponse.json(
        {
          error: "handovers, communications, and staffIds must be arrays",
        },
        { status: 400 },
      );
    }

    if (meetings !== undefined && meetings !== null && !Array.isArray(meetings)) {
      return NextResponse.json(
        { error: "meetings must be an array if provided" },
        { status: 400 },
      );
    }

    if (
      assessments !== undefined &&
      assessments !== null &&
      !Array.isArray(assessments)
    ) {
      return NextResponse.json(
        { error: "assessments must be an array if provided" },
        { status: 400 },
      );
    }

    const result = generateHandoverCommunicationQualityIntelligence(
      handovers,
      communications,
      Array.isArray(meetings) ? meetings : [],
      Array.isArray(assessments) ? assessments : [],
      staffIds,
      staffNames,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process handover & communication quality data",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
