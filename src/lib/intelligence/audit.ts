// ══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE LAYER — AUDIT LOG
//
// Writes to the intelligence_audit_log table. Safe to call when Supabase
// is not configured (no-ops silently).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";

export type IntelligenceAuditAction =
  | "record_created"
  | "record_updated"
  | "record_deleted"
  | "record_archived"
  | "cara_draft_generated"
  | "cara_draft_approved"
  | "management_oversight_added"
  | "ri_oversight_added"
  | "evidence_linked"
  | "evidence_pack_generated"
  | "reg44_action_completed"
  | "reg45_report_approved"
  | "learning_review_completed"
  | "staff_restriction_added"
  | "staff_restriction_removed"
  | "smart_link_created"
  | "smart_link_approved"
  | "competence_updated"
  | "attention_item_reviewed"
  | "attention_item_escalated"
  | "voice_entry_created"
  | "progress_entry_created"
  | "goal_created"
  | "goal_achieved"
  | "outcome_snapshot_created"
  | "provider_summary_generated"
  | "exported";

export interface IntelligenceAuditEntry {
  homeId?: string;
  entityType: string;
  entityId?: string;
  action: IntelligenceAuditAction;
  actorUserId?: string;
  actorRole?: string;
  detail?: Record<string, unknown>;
}

export async function writeIntelligenceAudit(
  entry: IntelligenceAuditEntry,
): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) return;

  try {
    const { error } = await (supabase as unknown as LooseSupabase)
      .from("intelligence_audit_log")
      .insert({
        home_id: entry.homeId ?? null,
        entity_type: entry.entityType,
        entity_id: entry.entityId ?? null,
        action: entry.action,
        actor_user_id: entry.actorUserId ?? null,
        actor_role: entry.actorRole ?? null,
        detail: entry.detail ?? {},
      });
    // supabase-js resolves (does not throw) on a missing table or bad column,
    // so without reading `error` a failed write is silently lost — exactly how
    // the absent intelligence_audit_log table went unnoticed on live. Never
    // fail silently; but never log record detail (PII) either — surface the
    // action label + error code only.
    if (error) {
      console.error(
        `[intelligence-audit] write failed for "${entry.action}" (${error.code ?? "unknown"}): audit entry not recorded`,
      );
    }
  } catch (e) {
    console.error(
      `[intelligence-audit] write threw for "${entry.action}": ${e instanceof Error ? e.message : "unknown error"}`,
    );
  }
}
