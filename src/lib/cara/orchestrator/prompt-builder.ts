// ══════���═══════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — PROMPT BUILDER
//
// Builds system prompts for each agent by combining:
// - Base safety preamble (from existing ai/safety.ts)
// - Agent-specific instructions (from agent registry)
// - Evidence context (formatted for consumption)
// - User role context
// - Human writing rules
// - Risk-appropriate guardrails
//
// The prompt builder ensures every model invocation has a complete, safe,
// and contextually appropriate system prompt regardless of which agent or
// model profile is being used.
// ══════════════════════════════════════════════════════════════════════════════

import type { AgentId } from "@/types/cara-reports";
import { AGENT_REGISTRY } from "../agents/agent-registry";
import { CARA_SYSTEM_PREAMBLE } from "../ai/safety";
import { WRITING_STYLE_RULES } from "../writing/humanised-writing";
import type { CaraRequest, EvidenceItem, RiskLevel, RouteDecision } from "./types";

// ── Role Context Descriptions ─────────────────────────────────────────────

const ROLE_CONTEXT: Record<string, string> = {
  rsw: "You are supporting a Residential Support Worker (RSW) — a frontline care practitioner. They need clear, practical guidance. Do not assume extensive regulatory knowledge.",
  residential_care_worker: "You are supporting a Residential Care Worker — a frontline practitioner providing direct care. Keep language practical and child-focused.",
  support_worker: "You are supporting a Support Worker. They need practical, clear direction. Avoid complex regulatory language.",
  bank_staff: "You are supporting Bank Staff who may be less familiar with the home's specific children and routines. Provide context and clear actions.",
  senior: "You are supporting a Senior Care Worker with team leadership responsibilities. They understand daily practice well but may need support on regulatory or analytical tasks.",
  team_leader: "You are supporting a Team Leader responsible for shift management and staff oversight. They can handle moderate complexity.",
  deputy_manager: "You are supporting a Deputy Manager with significant operational and regulatory responsibilities. They have strong professional knowledge.",
  registered_manager: "You are supporting the Registered Manager — the person with overall accountability for the home's quality of care, regulatory compliance, and children's outcomes. Use professional-level language and regulatory precision.",
  responsible_individual: "You are supporting the Responsible Individual (RI) — the organisation's representative with regulatory oversight responsibility. They need strategic, governance-level insight.",
  ri: "You are supporting the Responsible Individual (RI) — the organisation's representative with regulatory oversight responsibility. They need strategic, governance-level insight.",
  operations: "You are supporting an Operations Director overseeing multiple homes. They need high-level, comparative, and strategic insight.",
  director: "You are supporting a Director with organisation-wide responsibility. They need strategic summaries, risk indicators, and governance-level information.",
  admin: "You are supporting an Administrative team member. Focus on practical, procedural guidance. Avoid safeguarding-sensitive detail unless explicitly relevant.",
};

// ── Risk-Level Guardrail Additions ────────────────────────────────────────

function buildRiskGuardrails(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "critical":
      return `
CRITICAL RISK GUARDRAILS — MANDATORY:
- This query involves critical safeguarding or safety themes.
- You MUST NOT minimise, dismiss, or downplay any indicator.
- You MUST NOT make any determination about whether abuse has occurred.
- You MUST flag this for immediate manager review.
- You MUST include clear next-step actions: who to inform, what threshold has been met, what timeline applies.
- If Reg 40 notification, LADO referral, or police contact may be required, state this clearly.
- Use language such as "this requires immediate review", "the Registered Manager must consider whether...", "this may meet the threshold for...".
- Do NOT provide false reassurance.
- Do NOT suggest waiting or monitoring when immediate action may be needed.
`;

    case "high":
      return `
HIGH RISK GUARDRAILS:
- This query involves significant risk or regulatory themes.
- Use tentative, evidence-based language: "the records suggest", "this may indicate", "consideration should be given to".
- Flag any sections where confidence is low or evidence is insufficient.
- Include clear ownership for next actions (who should do what, by when).
- If safeguarding themes are present, recommend manager review before acting.
- Do not present analysis as conclusion — present it as draft professional thinking for review.
`;

    case "medium":
      return `
MEDIUM RISK GUARDRAILS:
- Use professional, evidence-based language throughout.
- Link statements to source evidence where available.
- Flag where evidence is weak or missing.
- Include reflective prompts to support professional thinking.
- Present output as draft analysis requiring human review.
`;

    case "low":
      return `
STANDARD GUARDRAILS:
- Keep output professional and evidence-based.
- Flag any unexpected safeguarding or risk themes if they emerge.
- Present output as a draft for review.
`;
  }
}

// ── Agent-Specific Instructions ───────────────────────────────────────────

function buildAgentInstructions(agentId: AgentId): string {
  const agent = AGENT_REGISTRY[agentId];
  if (!agent) return "";

  const parts: string[] = [
    `AGENT ROLE: ${agent.name}`,
    `DESCRIPTION: ${agent.description}`,
    "",
    "ALLOWED ACTIONS:",
    ...agent.allowedActions.map((a) => `- ${a}`),
    "",
    "PROHIBITED ACTIONS (you must NEVER do these):",
    ...agent.prohibitedActions.map((a) => `- ${a}`),
    "",
    `OUTPUT TYPES: ${agent.outputTypes.join(", ")}`,
  ];

  if (agent.requiresHumanApproval) {
    parts.push("");
    parts.push("NOTE: All output from this agent requires human approval before any action is taken. Mark your output clearly as a DRAFT for review.");
  }

  return parts.join("\n");
}

// ── Evidence Formatting ───────────────────────────────────────────────────

function formatEvidenceForPrompt(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) {
    return `
EVIDENCE STATUS: No evidence was retrieved for this query.
INSTRUCTION: You MUST clearly state that no supporting evidence was available. Do NOT invent, assume, or fabricate any facts, dates, names, or events. If you cannot provide a useful response without evidence, say so directly.
`;
  }

  const formatted = evidence.map((item, idx) => {
    const parts = [
      `[Evidence ${idx + 1}]`,
      `Source: ${item.sourceTable}`,
      `ID: ${item.sourceId}`,
    ];

    if (item.sourceDate) parts.push(`Date: ${item.sourceDate}`);
    if (item.sourceTitle) parts.push(`Title: ${item.sourceTitle}`);
    parts.push(`Excerpt: ${item.sourceExcerpt}`);

    if (item.regulationRefs.length > 0) {
      parts.push(`Regulation references: ${item.regulationRefs.join(", ")}`);
    }
    if (item.qualityStandardRefs.length > 0) {
      parts.push(`Quality Standard references: ${item.qualityStandardRefs.join(", ")}`);
    }
    parts.push(`Relevance: ${item.relevanceScore}/100`);

    return parts.join("\n");
  });

  return `
EVIDENCE RETRIEVED (${evidence.length} items):
You MUST ground your response in this evidence. Reference evidence items by number. If the evidence does not support a claim, do not make that claim.

${formatted.join("\n\n")}
`;
}

// ── Writing Style Section ─────────────────────────────────────────────────

function buildWritingSection(): string {
  return `
WRITING STYLE:
Master tone: ${WRITING_STYLE_RULES.tone}
Language: ${WRITING_STYLE_RULES.language}

Voice: ${WRITING_STYLE_RULES.voiceGuidance}

Avoid:
${WRITING_STYLE_RULES.avoid.map((item) => `- ${item}`).join("\n")}
`;
}

// ── Main Prompt Builder ───────────────────────────────────────────────────

export function buildSystemPrompt(input: {
  request: CaraRequest;
  routeDecision: RouteDecision;
  evidence: EvidenceItem[];
}): string {
  const { request, routeDecision, evidence } = input;

  const roleContext = ROLE_CONTEXT[request.role] ?? ROLE_CONTEXT["rsw"];
  const agentInstructions = buildAgentInstructions(routeDecision.requiredAgent);
  const riskGuardrails = buildRiskGuardrails(routeDecision.riskLevel);
  const evidenceSection = formatEvidenceForPrompt(evidence);
  const writingSection = buildWritingSection();

  const contextSection = buildContextSection(request);

  return [
    CARA_SYSTEM_PREAMBLE,
    "",
    "═══ ORCHESTRATOR CONTEXT ═══",
    "",
    roleContext,
    "",
    contextSection,
    "",
    "═══ AGENT INSTRUCTIONS ═══",
    "",
    agentInstructions,
    "",
    "═══ RISK GUARDRAILS ═══",
    "",
    riskGuardrails,
    "",
    "═══ EVIDENCE ═══",
    "",
    evidenceSection,
    "",
    "═══ WRITING STYLE ═══",
    "",
    writingSection,
    "",
    "═══ OUTPUT FORMAT ═══",
    "",
    buildOutputFormatInstructions(),
  ].join("\n");
}

// ── Context Section ───────────────────────────────────────────────────────

function buildContextSection(request: CaraRequest): string {
  const parts: string[] = [];

  if (request.homeId) {
    parts.push(`Home ID: ${request.homeId}`);
  }
  if (request.childId) {
    parts.push(`Child ID: ${request.childId} — ensure all output is specific to this child.`);
  }
  if (request.currentPage) {
    parts.push(`User is currently on page: ${request.currentPage}`);
  }
  if (request.sourceContext) {
    parts.push(`Additional context provided by the user:\n${request.sourceContext}`);
  }
  if (request.voiceTranscript) {
    parts.push(`Voice transcript provided:\n${request.voiceTranscript}`);
  }
  if (request.attachedDocuments && request.attachedDocuments.length > 0) {
    parts.push(`Attached documents: ${request.attachedDocuments.join(", ")}`);
  }
  if (request.requestedAction) {
    parts.push(`Requested action: ${request.requestedAction}`);
  }

  return parts.length > 0 ? parts.join("\n") : "No additional context provided.";
}

// ── Output Format Instructions ────────────────────────────────────────────

function buildOutputFormatInstructions(): string {
  return `Respond in clear, professional prose. Do NOT return JSON unless specifically instructed.

Structure your response with:
1. A direct answer or analysis addressing the user's query
2. Evidence references where applicable (cite by evidence number)
3. Any safety flags or concerns
4. Suggested next actions with ownership and priority

If confidence is low, say so explicitly. If evidence is missing, state what is needed.

Remember: your output is a DRAFT. A human must review and approve before anything is committed.`;
}

// ── User Prompt Builder ───────────────────────────────────────────────────
// Builds the user-role message that accompanies the system prompt.

export function buildUserPrompt(request: CaraRequest): string {
  const parts: string[] = [];

  parts.push(request.query);

  if (request.voiceTranscript && request.voiceTranscript !== request.query) {
    parts.push(`\n[Voice transcript]: ${request.voiceTranscript}`);
  }

  if (request.sourceContext) {
    parts.push(`\n[Context]: ${request.sourceContext}`);
  }

  return parts.join("\n");
}
