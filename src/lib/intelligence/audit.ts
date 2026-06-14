// ══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE LAYER — AUDIT LOG
//
// Writes to the intelligence_audit_log table. Safe to call when Supabase
// is not configured (no-ops silently).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;

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
    await (supabase as unknown as LooseSupabase)
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
  } catch {
    console.error("[intelligence-audit] Failed to write audit entry:", entry);
  }
}
