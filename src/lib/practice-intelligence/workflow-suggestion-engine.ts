// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE FOLLOW-UPS — deterministic, store-backed
//
// The workflow-trigger rules (incident → oversight/debrief/session, missing →
// return-home interview, restraint → debrief, safeguarding → referral, etc.)
// were only reachable through a Supabase write-path that nothing called and no UI
// consumed — so the suggested follow-ups never existed in the demo. This engine
// runs the SAME rules over the home's EXISTING records (the in-memory store) so
// the follow-ups exist and are actionable, each deep-linking into Cara Studio to
// draft it (grounded in the child's records). PURE (injected `now`), no LLM/DB.
// ─────────────────────────────────────────────────────────────────────────────

import { TRIGGER_RULES } from "./workflow-trigger.service";
import type { WorkflowSuggestion, WorkflowTriggerEvent } from "@/types/practice-intelligence";

export interface PracticeFollowUp {
  id: string;
  // the suggestion
  type: WorkflowSuggestion["type"];
  title: string;
  description: string;
  priority: WorkflowSuggestion["priority"];
  target_type: string;
  // the source record it followed from
  source_event: WorkflowTriggerEvent;
  source_table: string;
  source_id: string;
  child_id: string | null;
  child_name: string | null;
  source_label: string;
  source_date: string;
  // action: deep-link into Cara Studio (null when Studio can't draft this type)
  studio_link: string | null;
}

// target_type → the Cara Studio artifact type that can draft it. Absent = no draft.
const TARGET_TO_STUDIO: Record<string, string> = {
  management_oversight_drafts: "management_oversight",
  generated_sessions: "keywork_session",
  risk_assessment: "risk_review",
  plan_update_suggestions: "care_plan_update",
  learning_resources: "staff_training",
};

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export interface FollowUpSourceRecord {
  event: WorkflowTriggerEvent;
  source_table: string;
  source_id: string;
  child_id: string | null;
  content: string;
  label: string;
  date: string;
}

export interface FollowUpInput {
  now: string;
  windowDays?: number;
  children: { id: string; name: string }[];
  records: FollowUpSourceRecord[];
}

function studioLink(targetType: string, childId: string | null, context: string): string | null {
  const t = TARGET_TO_STUDIO[targetType];
  if (!t) return null;
  const params = new URLSearchParams({ type: t });
  if (childId) params.set("childId", childId);
  if (context) params.set("context", context.slice(0, 200));
  return `/cara-studio?${params.toString()}`;
}

export function buildPracticeFollowUps(input: FollowUpInput): PracticeFollowUp[] {
  const windowDays = input.windowDays ?? 30;
  const nowMs = Date.parse(input.now);
  const nameOf = (id: string | null) =>
    id ? input.children.find((c) => c.id === id)?.name ?? null : null;

  const out: PracticeFollowUp[] = [];
  for (const rec of input.records) {
    // Recent only — bounded [0, windowDays] so future-dated records don't slip in.
    const recMs = Date.parse(rec.date);
    if (!Number.isNaN(recMs) && !Number.isNaN(nowMs)) {
      const days = (nowMs - recMs) / 86_400_000;
      if (days < 0 || days > windowDays) continue;
    }
    const rule = TRIGGER_RULES.find((r) => r.events.includes(rec.event));
    if (!rule) continue;
    const suggestions = rule.generate({
      event: rec.event,
      sourceTable: rec.source_table,
      sourceId: rec.source_id,
      childId: rec.child_id,
      content: rec.content,
      metadata: {},
    });
    for (const s of suggestions) {
      out.push({
        id: `fu_${rec.source_id}_${s.type}_${s.target_type}`,
        type: s.type,
        title: s.title,
        description: s.description,
        priority: s.priority,
        target_type: s.target_type,
        source_event: rec.event,
        source_table: rec.source_table,
        source_id: rec.source_id,
        child_id: rec.child_id,
        child_name: nameOf(rec.child_id),
        source_label: rec.label,
        source_date: rec.date,
        studio_link: studioLink(s.target_type, rec.child_id, `${s.title} — ${rec.label}`),
      });
    }
  }
  out.sort(
    (a, b) =>
      (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
      b.source_date.localeCompare(a.source_date),
  );
  return out;
}
