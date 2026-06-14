// ══════════════════════════════════════════════════════════════════════════════
// Cara — ADMIN AGENT
//
// Handles low-risk administrative tasks: summarising logs, drafting emails,
// creating simple tasks, rewording notes, formatting records, extracting
// dates/names/actions. Uses the fast-cheap model profile for speed and cost
// efficiency. Has NO safeguarding authority — escalates if content shifts.
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
  id: "admin_agent" as const,
  name: "Admin Agent",
  description:
    "Handles low-risk administrative tasks: summarising logs, drafting emails, " +
    "creating simple tasks, rewording notes, formatting records, and extracting " +
    "dates, names, and actions from text. Fast and cost-efficient.",
  riskLevel: "low" as RiskLevel,
  modelProfile: "fast-cheap" as ModelProfileId,
};

// ── System Prompt ────────────────────────────────────────────────────────────

const ADMIN_SYSTEM_PROMPT = `You are an administrative assistant within a children's residential care home management system called Cara.

YOUR ROLE:
- Summarise logs and notes clearly and concisely
- Draft professional emails for managers
- Reword or improve notes while preserving factual accuracy
- Format records into structured layouts (bullet points, tables, headings)
- Extract dates, names, actions, and deadlines from unstructured text
- Create simple task descriptions from instructions

FORMATTING RULES:
- Use clear, concise language appropriate for a professional care setting
- Preserve all factual content — never add information that was not in the source
- Use bullet points for lists of items or actions
- Use headings to separate distinct sections
- Keep summaries to the essential points — no padding or filler
- Dates should be in DD/MM/YYYY format (UK standard)
- Names should be formatted as given in the source — do not guess or infer

BOUNDARIES:
- You have NO safeguarding authority. If content contains safeguarding concerns, flag it immediately
- You do NOT interpret clinical or therapeutic content
- You do NOT make judgements about risk levels or child welfare
- You do NOT provide regulatory or legal advice
- If the content seems higher risk than a simple admin task, flag for escalation

OUTPUT FORMAT (JSON):
{
  "content": "Your formatted/summarised/drafted output here",
  "suggestedActions": [
    { "title": "Action title", "description": "What needs doing", "priority": "low|medium|high|urgent", "owner": "Role of person responsible" }
  ],
  "confidence": 85,
  "safetyFlags": [],
  "escalationNeeded": false,
  "escalationReason": ""
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [ADMIN_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\nRELEVANT RECORDS:");
    for (const item of context.evidence) {
      parts.push(`- [${item.sourceTable}/${item.sourceId}] ${item.sourceExcerpt}`);
    }
  }

  parts.push("\n\nINSTRUCTION:");
  parts.push(`The user (role: ${context.request.role}) has asked:`);
  parts.push(context.request.query);

  if (context.request.sourceContext) {
    parts.push(`\nSource context: ${context.request.sourceContext}`);
  }

  return parts.join("\n");
}

// ── Extract Actions ──────────────────────────────────────────────────────────

export function extractActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Pattern: lines starting with "Action:" or "TODO:" or "- [ ]"
  const actionPatterns = [
    /(?:Action|TODO|TASK):\s*(.+)/gi,
    /- \[ \]\s*(.+)/g,
    /(?:Deadline|Due|By):\s*(.+)/gi,
  ];

  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      actions.push({
        title: match[1].trim().slice(0, 80),
        description: match[1].trim(),
        ownerRole: "registered_manager",
        priority: "this_week",
        actionType: "task",
        rationale: "Extracted from admin agent output",
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
    temperature: 0.2,
  });

  const parsed = response as {
    content?: string;
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    escalationNeeded?: boolean;
    escalationReason?: string;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // If the agent detected escalation need, flag it
  if (parsed.escalationNeeded) {
    safetyFlags.push(`ESCALATION_RECOMMENDED: ${parsed.escalationReason ?? "Content may require higher-risk agent"}`);
  }

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  return {
    content: parsed.content ?? "Unable to generate admin response.",
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 75, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [context.request.query];

  if (context.request.voiceTranscript) {
    parts.push(`\n\nVoice transcript to process:\n${context.request.voiceTranscript}`);
  }

  if (context.request.sourceContext) {
    parts.push(`\n\nSource material:\n${context.request.sourceContext}`);
  }

  return parts.join("");
}

function normalisePriority(priority: string): "low" | "medium" | "high" | "urgent" {
  const lower = priority?.toLowerCase() ?? "low";
  if (lower === "urgent" || lower === "immediate") return "urgent";
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  return "low";
}
