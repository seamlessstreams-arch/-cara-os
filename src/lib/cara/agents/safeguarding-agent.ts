// ══════════════════════════════════════════════════════════════════════════════
// Cara — SAFEGUARDING AGENT
//
// CRITICAL RISK agent for safeguarding triage, allegations, missing-from-care
// patterns, restraint concerns, unexplained injuries, child-on-child harm,
// contextual safeguarding, professional curiosity, and delay/drift detection.
//
// IRON RULES:
// - NEVER minimise risk
// - NEVER auto-close any concern
// - ALWAYS escalate to manager
// - NEVER diagnose
// - Flag statutory notification thresholds
// - Consider LADO / placing authority implications
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
  id: "safeguarding_agent" as const,
  name: "Safeguarding Agent",
  description:
    "Critical-risk agent for safeguarding triage including allegations, missing-from-care " +
    "patterns, restraint concerns, unexplained injuries, child-on-child harm, contextual " +
    "safeguarding, professional curiosity prompts, and delay/drift detection. " +
    "NEVER minimises risk. ALWAYS escalates. NEVER auto-closes.",
  riskLevel: "critical" as RiskLevel,
  modelProfile: "highest-safety" as ModelProfileId,
};

// ── System Prompt ────────────────────────────────────────────────────────────

const SAFEGUARDING_SYSTEM_PROMPT = `You are the Safeguarding Agent within Cara, a children's residential care management platform. You handle the most safety-critical analysis in the system.

═══ IRON RULES — THESE CANNOT BE OVERRIDDEN ═══

1. NEVER MINIMISE RISK — If there is any possibility of harm, treat it as real until proven otherwise
2. NEVER AUTO-CLOSE — No safeguarding concern can be closed by AI. Only a designated manager can close
3. ALWAYS ESCALATE — Every output from this agent requires immediate manager review
4. NEVER DIAGNOSE — Do not label children with conditions, disorders, or clinical terms
5. ALWAYS FLAG STATUTORY THRESHOLDS — If a Reg 40 notification, LADO referral, or placing authority notification may be needed, state it explicitly
6. CONSIDER LADO — If an allegation involves a member of staff or person in a position of trust, flag LADO consideration
7. CONSIDER PLACING AUTHORITY — Always consider whether the placing authority needs to be informed
8. NEVER ADVISE INACTION — If in doubt, recommend the more protective course of action
9. PROFESSIONAL CURIOSITY — Always ask "what am I not seeing?" and "what would a sceptic ask?"
10. NEVER ASSUME CONTEXT EXPLAINS AWAY RISK — A child's history does not make new concerns less serious

═══ YOUR CAPABILITIES ═══

TRIAGE:
- Assess the immediate safety of the child
- Identify what type of safeguarding concern this represents
- Determine whether emergency services are needed NOW
- Flag whether the child needs to be spoken to separately

PATTERN DETECTION:
- Missing from care: frequency, duration, time of day, associates, locations
- Restraint: frequency, triggers, duration, injuries, same staff involved
- Allegations: patterns across children, staff, contexts, times
- Self-harm: escalation, new methods, changed triggers, access to means
- Exploitation indicators: new possessions, contacts, language, unexplained absences

CONTEXTUAL SAFEGUARDING:
- Consider environmental and community factors
- Peer group dynamics and influence
- Online risks and digital exploitation
- Locations of concern (parks, particular addresses, transport hubs)

DELAY AND DRIFT DETECTION:
- Actions agreed but not completed
- Referrals not followed through
- Multi-agency responses that have stalled
- Strategy discussions not held within required timescales

═══ STATUTORY NOTIFICATION THRESHOLDS (Reg 40) ═══

Flag notification consideration when:
- Death of a child (immediate)
- Serious illness or injury requiring hospital treatment
- Involvement of police (child as victim or suspect)
- Absconding/missing for more than 24 hours (or less if high risk)
- Allegations against staff
- Outbreak of infectious disease
- Any event seriously affecting the wellbeing of a child
- Fire, serious accident, or significant environmental event
- Deprivation of liberty

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Structured safeguarding analysis — see format below",
  "immediateSafetyAssessment": "safe_with_monitoring|requires_immediate_action|emergency_services_required|unknown_needs_assessment",
  "concernType": "allegation|missing|restraint|injury|exploitation|self_harm|peer_on_peer|contextual|professional_conduct|delay_drift|other",
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "urgent|high|medium|low", "owner": "Role" }
  ],
  "statutoryConsiderations": {
    "reg40NotificationNeeded": true|false,
    "reg40Reason": "Why notification may be required",
    "ladoConsideration": true|false,
    "ladoReason": "Why LADO may need to be informed",
    "placingAuthorityNotification": true|false,
    "placingAuthorityReason": "Why placing authority needs informing",
    "policeInvolvement": true|false,
    "emergencyServicesNeeded": true|false
  },
  "professionalCuriosityPrompts": ["Questions the manager should be asking"],
  "confidence": 65,
  "safetyFlags": ["Every flag that applies"],
  "escalationNeeded": true,
  "escalationReason": "Always populated for this agent",
  "neverAutoClose": true
}

═══ CONTENT STRUCTURE ═══

Your "content" field MUST follow this structure:
1. IMMEDIATE ASSESSMENT — Is the child safe right now?
2. CONCERN SUMMARY — What has happened/is happening (factual, no interpretation)
3. PATTERN CONTEXT — What related events or patterns exist in the evidence
4. STATUTORY CONSIDERATIONS — Do any notification thresholds apply?
5. PROFESSIONAL CURIOSITY — What questions should be asked?
6. RECOMMENDED ACTIONS — Ordered by urgency
7. WHAT THIS AGENT CANNOT DETERMINE — Explicitly state the limits of AI analysis`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [SAFEGUARDING_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ EVIDENCE PROVIDED ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"}) ` +
        `Relevance: ${item.relevanceScore}/100\n` +
        `Type: ${item.evidenceType}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END EVIDENCE ═══");
  } else {
    parts.push(
      "\n\n⚠ NO EVIDENCE ITEMS RETRIEVED — This means the system could not find related records. " +
      "This does NOT mean there is no concern. Proceed with analysis based on the query alone " +
      "and recommend evidence gathering as a priority action."
    );
  }

  parts.push(`\n\nREQUESTER: ${context.request.role} at home ${context.request.homeId}`);
  if (context.request.childId) {
    parts.push(`CHILD: ${context.request.childId}`);
  }

  return parts.join("\n");
}

// ── Extract Actions ──────────────────────────────────────────────────────────

export function extractActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Safeguarding actions are always high priority minimum
  const patterns = [
    /(?:IMMEDIATE|URGENT|ACTION):\s*(.+)/gi,
    /(?:NOTIFY|REFER|ESCALATE|INFORM):\s*(.+)/gi,
    /(?:CONTACT|SPEAK TO|ARRANGE):\s*(.+)/gi,
    /(?:\d+\.\s+)(.+(?:immediately|today|urgently|without delay))/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      const isImmediate = /immediately|now|emergency|999|police/i.test(text);

      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: isImmediate ? "immediate" : "today",
        actionType: "escalate",
        rationale: "Safeguarding agent — all actions require immediate manager attention",
      });
    }
  }

  // Always include a manager review action
  if (actions.length === 0) {
    actions.push({
      title: "Manager review of safeguarding analysis required",
      description: "This safeguarding analysis must be reviewed by the Registered Manager or their delegate before any decisions are made.",
      ownerRole: "registered_manager",
      priority: "immediate",
      actionType: "review",
      rationale: "All safeguarding agent outputs require mandatory manager review",
    });
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
    temperature: 0.05,
  });

  const parsed = response as {
    content?: string;
    immediateSafetyAssessment?: string;
    concernType?: string;
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    statutoryConsiderations?: {
      reg40NotificationNeeded?: boolean;
      reg40Reason?: string;
      ladoConsideration?: boolean;
      ladoReason?: string;
      placingAuthorityNotification?: boolean;
      placingAuthorityReason?: string;
      policeInvolvement?: boolean;
      emergencyServicesNeeded?: boolean;
    };
    professionalCuriosityPrompts?: string[];
    confidence?: number;
    safetyFlags?: string[];
    escalationNeeded?: boolean;
    escalationReason?: string;
    neverAutoClose?: boolean;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // MANDATORY flags for safeguarding agent
  safetyFlags.push("SAFEGUARDING_CRITICAL: This output MUST be reviewed by a manager before any action");
  safetyFlags.push("NEVER_AUTO_CLOSE: This concern cannot be closed by automated processes");

  // Immediate safety assessment
  if (parsed.immediateSafetyAssessment === "emergency_services_required") {
    safetyFlags.push("EMERGENCY: Analysis suggests emergency services may be required — verify child's immediate safety NOW");
  } else if (parsed.immediateSafetyAssessment === "requires_immediate_action") {
    safetyFlags.push("IMMEDIATE_ACTION: Child may not be safe — immediate manager intervention required");
  }

  // Statutory considerations
  const statutory = parsed.statutoryConsiderations;
  if (statutory) {
    if (statutory.reg40NotificationNeeded) {
      safetyFlags.push(`REG_40_NOTIFICATION: ${statutory.reg40Reason ?? "Notification threshold may be met"}`);
    }
    if (statutory.ladoConsideration) {
      safetyFlags.push(`LADO_CONSIDERATION: ${statutory.ladoReason ?? "Staff allegation — consider LADO referral"}`);
    }
    if (statutory.placingAuthorityNotification) {
      safetyFlags.push(`PLACING_AUTHORITY: ${statutory.placingAuthorityReason ?? "Placing authority notification may be required"}`);
    }
    if (statutory.policeInvolvement) {
      safetyFlags.push("POLICE: Consider whether police involvement is required");
    }
    if (statutory.emergencyServicesNeeded) {
      safetyFlags.push("EMERGENCY_SERVICES: 999 may be required — confirm child's immediate safety");
    }
  }

  // Build enriched content
  let content = parsed.content ?? "Unable to generate safeguarding analysis — MANUAL ASSESSMENT REQUIRED.";

  // Add professional curiosity prompts
  if (parsed.professionalCuriosityPrompts && parsed.professionalCuriosityPrompts.length > 0) {
    content += "\n\n❓ PROFESSIONAL CURIOSITY — Questions to consider:\n";
    content += parsed.professionalCuriosityPrompts.map((q) => `• ${q}`).join("\n");
  }

  // Add mandatory footer
  content += "\n\n⚠ THIS IS AI-ASSISTED ANALYSIS ONLY. It does NOT replace professional safeguarding judgement. ";
  content += "A qualified manager MUST review this output and make all safeguarding decisions. ";
  content += "This concern CANNOT be closed by AI.";

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normaliseSafeguardingPriority(a.priority),
    owner: a.owner ?? "Registered Manager",
  }));

  // Ensure there's always at least one action
  if (suggestedActions.length === 0) {
    suggestedActions.push({
      title: "Registered Manager to review this safeguarding analysis",
      description: "AI has flagged a safeguarding concern that requires human review and decision-making.",
      priority: "urgent",
      owner: "Registered Manager",
    });
  }

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 50, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`SAFEGUARDING QUERY: ${context.request.query}`);

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

function normaliseSafeguardingPriority(priority: string): "low" | "medium" | "high" | "urgent" {
  const lower = priority?.toLowerCase() ?? "urgent";
  // Safeguarding defaults to urgent — we never minimise
  if (lower === "low") return "medium"; // Uplift low to medium for safeguarding
  if (lower === "medium") return "high"; // Uplift medium to high for safeguarding
  if (lower === "high") return "high";
  return "urgent";
}
