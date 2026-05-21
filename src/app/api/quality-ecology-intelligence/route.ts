import { NextResponse } from "next/server";
import { generateQualityEcologyIntelligence } from "@/lib/quality-ecology";
import type { QualityEcologyRecord, QualityEcologyPolicy, StaffQualityEcologyTraining } from "@/lib/quality-ecology";

const DEMO_RECORDS: QualityEcologyRecord[] = [
  { id: "qe-001", homeId: "home-oak", date: "2026-01-10", childId: "child-alex", childName: "Alex", category: "lifecycle_management", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-002", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "record_locking", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-003", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "audit_trail", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "qa_sampling", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "compliance_monitoring", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "escalation_management", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "amendment_tracking", outcome: "partially_compliant", qualityCheckPassed: false, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: false },
  { id: "qe-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "quality_review", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "lifecycle_management", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "record_locking", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
  { id: "qe-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "audit_trail", outcome: "partially_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: false, timelyRecording: true },
  { id: "qe-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "qa_sampling", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: false, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: QualityEcologyPolicy = {
  qualityAssurancePolicy: true, recordLockingPolicy: true, auditTrailPolicy: true,
  lifecycleManagementPolicy: true, amendmentPolicy: true, qaSamplingPolicy: true, escalationPolicy: true,
};

const DEMO_STAFF: StaffQualityEcologyTraining[] = [
  { staffId: "staff-sarah", qualityAssuranceKnowledge: true, recordLockingSkills: true, auditTrailSkills: true, lifecycleManagementSkills: true, qaSamplingSkills: true, amendmentProcedureKnowledge: true },
  { staffId: "staff-tom", qualityAssuranceKnowledge: true, recordLockingSkills: true, auditTrailSkills: true, lifecycleManagementSkills: true, qaSamplingSkills: true, amendmentProcedureKnowledge: false },
  { staffId: "staff-lisa", qualityAssuranceKnowledge: true, recordLockingSkills: true, auditTrailSkills: true, lifecycleManagementSkills: true, qaSamplingSkills: false, amendmentProcedureKnowledge: true },
  { staffId: "staff-darren", qualityAssuranceKnowledge: true, recordLockingSkills: true, auditTrailSkills: true, lifecycleManagementSkills: true, qaSamplingSkills: true, amendmentProcedureKnowledge: true },
];

export async function GET() {
  const result = generateQualityEcologyIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-21",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "quality-ecology-intelligence", version: "2.0.0" } } });
}
