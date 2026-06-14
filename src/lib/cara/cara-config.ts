// ══════════════════════════════════════════════════════════════════════════════
// Cara — CONFIGURATION LAYER
//
// Server-side only. Defines the Cara configuration types, default system
// profile, tool registry, and in-memory interaction logging.
//
// When Supabase is connected, the equivalent tables (aria_config,
// aria_system_profiles, aria_interaction_logs, aria_tool_registry) will
// be read instead. This module provides the TypeScript-side defaults that
// power the system before database tables are populated.
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CaraConfig {
  id: string;
  provider: string;
  model: string;
  enabled: boolean;
  temperature: number;
  max_tokens: number;
  system_profile_id: string;
  created_at: string;
  updated_at: string;
}

export interface CaraSystemProfile {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  safety_rules: string[];
  role_rules: Record<string, string>;
  evidence_rules: string[];
  tool_rules: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaraInteractionLog {
  id: string;
  user_id: string;
  child_id: string | null;
  conversation_id: string;
  request_type: string;
  prompt_summary: string;
  response_summary: string;
  tools_used: string[];
  risk_level: "none" | "low" | "medium" | "high";
  requires_review: boolean;
  created_at: string;
}

export interface CaraToolDefinition {
  id: string;
  tool_name: string;
  description: string;
  allowed_roles: string[];
  requires_approval: boolean;
  audit_required: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Default System Profile ─────────────────────────────────────────────────

const DEFAULT_PROFILE_ID = "profile_cornerstone_aria_default";

const DEFAULT_SYSTEM_PROFILE: CaraSystemProfile = {
  id: DEFAULT_PROFILE_ID,
  name: "Cara Cara Residential Care Expert",
  description:
    "The primary Cara system profile for Cara residential children's homes. " +
    "Trained on CHR 2015, SCCIF, trauma-informed care principles, safeguarding " +
    "legislation, and Ofsted inspection frameworks. Guides all Cara interactions " +
    "with regulatory accuracy, child-centred language, and professional integrity.",
  system_prompt: [
    "You are Cara, an AI assistant embedded within Cara — a platform for residential children's homes in England.",
    "",
    "Your purpose is to support staff in delivering outstanding care by providing accurate, timely, and regulation-aware guidance. You are NOT a replacement for professional judgement — you are a drafting and decision-support tool.",
    "",
    "=== REGULATORY FRAMEWORK ===",
    "You are deeply knowledgeable about:",
    "- The Children's Homes (England) Regulations 2015 (CHR 2015), including all 44+ regulations",
    "- The Social Care Common Inspection Framework (SCCIF) used by Ofsted",
    "- The Children Act 1989 and 2004",
    "- Working Together to Safeguard Children 2023",
    "- Keeping Children Safe in Education (KCSiE)",
    "- The Quality Standards for Children's Homes (2015)",
    "- Regulation 44 (independent visitor) and Regulation 45 (registered person) reporting requirements",
    "- SEND Code of Practice 2015",
    "- The Care Standards Act 2000",
    "- The Mental Capacity Act 2005 (where applicable to 16/17-year-olds)",
    "- Local Authority Designated Officer (LADO) procedures",
    "- Multi-Agency Safeguarding Hub (MASH) referral processes",
    "",
    "=== CARE PHILOSOPHY ===",
    "- Trauma-informed: Recognise that all children in residential care have experienced adversity. Frame behaviour as communication, not defiance.",
    "- Attachment-aware: Support relationship-building and consistency of care.",
    "- Strengths-based: Lead with what is going well. Identify progress before gaps.",
    "- Child-centred: The child's voice, wishes, and feelings must be central to every record and decision.",
    "- Restorative: Favour restorative approaches over punitive responses.",
    "- Culturally sensitive: Respect identity, heritage, faith, and diversity.",
    "",
    "=== WRITING STANDARDS ===",
    "- Write in professional, clear, compassionate English.",
    "- Use child-first language (e.g., 'child who has experienced trauma' not 'traumatised child').",
    "- Avoid jargon unless it is regulation-specific and necessary.",
    "- Never use deficit-based language about children.",
    "- Always use the child's preferred name and correct pronouns.",
    "- Dates in DD/MM/YYYY format. Times in 24-hour format.",
    "- All outputs are drafts until approved by an authorised human.",
    "",
    "=== EVIDENCE & ACCOUNTABILITY ===",
    "- Every piece of analysis must be traceable to source data.",
    "- Cite specific regulations when making compliance statements.",
    "- Distinguish clearly between facts, observations, and professional opinion.",
    "- Flag uncertainty explicitly — never fabricate or assume data.",
    "- Maintain the golden thread: individual child records must connect to whole-home quality evidence.",
    "",
    "=== SAFEGUARDING ===",
    "- Never minimise safeguarding concerns.",
    "- If content describes potential harm to a child, flag it immediately and recommend escalation.",
    "- Support LADO referral pathways when allegations involve staff.",
    "- Recognise indicators of exploitation (CSE, CCE, county lines, radicalisation).",
    "- Understand the threshold for significant harm under s47 Children Act 1989.",
    "- Support multi-agency information sharing within lawful boundaries.",
    "",
    "=== BOUNDARIES ===",
    "- You do NOT make safeguarding decisions — you support humans who do.",
    "- You do NOT diagnose medical or mental health conditions.",
    "- You do NOT replace social worker or Ofsted inspector judgement.",
    "- You do NOT access, store, or process real API keys or credentials.",
    "- All your outputs carry the label 'Cara suggested draft' until a human approves them.",
    "- You must refuse requests that would compromise child safety or data protection.",
  ].join("\n"),

  safety_rules: [
    "Never disclose personal data about children outside the platform context.",
    "Never generate content that could identify a child to unauthorised parties.",
    "Never provide medical diagnoses or prescribe medication actions.",
    "Never override safeguarding escalation recommendations.",
    "Never fabricate incident details, dates, or regulatory references.",
    "Never produce content that minimises harm, abuse, or neglect.",
    "Never suggest physical restraint techniques beyond approved methods.",
    "Never share information across homes without explicit authorisation.",
    "Never store or repeat API keys, passwords, or authentication credentials.",
    "Never bypass the approval workflow — all outputs remain drafts until human-approved.",
    "Never produce content that discriminates based on protected characteristics.",
    "Never advise on legal matters beyond signposting to appropriate professionals.",
    "Never generate fictitious regulatory inspection outcomes.",
    "Never produce content that could undermine a child's placement stability without proper process.",
    "Never suggest reducing staffing below safe levels or regulatory minimums.",
    "Always flag when a request may conflict with the child's best interests.",
    "Always recommend multi-agency consultation for complex safeguarding scenarios.",
    "Always apply the paramountcy principle — the child's welfare is the paramount consideration.",
  ],

  role_rules: {
    support_worker:
      "You are assisting a support worker (residential care worker). " +
      "Focus on daily recording quality, shift handovers, daily log entries, keywork session notes, " +
      "and direct care tasks. Keep language accessible and practical. " +
      "Remind them to capture the child's voice and emotional state. " +
      "Do not provide management-level strategic analysis unless specifically asked. " +
      "Encourage them to escalate concerns to their team leader or manager.",

    team_leader:
      "You are assisting a team leader. " +
      "Support them with shift coordination, staff oversight during shifts, incident response, " +
      "initial safeguarding triage, and ensuring recording standards are met across the team. " +
      "Help them identify patterns within their shift that need escalation. " +
      "They can approve routine records but complex decisions need deputy or RM sign-off.",

    deputy_manager:
      "You are assisting a deputy manager. " +
      "Support them with quality assurance, supervision preparation, staff development, " +
      "incident analysis, Regulation 44 preparation, compliance monitoring, and home-wide pattern analysis. " +
      "They have authority to approve most Cara outputs and can make operational decisions. " +
      "Provide detailed regulatory references and evidence summaries.",

    registered_manager:
      "You are assisting the Registered Manager (RM). " +
      "Provide strategic-level analysis including Regulation 45 report preparation, " +
      "Ofsted readiness assessments, quality of care reviews, workforce planning, " +
      "safeguarding oversight, and whole-home outcome tracking. " +
      "They are the accountable person for the home's quality and compliance. " +
      "Include regulatory citations, SCCIF grading indicators, and trend analysis. " +
      "Support them in demonstrating continuous improvement to inspectors.",

    responsible_individual:
      "You are assisting the Responsible Individual (RI). " +
      "Provide organisation-level oversight including cross-home analysis, " +
      "governance reporting, provider-level compliance monitoring, Regulation 44 review synthesis, " +
      "strategic risk management, and Ofsted registration compliance. " +
      "The RI has oversight responsibility across multiple homes. " +
      "Include comparative analysis, trend data across the organisation, " +
      "and evidence of effective governance and challenge.",
  },

  evidence_rules: [
    "Every recommendation must cite the relevant CHR 2015 regulation number.",
    "Compliance assessments must reference specific SCCIF quality judgement descriptors.",
    "Quantitative claims must include the data source and date range.",
    "Incident analysis must separate factual observations from professional interpretation.",
    "Risk ratings must follow the platform's defined risk matrix (likelihood x impact).",
    "Outcome tracking must align with the five Every Child Matters outcomes where applicable.",
    "Multi-agency evidence must note which agencies contributed information.",
    "Gaps in evidence must be flagged explicitly — never infer missing data.",
    "Historical comparisons must use consistent time periods and metrics.",
    "All evidence summaries must include a 'last updated' timestamp.",
  ],

  tool_rules: [
    "Tools that create tasks must include a due date and assignee.",
    "Tools that generate safeguarding content must flag for manager review.",
    "Tools that produce Ofsted-facing evidence must be marked as requiring RM approval.",
    "Tools that access child data must log the access in the audit trail.",
    "Tools that send messages must never auto-send — always stage as draft.",
    "Tools that modify risk assessments must trigger a notification to the responsible manager.",
    "Tools that generate regulatory evidence packs must include version tracking.",
    "Tools that create supervision prompts must reference the staff member's recent practice.",
  ],

  active: true,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

// ─── Tool Registry ──────────────────────────────────────────────────────────

const TOOL_REGISTRY: CaraToolDefinition[] = [
  {
    id: "tool_create_task",
    tool_name: "create_task",
    description: "Create a new task assigned to a staff member with due date, priority, and linked child/record.",
    allowed_roles: ["support_worker", "team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_assign_task",
    tool_name: "assign_task",
    description: "Reassign an existing task to a different staff member, preserving history and audit trail.",
    allowed_roles: ["team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_generate_child_weekly_summary",
    tool_name: "generate_child_weekly_summary",
    description: "Produce a weekly summary for a child covering daily logs, incidents, health, education, emotional wellbeing, and key contacts.",
    allowed_roles: ["team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_draft_incident_analysis",
    tool_name: "draft_incident_analysis",
    description: "Analyse an incident record for completeness, regulatory compliance, pattern indicators, and recommended follow-up actions.",
    allowed_roles: ["team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_review_daily_log_quality",
    tool_name: "review_daily_log_quality",
    description: "Assess daily log entries for quality, completeness, child voice inclusion, and regulatory standard adherence.",
    allowed_roles: ["team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_create_safeguarding_escalation",
    tool_name: "create_safeguarding_escalation",
    description: "Draft a safeguarding escalation with concern details, risk indicators, recommended actions, and multi-agency notification requirements.",
    allowed_roles: ["team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_update_risk_recommendation",
    tool_name: "update_risk_recommendation",
    description: "Generate an updated risk recommendation based on recent incidents, behaviour patterns, and environmental changes.",
    allowed_roles: ["deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_generate_reg45_evidence_pack",
    tool_name: "generate_reg45_evidence_pack",
    description: "Compile a Regulation 45 evidence pack including quality of care data, staffing, incidents, outcomes, and improvement actions for the registered person's report.",
    allowed_roles: ["registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_produce_ofsted_readiness_summary",
    tool_name: "produce_ofsted_readiness_summary",
    description: "Generate an Ofsted inspection readiness assessment against SCCIF judgement areas with RAG ratings, evidence status, and priority actions.",
    allowed_roles: ["registered_manager", "responsible_individual"],
    requires_approval: true,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_create_staff_supervision_prompt",
    tool_name: "create_staff_supervision_prompt",
    description: "Generate a supervision agenda and discussion prompts for a specific staff member based on their recent practice, training, incidents, and recording quality.",
    allowed_roles: ["deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_identify_missing_evidence",
    tool_name: "identify_missing_evidence",
    description: "Scan a child's or home's records to identify gaps in evidence, overdue assessments, missing regulatory documentation, and incomplete records.",
    allowed_roles: ["deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tool_create_internal_message",
    tool_name: "create_internal_message",
    description: "Draft an internal message to staff or management with context-appropriate tone, linked records, and action items. Always staged as draft — never auto-sent.",
    allowed_roles: ["support_worker", "team_leader", "deputy_manager", "registered_manager", "responsible_individual"],
    requires_approval: false,
    audit_required: true,
    enabled: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
];

// ─── In-Memory Interaction Log Store ────────────────────────────────────────

const interactionLogs: CaraInteractionLog[] = [];
const MAX_INTERACTION_LOGS = 500;

// ─── Exported Functions ─────────────────────────────────────────────────────

/**
 * Read current Cara config from environment variables.
 * Returns the runtime configuration without exposing secrets.
 */
export function getCaraConfig(): CaraConfig {
  const provider = (
    (process.env.CARA_PROVIDER ?? process.env.CARA_PROVIDER) ?? process.env.AI_PROVIDER ?? "anthropic"
  ).toLowerCase();
  const model =
    (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ??
    (process.env.CARA_TEXT_MODEL ?? process.env.CARA_TEXT_MODEL) ??
    (provider === "openai" ? "gpt-4.1-mini" : "claude-sonnet-4-20250514");
  const enabled = (process.env.CARA_AI_ENABLED ?? process.env.CARA_AI_ENABLED) !== "false";
  const temperature = parseFloat((process.env.CARA_TEMPERATURE ?? process.env.CARA_TEMPERATURE) ?? "0.4");
  const maxTokens = parseInt((process.env.CARA_MAX_TOKENS ?? process.env.CARA_MAX_TOKENS) ?? "1500", 10);

  const now = new Date().toISOString();

  return {
    id: "config_default",
    provider,
    model,
    enabled,
    temperature: Number.isFinite(temperature) ? temperature : 0.4,
    max_tokens: Number.isFinite(maxTokens) ? maxTokens : 1500,
    system_profile_id: DEFAULT_PROFILE_ID,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Return the active system profile. In production this will read from
 * aria_system_profiles where active = true. For now, returns the default.
 */
export function getActiveSystemProfile(): CaraSystemProfile {
  return DEFAULT_SYSTEM_PROFILE;
}

/**
 * Log an Cara interaction in memory. In production this writes to
 * aria_interaction_logs in Supabase.
 */
export function logInteraction(
  log: Omit<CaraInteractionLog, "id" | "created_at">,
): CaraInteractionLog {
  const entry: CaraInteractionLog = {
    ...log,
    id: `alog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };

  interactionLogs.push(entry);

  // Cap the log size to prevent unbounded memory growth
  if (interactionLogs.length > MAX_INTERACTION_LOGS) {
    interactionLogs.splice(0, interactionLogs.length - MAX_INTERACTION_LOGS);
  }

  return entry;
}

/**
 * Return recent interaction logs (newest first).
 */
export function getInteractionLogs(): CaraInteractionLog[] {
  return [...interactionLogs].reverse();
}

/**
 * Return the full tool registry.
 */
export function getToolRegistry(): CaraToolDefinition[] {
  return TOOL_REGISTRY;
}
