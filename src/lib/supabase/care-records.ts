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
