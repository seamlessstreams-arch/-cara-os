// ══════════════════════════════════════════════════════════════════════════════
// Cara — REGULATORY AGENT
//
// Handles CHR 2015 regulations, Quality Standards, SCCIF, Reg 44/45,
// notifications, Ofsted readiness, and inspection evidence mapping.
// Must use approved knowledge base only and cite internal source references.
// Risk level: HIGH. Model: highest-safety.
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
  id: "regulatory_agent" as const,
  name: "Regulatory Agent",
  description:
    "Handles Children's Homes Regulations 2015, Quality Standards, SCCIF framework, " +
    "Reg 44/45 compliance, notifications, Ofsted readiness, and inspection evidence " +
    "mapping. Uses approved regulatory knowledge base only. All outputs cite sources.",
  riskLevel: "high" as RiskLevel,
  modelProfile: "highest-safety" as ModelProfileId,
};

// ── Regulatory Reference Base ────────────────────────────────────────────────

const REGULATORY_REFERENCES = {
  CHR_2015: {
    title: "The Children's Homes (England) Regulations 2015",
    key_regs: [
      "Reg 5 — Statement of Purpose",
      "Reg 6 — Quality Standards",
      "Reg 7 — Children's Views",
      "Reg 8 — Children's Plans",
      "Reg 9 — Enjoyment and Achievement",
      "Reg 10 — Health and Well-being",
      "Reg 11 — Positive Relationships",
      "Reg 12 — Protection of Children",
      "Reg 13 — Leadership and Management",
      "Reg 14 — Care Planning",
      "Reg 15 — Staffing",
      "Reg 16 — Statement of Purpose to be Published",
      "Reg 34 — Employment of Staff",
      "Reg 35 — Fitness of Workers",
      "Reg 36 — Fitness of Premises",
      "Reg 37 — Financial Viability",
      "Reg 38 — Review of Quality of Care",
      "Reg 39 — Complaints and Representations",
      "Reg 40 — Notifications",
      "Reg 44 — Independent Visits",
      "Reg 45 — Monthly RM Report",
    ],
  },
  QUALITY_STANDARDS: {
    title: "Guide to the Children's Homes Regulations and Quality Standards (2015)",
    standards: [
      "QS 1 — The quality and purpose of care standard",
      "QS 2 — The children's views, wishes and feelings standard",
      "QS 3 — The education standard",
      "QS 4 — The enjoyment and achievement standard",
      "QS 5 — The health and well-being standard",
      "QS 6 — The positive relationships standard",
      "QS 7 — The protection of children standard",
      "QS 8 — The leadership and management standard",
      "QS 9 — The care planning standard",
    ],
  },
  SCCIF: {
    title: "Social Care Common Inspection Framework (SCCIF)",
    judgement_areas: [
      "Overall experiences and progress of children",
      "How well children are helped and protected",
      "The effectiveness of leaders and managers",
    ],
    grades: ["Outstanding", "Good", "Requires Improvement", "Inadequate"],
  },
};

// ── System Prompt ────────────────────────────────────────────────────────────

const REGULATORY_SYSTEM_PROMPT = `You are the Regulatory Agent within Cara, a children's residential care management platform. You provide analysis grounded in the regulatory framework for children's homes in England.

═══ YOUR KNOWLEDGE BASE ═══

You operate ONLY from the following approved regulatory sources:
1. The Children's Homes (England) Regulations 2015 (CHR 2015)
2. Guide to the Children's Homes Regulations and Quality Standards (DfE, 2015)
3. Social Care Common Inspection Framework (SCCIF) — Ofsted
4. Schedule 5 — Events and notifications (linked to Reg 40)
5. Ofsted inspection handbook for children's homes

═══ KEY REGULATIONS ═══

${REGULATORY_REFERENCES.CHR_2015.key_regs.join("\n")}

═══ QUALITY STANDARDS ═══

${REGULATORY_REFERENCES.QUALITY_STANDARDS.standards.join("\n")}

═══ SCCIF JUDGEMENT AREAS ═══

${REGULATORY_REFERENCES.SCCIF.judgement_areas.join("\n")}

═══ CRITICAL RULES ═══

1. CITE SOURCES — Every regulatory reference must cite the specific regulation, standard, or framework section
2. APPROVED KNOWLEDGE ONLY — Do not invent regulatory requirements. If unsure, state "I cannot confirm this from approved sources"
3. NO LEGAL ADVICE — You provide regulatory mapping and readiness analysis, NOT legal interpretation
4. ALWAYS CURRENT — Flag if the user's question may relate to superseded guidance
5. EVIDENCE-LINKED — Connect regulatory requirements to specific evidence items where available
6. INSPECTION READY — Frame outputs in terms of what an Ofsted inspector would expect to see
7. MANAGER APPROVAL — All regulatory outputs require manager review before use in formal submissions

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Structured regulatory analysis with citations",
  "regulatoryRefs": [
    { "regulation": "Reg 12", "section": "Protection of Children", "relevance": "Direct requirement" }
  ],
  "qualityStandardRefs": [
    { "standard": "QS 7", "title": "Protection of children standard", "relevance": "How this applies" }
  ],
  "sccifMapping": {
    "judgementArea": "How well children are helped and protected",
    "evidenceType": "What an inspector would look for",
    "currentStrength": "strong|adequate|weak|insufficient"
  },
  "complianceStatus": "compliant|partially_compliant|non_compliant|unable_to_assess",
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "confidence": 78,
  "safetyFlags": [],
  "citationsMissing": false,
  "managerReviewRequired": true
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [REGULATORY_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ EVIDENCE PROVIDED ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"})\n` +
        `Type: ${item.evidenceType}\n` +
        `Regulation refs: ${item.regulationRefs.join(", ") || "none mapped"}\n` +
        `Quality Standard refs: ${item.qualityStandardRefs.join(", ") || "none mapped"}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END EVIDENCE ═══");
  } else {
    parts.push("\n\nNOTE: No evidence items provided. Analysis will be limited to regulatory guidance without evidence assessment.");
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
    /(?:COMPLIANCE ACTION|REGULATORY ACTION|REQUIRED):\s*(.+)/gi,
    /(?:Ofsted would expect|Inspector would look for|Evidence needed):\s*(.+)/gi,
    /(?:Non-compliant|Partially compliant).*?:\s*(.+)/gi,
    /(?:NOTIFICATION REQUIRED|NOTIFY):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      const isNotification = /notification|notify|Ofsted/i.test(text);

      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: isNotification ? "immediate" : "this_week",
        actionType: isNotification ? "notify" : "review",
        rationale: "Identified by regulatory agent analysis — cite specific regulation",
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
    temperature: 0.05,
  });

  const parsed = response as {
    content?: string;
    regulatoryRefs?: { regulation: string; section: string; relevance: string }[];
    qualityStandardRefs?: { standard: string; title: string; relevance: string }[];
    sccifMapping?: { judgementArea: string; evidenceType: string; currentStrength: string };
    complianceStatus?: string;
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    confidence?: number;
    safetyFlags?: string[];
    citationsMissing?: boolean;
    managerReviewRequired?: boolean;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Always require manager review for regulatory outputs
  safetyFlags.push("MANAGER_REVIEW_REQUIRED: Regulatory analysis must be reviewed before use in formal submissions");

  if (parsed.citationsMissing) {
    safetyFlags.push("CITATIONS_INCOMPLETE: Some regulatory references could not be confirmed — verify manually");
  }

  if (parsed.complianceStatus === "non_compliant") {
    safetyFlags.push("NON_COMPLIANCE_IDENTIFIED: Potential regulatory non-compliance detected — immediate review needed");
  }

  // Enrich content with regulatory references
  let content = parsed.content ?? "Unable to generate regulatory analysis.";

  if (parsed.regulatoryRefs && parsed.regulatoryRefs.length > 0) {
    content += "\n\n📜 REGULATORY REFERENCES:\n";
    content += parsed.regulatoryRefs.map((r) => `• ${r.regulation} (${r.section}) — ${r.relevance}`).join("\n");
  }

  if (parsed.sccifMapping) {
    content += `\n\n🔍 SCCIF MAPPING:\n`;
    content += `• Judgement area: ${parsed.sccifMapping.judgementArea}\n`;
    content += `• Evidence type: ${parsed.sccifMapping.evidenceType}\n`;
    content += `• Current strength: ${parsed.sccifMapping.currentStrength}`;
  }

  content += "\n\n📋 This regulatory analysis requires manager review before use in any formal submission or response.";

  const suggestedActions = (parsed.suggestedActions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 65, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`REGULATORY QUERY: ${context.request.query}`);

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
  const lower = priority?.toLowerCase() ?? "medium";
  if (lower === "urgent" || lower === "immediate") return "urgent";
  if (lower === "high" || lower === "today") return "high";
  if (lower === "medium" || lower === "this_week") return "medium";
  return "low";
}
