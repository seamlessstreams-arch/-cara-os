// ══════════════════════════════════════════════════════════════════════════════
// RECORD PERSISTENCE (Enter Once → Supabase)
//
// Durable write-through / read-through for the universal orchestrator, used at
// the API route boundary. Fully gated by isSupabaseEnabled():
//   - Supabase NOT configured (default/demo) → every function is a safe no-op,
//     and the platform continues with the in-memory store. Zero behaviour change.
//   - Supabase configured → records + audit entries are persisted and survive
//     restarts; the audit feed reads from the database.
//
// Best-effort and defensive: a persistence failure never breaks record creation
// (the in-memory write has already succeeded by the time these are called).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// Loose-typed client — these tables aren't in the generated Database types.
// Matches the established pattern used across src/lib/services/*.
type SB = any; // eslint-disable-line @typescript-eslint/no-explicit-any
function sb(): SB | null {
  return createServerClient() as unknown as SB;
}

/** Persist a universal-orchestrator record to cs_records. No-op if Supabase is off. */
export async function persistRecord(record: Record<string, unknown>): Promise<{ persisted: boolean; error?: string }> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const s = sb();
  if (!s) return { persisted: false };

  try {
    const data = (record.data as Record<string, unknown>) ?? {};
    const tags = Array.isArray((record as Record<string, unknown>).tags)
      ? (record as Record<string, unknown>).tags
      : (Array.isArray(data.tags) ? data.tags : []);

    const { error } = await s.from("cs_records").upsert({
      id: record.id,
      reference: record.reference,
      record_type: record.record_type,
      home_id: record.home_id ?? "home_oak",
      child_id: record.child_id ?? null,
      staff_id: record.staff_id,
      title: record.title,
      description: record.description,
      severity: record.severity ?? null,
      status: record.status ?? "open",
      tags,
      data,
      created_by: record.created_by ?? record.staff_id ?? null,
      created_at: record.created_at ?? new Date().toISOString(),
      updated_at: record.updated_at ?? new Date().toISOString(),
    });
    if (error) return { persisted: false, error: error.message };
    return { persisted: true };
  } catch (err) {
    return { persisted: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Persist an orchestrator audit entry to cs_record_audit. No-op if Supabase is off. */
export async function persistAuditEntry(entry: Record<string, unknown>, source = "universal"): Promise<{ persisted: boolean; error?: string }> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const s = sb();
  if (!s) return { persisted: false };

  try {
    const { error } = await s.from("cs_record_audit").upsert({
      id: entry.id,
      event_type: entry.event_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      actor_id: entry.actor_id,
      summary: entry.summary,
      risk_level: entry.risk_level ?? "none",
      source,
      detail: (entry.detail as Record<string, unknown>) ?? {},
      created_at: entry.created_at ?? new Date().toISOString(),
    });
    if (error) return { persisted: false, error: error.message };
    return { persisted: true };
  } catch (err) {
    return { persisted: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Read persisted audit entries from Supabase. Returns null if Supabase is off. */
export async function fetchPersistedAudit(params?: { entityType?: string; actorId?: string; limit?: number }): Promise<Record<string, unknown>[] | null> {
  if (!isSupabaseEnabled()) return null;
  const s = sb();
  if (!s) return null;

  try {
    let q = s.from("cs_record_audit").select("*");
    if (params?.entityType) q = q.eq("entity_type", params.entityType);
    if (params?.actorId) q = q.eq("actor_id", params.actorId);
    q = q.order("created_at", { ascending: false }).limit(Math.min(params?.limit ?? 100, 500));
    const { data, error } = await q;
    if (error) return null;
    return (data ?? []) as Record<string, unknown>[];
  } catch {
    return null;
  }
}
