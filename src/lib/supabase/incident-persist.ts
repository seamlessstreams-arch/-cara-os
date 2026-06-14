// ══════════════════════════════════════════════════════════════════════════════
// CARA — Incident Mode & reflective-supervision write-through helpers
//
// Same contract as care-records/cara-persist: best-effort, never throws,
// no-op while Supabase is off. The migration-409/408 tables were authored to
// MIRROR the in-memory shapes with TEXT application ids, so records insert as
// near-direct spreads and session updates address the same row.
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { from(table: string): any };
function client(): RawClient | null {
  if (!isSupabaseEnabled()) return null;
  const c = createServerClient();
  return c ? (c as unknown as RawClient) : null;
}

async function insert(table: string, row: Record<string, unknown>): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    await c.from(table).insert(row);
  } catch {
    // best-effort — the in-memory write already succeeded
  }
}

export async function persistIncidentSession(s: Record<string, unknown>): Promise<void> {
  await insert("incident_sessions", { home_id: "home_oak", ...s });
}

/** Sessions mutate in place (end, workflow toggles, record_created) — update by text id. */
export async function persistIncidentSessionUpdate(s: { id: string } & Record<string, unknown>): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    const { id, ...rest } = s;
    await c.from("incident_sessions").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
  } catch {
    // best-effort
  }
}

export async function persistTimelineEntry(e: Record<string, unknown>): Promise<void> {
  await insert("incident_timeline_entries", { home_id: "home_oak", ...e });
}

export async function persistRecordingReview(r: Record<string, unknown>): Promise<void> {
  await insert("cara_recording_reviews", { home_id: "home_oak", ...r });
}

export async function persistRestorativeConversation(r: Record<string, unknown>): Promise<void> {
  await insert("restorative_conversations", { home_id: "home_oak", ...r });
}

export async function persistPostIncidentReflection(r: Record<string, unknown>): Promise<void> {
  await insert("post_incident_reflections", { home_id: "home_oak", ...r });
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
    home_id: "home_oak",
    child_id: a.child_id ?? null,
    user_id: a.user_id,
    action_type: a.action_type,
    entity_type: "cara_incident_sessions",
    entity_id: a.source_id ?? null,
    metadata: { note: a.note ?? null, approval_status: a.approval_status ?? null },
  });
}

export async function persistReflectiveSupervision(r: Record<string, unknown>): Promise<void> {
  await insert("reflective_supervisions", { home_id: "home_oak", ...r });
}
