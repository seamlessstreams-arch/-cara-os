// ══════════════════════════════════════════════════════════════════════════════
// CARA — METRICS STORE
//
// This module re-exports all metrics-related operations from the main store:
//   - Saved Time Metrics (time saved tracking per care event route)
//
// During the gradual store split (Phase 2), metrics-specific code should
// import from this module while the actual collections remain in store.ts.
// This maintains backward compatibility and enables clean separation later.
//
// Usage:
//   import { metricsStore } from "@/lib/db/metrics-store"
//   const metrics = metricsStore.savedTimeMetrics.findAll()
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "./store";
import type { SavedTimeMetric } from "@/types/care-events";

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTED METRICS STORE — Lazy-coupled to main store
// ─────────────────────────────────────────────────────────────────────────────

export const metricsStore = {
  // Saved Time Metrics — automated time savings per care event route
  // Tracks which automation routes save how much time per event
  // (findAll, findByHome, findByStaff, findByCareEvent, totalMinutesSaved, upsert)
  savedTimeMetrics: db.savedTimeMetrics,
};

// Re-export type for convenience
export type { SavedTimeMetric };
