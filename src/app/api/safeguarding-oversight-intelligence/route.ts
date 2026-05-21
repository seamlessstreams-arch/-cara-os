import { NextResponse } from "next/server";
import { generateSafeguardingOversightIntelligenceResult } from "@/lib/safeguarding-oversight/safeguarding-oversight-intelligence-engine";
import type { SafeguardingOversightRecord, SafeguardingOversightPolicy, StaffSafeguardingOversightTraining } from "@/lib/safeguarding-oversight/safeguarding-oversight-intelligence-engine";

const DEMO_RECORDS: SafeguardingOversightRecord[] = [
  { id: "so-001", homeId: "home-oak", date: "2025-01-15", childId: "child-alex", childName: "Alex", category: "safeguarding_referral", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-002", homeId: "home-oak", date: "2025-02-10", childId: "child-alex", childName: "Alex", category: "concern_assessment", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-003", homeId: "home-oak", date: "2025-03-05", childId: "child-alex", childName: "Alex", category: "multi_agency_strategy", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-004", homeId: "home-oak", date: "2025-04-01", childId: "child-alex", childName: "Alex", category: "dbs_compliance_check", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-005", homeId: "home-oak", date: "2025-01-20", childId: "child-jordan", childName: "Jordan", category: "safeguarding_training", outcome: "partially_effective", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-006", homeId: "home-oak", date: "2025-02-15", childId: "child-jordan", childName: "Jordan", category: "threshold_decision", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-007", homeId: "home-oak", date: "2025-03-10", childId: "child-jordan", childName: "Jordan", category: "section47_investigation", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: false, documentationComplete: true, timelyRecording: false },
  { id: "so-008", homeId: "home-oak", date: "2025-04-10", childId: "child-jordan", childName: "Jordan", category: "safeguarding_audit", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-009", homeId: "home-oak", date: "2025-02-01", childId: "child-morgan", childName: "Morgan", category: "safeguarding_referral", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-010", homeId: "home-oak", date: "2025-03-15", childId: "child-morgan", childName: "Morgan", category: "concern_assessment", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-011", homeId: "home-oak", date: "2025-04-10", childId: "child-morgan", childName: "Morgan", category: "multi_agency_strategy", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: false, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true },
  { id: "so-012", homeId: "home-oak", date: "2025-05-01", childId: "child-morgan", childName: "Morgan", category: "threshold_decision", outcome: "partially_effective", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: false, childViewCaptured: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: SafeguardingOversightPolicy = {
  safeguardingPolicy: true, saferRecruitmentPolicy: true, whistleblowingPolicy: true,
  allegationsManagementPolicy: true, onlineSafetyPolicy: true, bodyMapProtocol: true, safeguardingSupervisionPolicy: true,
};

const DEMO_STAFF: StaffSafeguardingOversightTraining[] = [
  { staffId: "staff-sarah", safeguardingAwareness: true, recognisingSigns: true, referralProcedures: true, recordKeepingSkills: true, multiAgencyWorking: true, onlineSafetyKnowledge: true },
  { staffId: "staff-tom", safeguardingAwareness: true, recognisingSigns: true, referralProcedures: true, recordKeepingSkills: true, multiAgencyWorking: true, onlineSafetyKnowledge: false },
  { staffId: "staff-lisa", safeguardingAwareness: true, recognisingSigns: true, referralProcedures: true, recordKeepingSkills: true, multiAgencyWorking: false, onlineSafetyKnowledge: true },
  { staffId: "staff-darren", safeguardingAwareness: true, recognisingSigns: true, referralProcedures: true, recordKeepingSkills: true, multiAgencyWorking: true, onlineSafetyKnowledge: true },
];

export async function GET() {
  const result = generateSafeguardingOversightIntelligenceResult({
    homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "safeguarding-oversight-intelligence", version: "2.0.0" } } });
}
