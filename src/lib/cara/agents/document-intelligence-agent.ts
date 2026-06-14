// ══════════════════════════════════════════════════════════════════════════════
// Cara — DOCUMENT INTELLIGENCE AGENT
//
// Handles PDF/report analysis, extracting actions from reports, comparing
// Reg 44 reports across periods, building evidence maps, and detecting
// repeated recommendations that haven't been actioned. Always returns
// evidence snippets and source references.
// Risk level: MEDIUM-HIGH. Model: balanced.
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
  id: "document_intelligence_agent" as const,
  name: "Document Intelligence Agent",
  description:
    "Analyses PDFs, reports, and documents to extract actions, compare Reg 44 reports " +
    "across periods, build evidence maps, and detect repeated unactioned recommendations. " +
    "Always returns evidence snippets with source references.",
  riskLevel: "high" as RiskLevel,
  modelProfile: "balanced" as ModelProfileId,
};

// ── System Prompt ────────────────────────────────────────────────────────────

const DOCUMENT_INTELLIGENCE_SYSTEM_PROMPT = `You are the Document Intelligence Agent within Cara, a children's residential care management platform. You specialise in extracting structured intelligence from documents.

═══ YOUR CAPABILITIES ═══

DOCUMENT ANALYSIS:
- Extract key findings, recommendations, and actions from reports
- Identify who is responsible for each action and any stated deadlines
- Summarise document sections with source page/paragraph references
- Detect the document type and its regulatory significance

COMPARISON:
- Compare Reg 44 reports across multiple months to identify:
  - Recurring recommendations that haven't been addressed
  - New concerns that weren't present previously
  - Progress on previously identified issues
  - Changes in overall tone or grading
- Compare any two versions of a document to highlight changes

EVIDENCE MAPPING:
- Link document content to specific regulations and quality standards
- Build source packs showing which evidence supports which standard
- Identify gaps where standards lack documentary evidence
- Grade evidence quality (direct evidence, indirect, insufficient)

PATTERN DETECTION:
- Repeated recommendations across reports (drift indicator)
- Escalating language in successive reports
- Themes that appear across different document types
- Actions that were agreed but never evidenced as completed

═══ CRITICAL RULES ═══

1. ALWAYS CITE SOURCES — Every finding must reference the specific document, page, or section
2. NEVER INFER BEYOND TEXT — Only report what the document actually states
3. FLAG CONTRADICTIONS — If documents contradict each other, highlight this explicitly
4. REPEATED RECOMMENDATIONS = DRIFT — If the same recommendation appears in 3+ reports, flag as potential regulatory drift
5. PRESERVE ORIGINAL LANGUAGE — When quoting, use the exact words from the source
6. DISTINGUISH FACT FROM OPINION — Clearly separate what the document states from your analytical observations
7. MANAGER REVIEW — Outputs that identify compliance gaps or repeated recommendations require manager review

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Structured document analysis with source citations",
  "documentType": "reg44|reg45|care_plan|risk_assessment|social_worker_report|ofsted|placement_plan|other",
  "extractedActions": [
    { "action": "What needs doing", "owner": "Who", "deadline": "When", "sourceRef": "Page/section", "status": "new|recurring|overdue" }
  ],
  "evidenceMap": [
    { "finding": "What was found", "sourceRef": "Document/page", "regulationRef": "Reg X", "qualityStandard": "QS Y", "strength": "strong|moderate|weak" }
  ],
  "repeatedRecommendations": [
    { "recommendation": "What keeps appearing", "occurrences": 3, "firstSeen": "Date", "latestSeen": "Date", "resolved": false }
  ],
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "confidence": 75,
  "safetyFlags": [],
  "driftIndicators": ["Any signs of drift or delay"],
  "managerReviewRequired": true
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [DOCUMENT_INTELLIGENCE_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ DOCUMENTS / EVIDENCE PROVIDED ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"})\n` +
        `Type: ${item.evidenceType}\n` +
        `Regulation refs: ${item.regulationRefs.join(", ") || "none"}\n` +
        `Quality Standards: ${item.qualityStandardRefs.join(", ") || "none"}\n` +
        `Content:\n${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END DOCUMENTS ═══");
  } else {
    parts.push("\n\nNOTE: No document content was provided. If the user is asking about specific documents, recommend they attach or reference the document for analysis.");
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

  const patterns = [
    /(?:RECOMMENDATION|ACTION|REQUIRED):\s*(.+)/gi,
    /(?:RECURRING|REPEATED|UNRESOLVED):\s*(.+)/gi,
    /(?:DRIFT|DELAY|OVERDUE):\s*(.+)/gi,
    /(?:EVIDENCE GAP|MISSING EVIDENCE):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      const isDrift = /drift|recurring|repeated|overdue/i.test(text);
      const isGap = /gap|missing/i.test(text);

      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: isDrift ? "today" : isGap ? "this_week" : "this_week",
        actionType: isDrift ? "review" : "task",
        rationale: "Extracted from document intelligence analysis",
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
    documentType?: string;
    extractedActions?: { action: string; owner: string; deadline: string; sourceRef: string; status: string }[];
    evidenceMap?: { finding: string; sourceRef: string; regulationRef: string; qualityStandard: string; strength: string }[];
    repeatedRecommendations?: { recommendation: string; occurrences: number; firstSeen: string; latestSeen: string; resolved: boolean }[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    driftIndicators?: string[];
    managerReviewRequired?: boolean;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Flag drift indicators
  if (parsed.driftIndicators && parsed.driftIndicators.length > 0) {
    safetyFlags.push(`DRIFT_DETECTED: ${parsed.driftIndicators.join("; ")}`);
  }

  // Flag repeated recommendations
  const unresolvedRepeats = (parsed.repeatedRecommendations ?? []).filter((r) => !r.resolved && r.occurrences >= 3);
  if (unresolvedRepeats.length > 0) {
    safetyFlags.push(
      `REPEATED_RECOMMENDATIONS: ${unresolvedRepeats.length} recommendation(s) have appeared in 3+ reports without resolution — potential regulatory drift`
    );
  }

  if (parsed.managerReviewRequired) {
    safetyFlags.push("MANAGER_REVIEW_REQUIRED: Document analysis contains findings requiring manager review");
  }

  // Build enriched content
  let content = parsed.content ?? "Unable to generate document analysis.";

  if (unresolvedRepeats.length > 0) {
    content += "\n\n⚠ REPEATED UNRESOLVED RECOMMENDATIONS:\n";
    content += unresolvedRepeats.map((r) =>
      `• "${r.recommendation}" — appeared ${r.occurrences} times (first: ${r.firstSeen}, latest: ${r.latestSeen})`
    ).join("\n");
  }

  if (parsed.driftIndicators && parsed.driftIndicators.length > 0) {
    content += "\n\n⚠ DRIFT INDICATORS:\n";
    content += parsed.driftIndicators.map((d) => `• ${d}`).join("\n");
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

  parts.push(`DOCUMENT ANALYSIS REQUEST: ${context.request.query}`);

  if (context.request.attachedDocuments && context.request.attachedDocuments.length > 0) {
    parts.push(`\nATTACHED DOCUMENTS: ${context.request.attachedDocuments.join(", ")}`);
  }

  if (context.request.sourceContext) {
    parts.push(`\nCONTEXT:\n${context.request.sourceContext}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nSource page: ${context.request.currentPage}`);
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
