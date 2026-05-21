import { NextResponse } from "next/server";
import { generateEscalationThresholdIntelligence } from "@/lib/escalation-intelligence";
import type {
  EscalationThresholdRecord,
  EscalationThresholdPolicy,
  StaffEscalationThresholdTraining,
} from "@/lib/escalation-intelligence";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: EscalationThresholdRecord[] = [
  // Alex — safeguarding, threshold, multi-agency, concern
  { id: "et-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "safeguarding_escalation", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "threshold_assessment", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "multi_agency_referral", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "concern_escalation", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },

  // Jordan — professional disagreement, management, ofsted, emergency
  { id: "et-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "professional_disagreement", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "management_escalation", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "ofsted_notification", outcome: "partially_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: false },
  { id: "et-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "emergency_response", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },

  // Morgan — mixed
  { id: "et-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "safeguarding_escalation", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "threshold_assessment", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "concern_escalation", outcome: "delayed_escalation", thresholdCorrectlyIdentified: false, escalationTimelyCompleted: true, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: true, timelyRecording: true },
  { id: "et-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "multi_agency_referral", outcome: "appropriately_escalated", thresholdCorrectlyIdentified: true, escalationTimelyCompleted: false, appropriateRecipientNotified: true, outcomeRecorded: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: EscalationThresholdPolicy = {
  escalationPolicy: true,
  thresholdFramework: true,
  safeguardingEscalationProcedure: true,
  multiAgencyReferralPolicy: true,
  professionalDisagreementPolicy: true,
  ofstedNotificationProcedure: true,
  emergencyResponseProtocol: true,
};

const DEMO_STAFF: StaffEscalationThresholdTraining[] = [
  { staffId: "staff-sarah", escalationProcedureKnowledge: true, thresholdAssessmentSkills: true, safeguardingEscalationSkills: true, multiAgencyReferralSkills: true, professionalDisagreementResolution: true, emergencyResponseSkills: true },
  { staffId: "staff-tom", escalationProcedureKnowledge: true, thresholdAssessmentSkills: true, safeguardingEscalationSkills: true, multiAgencyReferralSkills: true, professionalDisagreementResolution: true, emergencyResponseSkills: false },
  { staffId: "staff-lisa", escalationProcedureKnowledge: true, thresholdAssessmentSkills: true, safeguardingEscalationSkills: true, multiAgencyReferralSkills: true, professionalDisagreementResolution: false, emergencyResponseSkills: true },
  { staffId: "staff-darren", escalationProcedureKnowledge: true, thresholdAssessmentSkills: true, safeguardingEscalationSkills: true, multiAgencyReferralSkills: true, professionalDisagreementResolution: true, emergencyResponseSkills: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateEscalationThresholdIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-21",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "escalation-threshold-intelligence",
        version: "2.0.0",
      },
    },
  });
}
