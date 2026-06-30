// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — WORKFLOW TRIGGER SERVICE
//
// When records are created/updated (incidents, missing episodes, restraints,
// safeguarding concerns, etc.), this service analyses the event and generates
// contextual suggestions: plan updates, sessions, training, oversight, risk
// reviews, debriefs, and referrals. Humans action or dismiss.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  WorkflowTrigger,
  WorkflowSuggestion,
  WorkflowTriggerEvent,
} from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Trigger rules engine ────────────────────────────────────────────────────
// Maps events to suggestion generators

export interface TriggerRule {
  events: WorkflowTriggerEvent[];
  generate: (context: TriggerContext) => WorkflowSuggestion[];
}

export interface TriggerContext {
  event: WorkflowTriggerEvent;
  sourceTable: string;
  sourceId: string;
  childId: string | null;
  content: string;
  metadata: Record<string, unknown>;
}

export const TRIGGER_RULES: TriggerRule[] = [
  // Incident triggers
  {
    events: ["incident_created", "incident_updated"],
    generate: (ctx) => {
      const suggestions: WorkflowSuggestion[] = [
        {
          type: "oversight",
          title: "Management Oversight Required",
          description: "This incident requires a management oversight comment.",
          priority: "high",
          target_type: "management_oversight_drafts",
          target_id: null,
        },
      ];

      if (/restrain|physical|intervention/i.test(ctx.content)) {
        suggestions.push({
          type: "debrief",
          title: "Post-Incident Debrief",
          description: "Physical intervention recorded. A structured debrief session is recommended for both child and staff.",
          priority: "high",
          target_type: "generated_sessions",
          target_id: null,
        });
        suggestions.push({
          type: "risk_review",
          title: "Risk Assessment Review",
          description: "Physical intervention recorded. Review whether the current risk assessment remains accurate.",
          priority: "high",
          target_type: "risk_assessment",
          target_id: null,
        });
      }

      if (ctx.childId) {
        suggestions.push({
          type: "session",
          title: "Follow-up Key Work Session",
          description: "A key work session to check in with the young person following this incident.",
          priority: "medium",
          target_type: "generated_sessions",
          target_id: null,
        });
      }

      return suggestions;
    },
  },

  // Missing episode triggers
  {
    events: ["missing_episode_created"],
    generate: (ctx) => [
      {
        type: "oversight",
        title: "Missing from Care Oversight",
        description: "Missing episode recorded. Management oversight required.",
        priority: "urgent",
        target_type: "management_oversight_drafts",
        target_id: null,
      },
      {
        type: "session",
        title: "Return Home Interview",
        description: "Statutory return home conversation required following this missing episode.",
        priority: "urgent",
        target_type: "generated_sessions",
        target_id: null,
      },
      {
        type: "risk_review",
        title: "Missing from Care Risk Review",
        description: "Review missing from care risk assessment following this episode.",
        priority: "high",
        target_type: "risk_assessment",
        target_id: null,
      },
      {
        type: "plan_update",
        title: "Missing from Care Plan Update",
        description: "Consider whether the missing from care plan needs updating based on this episode.",
        priority: "high",
        target_type: "plan_update_suggestions",
        target_id: null,
      },
    ],
  },

  // Restraint triggers
  {
    events: ["restraint_recorded"],
    generate: () => [
      {
        type: "oversight",
        title: "Restraint Oversight",
        description: "Physical intervention recorded. Detailed management oversight required.",
        priority: "urgent",
        target_type: "management_oversight_drafts",
        target_id: null,
      },
      {
        type: "debrief",
        title: "Post-Restraint Debrief",
        description: "Structured debrief required for child and all staff involved.",
        priority: "urgent",
        target_type: "generated_sessions",
        target_id: null,
      },
      {
        type: "training",
        title: "De-escalation Review",
        description: "Review team de-escalation skills and consider refresher training.",
        priority: "high",
        target_type: "learning_resources",
        target_id: null,
      },
    ],
  },

  // Safeguarding triggers
  {
    events: ["safeguarding_concern_raised"],
    generate: () => [
      {
        type: "oversight",
        title: "Safeguarding Oversight",
        description: "Safeguarding concern raised. Designated safeguarding lead oversight required.",
        priority: "urgent",
        target_type: "management_oversight_drafts",
        target_id: null,
      },
      {
        type: "referral",
        title: "Multi-Agency Referral Consideration",
        description: "Consider whether a multi-agency referral is required.",
        priority: "urgent",
        target_type: "referral",
        target_id: null,
      },
      {
        type: "risk_review",
        title: "Safeguarding Risk Review",
        description: "Review risk assessment in light of this safeguarding concern.",
        priority: "urgent",
        target_type: "risk_assessment",
        target_id: null,
      },
    ],
  },

  // Complaint triggers
  {
    events: ["complaint_created"],
    generate: () => [
      {
        type: "oversight",
        title: "Complaint Oversight",
        description: "Complaint recorded. Management oversight and response required.",
        priority: "high",
        target_type: "management_oversight_drafts",
        target_id: null,
      },
    ],
  },

  // Key work / direct work completion
  {
    events: ["keywork_completed", "direct_work_completed"],
    generate: (ctx) => {
      const suggestions: WorkflowSuggestion[] = [];

      if (ctx.childId) {
        suggestions.push({
          type: "plan_update",
          title: "Consider Plan Updates",
          description: "Review whether this session's outcomes suggest any plan updates.",
          priority: "low",
          target_type: "plan_update_suggestions",
          target_id: null,
        });
      }

      return suggestions;
    },
  },

  // Supervision completion
  {
    events: ["supervision_completed"],
    generate: () => [
      {
        type: "training",
        title: "Review Training Needs",
        description: "Check if any training needs were identified during supervision.",
        priority: "low",
        target_type: "learning_resources",
        target_id: null,
      },
    ],
  },

  // Medication error
  {
    events: ["medication_error"],
    generate: () => [
      {
        type: "oversight",
        title: "Medication Oversight",
        description: "Medication error recorded. Immediate management oversight required.",
        priority: "urgent",
        target_type: "management_oversight_drafts",
        target_id: null,
      },
      {
        type: "training",
        title: "Medication Training Review",
        description: "Review medication training for involved staff.",
        priority: "high",
        target_type: "learning_resources",
        target_id: null,
      },
    ],
  },

  // Daily log creation
  {
    events: ["daily_log_created"],
    generate: (ctx) => {
      const suggestions: WorkflowSuggestion[] = [];

      // Only suggest oversight if content indicates concerns. Word-boundaried +
      // stem-aware so substrings don't false-trigger ("brisk", "harmonious",
      // "harmless", "pharmacy") while real stemmed forms still match
      // ("concerns", "concerned", "risky", "self-harm", "safeguarding").
      if (/\b(concern(s|ed|ing)?|worr(y|ied|ies|ying)|risk(s|y|ed|ing)?|harm(s|ed|ful)?|safeguard(s|ing|ed)?|distress(ed|ing)?)\b/i.test(ctx.content)) {
        suggestions.push({
          type: "oversight",
          title: "Daily Log Review",
          description: "Daily log contains potential concerns that may need management attention.",
          priority: "medium",
          target_type: "management_oversight_drafts",
          target_id: null,
        });
      }

      return suggestions;
    },
  },
];

// ── Process trigger event ───────────────────────────────────────────────────

export async function processWorkflowTrigger(
  event: WorkflowTriggerEvent,
  sourceTable: string,
  sourceId: string,
  childId: string | null,
  content: string,
  metadata: Record<string, unknown> = {},
  hId?: string,
): Promise<WorkflowTrigger | null> {
  const hid = hId ?? homeId();
  const sb = createServerClient();

  const context: TriggerContext = { event, sourceTable, sourceId, childId, content, metadata };

  // Find matching rules
  const suggestions: WorkflowSuggestion[] = [];
  for (const rule of TRIGGER_RULES) {
    if (rule.events.includes(event)) {
      suggestions.push(...rule.generate(context));
    }
  }

  if (suggestions.length === 0) return null;

  const trigger: Omit<WorkflowTrigger, "id" | "created_at"> = {
    home_id: hid,
    trigger_event: event,
    source_table: sourceTable,
    source_id: sourceId,
    child_id: childId,
    suggestions,
    status: "pending",
    actioned_by: null,
    actioned_at: null,
  };

  if (!sb) {
    return {
      id: crypto.randomUUID(),
      ...trigger,
      created_at: new Date().toISOString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_workflow_triggers") as any)
    .insert(trigger)
    .select("*")
    .single();

  if (error) {
    console.error("[practice-intelligence/workflow-trigger] Error:", error);
    return { id: crypto.randomUUID(), ...trigger, created_at: new Date().toISOString() };
  }

  return data as WorkflowTrigger;
}

// ── List pending triggers ───────────────────────────────────────────────────

export async function listPendingTriggers(hId?: string, limit: number = 20): Promise<WorkflowTrigger[]> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoTriggers(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_workflow_triggers") as any)
    .select("*")
    .eq("home_id", hid)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return getDemoTriggers(hid);
  return (data ?? []) as WorkflowTrigger[];
}

// ── List all triggers ───────────────────────────────────────────────────────

export async function listWorkflowTriggers(opts?: {
  status?: string;
  childId?: string;
  homeId?: string;
  limit?: number;
}): Promise<WorkflowTrigger[]> {
  const sb = createServerClient();
  const hid = opts?.homeId ?? homeId();

  if (!sb) return getDemoTriggers(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("practice_workflow_triggers") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 20);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.childId) query = query.eq("child_id", opts.childId);

  const { data, error } = await query;
  if (error) return getDemoTriggers(hid);
  return (data ?? []) as WorkflowTrigger[];
}

// ── Action trigger ──────────────────────────────────────────────────────────

export async function actionWorkflowTrigger(
  triggerId: string,
  actionedBy: string,
): Promise<WorkflowTrigger> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_workflow_triggers") as any)
    .update({
      status: "actioned",
      actioned_by: actionedBy,
      actioned_at: new Date().toISOString(),
    })
    .eq("id", triggerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to action trigger: ${error.message}`);
  return data as WorkflowTrigger;
}

// ── Dismiss trigger ─────────────────────────────────────────────────────────

export async function dismissWorkflowTrigger(
  triggerId: string,
  dismissedBy: string,
): Promise<WorkflowTrigger> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_workflow_triggers") as any)
    .update({
      status: "dismissed",
      actioned_by: dismissedBy,
      actioned_at: new Date().toISOString(),
    })
    .eq("id", triggerId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to dismiss trigger: ${error.message}`);
  return data as WorkflowTrigger;
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoTriggers(hid: string): WorkflowTrigger[] {
  return [
    {
      id: "demo-trigger-1", home_id: hid, trigger_event: "incident_created",
      source_table: "incidents", source_id: "inc-1", child_id: "child_2",
      suggestions: [
        { type: "oversight", title: "Incident Oversight Required", description: "This incident requires a management oversight comment.", priority: "high", target_type: "management_oversight_drafts", target_id: null },
        { type: "session", title: "Follow-up Key Work Session", description: "Check in with Amara following this incident.", priority: "medium", target_type: "generated_sessions", target_id: null },
      ],
      status: "pending", actioned_by: null, actioned_at: null,
      created_at: "2026-05-11T09:00:00Z",
    },
    {
      id: "demo-trigger-2", home_id: hid, trigger_event: "missing_episode_created",
      source_table: "incidents", source_id: "inc-5", child_id: "child_1",
      suggestions: [
        { type: "oversight", title: "Missing from Care Oversight", description: "Missing episode recorded. Management oversight required.", priority: "urgent", target_type: "management_oversight_drafts", target_id: null },
        { type: "session", title: "Return Home Interview", description: "Statutory return home conversation required.", priority: "urgent", target_type: "generated_sessions", target_id: null },
        { type: "risk_review", title: "Missing from Care Risk Review", description: "Review missing from care risk assessment.", priority: "high", target_type: "risk_assessment", target_id: null },
      ],
      status: "pending", actioned_by: null, actioned_at: null,
      created_at: "2026-05-10T22:00:00Z",
    },
    {
      id: "demo-trigger-3", home_id: hid, trigger_event: "keywork_completed",
      source_table: "keywork_sessions", source_id: "kw-3", child_id: "child_1",
      suggestions: [
        { type: "plan_update", title: "Consider Plan Updates", description: "Review whether this session's outcomes suggest any plan updates.", priority: "low", target_type: "plan_update_suggestions", target_id: null },
      ],
      status: "actioned", actioned_by: "user-rm-1", actioned_at: "2026-05-10T15:00:00Z",
      created_at: "2026-05-10T14:00:00Z",
    },
  ];
}
