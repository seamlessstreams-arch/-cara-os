// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Core care-record write-through helpers
//
// Best-effort persistence for core care records that are created by SYNC services
// (linked-updates, the care-events processor, orchestrators) which write the
// in-memory store directly and so bypass the async `dal`. After the in-memory
// write, the service fires `void persist<X>(record)` — a no-op when Supabase is
// off, never throwing, so the caller is never blocked or broken. Reads come back
// through the `dal` (real table when on), so the data is there on the next request.
//
// The in-memory id is dropped so Supabase generates its own — reads return the
// Supabase rows, so ids stay internally consistent.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { isSupabaseEnabled, createServerClient } from "./server";
import * as sq from "./queries";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Best-effort write-through of a daily-log entry created by a sync service. */
export async function persistDailyLog(entry: Record<string, unknown>): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: _id, ...rest } = entry as any;
    await sq.createDailyLogEntry(c, { ...rest, home_id: homeId() });
  } catch {
    // best-effort — the in-memory write already succeeded; never block the caller
  }
}

/** Best-effort write-through of an incident created by a sync service / orchestrator. */
export async function persistIncident(incident: Record<string, unknown>): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: _id, ...rest } = incident as any;
    await sq.createIncident(c, { ...rest, home_id: homeId() });
  } catch {
    // best-effort — the in-memory write already succeeded; never block the caller
  }
}

/**
 * Create an incident in the in-memory store AND best-effort persist it to Supabase.
 * Used by the sync services / orchestrators that create incidents directly (and so
 * bypass the async dal), so those incidents reach the real table when Supabase is on.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createIncidentRecord(data: any) {
  const incident = db.incidents.create(data);
  void persistIncident(incident as unknown as Record<string, unknown>);
  return incident;
}

/** Best-effort write-through of a task created by a sync service / orchestrator. */
export async function persistTask(task: Record<string, unknown>): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: _id, ...rest } = task as any;
    await sq.createTask(c, { ...rest, home_id: homeId() });
  } catch {
    // best-effort — the in-memory write already succeeded; never block the caller
  }
}

/**
 * Create a task in the in-memory store AND best-effort persist it to Supabase. Used by
 * the many sync services / orchestrators / routes that create tasks directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTaskRecord(data: any) {
  const task = db.tasks.create(data);
  void persistTask(task as unknown as Record<string, unknown>);
  return task;
}
