import { NextResponse } from "next/server";
import { generateSafeguardingIntelligence } from "@/lib/safeguarding";
import type { SafeguardingRecord, SafeguardingPolicy, StaffSafeguardingTraining } from "@/lib/safeguarding";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: SafeguardingRecord[] = [
  { id: "sg-001", homeId: "home-oak", date: "2026-05-14", childId: "child-alex", childName: "Alex", category: "concern_raised", outcome: "action_taken", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-002", homeId: "home-oak", date: "2026-05-07", childId: "child-jordan", childName: "Jordan", category: "referral_made", outcome: "referral_accepted", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-003", homeId: "home-oak", date: "2026-04-30", childId: "child-morgan", childName: "Morgan", category: "strategy_meeting", outcome: "action_taken", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: false, documentationComplete: true, timelyRecording: true },
  { id: "sg-004", homeId: "home-oak", date: "2026-04-23", childId: "child-alex", childName: "Alex", category: "risk_assessment", outcome: "ongoing_monitoring", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-005", homeId: "home-oak", date: "2026-04-16", childId: "child-jordan", childName: "Jordan", category: "chronology_update", outcome: "action_taken", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: false, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-006", homeId: "home-oak", date: "2026-04-09", childId: "child-morgan", childName: "Morgan", category: "multi_agency_contact", outcome: "action_taken", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: false },
  { id: "sg-007", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "child_protection_review", outcome: "action_taken", timelyResponse: true, childViewCaptured: false, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-008", homeId: "home-oak", date: "2026-03-26", childId: "child-jordan", childName: "Jordan", category: "preventive_action", outcome: "no_further_action", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-009", homeId: "home-oak", date: "2026-03-19", childId: "child-morgan", childName: "Morgan", category: "concern_raised", outcome: "action_taken", timelyResponse: false, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: false, timelyRecording: true },
  { id: "sg-010", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "referral_made", outcome: "referral_accepted", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-011", homeId: "home-oak", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", category: "strategy_meeting", outcome: "action_taken", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "sg-012", homeId: "home-oak", date: "2026-02-26", childId: "child-morgan", childName: "Morgan", category: "risk_assessment", outcome: "ongoing_monitoring", timelyResponse: true, childViewCaptured: true, multiAgencyEngaged: true, riskAssessmentUpdated: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: SafeguardingPolicy = {
  safeguardingPolicy: true,
  whistleblowingPolicy: true,
  childProtectionProcedure: true,
  escortionPolicy: true,
  onlineSafetyPolicy: true,
  allegationsAgainstStaffPolicy: true,
  preventDutyPolicy: true,
};

const DEMO_STAFF: StaffSafeguardingTraining[] = [
  { staffId: "staff-sarah", safeguardingLevel3: true, childProtectionAwareness: true, preventDutyTraining: true, onlineSafetyTraining: true, concernRecordingSkills: true, multiAgencyWorkingKnowledge: true },
  { staffId: "staff-tom", safeguardingLevel3: true, childProtectionAwareness: true, preventDutyTraining: true, onlineSafetyTraining: true, concernRecordingSkills: true, multiAgencyWorkingKnowledge: false },
  { staffId: "staff-lisa", safeguardingLevel3: true, childProtectionAwareness: true, preventDutyTraining: true, onlineSafetyTraining: true, concernRecordingSkills: true, multiAgencyWorkingKnowledge: true },
  { staffId: "staff-darren", safeguardingLevel3: true, childProtectionAwareness: true, preventDutyTraining: true, onlineSafetyTraining: true, concernRecordingSkills: true, multiAgencyWorkingKnowledge: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateSafeguardingIntelligence({
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
      meta: { generatedAt: new Date().toISOString(), engine: "safeguarding", version: "2.0.0" },
    },
  });
}
