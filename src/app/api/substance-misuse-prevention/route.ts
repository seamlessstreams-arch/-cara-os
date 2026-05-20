import { NextResponse } from "next/server";
import {
  generateSubstanceMisusePreventionIntelligence,
} from "@/lib/substance-misuse-prevention";
import type {
  PreventionSession,
  PreventionPolicy,
  StaffPreventionTraining,
  PreventionTopic,
} from "@/lib/substance-misuse-prevention";

function demoData() {
  const topics: PreventionTopic[] = [
    "drug_awareness",
    "alcohol_awareness",
    "smoking_vaping",
    "peer_pressure_resistance",
    "healthy_coping_strategies",
    "support_signposting",
    "risk_recognition",
    "legal_consequences",
  ];

  const sessions: PreventionSession[] = [
    // Alex – 5 sessions
    { id: "smp-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-01-15", topic: "drug_awareness", understandingLevel: "excellent", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-02-10", topic: "alcohol_awareness", understandingLevel: "good", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-02-28", topic: "peer_pressure_resistance", understandingLevel: "excellent", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: false },
    { id: "smp-4", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-20", topic: "healthy_coping_strategies", understandingLevel: "good", childEngaged: true, scenarioPracticed: false, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-5", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-15", topic: "risk_recognition", understandingLevel: "excellent", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    // Jordan – 4 sessions
    { id: "smp-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-01-22", topic: "smoking_vaping", understandingLevel: "good", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-7", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-02-18", topic: "support_signposting", understandingLevel: "developing", childEngaged: false, scenarioPracticed: false, copingStrategyIdentified: false, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-8", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-14", topic: "legal_consequences", understandingLevel: "good", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: false },
    { id: "smp-9", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-10", topic: "drug_awareness", understandingLevel: "excellent", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    // Morgan – 3 sessions
    { id: "smp-10", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-02-05", topic: "alcohol_awareness", understandingLevel: "developing", childEngaged: true, scenarioPracticed: false, copingStrategyIdentified: false, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
    { id: "smp-11", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-08", topic: "peer_pressure_resistance", understandingLevel: "good", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: false, staffDelivered: true, followUpPlanned: false },
    { id: "smp-12", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-20", topic: "healthy_coping_strategies", understandingLevel: "good", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true },
  ];

  const policy: PreventionPolicy = {
    id: "pol-smp-1",
    substanceMisuseStrategy: true,
    ageAppropriateCurriculum: true,
    incidentResponseProtocol: true,
    externalAgencyPartnership: true,
    staffTrainingRequirement: true,
    parentCarerEngagement: true,
    regularReview: false,
  };

  const training: StaffPreventionTraining[] = [
    { id: "tr-smp-1", staffId: "staff-sarah", staffName: "Sarah Johnson", substanceKnowledge: true, riskIndicatorRecognition: true, motivationalInterviewing: true, incidentManagement: true, safeguardingLinks: true, ageAppropriateDelivery: true },
    { id: "tr-smp-2", staffId: "staff-tom", staffName: "Tom Richards", substanceKnowledge: true, riskIndicatorRecognition: true, motivationalInterviewing: false, incidentManagement: true, safeguardingLinks: true, ageAppropriateDelivery: true },
    { id: "tr-smp-3", staffId: "staff-lisa", staffName: "Lisa Williams", substanceKnowledge: true, riskIndicatorRecognition: true, motivationalInterviewing: true, incidentManagement: true, safeguardingLinks: true, ageAppropriateDelivery: true },
    { id: "tr-smp-4", staffId: "staff-darren", staffName: "Darren Laville", substanceKnowledge: true, riskIndicatorRecognition: true, motivationalInterviewing: true, incidentManagement: true, safeguardingLinks: true, ageAppropriateDelivery: true },
  ];

  return { sessions, policy, training };
}

export async function GET() {
  const { sessions, policy, training } = demoData();
  const result = generateSubstanceMisusePreventionIntelligence(
    sessions,
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
        engine: "substance-misuse-prevention-engine",
        version: "1.0.0",
      },
    },
  });
}
