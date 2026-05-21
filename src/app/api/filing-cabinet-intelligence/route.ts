import { NextResponse } from "next/server";
import { generateFilingCabinetIntelligence } from "@/lib/filing-cabinet";
import type { FilingCabinetRecord, FilingCabinetPolicy, StaffFilingCabinetTraining } from "@/lib/filing-cabinet";

const DEMO_RECORDS: FilingCabinetRecord[] = [
  { id: "fc-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "care_plan_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "risk_assessment_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "medical_record_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: false },
  { id: "fc-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "education_record_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "safeguarding_record_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "placement_record_filing", outcome: "partially_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "correspondence_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: false },
  { id: "fc-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "legal_document_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: false, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "care_plan_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "medical_record_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "education_record_filing", outcome: "misfiled", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: false, accessControlSet: true, documentationComplete: true, timelyRecording: true },
  { id: "fc-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "safeguarding_record_filing", outcome: "correctly_filed", correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: true, accessControlSet: false, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: FilingCabinetPolicy = {
  documentManagementPolicy: true, retentionSchedulePolicy: true, dataProtectionFilingPolicy: true,
  accessControlPolicy: true, documentDestructionPolicy: true, auditTrailPolicy: true, backupAndRecoveryPolicy: true,
};

const DEMO_STAFF: StaffFilingCabinetTraining[] = [
  { staffId: "staff-sarah", documentManagementKnowledge: true, dataProtectionSkills: true, retentionPolicyKnowledge: true, accessControlSkills: true, auditTrailSkills: true, documentDestructionProcedure: true },
  { staffId: "staff-tom", documentManagementKnowledge: true, dataProtectionSkills: true, retentionPolicyKnowledge: true, accessControlSkills: true, auditTrailSkills: true, documentDestructionProcedure: false },
  { staffId: "staff-lisa", documentManagementKnowledge: true, dataProtectionSkills: true, retentionPolicyKnowledge: true, accessControlSkills: false, auditTrailSkills: true, documentDestructionProcedure: true },
  { staffId: "staff-darren", documentManagementKnowledge: true, dataProtectionSkills: true, retentionPolicyKnowledge: true, accessControlSkills: true, auditTrailSkills: true, documentDestructionProcedure: true },
];

export async function GET() {
  const result = generateFilingCabinetIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-21",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "filing-cabinet-intelligence", version: "2.0.0" } } });
}
