// ══════════════════════════════════════════════════════════════════════════════
// Cara — TASK ACTION AGENT
//
// Generates actions from context, assigns owners, suggests deadlines, links
// actions to forms/reports, and updates improvement plans. Lightweight agent
// focused on turning intelligence outputs into trackable work items.
// Risk level: LOW-MEDIUM. Model: fast-cheap.
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
  id: "task_action_agent" as const,
  name: "Task Action Agent",
  description:
    "Generates trackable actions from context, assigns owners by role, suggests " +
    "deadlines, links actions to forms and reports, and updates improvement plans. " +
    "Turns intelligence outputs into concrete, assignable work items.",
  riskLevel: "medium" as RiskLevel,
  modelProfile: "fast-cheap" as ModelProfileId,
};

// ── Role Definitions ─────────────────────────────────────────────────────────

const ASSIGNABLE_ROLES = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "team_leader",
  "residential_care_worker",
  "senior_care_worker",
  "admin",
  "maintenance",
  "hr_recruitment",
];

// ── System Prompt ────────────────────────────────────────────────────────────

const TASK_ACTION_SYSTEM_PROMPT = `You are the Task Action Agent within Cara, a children's residential care management platform. You convert insights, recommendations, and identified needs into clear, trackable actions.

═══ YOUR ROLE ═══

- Generate specific, actionable tasks from analysis outputs, reports, or user requests
- Assign appropriate owners based on role and responsibility
- Suggest realistic deadlines based on priority and complexity
- Link actions to relevant forms, reports, or improvement plan items
- Group related actions into logical sequences
- Identify dependencies between actions

═══ ACTION QUALITY STANDARDS ═══

Every action MUST be:
- SPECIFIC — Clear enough that the assignee knows exactly what to do
- MEASURABLE — How will completion be verified?
- ASSIGNABLE — Linked to a specific role (not "someone")
- REALISTIC — Achievable within the stated timeframe
- TIME-BOUND — Has a clear deadline or priority timeframe

═══ PRIORITY FRAMEWORK ═══

- URGENT (today): Safety concerns, regulatory deadlines, imminent risk
- HIGH (this week): Compliance gaps, overdue actions, escalated concerns
- MEDIUM (this month): Development actions, improvement plan items, training needs
- LOW (monitor): Nice-to-have improvements, future planning, aspirational goals

═══ OWNER ASSIGNMENT RULES ═══

Available roles for assignment:
${ASSIGNABLE_ROLES.map((r) => `- ${r}`).join("\n")}

Assignment principles:
- Safeguarding actions → registered_manager (always)
- Regulatory compliance → registered_manager or responsible_individual
- Staff development → team_leader or deputy_manager
- Day-to-day care tasks → residential_care_worker or senior_care_worker
- Admin/filing → admin
- Building/environment → maintenance
- Recruitment/HR → hr_recruitment

═══ CRITICAL RULES ═══

1. NEVER CREATE SAFEGUARDING ACTIONS WITHOUT ESCALATION FLAG — If an action relates to safeguarding, it must also flag for safeguarding agent review
2. REALISTIC DEADLINES — Don't set "today" deadlines for complex multi-step tasks
3. NO DUPLICATE ACTIONS — Check context for actions that already exist before creating new ones
4. LINK TO SOURCE — Every action should reference what generated it (report, analysis, observation)
5. DEPENDENCY AWARENESS — If action B depends on action A, state the dependency clearly

═══ OUTPUT FORMAT (JSON) ═══
{
  "content": "Summary of actions generated with rationale",
  "actions": [
    {
      "title": "Clear, specific action title (max 80 chars)",
      "description": "Full description of what needs to happen",
      "owner": "role_name",
      "priority": "urgent|high|medium|low",
      "deadline": "YYYY-MM-DD or relative (e.g. 'within 7 days')",
      "linkedTo": "report/form/plan reference if applicable",
      "dependsOn": "other action title if dependency exists",
      "verificationMethod": "How to confirm this is done",
      "source": "What generated this action"
    }
  ],
  "suggestedActions": [
    { "title": "Action", "description": "Detail", "priority": "low|medium|high|urgent", "owner": "Role" }
  ],
  "actionGroups": [
    { "group": "Group name", "actions": ["action title 1", "action title 2"], "rationale": "Why grouped" }
  ],
  "confidence": 85,
  "safetyFlags": [],
  "totalActions": 5,
  "urgentCount": 1,
  "highCount": 2
}`;

// ── Build Agent Prompt ───────────────────────────────────────────────────────

export function buildAgentPrompt(context: AgentContext): string {
  const parts: string[] = [TASK_ACTION_SYSTEM_PROMPT];

  if (context.evidence.length > 0) {
    parts.push("\n\n═══ CONTEXT / SOURCE MATERIAL ═══");
    for (const item of context.evidence) {
      parts.push(
        `\n[${item.sourceTable}/${item.sourceId}] (${item.sourceDate ?? "no date"})\n` +
        `Type: ${item.evidenceType}\n` +
        `Content: ${item.sourceExcerpt}`
      );
    }
    parts.push("\n═══ END CONTEXT ═══");
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
    /(?:ACTION|TASK|TODO|ASSIGN):\s*(.+)/gi,
    /(?:\d+\.\s+)(.+(?:by|before|within|deadline).+)/gi,
    /(?:Owner|Assigned to):\s*(\w+).*?(?:Task|Action):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = (match[2] ?? match[1]).trim();
      actions.push({
        title: text.slice(0, 80),
        description: text,
        ownerRole: "registered_manager",
        priority: "this_week",
        actionType: "task",
        rationale: "Generated by task action agent",
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
    actions?: {
      title: string;
      description: string;
      owner: string;
      priority: string;
      deadline?: string;
      linkedTo?: string;
      dependsOn?: string;
      verificationMethod?: string;
      source?: string;
    }[];
    suggestedActions?: { title: string; description: string; priority: string; owner?: string }[];
    actionGroups?: { group: string; actions: string[]; rationale: string }[];
    confidence?: number;
    safetyFlags?: string[];
    totalActions?: number;
    urgentCount?: number;
    highCount?: number;
  };

  const safetyFlags: string[] = parsed.safetyFlags ?? [];

  // Flag if there are urgent actions
  if (parsed.urgentCount && parsed.urgentCount > 0) {
    safetyFlags.push(`URGENT_ACTIONS: ${parsed.urgentCount} urgent action(s) generated — require immediate attention`);
  }

  // Check for safeguarding-related actions
  const safeguardingActions = (parsed.actions ?? []).filter((a) =>
    /safeguard|allegation|missing|restraint|harm|abuse/i.test(a.title + " " + a.description)
  );
  if (safeguardingActions.length > 0) {
    safetyFlags.push("SAFEGUARDING_ACTIONS_PRESENT: Some generated actions relate to safeguarding — ensure safeguarding agent has reviewed");
  }

  // Build enriched content
  let content = parsed.content ?? "Unable to generate actions.";

  if (parsed.actions && parsed.actions.length > 0) {
    content += "\n\n── GENERATED ACTIONS ──\n";
    for (const action of parsed.actions) {
      content += `\n• [${action.priority.toUpperCase()}] ${action.title}\n`;
      content += `  Owner: ${action.owner}\n`;
      content += `  Description: ${action.description}\n`;
      if (action.deadline) content += `  Deadline: ${action.deadline}\n`;
      if (action.linkedTo) content += `  Linked to: ${action.linkedTo}\n`;
      if (action.dependsOn) content += `  Depends on: ${action.dependsOn}\n`;
      if (action.verificationMethod) content += `  Verification: ${action.verificationMethod}\n`;
    }
  }

  if (parsed.actionGroups && parsed.actionGroups.length > 0) {
    content += "\n\n── ACTION GROUPS ──\n";
    for (const group of parsed.actionGroups) {
      content += `\n${group.group}: ${group.actions.join(" → ")}\n  Rationale: ${group.rationale}\n`;
    }
  }

  // Map actions to the standard format
  const suggestedActions = (parsed.actions ?? []).map((a) => ({
    title: a.title,
    description: a.description,
    priority: normalisePriority(a.priority),
    owner: a.owner,
  }));

  return {
    content,
    suggestedActions,
    confidence: Math.min(Math.max(parsed.confidence ?? 80, 0), 100),
    additionalSafetyFlags: safetyFlags,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPrompt(context: AgentContext): string {
  const parts: string[] = [];

  parts.push(`ACTION GENERATION REQUEST: ${context.request.query}`);

  if (context.request.sourceContext) {
    parts.push(`\nSOURCE MATERIAL:\n${context.request.sourceContext}`);
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
  if (lower === "urgent" || lower === "immediate" || lower === "today") return "urgent";
  if (lower === "high" || lower === "this_week") return "high";
  if (lower === "medium" || lower === "this_month") return "medium";
  return "low";
}
