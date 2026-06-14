// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — INTELLIGENT ROUTER
//
// The brain of the routing layer. Analyses the request to determine:
// - What type of task this is
// - How risky it is
// - Which agent should handle it
// - Which model profile to use
// - Whether RAG (evidence retrieval) is needed
// - Whether human approval is required
// - Whether safeguarding escalation is needed
//
// Uses keyword detection + context analysis. Safeguarding keywords always
// override any other classification to ensure nothing dangerous slips through
// as a "simple admin task".
// ══════════════════════════════════════════════════════════════════════════════

import type { AgentId } from "@/types/cara-reports";
import { AGENT_REGISTRY } from "../agents/agent-registry";
import { classifyRisk } from "./risk-classifier";
import { getModelProfileIdForAgent, applyRiskOverride } from "./model-registry";
import type { CaraRequest, RouteDecision, TaskType, ModelProfileId, RiskLevel } from "./types";

// ── Keyword → TaskType Mappings ───────────────────────────────────────────

const SAFEGUARDING_KEYWORDS = [
  "allegation", "abuse", "missing", "restraint", "injury", "exploitation",
  "self-harm", "ligature", "medication error", "police", "LADO",
  "Ofsted notification", "sexual", "trafficking", "radicalisation",
  "grooming", "county lines", "forced marriage", "FGM", "death",
  "suicide", "suicidal", "overdose", "section 47", "s47",
  "child protection", "deprivation of liberty", "DoLS", "Reg 40",
  "serious incident", "secure accommodation",
];

const REGULATORY_KEYWORDS = [
  "Reg 45", "Reg 44", "regulation 45", "regulation 44", "Annex A",
  "Quality Standards", "SCCIF", "Ofsted", "inspection", "compliance",
  "notification", "Schedule 5", "Children's Homes Regulations",
  "statement of purpose", "children's guide", "registered person",
];

const THERAPEUTIC_KEYWORDS = [
  "keywork", "direct work", "PACE", "DDP", "ARC framework",
  "trauma-informed", "therapeutic", "attachment", "relationship repair",
  "life story", "identity work", "sensory", "de-escalation",
  "restorative", "positive behaviour", "behaviour support",
  "regulation strategies", "co-regulation",
];

const OVERSIGHT_KEYWORDS = [
  "oversight", "recording quality", "gaps", "monitoring", "patterns",
  "quality assurance", "management oversight", "manager review",
  "audit", "consistency", "standard of care", "drift",
  "practice quality", "recording standards",
];

const RISK_ASSESSMENT_KEYWORDS = [
  "risk assessment", "risk register", "risk review", "risk level",
  "risk mitigation", "risk factors", "escalating risk", "emerging risk",
  "risk history", "dynamic risk",
];

const WORKFORCE_KEYWORDS = [
  "staffing", "supervision", "training", "rota", "team stability",
  "staff development", "workforce", "agency staff", "sickness",
  "retention", "induction", "competency",
];

const REPORT_KEYWORDS = [
  "report", "Reg 45 report", "weekly report", "monthly report",
  "social worker update", "child review", "placement report",
  "progress report", "transition report", "end of placement",
];

const ADMIN_KEYWORDS = [
  "summarise", "summarize", "tidy", "email", "rewrite", "format",
  "shorten", "lengthen", "proofread", "correct", "grammar",
  "structure", "rephrase", "bullet points", "template",
];

const DOCUMENT_KEYWORDS = [
  "file", "document", "upload", "classify", "filing", "scan",
  "attachment", "paperwork", "form",
];

const VOICE_KEYWORDS = [
  "voice", "transcription", "dictation", "audio", "recording",
  "spoken", "transcript",
];

const SEARCH_KEYWORDS = [
  "find", "search", "look up", "locate", "where is", "show me",
  "retrieve", "pull up", "check if",
];

// ── Agent Selection Logic ─────────────────────────────────────────────────

function selectAgent(taskType: TaskType, riskLevel: RiskLevel): AgentId {
  switch (taskType) {
    case "safeguarding":
      return "safeguarding_agent";
    case "regulatory":
      return "regulation45_evidence_agent";
    case "therapeutic":
      return "therapeutic_practice_agent";
    case "oversight":
      return "oversight_agent";
    case "risk_assessment":
      return "risk_assessment_agent";
    case "workforce":
      return "workforce_agent";
    case "report":
      return "report_generator_agent";
    case "document":
      return "filing_agent";
    case "admin":
      // Admin at high risk likely has safeguarding undertones
      if (riskLevel === "high" || riskLevel === "critical") {
        return "safeguarding_agent";
      }
      return "filing_agent";
    case "voice":
      // Voice transcripts could be anything — route by risk
      if (riskLevel === "critical") return "safeguarding_agent";
      if (riskLevel === "high") return "risk_assessment_agent";
      return "report_generator_agent";
    case "reasoning":
      return "oversight_agent";
    case "search":
      return "filing_agent";
    case "task":
      return "filing_agent";
    default:
      return "filing_agent";
  }
}

// ── Task Type Detection ───────────────────────────────────────────────────

function detectTaskType(text: string): TaskType {
  const lower = text.toLowerCase();

  // Safeguarding always wins — checked first regardless of other keywords
  for (const kw of SAFEGUARDING_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "safeguarding";
    }
  }

  // Risk assessment is second priority
  for (const kw of RISK_ASSESSMENT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "risk_assessment";
    }
  }

  // Regulatory
  for (const kw of REGULATORY_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "regulatory";
    }
  }

  // Oversight
  for (const kw of OVERSIGHT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "oversight";
    }
  }

  // Workforce
  for (const kw of WORKFORCE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "workforce";
    }
  }

  // Therapeutic
  for (const kw of THERAPEUTIC_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "therapeutic";
    }
  }

  // Report
  for (const kw of REPORT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "report";
    }
  }

  // Voice
  for (const kw of VOICE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "voice";
    }
  }

  // Document
  for (const kw of DOCUMENT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "document";
    }
  }

  // Search
  for (const kw of SEARCH_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "search";
    }
  }

  // Admin (check last since admin keywords can coexist with domain terms)
  for (const kw of ADMIN_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return "admin";
    }
  }

  // Default to reasoning if nothing else matches
  return "reasoning";
}

// ── RAG Decision ──────────────────────────────────────────────────────────

function shouldRetrieveEvidence(taskType: TaskType, riskLevel: RiskLevel): boolean {
  // Always retrieve evidence for high-risk tasks
  if (riskLevel === "critical" || riskLevel === "high") return true;

  // Task types that benefit from evidence
  const evidenceTaskTypes: TaskType[] = [
    "safeguarding", "regulatory", "oversight", "risk_assessment",
    "report", "workforce", "therapeutic", "reasoning",
  ];

  return evidenceTaskTypes.includes(taskType);
}

// ── Approval Decision ─────────────────────────────────────────────────────

function requiresApproval(
  agentId: AgentId,
  riskLevel: RiskLevel,
  role: string,
): boolean {
  // Critical risk always requires approval
  if (riskLevel === "critical") return true;

  // Check agent's own requirement
  const agent = AGENT_REGISTRY[agentId];
  if (agent?.requiresHumanApproval) return true;

  // High risk from frontline staff requires approval
  const frontlineRoles = ["rsw", "residential_care_worker", "support_worker", "bank_staff"];
  if (riskLevel === "high" && frontlineRoles.includes(role)) return true;

  return false;
}

// ── Auto-save Decision ────────────────────────────────────────────────────

function canAutoSave(riskLevel: RiskLevel, taskType: TaskType): boolean {
  // Never auto-save critical or high-risk content
  if (riskLevel === "critical" || riskLevel === "high") return false;

  // Only admin and document tasks can potentially auto-save
  return taskType === "admin" || taskType === "document" || taskType === "task";
}

// ── Main Router ───────────────────────────────────────────────────────────

export function routeRequest(request: CaraRequest): RouteDecision {
  // Combine all text inputs for analysis
  const fullText = [
    request.query,
    request.sourceContext ?? "",
    request.voiceTranscript ?? "",
    request.requestedAction ?? "",
  ].join(" ");

  // 1. Detect task type from content
  const taskType = detectTaskType(fullText);

  // 2. Classify risk
  const riskClassification = classifyRisk({
    query: request.query,
    role: request.role,
    currentPage: request.currentPage,
    childId: request.childId,
    sourceContext: request.sourceContext,
    voiceTranscript: request.voiceTranscript,
  });

  const riskLevel = riskClassification.level;

  // 3. Override task type if risk classification reveals safeguarding concern
  // even when keywords didn't match directly (e.g. from page context)
  const effectiveTaskType = riskClassification.safeguardingConcern && taskType !== "safeguarding"
    ? "safeguarding"
    : taskType;

  // 4. Select agent
  const requiredAgent = selectAgent(effectiveTaskType, riskLevel);

  // 5. Select model profile — start with agent default, apply risk override
  const baseProfile = getModelProfileIdForAgent(requiredAgent);
  const requiredModelProfile: ModelProfileId = applyRiskOverride(baseProfile, riskLevel);

  // 6. Determine RAG need
  const requiresRAG = shouldRetrieveEvidence(effectiveTaskType, riskLevel);

  // 7. Determine approval need
  const requiresHumanApproval = requiresApproval(requiredAgent, riskLevel, request.role);

  // 8. Determine safeguarding escalation
  const requiresSafeguardingEscalation = riskClassification.safeguardingConcern &&
    riskLevel === "critical";

  // 9. Determine auto-draft/save capabilities
  const canAutoDraft = riskLevel !== "critical";
  const canAutoSaveResult = canAutoSave(riskLevel, effectiveTaskType);

  // 10. Build routing reason
  const routingReason = buildRoutingReason(effectiveTaskType, riskLevel, requiredAgent, requiresRAG);

  return {
    taskType: effectiveTaskType,
    riskLevel,
    requiredAgent,
    requiredModelProfile,
    requiresRAG,
    requiresHumanApproval,
    requiresSafeguardingEscalation,
    canAutoDraft,
    canAutoSave: canAutoSaveResult,
    routingReason,
    riskFactors: riskClassification.factors,
  };
}

// ── Routing Reason Builder ────────────────────────────────────────────────

function buildRoutingReason(
  taskType: TaskType,
  riskLevel: RiskLevel,
  agentId: AgentId,
  requiresRAG: boolean,
): string {
  const agent = AGENT_REGISTRY[agentId];
  const agentName = agent?.name ?? agentId;

  const parts: string[] = [
    `Task classified as "${taskType}" at ${riskLevel} risk.`,
    `Routed to ${agentName}.`,
  ];

  if (requiresRAG) {
    parts.push("Evidence retrieval enabled.");
  }

  if (riskLevel === "critical") {
    parts.push("CRITICAL: Manager review mandatory before any output is committed.");
  }

  return parts.join(" ");
}
