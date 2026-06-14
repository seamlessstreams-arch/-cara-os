// ══════════════════════════════════════════════════════════════════════════════
// Cara — SEARCH RAG AGENT
//
// System-core agent that runs BEFORE any high-risk AI response. Searches
// Cara records, retrieves relevant child/home/staff evidence, and
// builds source packs for other agents. The foundation layer that ensures
// all intelligence outputs are grounded in real evidence.
// Risk level: SYSTEM CORE. Model: fast-cheap.
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

// ── Extended Result with Evidence Pack ────────────────────────────────────────

export interface SearchResult extends AgentResult {
  evidencePack: EvidenceItem[];
  searchMetadata: {
    tablesSearched: string[];
    totalRecordsScanned: number;
    evidenceItemsReturned: number;
    searchDurationMs: number;
    queryExpansions: string[];
  };
}

// ── Agent Configuration ──────────────────────────────────────────────────────

export const AGENT_CONFIG = {
  id: "search_rag_agent" as const,
  name: "Search RAG Agent",
  description:
    "System-core retrieval agent that searches Cara records to build evidence " +
    "packs for other agents. Retrieves child, home, and staff evidence, scoring each " +
    "item by relevance. Runs before any high-risk AI response to ensure evidence grounding.",
  riskLevel: "medium" as RiskLevel,
  modelProfile: "fast-cheap" as ModelProfileId,
};

// ── Searchable Tables ────────────────────────────────────────────────────────

const SEARCHABLE_TABLES = [
  { table: "daily_logs", description: "Day-to-day records of events, observations, and activities" },
  { table: "incidents", description: "Incident reports including restraints, missing episodes, injuries" },
  { table: "safeguarding_concerns", description: "Open and closed safeguarding concerns and allegations" },
  { table: "risk_assessments", description: "Child and home risk assessments" },
  { table: "care_plans", description: "Placement plans, care plans, and pathway plans" },
  { table: "keywork_sessions", description: "Direct work and keywork session records" },
  { table: "health_records", description: "Medical appointments, medications, health assessments" },
  { table: "education_records", description: "School attendance, PEPs, exclusions, achievements" },
  { table: "contact_records", description: "Family contact, professional visits, social worker visits" },
  { table: "staff_supervision", description: "Supervision records and notes" },
  { table: "reg44_reports", description: "Independent visitor Reg 44 reports" },
  { table: "reg45_reports", description: "Monthly Registered Manager Reg 45 reports" },
  { table: "management_oversight", description: "Manager oversight entries and decisions" },
  { table: "complaints", description: "Complaints and representations" },
  { table: "notifications", description: "Ofsted and authority notifications" },
  { table: "training_records", description: "Staff training completion and gaps" },
  { table: "home_improvement_plans", description: "Development and improvement plan items" },
];

// ── System Prompt ────────────────────────────────────────────────────────────

const SEARCH_RAG_SYSTEM_PROMPT = `You are the Search RAG Agent within Cara, a children's residential care management platform. You are the evidence foundation — you retrieve and score evidence from the record system to ground all other agents' outputs.

═══ YOUR ROLE ═══

You are a SYSTEM CORE agent. You run BEFORE other agents to:
1. Analyse the incoming query to understand what evidence is needed
2. Determine which record tables to search
3. Score retrieved evidence items by relevance
4. Build an evidence pack that other agents will use
5. Identify gaps where important evidence may be missing

═══ SEARCHABLE RECORD TABLES ═══

${SEARCHABLE_TABLES.map((t) => `- ${t.table}: ${t.description}`).join("\n")}

═══ SEARCH STRATEGY ═══

1. QUERY EXPANSION — Expand the user's query into multiple search terms:
   - Synonyms (e.g., "missing" → "absent", "abscond", "missing from care")
   - Related concepts (e.g., "exploitation" → also search incidents, contacts, missing episodes)
   - Time-related (if asking about patterns, search a wider date range)

2. TABLE SELECTION — Choose which tables to search based on the query type:
   - Safeguarding → incidents, safeguarding_concerns, risk_assessments, daily_logs
   - Regulatory → reg44_reports, reg45_reports, notifications, complaints
   - Child progress → daily_logs, keywork_sessions, education_records, health_records
   - Oversight → management_oversight, staff_supervision, training_records
   - Reports → all tables relevant to the report type

3. RELEVANCE SCORING — Score each evidence item 0-100:
   - 90-100: Directly answers the query with specific, recent evidence
   - 70-89: Highly relevant context or supporting evidence
   - 50-69: Related but not directly addressing the query
   - 30-49: Tangentially related — may be useful for pattern detection
   - 0-29: Low relevance — include only if few better results exist

4. GAP DETECTION — After retrieval, identify:
   - Expected evidence that was not found
   - Time periods with no records
   - Record types that should exist but don't
   - Missing child voice or child perspective

═══ CRITICAL RULES ═══

1. NEVER FABRICATE EVIDENCE — If a search returns nothing, say so. Empty results are valid
2. ALWAYS SCORE HONESTLY — Don't inflate relevance scores. Low relevance is useful information
3. RESPECT PERMISSIONS — Only return evidence the requesting user's role has access to
4. FLAG SENSITIVE CONTENT — Mark evidence items that contain safeguarding or sensitive content
5. PRESERVE CONTEXT — Include enough excerpt to be useful but not so much that it overwhelms
6. DATE AWARENESS — Always include dates so downstream agents can assess recency
7. SOURCE INTEGRITY — Never modify evidence content during retrieval

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Summary of search results and evidence pack composition",
  "evidencePack": [
    {
      "sourceTable": "table_name",
      "sourceId": "record_id",
      "sourceDate": "YYYY-MM-DD",
      "sourceTitle": "Record title or summary",
      "sourceExcerpt": "Relevant excerpt from the record",
      "sourceAuthorId": "author_user_id",
      "relevanceScore": 85,
      "evidenceType": "direct|supporting|contextual|pattern",
      "regulationRefs": ["Reg 12", "Reg 40"],
      "qualityStandardRefs": ["QS 7"]
    }
  ],
  "searchMetadata": {
    "tablesSearched": ["daily_logs", "incidents"],
    "totalRecordsScanned": 150,
    "evidenceItemsReturned": 12,
    "searchDurationMs": 450,
    "queryExpansions": ["missing", "absent", "abscond", "missing from care"]
  },
  "suggestedActions": [],
  "evidenceGaps": ["No keywork sessions found in last 30 days", "No child voice recorded this week"],
  "confidence": 82,
  "safetyFlags": []
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [SEARCH_RAG_SYSTEM_PROMPT];

  // If there's already some evidence (from a previous search pass), include it
  if (context.evidence.length > 0) {
    parts.push("\n\n═══ PRE-EXISTING EVIDENCE (from previous retrieval) ═══");
    for (const item of context.evidence) {
      parts.push(
        `[${item.sourceTable}/${item.sourceId}] Relevance: ${item.relevanceScore}/100 — ${item.sourceExcerpt.slice(0, 100)}...`
      );
    }
    parts.push("═══ END PRE-EXISTING ═══");
    parts.push("\nExpand the search beyond what has already been retrieved.");
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

  // Search agent primarily flags evidence gaps as actions
  const patterns = [
    /(?:EVIDENCE GAP|MISSING RECORDS|NO RECORDS FOUND):\s*(.+)/gi,
    /(?:RECORDING GAP|MISSING ENTRY|NOT FOUND):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      actions.push({
        title: `Evidence gap: ${match[1].trim().slice(0, 60)}`,
        description: match[1].trim(),
        ownerRole: "registered_manager",
        priority: "this_week",
        actionType: "review",
        rationale: "Search agent detected missing evidence — may indicate recording gap",
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
    evidencePack?: EvidenceItem[];
    searchMetadata?: {
      tablesSearched?: string[];
      totalRecordsScanned?: number;
      evidenceItemsReturned?: number;
      searchDurationMs?: number;
      queryExpansions?: string[];
    };
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    evidenceGaps?: string[];
    confidence?: number;
    safetyFlags?: string[];
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Flag evidence gaps
  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    safetyFlags.push(`EVIDENCE_GAPS: ${parsed.evidenceGaps.join("; ")}`);
  }

  // Flag if search returned very little
  const itemCount = parsed.searchMetadata?.evidenceItemsReturned ?? 0;
  if (itemCount === 0) {
    safetyFlags.push("NO_EVIDENCE_FOUND: Search returned zero evidence items — downstream agent outputs will be uncorroborated");
  } else if (itemCount < 3) {
    safetyFlags.push(`LIMITED_EVIDENCE: Only ${itemCount} evidence item(s) found — analysis may be incomplete`);
  }

  // Flag safeguarding content in retrieved evidence
  const safeguardingEvidence = (parsed.evidencePack ?? []).filter((e) =>
    /safeguard|allegation|missing|restraint|harm|abuse|exploitation/i.test(e.sourceExcerpt)
  );
  if (safeguardingEvidence.length > 0) {
    safetyFlags.push(`SAFEGUARDING_CONTENT_IN_EVIDENCE: ${safeguardingEvidence.length} evidence item(s) contain safeguarding-related content`);
  }

  // Build content summary
  let content = parsed.content ?? "Search completed.";

  const metadata = parsed.searchMetadata;
  if (metadata) {
    content += `\n\n📊 SEARCH SUMMARY:\n`;
    content += `• Tables searched: ${metadata.tablesSearched?.join(", ") ?? "unknown"}\n`;
    content += `• Records scanned: ${metadata.totalRecordsScanned ?? 0}\n`;
    content += `• Evidence items returned: ${metadata.evidenceItemsReturned ?? 0}\n`;
    if (metadata.queryExpansions && metadata.queryExpansions.length > 0) {
      content += `• Query expansions: ${metadata.queryExpansions.join(", ")}`;
    }
  }

  if (parsed.evidenceGaps && parsed.evidenceGaps.length > 0) {
    content += "\n\n⚠ EVIDENCE GAPS:\n";
    content += parsed.evidenceGaps.map((g) => `• ${g}`).join("\n");
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
    confidence: Math.min(Math.max(parsed.confidence ?? 75, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Extended Execute (returns evidence pack) ─────────────────────────────────

export async function executeSearchAgent(context: AgentContext): Promise<SearchResult> {
  const baseResult = await executeAgent(context);

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
    evidencePack?: EvidenceItem[];
    searchMetadata?: {
      tablesSearched?: string[];
      totalRecordsScanned?: number;
      evidenceItemsReturned?: number;
      searchDurationMs?: number;
      queryExpansions?: string[];
    };
  };

  return {
    ...baseResult,
    evidencePack: parsed.evidencePack ?? [],
    searchMetadata: {
      tablesSearched: parsed.searchMetadata?.tablesSearched ?? [],
      totalRecordsScanned: parsed.searchMetadata?.totalRecordsScanned ?? 0,
      evidenceItemsReturned: parsed.searchMetadata?.evidenceItemsReturned ?? 0,
      searchDurationMs: parsed.searchMetadata?.searchDurationMs ?? 0,
      queryExpansions: parsed.searchMetadata?.queryExpansions ?? [],
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`SEARCH QUERY: ${context.request.query}`);

  if (context.request.childId) {
    parts.push(`\nSearch scoped to child: ${context.request.childId}`);
  }

  parts.push(`\nHome: ${context.request.homeId}`);

  if (context.request.sourceContext) {
    parts.push(`\nAdditional context: ${context.request.sourceContext}`);
  }

  if (context.request.currentPage) {
    parts.push(`\nRequest source page: ${context.request.currentPage}`);
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
