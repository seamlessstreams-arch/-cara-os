import { NextResponse } from "next/server";
import { generateHrFilesIntelligence } from "@/lib/hr-files";
import type { HrFilesRecord, HrFilesPolicy, StaffHrFilesTraining } from "@/lib/hr-files";

const DEMO_RECORDS: HrFilesRecord[] = [
  { id: "hr-001", homeId: "home-oak", date: "2026-01-15", childId: "staff-sarah", childName: "Sarah Johnson", category: "supervision_record", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-002", homeId: "home-oak", date: "2026-02-10", childId: "staff-sarah", childName: "Sarah Johnson", category: "training_completion", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-003", homeId: "home-oak", date: "2026-03-05", childId: "staff-sarah", childName: "Sarah Johnson", category: "dbs_check", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: false },
  { id: "hr-004", homeId: "home-oak", date: "2026-01-20", childId: "staff-tom", childName: "Tom Richards", category: "probation_review", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-005", homeId: "home-oak", date: "2026-02-15", childId: "staff-tom", childName: "Tom Richards", category: "absence_management", outcome: "partially_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-006", homeId: "home-oak", date: "2026-03-10", childId: "staff-tom", childName: "Tom Richards", category: "performance_review", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: false },
  { id: "hr-007", homeId: "home-oak", date: "2026-02-01", childId: "staff-lisa", childName: "Lisa Williams", category: "disciplinary_record", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-008", homeId: "home-oak", date: "2026-03-15", childId: "staff-lisa", childName: "Lisa Williams", category: "recruitment_record", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-009", homeId: "home-oak", date: "2026-04-10", childId: "staff-lisa", childName: "Lisa Williams", category: "supervision_record", outcome: "overdue", recordAccurate: true, signaturesObtained: false, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-010", homeId: "home-oak", date: "2026-02-05", childId: "staff-darren", childName: "Darren Laville", category: "training_completion", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-011", homeId: "home-oak", date: "2026-03-20", childId: "staff-darren", childName: "Darren Laville", category: "dbs_check", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: true, timeframesMet: true, documentationComplete: true, timelyRecording: true },
  { id: "hr-012", homeId: "home-oak", date: "2026-05-01", childId: "staff-darren", childName: "Darren Laville", category: "absence_management", outcome: "fully_compliant", recordAccurate: true, signaturesObtained: true, actionPointsDocumented: false, timeframesMet: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: HrFilesPolicy = {
  supervisionPolicy: true, mandatoryTrainingPolicy: true, saferRecruitmentPolicy: true,
  dbsRenewalPolicy: true, absenceManagementPolicy: true, performanceReviewPolicy: true, disciplinaryPolicy: true,
};

const DEMO_STAFF: StaffHrFilesTraining[] = [
  { staffId: "staff-sarah", hrPolicyKnowledge: true, supervisionSkills: true, saferRecruitmentKnowledge: true, trainingComplianceSkills: true, absenceManagementSkills: true, performanceReviewSkills: true },
  { staffId: "staff-tom", hrPolicyKnowledge: true, supervisionSkills: true, saferRecruitmentKnowledge: true, trainingComplianceSkills: true, absenceManagementSkills: true, performanceReviewSkills: false },
  { staffId: "staff-lisa", hrPolicyKnowledge: true, supervisionSkills: true, saferRecruitmentKnowledge: true, trainingComplianceSkills: false, absenceManagementSkills: true, performanceReviewSkills: true },
  { staffId: "staff-darren", hrPolicyKnowledge: true, supervisionSkills: true, saferRecruitmentKnowledge: true, trainingComplianceSkills: true, absenceManagementSkills: true, performanceReviewSkills: true },
];

export async function GET() {
  const result = generateHrFilesIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-21",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "hr-files-intelligence", version: "2.0.0" } } });
}
