// ══════════════════════════════════════════════════════════════════════════════
// CARA — Incident Mode & reflective-supervision write-through helpers
//
// Same contract as care-records/cara-persist: best-effort, never throws,
// no-op while Supabase is off. Tables are created by
// 20260922120000_persist_incident_mode.sql and MIRROR the in-memory shapes with
// TEXT application ids, so records insert as near-direct spreads and session
// updates address the same row.
//
// ── Why this file is commented at all ───────────────────────────────────────
//
// Six of the seven tables it writes did not exist. The old header named a
// "migration-409/408" that is not in this repo and never was. The failure was
// invisible for two reasons, and both are fixed here:
//
//   1. supabase-js does not THROW on a missing table or a bad column — it
//      resolves with the error in `error`. The old body was
//      `try { await c.from(t).insert(row) } catch {}`, which never read it.
//      So the catch could not fire and there was nothing to fire it.
//   2. Callers invoke these as `void persistIncidentSession(...)` — no await,
//      no handler — so even a rejection would have gone nowhere.
//
// insert() now reads `error` and reports it. It still does not throw: the
// callers are fire-and-forget and a rejection would surface as an unhandled
// one, which is worse than a log. Best-effort means the in-memory write stands
// if the durable one fails — it does not mean nobody is told.
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";
import { tenantHomeId } from "./tenant";

import type { RawClient } from "@/lib/supabase/loose-client";
function client(): RawClient | null {
  if (!isSupabaseEnabled()) return null;
  const c = createServerClient();
  return c ? (c as unknown as RawClient) : null;
}

async function insert(table: string, row: Record<string, unknown>): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    const { error } = await c.from(table).insert(row);
    if (error) {
      // The in-memory write already succeeded, so the request is not failed —
      // but a durable safeguarding record was NOT written, and that has to be
      // visible in the logs rather than discovered months later.
      console.error(`[incident-persist] ${table} insert failed — record held in memory only:`, error.message ?? error);
    }
  } catch (err) {
    console.error(`[incident-persist] ${table} insert threw — record held in memory only:`, err);
  }
}

export async function persistIncidentSession(s: Record<string, unknown>): Promise<void> {
  await insert("incident_sessions", { ...s, home_id: tenantHomeId() });
}

/** Sessions mutate in place (end, workflow toggles, record_created) — update by text id.
 *
 *  home_id is never patched: the tenant a session belongs to is decided when it
 *  is created and an update must not be able to walk it to another home. */
export async function persistIncidentSessionUpdate(s: { id: string } & Record<string, unknown>): Promise<void> {
  const c = client();
  if (!c) return;
  const { id, home_id: _ignored, ...rest } = s;
  void _ignored;
  try {
    const { error } = await c.from("incident_sessions")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      // An un-persisted update is how a session stays "active" forever, or how
      // an ended incident never records that it ended.
      console.error(`[incident-persist] incident_sessions update failed for ${id} — change held in memory only:`, error.message ?? error);
    }
  } catch (err) {
    console.error(`[incident-persist] incident_sessions update threw for ${id} — change held in memory only:`, err);
  }
}

export async function persistTimelineEntry(e: Record<string, unknown>): Promise<void> {
  await insert("incident_timeline_entries", { ...e, home_id: tenantHomeId() });
}

export async function persistRecordingReview(r: Record<string, unknown>): Promise<void> {
  await insert("cara_recording_reviews", { ...r, home_id: tenantHomeId() });
}

export async function persistRestorativeConversation(r: Record<string, unknown>): Promise<void> {
  await insert("restorative_conversations", { ...r, home_id: tenantHomeId() });
}

export async function persistPostIncidentReflection(r: Record<string, unknown>): Promise<void> {
  await insert("post_incident_reflections", { ...r, home_id: tenantHomeId() });
}

export async function persistIncidentAudit(a: {
  action_type: string;
  user_id: string;
  child_id?: string;
  source_id?: string;
  note?: string;
  approval_status?: string;
}): Promise<void> {
  await insert("cara_audit_logs", {
    id: `aal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    home_id: tenantHomeId(),
    child_id: a.child_id ?? null,
    user_id: a.user_id,
    action_type: a.action_type,
    entity_type: "cara_incident_sessions",
    entity_id: a.source_id ?? null,
    metadata: { note: a.note ?? null, approval_status: a.approval_status ?? null },
  });
}

export async function persistReflectiveSupervision(r: Record<string, unknown>): Promise<void> {
  await insert("reflective_supervisions", { ...r, home_id: tenantHomeId() });
}
