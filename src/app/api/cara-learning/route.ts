// ══════════════════════════════════════════════════════════════════════════════
// Cara Agent Learning & Cost Reduction — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateAgentReadiness,
  calculateOrganisationLearningMetrics,
} from "@/lib/cara-learning";
import type { AgentCapabilityProfile } from "@/lib/cara-learning";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_PROFILES: AgentCapabilityProfile[] = [
  {
    id: "agent-reg-compliance",
    organisationId: "org-cornerstone",
    agentName: "Regulatory Compliance Checker",
    agentType: "regulatory_compliance",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "shadow_mode",
    taskScope: "Evaluate compliance of care records against CHR 2015 regulations",
    triggerConditions: ["New care record submitted", "Monthly compliance audit", "Reg 44 visit prep"],
    requiredInputs: ["care_record", "regulation_reference", "child_profile", "home_context"],
    outputSchema: "ComplianceResult: issues[], warnings[], score, recommendations[]",
    safetyBoundaries: ["Never auto-approve non-compliant records", "Always flag safeguarding gaps", "Escalate Reg 12 breaches"],
    approvalRules: ["Manager must review any non-compliant finding", "Critical issues escalate to RI"],
    confidenceThreshold: 85,
    averageCostPerRun: 0.12,
    averageLatency: 2200,
    successRate: 93,
    failureRate: 7,
    commonFailures: ["Ambiguous regulation interpretation", "Missing context from partial records"],
    approvedPromptPatterns: ["structured_compliance_check_v3", "regulatory_gap_analysis_v2", "evidence_citation_v1"],
    approvedTrainingExamples: 145,
    managerCorrections: 12,
    rejectedOutputs: 3,
    internalModelCandidate: "cornerstone-reg-v2",
    shadowModeEnabled: true,
    shadowAccuracyScore: 92,
    shadowSafetyScore: 97,
    shadowCostSavingEstimate: 95,
    replacementReadinessScore: 82,
    replacementApprovedBy: "Darren Laville",
    replacementApprovedAt: "2026-05-01T10:00:00Z",
    riskLevel: "medium",
    lastEvaluatedAt: "2026-05-15T10:00:00Z",
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "agent-report-gen",
    organisationId: "org-cornerstone",
    agentName: "Report Generator",
    agentType: "report_generation",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "observing",
    taskScope: "Generate structured reports from care data (Reg 44, Reg 45, incident summaries)",
    triggerConditions: ["Report due date approaching", "Manager requests report draft", "Post-incident"],
    requiredInputs: ["report_type", "data_sources", "date_range", "child_profiles"],
    outputSchema: "StructuredReport: sections[], evidenceCitations[], recommendations[]",
    safetyBoundaries: ["Never fabricate data", "Always cite sources", "Flag incomplete data"],
    approvalRules: ["All reports require manager sign-off before issue", "RI reviews Reg 45 reports"],
    confidenceThreshold: 80,
    averageCostPerRun: 0.25,
    averageLatency: 4500,
    successRate: 88,
    failureRate: 12,
    commonFailures: ["Report too long", "Missing data not flagged", "Tone inconsistency"],
    approvedPromptPatterns: ["reg44_report_structure_v2", "incident_summary_v1"],
    approvedTrainingExamples: 65,
    managerCorrections: 28,
    rejectedOutputs: 8,
    internalModelCandidate: "cornerstone-report-v1",
    shadowModeEnabled: false,
    shadowAccuracyScore: 0,
    shadowSafetyScore: 0,
    shadowCostSavingEstimate: 150,
    replacementReadinessScore: 45,
    replacementApprovedBy: null,
    replacementApprovedAt: null,
    riskLevel: "low",
    lastEvaluatedAt: "2026-05-10T10:00:00Z",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-05-10T10:00:00Z",
  },
  {
    id: "agent-safeguarding",
    organisationId: "org-cornerstone",
    agentName: "Safeguarding Analyzer",
    agentType: "safeguarding_analysis",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "external_only",
    taskScope: "Analyse safeguarding concerns, identify risk patterns, recommend protective actions",
    triggerConditions: ["New safeguarding concern raised", "Risk level change", "Missing episode"],
    requiredInputs: ["concern_details", "child_history", "risk_factors", "protective_factors"],
    outputSchema: "SafeguardingAnalysis: riskLevel, immediateActions[], referralNeeded, escalation",
    safetyBoundaries: ["Never dismiss a concern", "Always recommend escalation if uncertain", "Never replace human judgment on thresholds"],
    approvalRules: ["DSL must review all outputs", "Section 47 referrals always human-led", "Never auto-close a concern"],
    confidenceThreshold: 95,
    averageCostPerRun: 0.18,
    averageLatency: 3000,
    successRate: 96,
    failureRate: 4,
    commonFailures: ["Over-cautious recommendations", "Context not fully weighted"],
    approvedPromptPatterns: ["safeguarding_triage_v2"],
    approvedTrainingExamples: 25,
    managerCorrections: 5,
    rejectedOutputs: 1,
    internalModelCandidate: null,
    shadowModeEnabled: false,
    shadowAccuracyScore: 0,
    shadowSafetyScore: 0,
    shadowCostSavingEstimate: 0,
    replacementReadinessScore: 15,
    replacementApprovedBy: null,
    replacementApprovedAt: null,
    riskLevel: "critical",
    lastEvaluatedAt: "2026-05-12T10:00:00Z",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "agent-therapeutic",
    organisationId: "org-cornerstone",
    agentName: "Therapeutic Guidance Advisor",
    agentType: "therapeutic_guidance",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "external_only",
    taskScope: "Provide trauma-informed practice suggestions, therapeutic parenting strategies",
    triggerConditions: ["Key-work session planning", "Behaviour escalation", "New placement"],
    requiredInputs: ["child_profile", "therapeutic_needs", "recent_behaviour", "attachment_style"],
    outputSchema: "TherapeuticGuidance: strategies[], dontDo[], resources[], escalation",
    safetyBoundaries: ["Never replace clinical advice", "Always recommend CAMHS referral for complex presentations", "Never diagnose"],
    approvalRules: ["Therapeutic lead reviews guidance for complex cases", "New strategies require trial period"],
    confidenceThreshold: 90,
    averageCostPerRun: 0.15,
    averageLatency: 2800,
    successRate: 91,
    failureRate: 9,
    commonFailures: ["Generic strategies not tailored", "Attachment style not weighted"],
    approvedPromptPatterns: ["therapeutic_parenting_v2", "pace_strategy_v1", "trauma_response_v1"],
    approvedTrainingExamples: 40,
    managerCorrections: 18,
    rejectedOutputs: 6,
    internalModelCandidate: null,
    shadowModeEnabled: false,
    shadowAccuracyScore: 0,
    shadowSafetyScore: 0,
    shadowCostSavingEstimate: 0,
    replacementReadinessScore: 22,
    replacementApprovedBy: null,
    replacementApprovedAt: null,
    riskLevel: "high",
    lastEvaluatedAt: "2026-05-14T10:00:00Z",
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-05-14T10:00:00Z",
  },
  {
    id: "agent-comms",
    organisationId: "org-cornerstone",
    agentName: "Communication Drafter",
    agentType: "communication_drafting",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "partial_internal",
    taskScope: "Draft professional communications (emails to SWs, LA letters, parent updates)",
    triggerConditions: ["Communication template needed", "SW update due", "Incident notification"],
    requiredInputs: ["communication_type", "recipient", "key_information", "tone", "urgency"],
    outputSchema: "DraftCommunication: subject, body, attachmentSuggestions[], reviewRequired",
    safetyBoundaries: ["Never send without human review", "Never include unverified claims", "Professional tone always"],
    approvalRules: ["All external communications require manager approval", "LA notifications reviewed by RI"],
    confidenceThreshold: 75,
    averageCostPerRun: 0.08,
    averageLatency: 1500,
    successRate: 94,
    failureRate: 6,
    commonFailures: ["Too formal for parent comms", "Missing key details"],
    approvedPromptPatterns: ["sw_update_v3", "incident_notification_v2", "parent_update_v2", "la_letter_v1"],
    approvedTrainingExamples: 200,
    managerCorrections: 35,
    rejectedOutputs: 5,
    internalModelCandidate: "cornerstone-comms-v1",
    shadowModeEnabled: true,
    shadowAccuracyScore: 94,
    shadowSafetyScore: 99,
    shadowCostSavingEstimate: 65,
    replacementReadinessScore: 88,
    replacementApprovedBy: "Darren Laville",
    replacementApprovedAt: "2026-04-15T10:00:00Z",
    riskLevel: "low",
    lastEvaluatedAt: "2026-05-16T10:00:00Z",
    createdAt: "2025-10-01T10:00:00Z",
    updatedAt: "2026-05-16T10:00:00Z",
  },
  {
    id: "agent-data-analysis",
    organisationId: "org-cornerstone",
    agentName: "Data Pattern Analyzer",
    agentType: "data_analysis",
    currentProvider: "anthropic_claude",
    internalReplacementStatus: "shadow_mode",
    taskScope: "Identify patterns in incident data, behaviour trends, outcome trajectories",
    triggerConditions: ["Monthly analysis cycle", "Threshold breach", "RI dashboard review"],
    requiredInputs: ["data_set", "analysis_type", "date_range", "comparison_baseline"],
    outputSchema: "DataAnalysis: patterns[], anomalies[], trends[], recommendations[]",
    safetyBoundaries: ["Never present correlation as causation", "Always note data limitations", "Flag small sample sizes"],
    approvalRules: ["Trend findings reviewed by RM", "Home-level patterns shared at team meeting"],
    confidenceThreshold: 80,
    averageCostPerRun: 0.10,
    averageLatency: 2000,
    successRate: 90,
    failureRate: 10,
    commonFailures: ["Spurious correlation detection", "Seasonal patterns not accounted for"],
    approvedPromptPatterns: ["behaviour_trend_v2", "incident_pattern_v1", "outcome_trajectory_v1"],
    approvedTrainingExamples: 85,
    managerCorrections: 10,
    rejectedOutputs: 4,
    internalModelCandidate: "cornerstone-analytics-v1",
    shadowModeEnabled: true,
    shadowAccuracyScore: 89,
    shadowSafetyScore: 98,
    shadowCostSavingEstimate: 75,
    replacementReadinessScore: 72,
    replacementApprovedBy: null,
    replacementApprovedAt: null,
    riskLevel: "low",
    lastEvaluatedAt: "2026-05-16T10:00:00Z",
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-05-16T10:00:00Z",
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "dashboard";
  const agentId = searchParams.get("agentId");

  if (mode === "dashboard") {
    const metrics = calculateOrganisationLearningMetrics(DEMO_PROFILES, "org-cornerstone");
    const agentResults = DEMO_PROFILES.map(p => evaluateAgentReadiness(p));
    return NextResponse.json({ metrics, agentResults, profiles: DEMO_PROFILES });
  }

  if (mode === "agent" && agentId) {
    const profile = DEMO_PROFILES.find(p => p.id === agentId);
    if (!profile) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const result = evaluateAgentReadiness(profile);
    return NextResponse.json({ result, profile });
  }

  if (mode === "metrics") {
    const metrics = calculateOrganisationLearningMetrics(DEMO_PROFILES, "org-cornerstone");
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const profile = body.profile as AgentCapabilityProfile;
    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }
    const result = evaluateAgentReadiness(profile);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const profiles = body.profiles as AgentCapabilityProfile[];
    const orgId = body.organisationId as string;
    if (!profiles || !orgId) {
      return NextResponse.json({ error: "Missing profiles or organisationId" }, { status: 400 });
    }
    const metrics = calculateOrganisationLearningMetrics(profiles, orgId);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
