import { NextResponse } from "next/server";
import {
  generateDelegatedAuthorityIntelligence,
  getAuthorityCategoryLabel,
  getDecisionOutcomeLabel,
  getRatingLabel,
} from "@/lib/delegated-authority";
import type {
  AuthorityDecision,
  AuthorityPolicy,
  StaffAuthorityTraining,
} from "@/lib/delegated-authority";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  decisions: AuthorityDecision[];
  policy: AuthorityPolicy;
  training: StaffAuthorityTraining[];
} {
  const decisions: AuthorityDecision[] = [
    // Alex — education & health
    { id: "dec-001", childId: "child-alex", childName: "Alex", decisionDate: "2026-01-15", category: "education_decisions", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-002", childId: "child-alex", childName: "Alex", decisionDate: "2026-02-03", category: "health_appointments", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-003", childId: "child-alex", childName: "Alex", decisionDate: "2026-02-20", category: "social_activities", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-004", childId: "child-alex", childName: "Alex", decisionDate: "2026-03-10", category: "overnight_stays", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-005", childId: "child-alex", childName: "Alex", decisionDate: "2026-03-25", category: "haircuts_appearance", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: false, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-006", childId: "child-alex", childName: "Alex", decisionDate: "2026-04-05", category: "travel_permissions", outcome: "approved_delayed", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-007", childId: "child-alex", childName: "Alex", decisionDate: "2026-04-18", category: "religious_observance", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-008", childId: "child-alex", childName: "Alex", decisionDate: "2026-05-02", category: "emergency_medical", outcome: "approved_timely", childConsulted: false, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },

    // Jordan — mixed outcomes
    { id: "dec-009", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-01-20", category: "education_decisions", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-010", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-02-10", category: "health_appointments", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-011", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-02-28", category: "social_activities", outcome: "approved_delayed", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: false },
    { id: "dec-012", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-03-15", category: "overnight_stays", outcome: "referred_up", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: false, staffMadeDecision: false, outcomeRecorded: true },
    { id: "dec-013", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-04-01", category: "haircuts_appearance", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-014", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-04-20", category: "travel_permissions", outcome: "denied", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-015", childId: "child-jordan", childName: "Jordan", decisionDate: "2026-05-05", category: "emergency_medical", outcome: "approved_timely", childConsulted: false, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },

    // Morgan — good overall
    { id: "dec-016", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-01-25", category: "education_decisions", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-017", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-02-15", category: "health_appointments", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-018", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-03-05", category: "social_activities", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-019", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-03-20", category: "overnight_stays", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-020", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-04-10", category: "haircuts_appearance", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: false, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-021", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-04-28", category: "travel_permissions", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
    { id: "dec-022", childId: "child-morgan", childName: "Morgan", decisionDate: "2026-05-10", category: "religious_observance", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true, outcomeRecorded: true },
  ];

  const policy: AuthorityPolicy = {
    id: "pol-001",
    delegatedAuthorityMatrix: true,
    clearDecisionFramework: true,
    staffEmpowermentGuidance: true,
    escalationProtocol: true,
    parentalNotificationProcess: true,
    childParticipationFramework: true,
    regularReview: true,
  };

  const training: StaffAuthorityTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", delegatedAuthorityUnderstanding: true, decisionMakingConfidence: true, scopeRecognition: true, documentationCompetency: true, escalationAwareness: true, childConsultationSkills: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", delegatedAuthorityUnderstanding: true, decisionMakingConfidence: true, scopeRecognition: true, documentationCompetency: true, escalationAwareness: true, childConsultationSkills: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", delegatedAuthorityUnderstanding: true, decisionMakingConfidence: true, scopeRecognition: true, documentationCompetency: false, escalationAwareness: true, childConsultationSkills: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", delegatedAuthorityUnderstanding: true, decisionMakingConfidence: true, scopeRecognition: true, documentationCompetency: true, escalationAwareness: true, childConsultationSkills: true },
  ];

  return { decisions, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { decisions, policy, training } = generateDemoData();

  const result = generateDelegatedAuthorityIntelligence(
    decisions,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "delegated-authority-intelligence",
        version: "1.0.0",
      },
    },
  });
}
