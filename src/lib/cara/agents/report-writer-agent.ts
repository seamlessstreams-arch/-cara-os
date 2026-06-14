// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT WRITER AGENT
//
// Produces weekly child reports, review reports, Reg 45 drafts, management
// summaries, home development plans, and child progress summaries. All outputs
// are evidence-grounded and approval-gated — nothing is committed without
// manager sign-off.
// Risk level: HIGH. Model: balanced.
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
  id: "report_writer_agent" as const,
  name: "Report Writer Agent",
  description:
    "Produces evidence-grounded reports including weekly child reports, review reports, " +
    "Reg 45 drafts, management summaries, home development plans, and child progress " +
    "summaries. All outputs are approval-gated and require manager sign-off.",
  riskLevel: "high" as RiskLevel,
  modelProfile: "balanced" as ModelProfileId,
};

// ── Report Type Definitions ──────────────────────────────────────────────────

const REPORT_TYPES = {
  weekly_child: {
    name: "Weekly Child Report",
    sections: ["Overview", "Key Events", "Behaviour & Wellbeing", "Education", "Health", "Contact", "Actions"],
    audience: "Social Worker / Placing Authority",
    tone: "Professional, factual, child-centred",
  },
  review_report: {
    name: "Child Review Report",
    sections: ["Placement Summary", "Progress Against Objectives", "Health & Education", "Relationships", "Identity & Independence", "Views of the Child", "Recommendations"],
    audience: "Reviewing Officer / Panel",
    tone: "Formal, evidence-based, balanced",
  },
  reg45_draft: {
    name: "Regulation 45 Monthly Report",
    sections: ["Children in Placement", "Staffing", "Significant Events", "Complaints & Representations", "Quality Standards Self-Assessment", "Actions from Previous Month", "Development Priorities"],
    audience: "Responsible Individual / Ofsted (on request)",
    tone: "Formal, regulatory, comprehensive",
  },
  management_summary: {
    name: "Management Summary",
    sections: ["Key Headlines", "Concerns & Risks", "Staffing", "Compliance", "Priorities"],
    audience: "Senior Leadership",
    tone: "Concise, strategic, action-focused",
  },
  home_development: {
    name: "Home Development Plan",
    sections: ["Current Position", "Strengths", "Areas for Development", "Objectives", "Timescales", "Resources Required", "Measurement Criteria"],
    audience: "RI / Board / Ofsted",
    tone: "Strategic, developmental, evidence-informed",
  },
  child_progress: {
    name: "Child Progress Summary",
    sections: ["Period Overview", "Achievements & Strengths", "Challenges", "Relationships", "Targets Progress", "Next Steps"],
    audience: "Social Worker / Child (age appropriate)",
    tone: "Warm, strengths-focused, accessible",
  },
};

// ── System Prompt ────────────────────────────────────────────────────────────

const REPORT_WRITER_SYSTEM_PROMPT = `You are the Report Writer Agent within Cara, a children's residential care management platform. You produce structured, evidence-grounded reports for children's residential care homes.

═══ REPORT TYPES YOU PRODUCE ═══

${Object.entries(REPORT_TYPES).map(([key, rt]) =>
  `${key.toUpperCase()}:\n  Name: ${rt.name}\n  Sections: ${rt.sections.join(", ")}\n  Audience: ${rt.audience}\n  Tone: ${rt.tone}`
).join("\n\n")}

═══ CRITICAL RULES ═══

1. EVIDENCE-GROUNDED — Every statement in a report must be supported by evidence. If evidence is insufficient, state "Insufficient evidence for this section" rather than fabricating content
2. NEVER FABRICATE — If you don't have evidence for something, say so. An honest gap is infinitely better than a fabricated claim
3. APPROVAL-GATED — All reports are DRAFTS until a manager reviews and approves them
4. CHILD-CENTRED — The child's voice, wishes, and feelings must be present where appropriate
5. BALANCED — Present both strengths and challenges. Never all-positive or all-negative
6. AUDIENCE-APPROPRIATE — Adjust language, detail level, and tone for the stated audience
7. CITE EVIDENCE — Reference specific log entries, records, or observations by date/type
8. CONFIDENCE SCORING — Rate your confidence in each section based on evidence availability
9. FLAG GAPS — Explicitly identify where evidence is missing and the report would benefit from additional input
10. NO OPINIONS AS FACTS — Clearly distinguish observations from interpretations

═══ WRITING STANDARDS ═══

- First person should not be used (the report is from "the home" not "I")
- Use the child's first name, not "the young person" or "the child" (unless for formal Ofsted submissions)
- Dates in DD/MM/YYYY format
- Active voice preferred
- Short paragraphs (3-4 sentences maximum)
- Professional but accessible language
- No jargon without explanation
- Quantify where possible ("attended school 4 out of 5 days" not "attended school well")

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "The full draft report content, formatted with headings and sections",
  "reportType": "weekly_child|review_report|reg45_draft|management_summary|home_development|child_progress",
  "sections": [
    { "heading": "Section title", "content": "Section content", "evidenceCount": 3, "confidenceScore": 85, "gaps": ["What's missing"] }
  ],
  "overallConfidence": 72,
  "evidenceGaps": ["Section X lacks evidence for Y", "No child voice captured for Z"],
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "confidence": 72,
  "safetyFlags": [],
  "approvalRequired": true,
  "draftStatus": "complete_draft|partial_draft|insufficient_evidence"
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [REPORT_WRITER_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ EVIDENCE FOR REPORT ═══");
    parts.push(`Total evidence items: ${context.evidence.length}\n`);
    for (const item of context.evidence) {
      parts.push(
        `[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"}) ` +
        `Relevance: ${item.relevanceScore}/100\n` +
        `Type: ${item.evidenceType}\n` +
        `Author: ${item.sourceAuthorId ?? "unknown"}\n` +
        `Regulation refs: ${item.regulationRefs.join(", ") || "none"}\n` +
        `QS refs: ${item.qualityStandardRefs.join(", ") || "none"}\n` +
        `Content: ${item.sourceExcerpt}\n`
      );
    }
    parts.push("═══ END EVIDENCE ═══");
  } else {
    parts.push(
      "\n\n⚠ NO EVIDENCE PROVIDED — Cannot produce an evidence-grounded report without evidence items. " +
      "Response will outline the report structure and identify what evidence is needed."
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

  const patterns = [
    /(?:ACTION|RECOMMENDATION|NEXT STEP|FOLLOW-UP):\s*(.+)/gi,
    /(?:Evidence needed|Gap identified|Missing):\s*(.+)/gi,
    /(?:Review by|Approve by|Deadline):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: "this_week",
        actionType: "review",
        rationale: "Report writer agent — action for report completion or follow-up",
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
    reportType?: string;
    sections?: { heading: string; content: string; evidenceCount: number; confidenceScore: number; gaps: string[] }[];
    overallConfidence?: number;
    evidenceGaps?: string[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    approvalRequired?: boolean;
    draftStatus?: string;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Always require approval
  safetyFlags.push("APPROVAL_REQUIRED: This report is a DRAFT and must be reviewed and approved by a manager before distribution");

  // Flag evidence gaps
  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    safetyFlags.push(`EVIDENCE_GAPS: ${parsed.evidenceGaps.length} gap(s) identified — report may be incomplete`);
  }

  // Flag low-confidence sections
  const lowConfidenceSections = (parsed.sections ?? []).filter((s) => s.confidenceScore < 50);
  if (lowConfidenceSections.length > 0) {
    safetyFlags.push(
      `LOW_CONFIDENCE_SECTIONS: ${lowConfidenceSections.map((s) => s.heading).join(", ")} — these sections lack sufficient evidence`
    );
  }

  if (parsed.draftStatus === "insufficient_evidence") {
    safetyFlags.push("INSUFFICIENT_EVIDENCE: Cannot produce a complete report with the evidence available");
  }

  // Build enriched content
  let content = parsed.content ?? "Unable to generate report draft.";

  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    content += "\n\n⚠ EVIDENCE GAPS:\n";
    content += parsed.evidenceGaps.map((g) => `• ${g}`).join("\n");
  }

  content += "\n\n📋 DRAFT STATUS: This report requires manager review and approval before distribution.";

  if (parsed.draftStatus) {
    content += ` Status: ${parsed.draftStatus.replace(/_/g, " ")}`;
  }

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  // Always add an approval action
  suggestedActions.unshift({
    title: "Review and approve report draft",
    description: "This report draft requires manager review before it can be distributed or saved as final.",
    priority: "high",
    owner: "Registered Manager",
  });

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? parsed.overallConfidence ?? 60, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`REPORT REQUEST: ${context.request.query}`);

  if (context.request.sourceContext) {
    parts.push(`\nADDITIONAL CONTEXT:\n${context.request.sourceContext}`);
  }

  if (context.request.voiceTranscript) {
    parts.push(`\nVOICE INPUT:\n${context.request.voiceTranscript}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nSource page: ${context.request.currentPage}`);
  }

  if (context.request.childId) {
    parts.push(`\nReport for child: ${context.request.childId}`);
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
