// ══════════════════════════════════════════════════════════════════════════════
// Cara — REASONING AGENT
//
// Deep analysis agent for management oversight, Reg 45 analysis, incident
// pattern detection, risk analysis, care planning gaps, placement stability,
// and staff performance patterns. Uses the best-reasoning model profile.
// All outputs are flagged for manager review.
// ══════════════════════════════════════════════════════════════════════════════

import type { EvidenceItem, SuggestedAction, ModelProfileId, RiskLevel } from "../orchestrator/types";
import type { CaraRequest } from "../orchestrator/types";
import { generateCaraJson } from "../provider";

// ── Agent Context & Result Types ─────────────────────────────────────────────

export interface AgentContext {
  request: CaraRequest;
  evidence: EvidenceItem[];
  systemPrompt: string;
  modelProfile: string;
}

export interface AgentResult {
  content: string;
  suggestedActions: { title: string; description: string; priority: "low" | "medium" | "high" | "urgent"; owner?: string }[];
  confidence: number;
  additionalSafetyFlags: string[];
}

// ── Agent Configuration ──────────────────────────────────────────────────────

export const AGENT_CONFIG = {
  id: "reasoning_agent" as const,
  name: "Reasoning Agent",
  description:
    "Deep analysis agent for management oversight, Reg 45 analysis, incident " +
    "pattern detection, risk analysis, care planning gaps, placement stability " +
    "assessment, and staff performance patterns. Always flags for manager review.",
  riskLevel: "high" as RiskLevel,
  modelProfile: "best-reasoning" as ModelProfileId,
};

// ── System Prompt ────────────────────────────────────────────────────────────

const REASONING_SYSTEM_PROMPT = `You are the Reasoning Agent within Cara, a children's residential care management platform. Your role is to perform deep, structured analysis that supports management oversight and decision-making.

YOUR CAPABILITIES:
- Management oversight analysis: identifying where oversight is strong, weak, or absent
- Reg 45 monthly report analysis: assessing evidence quality, gaps, and patterns across reporting periods
- Incident pattern detection: identifying escalation patterns, clustering, and correlations
- Risk analysis: linking events to risk factors, identifying emerging risks
- Care planning gaps: where plans have drifted, stalled, or lack evidence of implementation
- Placement stability assessment: factors contributing to stability or instability
- Staff performance patterns: consistency, recording quality, response patterns (never punitive)

ANALYSIS METHODOLOGY:
1. GATHER: Review all available evidence items provided
2. PATTERN: Identify temporal patterns, clusters, correlations, and trends
3. LINK: Connect related events across different record types and time periods
4. ASSESS: Grade the strength of each finding (strong evidence / moderate indication / weak signal)
5. RECOMMEND: Suggest concrete next steps with clear ownership and priority
6. FLAG: Identify anything requiring immediate manager attention

CRITICAL RULES:
- ALL outputs require manager review before action — state this explicitly
- Never present analysis as definitive fact — use language like "the evidence suggests", "patterns indicate"
- Always link findings to specific evidence items with source references
- Consider alternative explanations for every pattern identified
- If safeguarding concerns emerge during analysis, flag immediately — do not continue routine analysis
- Never make punitive judgements about staff — focus on systemic factors and support needs
- Maintain professional curiosity — ask "what else could explain this?"

EVIDENCE STRENGTH GRADING:
- STRONG: Multiple corroborating sources across time, consistent with known risk factors
- MODERATE: Two or more indicators but limited corroboration or short time window
- WEAK: Single indicator or circumstantial — warrants monitoring, not action
- INSUFFICIENT: Not enough evidence to form any view — flag as evidence gap

OUTPUT FORMAT (JSON):
{
  "content": "Structured analysis with headings, findings, and recommendations",
  "analysisType": "pattern_detection|gap_analysis|risk_analysis|oversight_review|stability_assessment",
  "keyFindings": [
    { "finding": "Description", "evidenceStrength": "strong|moderate|weak|insufficient", "sourceRefs": ["sourceId1", "sourceId2"] }
  ],
  "suggestedActions": [
    { "title": "Action title", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "confidence": 72,
  "safetyFlags": [],
  "managerReviewRequired": true,
  "escalationNeeded": false,
  "escalationReason": "",
  "evidenceGaps": ["Description of missing evidence that would strengthen analysis"]
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [REASONING_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n══ EVIDENCE PROVIDED ══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"}) ` +
        `Relevance: ${item.relevanceScore}/100\n` +
        `Type: ${item.evidenceType}\n` +
        `Regs: ${item.regulationRefs.join(", ") || "none"}\n` +
        `QS: ${item.qualityStandardRefs.join(", ") || "none"}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n══ END EVIDENCE ══");
  } else {
    parts.push("\n\nNOTE: No evidence items were retrieved for this query. Your analysis must be caveated accordingly.");
  }

  parts.push(`\n\nREQUESTER: ${context.request.role} at home ${context.request.homeId}`);
  if (context.request.childId) {
    parts.push(`CHILD CONTEXT: ${context.request.childId}`);
  }

  return parts.join("\n");
}

// ── Extract Actions ──────────────────────────────────────────────────────────

export function extractActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Pattern: structured recommendation lines
  const patterns = [
    /(?:RECOMMEND|RECOMMENDATION|ACTION REQUIRED|NEXT STEP):\s*(.+)/gi,
    /(?:\d+\.\s+)(?:Manager should|Consider|Review|Escalate|Monitor)\s+(.+)/gi,
    /(?:PRIORITY|URGENT|IMMEDIATE):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      const isUrgent = /urgent|immediate|escalat/i.test(text);
      const isHigh = /review|assess|investigate/i.test(text);

      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: isUrgent ? "immediate" : isHigh ? "today" : "this_week",
        actionType: isUrgent ? "escalate" : "review",
        rationale: "Identified by reasoning agent analysis",
      });
    }
  }

  return actions;
}

// ── Execute Agent ────────────────────────────────────────────────────────────

export async function executeAgent(context: AgentContext): Promise<AgentResult> {
  const systemPrompt = buildAgentPrompt(context);
  const userPrompt = buildUserPrompt(context);

  const response = await generateCaraJson({
    model: context.modelProfile,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
  });

  const parsed = response as {
    content?: string;
    analysisType?: string;
    keyFindings?: { finding: string; evidenceStrength: string; sourceRefs: string[] }[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    managerReviewRequired?: boolean;
    escalationNeeded?: boolean;
    escalationReason?: string;
    evidenceGaps?: string[];
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Always flag for manager review
  safetyFlags.push("MANAGER_REVIEW_REQUIRED: This analysis must be reviewed by a manager before any action is taken");

  if (parsed.escalationNeeded) {
    safetyFlags.push(`ESCALATION_RECOMMENDED: ${parsed.escalationReason ?? "Analysis identified potential safeguarding concern"}`);
  }

  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    safetyFlags.push(`EVIDENCE_GAPS: ${parsed.evidenceGaps.join("; ")}`);
  }

  // Enrich content with evidence gap warnings
  let content = parsed.content ?? "Unable to generate analysis.";
  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    content += "\n\n⚠ EVIDENCE GAPS IDENTIFIED:\n" + parsed.evidenceGaps.map((g) => `- ${g}`).join("\n");
  }

  content += "\n\n📋 This analysis requires manager review before any actions are taken.";

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 60, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`ANALYSIS REQUEST: ${context.request.query}`);

  if (context.request.sourceContext) {
    parts.push(`\nADDITIONAL CONTEXT:\n${context.request.sourceContext}`);
  }

  if (context.request.voiceTranscript) {
    parts.push(`\nVOICE INPUT:\n${context.request.voiceTranscript}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nRequested from page: ${context.request.currentPage}`);
  }

  return parts.join("");
}

function normalisePriority(priority: string): "low" | "medium" | "high" | "urgent" {
  const lower = priority?.toLowerCase() ?? "medium";
  if (lower === "urgent" || lower === "immediate") return "urgent";
  if (lower === "high" || lower === "today") return "high";
  if (lower === "medium" || lower === "this_week") return "medium";
  return "low";
}
