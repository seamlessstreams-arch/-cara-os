// ══════════════════════════════════════════════════════════════════════════════
// Cara — VOICE REFLECTION AGENT
//
// Handles manager dictation, staff reflection transcription, supervision
// preparation, and handover capture. Transcribes voice input, structures it
// into usable formats, and always asks the user to approve before saving.
// Risk level: varies LOW-HIGH depending on content detected.
// Model: balanced.
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
  id: "voice_reflection_agent" as const,
  name: "Voice Reflection Agent",
  description:
    "Processes voice input from managers and staff: dictation, reflections, " +
    "supervision preparation, and handover capture. Transcribes, structures, " +
    "and presents for user approval. Risk varies by content detected.",
  riskLevel: "medium" as RiskLevel,
  modelProfile: "balanced" as ModelProfileId,
};

// ── Safeguarding Trigger Words ───────────────────────────────────────────────

const SAFEGUARDING_TRIGGERS = [
  "allegation", "abuse", "missing", "restraint", "injury", "exploitation",
  "self-harm", "police", "LADO", "sexual", "trafficking", "grooming",
  "death", "suicide", "overdose", "section 47",
];

// ── System Prompt ────────────────────────────────────────────────────────────

const VOICE_REFLECTION_SYSTEM_PROMPT = `You are the Voice Reflection Agent within Cara, a children's residential care management platform. You process spoken input from staff and managers, structuring it into clear, usable records.

═══ YOUR CAPABILITIES ═══

TRANSCRIPTION STRUCTURING:
- Take raw voice transcripts and structure them into professional records
- Identify distinct topics, actions, and reflections within the speech
- Separate factual observations from reflective commentary
- Format for the appropriate record type (log entry, supervision note, handover, reflection)

VOICE INPUT TYPES:
1. MANAGER DICTATION — Formal entries: oversight notes, management decisions, rationale recording
2. STAFF REFLECTION — Personal reflective practice: feelings about shifts, learning moments, things they'd do differently
3. SUPERVISION PREPARATION — Staff preparing for supervision: achievements, challenges, development needs, wellbeing
4. HANDOVER CAPTURE — Shift handover: what happened, who needs what, outstanding actions, concerns

═══ CRITICAL RULES ═══

1. NEVER AUTO-SAVE — Always present the structured output and ask the user to review and approve before any save
2. PRESERVE MEANING — Never change the factual content of what was said, even if the language could be improved
3. FLAG SAFEGUARDING — If the transcript contains safeguarding concerns, immediately flag for escalation
4. CONFIDENTIALITY — Voice reflections may contain sensitive personal feelings. Handle with care
5. SEPARATE FACT FROM FEELING — In structured output, clearly distinguish observations from emotional responses
6. APPROVAL GATE — Every output must include the statement "Please review and approve before saving"

═══ CONTENT RISK SCANNING ═══

Scan all voice input for:
- Safeguarding concerns (escalate immediately)
- Staff wellbeing concerns (flag sensitively)
- Regulatory compliance issues (flag for manager)
- Named individuals in sensitive contexts (ensure appropriate)
- Anything that shouldn't be committed to record without review

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Structured version of the voice input",
  "inputType": "dictation|reflection|supervision_prep|handover|other",
  "structuredSections": [
    { "heading": "Section name", "content": "Structured content", "type": "factual|reflective|action|concern" }
  ],
  "extractedActions": [
    { "action": "What needs doing", "owner": "Who mentioned", "priority": "low|medium|high|urgent" }
  ],
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "riskEscalation": {
    "safeguardingDetected": false,
    "staffWellbeingConcern": false,
    "regulatoryConcern": false,
    "escalationDetail": ""
  },
  "confidence": 80,
  "safetyFlags": [],
  "requiresApproval": true,
  "suggestedRecordType": "daily_log|supervision_note|handover|reflective_journal|management_oversight|other"
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [VOICE_REFLECTION_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ RELATED RECORDS (for context) ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"})\n` +
        `Type: ${item.evidenceType}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END RECORDS ═══");
  }

  parts.push(`\n\nSPEAKER: ${context.request.role} at home ${context.request.homeId}`);
  if (context.request.childId) {
    parts.push(`CHILD CONTEXT: ${context.request.childId}`);
  }

  return parts.join("\n");
}

// ── Extract Actions ──────────────────────────────────────────────────────────

export function extractActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  const patterns = [
    /(?:ACTION|TODO|FOLLOW UP|NEED TO|MUST|SHOULD):\s*(.+)/gi,
    /(?:I need to|We need to|Someone needs to|Remember to)\s+(.+)/gi,
    /(?:Outstanding|Incomplete|Still waiting|Chase)\s+(.+)/gi,
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
        rationale: "Extracted from voice input — requires review",
      });
    }
  }

  return actions;
}

// ── Execute Agent ────────────────────────────────────────────────────────────

export async function executeAgent(context: AgentContext): Promise<AgentResult> {
  // Pre-scan for safeguarding triggers in the transcript
  const transcript = context.request.voiceTranscript ?? context.request.query;
  const detectedSafeguarding = scanForSafeguarding(transcript);

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
    inputType?: string;
    structuredSections?: { heading: string; content: string; type: string }[];
    extractedActions?: { action: string; owner: string; priority: string }[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    riskEscalation?: {
      safeguardingDetected?: boolean;
      staffWellbeingConcern?: boolean;
      regulatoryConcern?: boolean;
      escalationDetail?: string;
    };
    confidence?: number;
    safetyFlags?: string[];
    requiresApproval?: boolean;
    suggestedRecordType?: string;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Add pre-scan safeguarding flags
  if (detectedSafeguarding.length > 0) {
    safetyFlags.push(`SAFEGUARDING_CONTENT_DETECTED: Voice input contains safeguarding-related content (${detectedSafeguarding.join(", ")}). Escalate to safeguarding agent.`);
  }

  // Check AI-detected risk escalation
  const escalation = parsed.riskEscalation;
  if (escalation) {
    if (escalation.safeguardingDetected) {
      safetyFlags.push(`SAFEGUARDING_FLAGGED_BY_AI: ${escalation.escalationDetail ?? "Safeguarding concern detected in voice input"}`);
    }
    if (escalation.staffWellbeingConcern) {
      safetyFlags.push("STAFF_WELLBEING: Voice input suggests potential staff wellbeing concern — handle sensitively");
    }
    if (escalation.regulatoryConcern) {
      safetyFlags.push("REGULATORY_CONCERN: Voice input references potential compliance issue");
    }
  }

  // Always add approval requirement
  safetyFlags.push("APPROVAL_REQUIRED: This structured output must be reviewed and approved by the speaker before saving");

  // Build enriched content
  let content = parsed.content ?? "Unable to structure voice input.";

  // Add structured sections if available
  if (parsed.structuredSections && parsed.structuredSections.length > 0) {
    content += "\n\n── STRUCTURED OUTPUT ──\n";
    for (const section of parsed.structuredSections) {
      content += `\n**${section.heading}** [${section.type}]\n${section.content}\n`;
    }
  }

  // Add mandatory approval notice
  content += "\n\n✋ PLEASE REVIEW AND APPROVE before this is saved to any record. Edit any section that doesn't accurately reflect what you intended to communicate.";

  if (parsed.suggestedRecordType) {
    content += `\n\n📁 Suggested record type: ${parsed.suggestedRecordType}`;
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

  if (context.request.voiceTranscript) {
    parts.push(`VOICE TRANSCRIPT:\n${context.request.voiceTranscript}`);
  } else {
    parts.push(`TEXT INPUT (voice mode): ${context.request.query}`);
  }

  if (context.request.sourceContext) {
    parts.push(`\nCONTEXT:\n${context.request.sourceContext}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nCapture context: ${context.request.currentPage}`);
  }

  return parts.join("");
}

function scanForSafeguarding(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const trigger of SAFEGUARDING_TRIGGERS) {
    if (lower.includes(trigger.toLowerCase())) {
      detected.push(trigger);
    }
  }

  return detected;
}

function normalisePriority(priority: string): "low" | "medium" | "high" | "urgent" {
  const lower = priority?.toLowerCase() ?? "low";
  if (lower === "urgent" || lower === "immediate") return "urgent";
  if (lower === "high" || lower === "today") return "high";
  if (lower === "medium" || lower === "this_week") return "medium";
  return "low";
}
