// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIVE EVENT STREAM (projected ∪ persisted)
//
// The read side of the capture-once write spine. The canonical stream is the
// read-only projection of domain collections UNION any events captured directly
// to the persisted spine (store.cornerstoneEvents). De-duped by id (a persisted
// canonical event wins), newest-first, same EventStreamResult shape as
// buildEventStream — so a single captured event surfaces everywhere the spine is
// read, with no re-keying and no double-counting.
//
// Pure given the store snapshot; no side effects.
// ══════════════════════════════════════════════════════════════════════════════

import { projectEvents, summariseEvents } from "./event-projector";
import type { EventStreamResult } from "./event-projector";
import { mapStoreToEventInput } from "./store-mapper";
import type { CornerstoneEvent } from "@/types/cornerstone-event";

export function buildLiveEventStream(store: any): EventStreamResult {
  const projected = projectEvents(mapStoreToEventInput(store));
  const persisted: CornerstoneEvent[] = (store?.cornerstoneEvents ?? []) as CornerstoneEvent[];

  // Dedupe by id — a persisted (canonical) event wins over any projected one with the same id.
  const byId = new Map<string, CornerstoneEvent>();
  for (const e of projected) byId.set(e.id, e);
  for (const e of persisted) byId.set(e.id, e);

  const events = [...byId.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return { events, overview: summariseEvents(events) };
}
