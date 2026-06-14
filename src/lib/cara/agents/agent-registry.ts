// ══════════════════════════════════════════════════════════════════════════════
// Cara — AGENT REGISTRY
// Canonical definitions for every Cara agent. Each entry declares what the
// agent may and must not do, its risk classification, the roles that may
// invoke it, and whether a human must approve its output before commit.
// ══════════════════════════════════════════════════════════════════════════════

import type { AgentDefinition, AgentId } from "@/types/cara-reports";

// ── Individual Agent Definitions ────────────────────────────────────────────

export const OVERSIGHT_AGENT: AgentDefinition = {
  id: "oversight_agent",
  name: "Oversight Agent",
  description:
    "Monitors recording quality, identifies gaps in management oversight, " +
    "flags missing child voice entries, and highlights where care plans are " +
    "drifting from agreed actions. Surfaces issues that require manager attention.",
  allowedActions: [
    "scan_recording_quality",
    "identify_oversight_gaps",
    "flag_missing_child_voice",
    "detect_care_plan_drift",
    "generate_oversight_summary",
    "suggest_manager_actions",
    "compare_period_quality",
    "highlight_evidence_gaps",
  ],
  prohibitedActions: [
    "modify_records",
    "approve_reports",
    "delete_data",
    "send_external_communications",
    "override_manager_decisions",
    "access_hr_data",
  ],
  riskLevel: "medium",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
  ],
  requiresHumanApproval: false,
  outputTypes: [
    "oversight_summary",
    "gap_alert",
    "quality_score",
    "manager_action_suggestion",
  ],
};

export const SAFEGUARDING_AGENT: AgentDefinition = {
  id: "safeguarding_agent",
  name: "Safeguarding Agent",
  description:
    "Analyses incident patterns, identifies escalating safeguarding concerns, " +
    "detects exploitation indicators, and flags when statutory notification " +
    "thresholds may have been reached. All outputs require manager review.",
  allowedActions: [
    "analyse_incident_patterns",
    "detect_exploitation_indicators",
    "flag_escalating_concerns",
    "check_notification_thresholds",
    "cross_reference_missing_episodes",
    "identify_peer_on_peer_risks",
    "summarise_safeguarding_timeline",
    "suggest_safeguarding_actions",
  ],
  prohibitedActions: [
    "make_safeguarding_decisions",
    "send_referrals",
    "contact_external_agencies",
    "modify_risk_assessments",
    "approve_reports",
    "delete_data",
    "close_safeguarding_concerns",
  ],
  riskLevel: "high",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
  ],
  requiresHumanApproval: true,
  outputTypes: [
    "safeguarding_alert",
    "pattern_analysis",
    "risk_escalation_notice",
    "notification_threshold_warning",
    "safeguarding_timeline",
  ],
};

export const REPORT_GENERATOR_AGENT: AgentDefinition = {
  id: "report_generator_agent",
  name: "Report Generator Agent",
  description:
    "Produces structured reports (weekly, review, social worker update, Reg 45, " +
    "etc.) by retrieving and synthesising evidence from across the system. " +
    "Populates sections, links evidence, and flags confidence levels per section.",
  allowedActions: [
    "retrieve_evidence",
    "generate_report_sections",
    "calculate_confidence_scores",
    "link_evidence_to_sections",
    "detect_evidence_gaps",
    "suggest_report_actions",
    "generate_executive_summary",
    "adapt_tone_for_audience",
    "version_report",
  ],
  prohibitedActions: [
    "approve_reports",
    "send_reports_externally",
    "fabricate_evidence",
    "modify_source_records",
    "delete_data",
    "bypass_governance_settings",
  ],
  riskLevel: "medium",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
    "team_leader",
  ],
  requiresHumanApproval: true,
  outputTypes: [
    "child_report",
    "report_section",
    "evidence_link",
    "action_suggestion",
    "challenge_item",
  ],
};

export const THERAPEUTIC_PRACTICE_AGENT: AgentDefinition = {
  id: "therapeutic_practice_agent",
  name: "Therapeutic Practice Agent",
  description:
    "Provides practice-informed suggestions grounded in PACE, DDP, ARC, and " +
    "trauma-informed frameworks. Reviews recording language for dignity and " +
    "therapeutic alignment. Suggests keywork themes and reflective prompts.",
  allowedActions: [
    "review_language_quality",
    "suggest_therapeutic_framing",
    "generate_reflective_prompts",
    "identify_keywork_themes",
    "check_dignity_language",
    "suggest_practice_bank_entries",
    "review_behaviour_descriptions",
    "identify_attachment_themes",
  ],
  prohibitedActions: [
    "make_clinical_diagnoses",
    "prescribe_interventions",
    "override_care_plan",
    "modify_records",
    "approve_reports",
    "delete_data",
    "replace_professional_judgement",
  ],
  riskLevel: "low",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
    "team_leader",
    "residential_care_worker",
  ],
  requiresHumanApproval: false,
  outputTypes: [
    "language_review",
    "reflective_prompt",
    "practice_suggestion",
    "keywork_theme",
    "dignity_check_result",
  ],
};

export const RISK_ASSESSMENT_AGENT: AgentDefinition = {
  id: "risk_assessment_agent",
  name: "Risk Assessment Agent",
  description:
    "Analyses current and historical risk data to produce risk summaries, " +
    "detect escalation patterns, and highlight where risk assessments are " +
    "overdue or do not reflect recent events. All risk outputs require " +
    "manager approval and explicit evidence linking.",
  allowedActions: [
    "analyse_risk_history",
    "detect_risk_escalation",
    "flag_overdue_risk_assessments",
    "cross_reference_incidents_and_risk",
    "generate_risk_summary",
    "suggest_risk_mitigation_actions",
    "compare_risk_over_time",
    "identify_emerging_risks",
  ],
  prohibitedActions: [
    "set_risk_levels",
    "approve_risk_assessments",
    "modify_risk_records",
    "close_risk_flags",
    "delete_data",
    "override_professional_judgement",
    "send_external_notifications",
  ],
  riskLevel: "high",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
  ],
  requiresHumanApproval: true,
  outputTypes: [
    "risk_summary",
    "risk_escalation_alert",
    "overdue_risk_flag",
    "risk_mitigation_suggestion",
    "risk_trend_analysis",
  ],
};

export const REGULATION45_EVIDENCE_AGENT: AgentDefinition = {
  id: "regulation45_evidence_agent",
  name: "Regulation 45 Evidence Agent",
  description:
    "Collects, categorises, and scores evidence items for the Regulation 45 " +
    "monthly report. Identifies strong and weak evidence areas, flags where " +
    "quality standards lack sufficient supporting records, and suggests items " +
    "for inclusion.",
  allowedActions: [
    "scan_monthly_evidence",
    "categorise_evidence_items",
    "score_evidence_quality",
    "identify_weak_evidence_areas",
    "map_evidence_to_quality_standards",
    "suggest_evidence_for_inclusion",
    "generate_reg45_summary",
    "compare_monthly_trends",
  ],
  prohibitedActions: [
    "submit_reg45_report",
    "modify_evidence_records",
    "fabricate_evidence",
    "approve_reports",
    "delete_data",
    "send_external_communications",
  ],
  riskLevel: "medium",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
  ],
  requiresHumanApproval: true,
  outputTypes: [
    "reg45_evidence_item",
    "evidence_quality_score",
    "quality_standard_coverage",
    "reg45_summary",
    "evidence_gap_alert",
  ],
};

export const WORKFORCE_AGENT: AgentDefinition = {
  id: "workforce_agent",
  name: "Workforce Agent",
  description:
    "Analyses staffing patterns, supervision compliance, training gaps, and " +
    "team stability. Identifies where staffing inconsistencies may be " +
    "affecting children's experience and flags workforce risks.",
  allowedActions: [
    "analyse_staffing_patterns",
    "check_supervision_compliance",
    "identify_training_gaps",
    "assess_team_stability",
    "correlate_staffing_and_incidents",
    "flag_workforce_risks",
    "generate_workforce_summary",
    "suggest_staffing_actions",
  ],
  prohibitedActions: [
    "modify_staff_records",
    "change_rota",
    "approve_leave",
    "access_salary_data",
    "access_disciplinary_records",
    "delete_data",
    "send_external_communications",
  ],
  riskLevel: "medium",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
    "hr_recruitment",
  ],
  requiresHumanApproval: false,
  outputTypes: [
    "workforce_summary",
    "supervision_compliance_report",
    "training_gap_alert",
    "staffing_risk_flag",
    "team_stability_score",
  ],
};

export const FILING_AGENT: AgentDefinition = {
  id: "filing_agent",
  name: "Filing Agent",
  description:
    "Classifies incoming documents, suggests where they should be filed, " +
    "extracts key information, and links documents to the relevant child, " +
    "staff member, or record. Handles document routing and metadata tagging.",
  allowedActions: [
    "classify_document",
    "suggest_filing_location",
    "extract_key_information",
    "suggest_record_links",
    "tag_document_metadata",
    "detect_duplicate_documents",
    "generate_document_summary",
    "suggest_follow_up_actions",
  ],
  prohibitedActions: [
    "delete_documents",
    "modify_document_content",
    "move_documents_without_approval",
    "share_documents_externally",
    "approve_reports",
    "override_classification",
  ],
  riskLevel: "low",
  requiredRoles: [
    "registered_manager",
    "responsible_individual",
    "deputy_manager",
    "team_leader",
    "residential_care_worker",
    "admin",
  ],
  requiresHumanApproval: false,
  outputTypes: [
    "document_classification",
    "filing_suggestion",
    "document_summary",
    "record_link_suggestion",
    "follow_up_action",
  ],
};

// ── Agent Registry ──────────────────────────────────────────────────────────

export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  oversight_agent: OVERSIGHT_AGENT,
  safeguarding_agent: SAFEGUARDING_AGENT,
  report_generator_agent: REPORT_GENERATOR_AGENT,
  therapeutic_practice_agent: THERAPEUTIC_PRACTICE_AGENT,
  risk_assessment_agent: RISK_ASSESSMENT_AGENT,
  regulation45_evidence_agent: REGULATION45_EVIDENCE_AGENT,
  workforce_agent: WORKFORCE_AGENT,
  filing_agent: FILING_AGENT,
};

// ── Lookup Functions ────────────────────────────────────────────────────────

/**
 * Returns the full agent definition for a given agent id.
 * Throws if the agent id is not found in the registry.
 */
export function getAgent(agentId: AgentId): AgentDefinition {
  const agent = AGENT_REGISTRY[agentId];
  if (!agent) {
    throw new Error(`Unknown agent id: ${agentId}`);
  }
  return agent;
}

/**
 * Returns all agents whose requiredRoles array includes the given role.
 * Useful for determining which agents a user may invoke based on their
 * current application role.
 */
export function getAgentsForRole(role: string): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter((agent) =>
    agent.requiredRoles.includes(role),
  );
}
