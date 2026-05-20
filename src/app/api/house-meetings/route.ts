import { NextResponse } from "next/server";
import { generateHouseMeetingsIntelligence } from "@/lib/house-meetings";
import type { HouseMeetingRecord, HouseMeetingPolicy, StaffHouseMeetingTraining } from "@/lib/house-meetings";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: HouseMeetingRecord[] = [
  { id: "hm-001", homeId: "home-oak", date: "2026-05-14", childId: "child-alex", childName: "Alex", category: "house_meeting", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-002", homeId: "home-oak", date: "2026-05-07", childId: "child-jordan", childName: "Jordan", category: "childrens_council", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-003", homeId: "home-oak", date: "2026-04-30", childId: "child-morgan", childName: "Morgan", category: "menu_planning", outcome: "child_led", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-004", homeId: "home-oak", date: "2026-04-23", childId: "child-alex", childName: "Alex", category: "activity_planning", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: false, documentationComplete: true, timelyRecording: true },
  { id: "hm-005", homeId: "home-oak", date: "2026-04-16", childId: "child-jordan", childName: "Jordan", category: "rules_review", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-006", homeId: "home-oak", date: "2026-04-09", childId: "child-morgan", childName: "Morgan", category: "agenda_setting", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: false },
  { id: "hm-007", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "action_review", outcome: "fully_completed", childContributedToAgenda: false, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-008", homeId: "home-oak", date: "2026-03-26", childId: "child-jordan", childName: "Jordan", category: "special_topic", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-009", homeId: "home-oak", date: "2026-03-19", childId: "child-morgan", childName: "Morgan", category: "house_meeting", outcome: "partially_completed", childContributedToAgenda: true, minutesRecorded: false, childAttended: true, actionsReviewed: true, documentationComplete: false, timelyRecording: true },
  { id: "hm-010", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "childrens_council", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-011", homeId: "home-oak", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", category: "menu_planning", outcome: "child_led", childContributedToAgenda: true, minutesRecorded: true, childAttended: false, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "hm-012", homeId: "home-oak", date: "2026-02-26", childId: "child-morgan", childName: "Morgan", category: "activity_planning", outcome: "fully_completed", childContributedToAgenda: true, minutesRecorded: true, childAttended: true, actionsReviewed: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: HouseMeetingPolicy = {
  houseMeetingPolicy: true,
  meetingFrequencyGuidance: true,
  childParticipationFramework: true,
  minutesAccessibilityPolicy: true,
  actionTrackingProcedure: true,
  suggestionBoxPolicy: true,
  councilGovernanceFramework: true,
};

const DEMO_STAFF: StaffHouseMeetingTraining[] = [
  { staffId: "staff-sarah", meetingFacilitation: true, childParticipation: true, minutesTaking: true, actionTracking: true, conflictResolution: true, inclusivePractice: true },
  { staffId: "staff-tom", meetingFacilitation: true, childParticipation: true, minutesTaking: true, actionTracking: true, conflictResolution: false, inclusivePractice: true },
  { staffId: "staff-lisa", meetingFacilitation: true, childParticipation: true, minutesTaking: true, actionTracking: true, conflictResolution: true, inclusivePractice: true },
  { staffId: "staff-darren", meetingFacilitation: true, childParticipation: true, minutesTaking: true, actionTracking: true, conflictResolution: true, inclusivePractice: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateHouseMeetingsIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "house-meetings", version: "2.0.0" },
    },
  });
}
