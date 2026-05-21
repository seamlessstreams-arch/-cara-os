import { NextResponse } from "next/server";
import { generateRegulatoryIntelligence } from "@/lib/regulatory/regulatory-intelligence-engine";
import type { RegulatoryRecord, RegulatoryPolicy, StaffRegulatoryTraining } from "@/lib/regulatory/regulatory-intelligence-engine";

const DEMO_RECORDS: RegulatoryRecord[] = [
  { id: "reg-001", homeId: "home-oak", date: "2026-01-10", childId: "child-alex", childName: "Alex", category: "reg44_visit", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-002", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "reg45_report", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-003", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "ofsted_notification", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "schedule4_matter", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "statutory_notification", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "action_point_tracking", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "regulatory_inspection", outcome: "partially_compliant", reportAccurate: false, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: false },
  { id: "reg-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "compliance_audit", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "reg44_visit", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "ofsted_notification", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
  { id: "reg-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "statutory_notification", outcome: "partially_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: false, actionPointsAddressed: true, documentationComplete: false, timelyRecording: true },
  { id: "reg-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "schedule4_matter", outcome: "fully_compliant", reportAccurate: true, deadlineMet: false, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: RegulatoryPolicy = {
  reg44VisitPolicy: true, reg45ReportingPolicy: true, ofstedNotificationPolicy: true,
  statutoryNotificationPolicy: true, actionPointTrackingPolicy: true, complianceAuditPolicy: true, regulatoryInspectionPolicy: true,
};

const DEMO_STAFF: StaffRegulatoryTraining[] = [
  { staffId: "staff-sarah", regulatoryKnowledge: true, reportWritingSkills: true, notificationProcedureKnowledge: true, actionPointManagementSkills: true, complianceAuditSkills: true, inspectionPreparationSkills: true },
  { staffId: "staff-tom", regulatoryKnowledge: true, reportWritingSkills: true, notificationProcedureKnowledge: true, actionPointManagementSkills: true, complianceAuditSkills: true, inspectionPreparationSkills: false },
  { staffId: "staff-lisa", regulatoryKnowledge: true, reportWritingSkills: true, notificationProcedureKnowledge: true, actionPointManagementSkills: true, complianceAuditSkills: false, inspectionPreparationSkills: true },
  { staffId: "staff-darren", regulatoryKnowledge: true, reportWritingSkills: true, notificationProcedureKnowledge: true, actionPointManagementSkills: true, complianceAuditSkills: true, inspectionPreparationSkills: true },
];

export async function GET() {
  const result = generateRegulatoryIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-21",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "regulatory-intelligence", version: "2.0.0" } } });
}
