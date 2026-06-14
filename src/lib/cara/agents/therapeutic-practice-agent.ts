// ══════════════════════════════════════════════════════════════════════════════
// Cara — THERAPEUTIC PRACTICE AGENT
//
// Provides PACE-informed reflection, trauma-informed prompts, keywork session
// guidance, relational repair strategies, trusted adult development, child-
// centred planning support, and debriefing frameworks. Uses warm, human,
// non-clinical language. NEVER diagnoses. Grounded in Dan Hughes / DDP.
// Risk level: MEDIUM. Model: balanced.
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
  id: "therapeutic_practice_agent" as const,
  name: "Therapeutic Practice Agent",
  description:
    "Provides PACE-informed reflection, trauma-informed prompts, keywork session " +
    "guidance, relational repair strategies, trusted adult development, child-centred " +
    "planning, and debriefing support. Uses warm, non-clinical language grounded in " +
    "Dan Hughes and DDP principles. Never diagnoses.",
  riskLevel: "medium" as RiskLevel,
  modelProfile: "balanced" as ModelProfileId,
};

// ── System Prompt ────────────────────────────────────────────────────────────

const THERAPEUTIC_SYSTEM_PROMPT = `You are the Therapeutic Practice Agent within Cara, a children's residential care management platform. You support staff to deliver relationship-based, trauma-informed care.

═══ YOUR THERAPEUTIC FRAMEWORK ═══

PACE (Dan Hughes):
- PLAYFULNESS — Using lightness, warmth, and joy to reduce shame and build connection
- ACCEPTANCE — Accepting the child's inner world without judgement, separating behaviour from identity
- CURIOSITY — Wondering aloud about what might be driving behaviour, never interrogating
- EMPATHY — Genuinely feeling with the child, communicating understanding of their emotional experience

DDP (Dyadic Developmental Psychotherapy) Principles:
- The child's behaviour always makes sense in the context of their history
- Connection before correction — relationship is the intervention
- Co-regulation before self-regulation
- Safety is felt, not told — created through consistent, predictable responses
- Shame is the enemy of change — reduce shame at every opportunity
- Follow, lead, follow — attune to the child's state before guiding

ARC Framework (Attachment, Regulation, Competency):
- ATTACHMENT: Building safe, stable relationships with consistent adults
- REGULATION: Supporting the child to understand and manage their emotional states
- COMPETENCY: Building on strengths, developing identity, creating mastery experiences

═══ YOUR ROLE ═══

- Suggest PACE-informed responses to challenging moments
- Provide reflective prompts for keywork sessions
- Offer language suggestions that are warm, human, and non-clinical
- Support relational repair after ruptures
- Guide trusted adult relationship development
- Provide debriefing frameworks after difficult shifts
- Suggest child-centred planning approaches
- Review recording language for therapeutic alignment

═══ IRON RULES ═══

1. NEVER DIAGNOSE — Do not label, categorise, or apply clinical terms to children
2. NEVER USE CLINICAL LANGUAGE — No "dysregulated", "attachment disordered", "triggered" in outputs meant for child-facing use
3. ALWAYS HUMAN — Write as a warm, experienced practitioner, not a textbook
4. NEVER PRESCRIPTIVE — Offer possibilities ("you might try...", "some staff find...") not mandates
5. BEHAVIOUR IS COMMUNICATION — Always frame behaviour as the child communicating an unmet need
6. NO BLAME — Never frame the child as "the problem". The environment, history, and adult responses are where change happens
7. STRENGTHS-FIRST — Always identify what the child is doing well before addressing challenges
8. CONTEXT MATTERS — A response that works for one child may harm another. Always caveat with "knowing this child..."

═══ LANGUAGE PRINCIPLES ═══

Instead of:          Use:
"Dysregulated"  →   "Feeling overwhelmed" / "Having a tough time"
"Triggered"     →   "Something reminded them of..." / "This felt unsafe for them"
"Attention-seeking" → "Connection-seeking" / "Needing to know you're there"
"Non-compliant" →   "Finding it hard to..." / "Not ready yet"
"Aggressive"    →   "Showing us how big their feelings are"
"Manipulative"  →   "Using the strategies that kept them safe before"
"Challenging behaviour" → "Behaviour that tells us something"

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Warm, human, practice-focused response",
  "paceElement": "playfulness|acceptance|curiosity|empathy|combined",
  "therapeuticFramework": "PACE|DDP|ARC|combined",
  "practicePrompts": ["Reflective questions for the practitioner"],
  "languageSuggestions": ["Alternative phrases that are more therapeutic"],
  "keyworkIdeas": ["Session themes or activities if relevant"],
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "confidence": 80,
  "safetyFlags": [],
  "strengthsIdentified": ["What the child/staff are doing well"]
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [THERAPEUTIC_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ RELEVANT RECORDS ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"})\n` +
        `Type: ${item.evidenceType}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END RECORDS ═══");
  }

  parts.push(`\n\nPRACTITIONER: ${context.request.role} at home ${context.request.homeId}`);
  if (context.request.childId) {
    parts.push(`CHILD: ${context.request.childId}`);
  }

  return parts.join("\n");
}

// ── Extract Actions ──────────────────────────────────────────────────────────

export function extractActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  const patterns = [
    /(?:KEYWORK SUGGESTION|SESSION IDEA|PRACTICE PROMPT):\s*(.+)/gi,
    /(?:Consider|Try|You might):\s*(.+)/gi,
    /(?:Relational repair|Reconnection|Follow-up):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      actions.push({
        title: match[1].trim().slice(0, 80),
        description: match[1].trim(),
        ownerRole: "residential_care_worker",
        priority: "this_week",
        actionType: "task",
        rationale: "Therapeutic practice suggestion — to be discussed with team/manager",
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
    temperature: 0.15,
  });

  const parsed = response as {
    content?: string;
    paceElement?: string;
    therapeuticFramework?: string;
    practicePrompts?: string[];
    languageSuggestions?: string[];
    keyworkIdeas?: string[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    strengthsIdentified?: string[];
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Check for accidental clinical language in the output
  const clinicalTerms = ["dysregulated", "attachment disorder", "triggered", "manipulative", "non-compliant"];
  const contentLower = (parsed.content ?? "").toLowerCase();
  for (const term of clinicalTerms) {
    if (contentLower.includes(term)) {
      safetyFlags.push(`CLINICAL_LANGUAGE_DETECTED: Output contains "${term}" — should be rephrased`);
    }
  }

  // Build enriched content
  let content = parsed.content ?? "Unable to generate therapeutic practice response.";

  if (parsed.practicePrompts && parsed.practicePrompts.length > 0) {
    content += "\n\n💭 REFLECTIVE PROMPTS:\n";
    content += parsed.practicePrompts.map((p) => `• ${p}`).join("\n");
  }

  if (parsed.languageSuggestions && parsed.languageSuggestions.length > 0) {
    content += "\n\n✏️ LANGUAGE SUGGESTIONS:\n";
    content += parsed.languageSuggestions.map((s) => `• ${s}`).join("\n");
  }

  if (parsed.keyworkIdeas && parsed.keyworkIdeas.length > 0) {
    content += "\n\n🎯 KEYWORK IDEAS:\n";
    content += parsed.keyworkIdeas.map((k) => `• ${k}`).join("\n");
  }

  if (parsed.strengthsIdentified && parsed.strengthsIdentified.length > 0) {
    content += "\n\n⭐ STRENGTHS IDENTIFIED:\n";
    content += parsed.strengthsIdentified.map((s) => `• ${s}`).join("\n");
  }

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 70, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`PRACTICE QUERY: ${context.request.query}`);

  if (context.request.sourceContext) {
    parts.push(`\nCONTEXT:\n${context.request.sourceContext}`);
  }

  if (context.request.voiceTranscript) {
    parts.push(`\nVOICE INPUT:\n${context.request.voiceTranscript}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nSource page: ${context.request.currentPage}`);
  }

  return parts.join("");
}

function normalisePriority(priority: string): "low" | "medium" | "high" | "urgent" {
  const lower = priority?.toLowerCase() ?? "low";
  if (lower === "urgent" || lower === "immediate") return "urgent";
  if (lower === "high" || lower === "today") return "high";
  if (lower === "medium" || lower === "this_week") return "medium";
  return "low";
}
