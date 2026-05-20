import { NextResponse } from "next/server";
import { generateMultiAgencyIntelligence } from "@/lib/multi-agency";
import type { MultiAgencyRecord, MultiAgencyPolicy, StaffMultiAgencyTraining } from "@/lib/multi-agency";

const DEMO_RECORDS: MultiAgencyRecord[] = [
  // Alex — 4 records across different categories
  { id: "ma-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "strategy_meeting", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "lac_review", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "information_sharing", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: false },
  { id: "ma-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "joint_assessment", outcome: "partially_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: false, documentationComplete: true, timelyRecording: true },

  // Jordan — 4 records
  { id: "ma-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "care_team_meeting", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "professional_consultation", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "referral_coordination", outcome: "partially_engaged", agencyAttendanceConfirmed: false, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: false },
  { id: "ma-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "multi_agency_training", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },

  // Morgan — 4 records
  { id: "ma-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "strategy_meeting", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "lac_review", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
  { id: "ma-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "care_team_meeting", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: false, informationSharedAppropriately: true, childViewRepresented: true, documentationComplete: false, timelyRecording: true },
  { id: "ma-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "information_sharing", outcome: "fully_engaged", agencyAttendanceConfirmed: true, actionPointsRecorded: true, informationSharedAppropriately: false, childViewRepresented: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: MultiAgencyPolicy = {
  multiAgencyWorkingPolicy: true,
  informationSharingProtocol: true,
  lacReviewProcedure: true,
  referralCoordinationPolicy: true,
  jointAssessmentFramework: true,
  professionalConsultationPolicy: true,
  multiAgencyTrainingPolicy: true,
};

const DEMO_STAFF: StaffMultiAgencyTraining[] = [
  { staffId: "staff-sarah", multiAgencyWorkingKnowledge: true, informationSharingSkills: true, meetingFacilitationSkills: true, referralProcessKnowledge: true, jointAssessmentSkills: true, professionalBoundaries: true },
  { staffId: "staff-tom", multiAgencyWorkingKnowledge: true, informationSharingSkills: true, meetingFacilitationSkills: true, referralProcessKnowledge: true, jointAssessmentSkills: false, professionalBoundaries: true },
  { staffId: "staff-lisa", multiAgencyWorkingKnowledge: true, informationSharingSkills: true, meetingFacilitationSkills: false, referralProcessKnowledge: true, jointAssessmentSkills: true, professionalBoundaries: true },
  { staffId: "staff-darren", multiAgencyWorkingKnowledge: true, informationSharingSkills: true, meetingFacilitationSkills: true, referralProcessKnowledge: true, jointAssessmentSkills: true, professionalBoundaries: true },
];

export async function GET() {
  const result = generateMultiAgencyIntelligence({
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
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "multi-agency-intelligence",
        version: "2.0.0",
      },
    },
  });
}
