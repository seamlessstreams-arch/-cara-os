// ══════════════════════════════════════════════════════════════════════════════
// Child Daily Summary Auto-Build Engine  (Milestone 20)
//
// CLAUDE.md spec: "child daily summaries" must update live from verified
// care events. Idempotent on (home_id + child_id + summary_date).
//
// Aggregates current-version, non-draft/returned care events for a single
// (child, date) into the ChildDailySummary record. The store's `upsert`
// already guarantees one row per (home_id, child_id, summary_date), so
// re-running this engine is safe.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CareEvent,
  CareEventCategory,
  ChildDailySummary,
} from "@/types/care-events";

const EXCLUDED_STATUSES: ReadonlySet<CareEvent["status"]> = new Set([
  "draft",
  "returned",
]);

export interface RebuildOptions {
  /** Defaults to today (UTC). */
  summaryDate?: string;
}

export interface RebuildResult {
  rebuilt: number;
  skipped_no_events: number;
  summaries: ChildDailySummary[];
}

function eventsForChildOnDate(
  homeId: string,
  childId: string,
  summaryDate: string,
): CareEvent[] {
  return db.careEvents
    .findCurrent()
    .filter(
      (e) =>
        e.home_id === homeId &&
        e.child_id === childId &&
        e.event_date === summaryDate &&
        !EXCLUDED_STATUSES.has(e.status),
    );
}

function aggregate(events: CareEvent[]): {
  event_count: number;
  significant_count: number;
  avg_mood_score: number | null;
  categories: CareEventCategory[];
  requires_followup: boolean;
  summary_text: string;
} {
  const event_count = events.length;
  const significant_count = events.filter((e) => e.is_significant).length;

  const moods = events
    .map((e) => e.mood_score)
    .filter((m): m is number => typeof m === "number");
  const avg_mood_score =
    moods.length === 0
      ? null
      : Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10;

  const categories = Array.from(new Set(events.map((e) => e.category))).sort();

  const requires_followup = events.some(
    (e) =>
      e.is_safeguarding ||
      e.requires_reg40_triage ||
      e.requires_manager_review,
  );

  const lines: string[] = [];
  lines.push(
    `${event_count} care event${event_count === 1 ? "" : "s"} recorded` +
      (significant_count ? `, ${significant_count} significant` : "") +
      (avg_mood_score !== null ? `, average mood ${avg_mood_score}/5` : "") +
      ".",
  );
  if (categories.length > 0) {
    lines.push(`Categories: ${categories.join(", ")}.`);
  }
  if (requires_followup) {
    lines.push("Follow-up required: safeguarding/Reg 40/manager review flagged.");
  }
  const summary_text = lines.join(" ");

  return {
    event_count,
    significant_count,
    avg_mood_score,
    categories,
    requires_followup,
    summary_text,
  };
}

/**
 * Rebuild a single (child, date) summary. Idempotent: returns the upserted
 * row, or null when no qualifying events exist (no record is created).
 */
export function rebuildChildDailySummary(
  homeId: string,
  childId: string,
  summaryDate: string,
): ChildDailySummary | null {
  const events = eventsForChildOnDate(homeId, childId, summaryDate);
  if (events.length === 0) return null;
  const agg = aggregate(events);
  return db.childDailySummaries.upsert({
    home_id: homeId,
    child_id: childId,
    summary_date: summaryDate,
    event_count: agg.event_count,
    significant_count: agg.significant_count,
    avg_mood_score: agg.avg_mood_score,
    categories: agg.categories,
    summary_text: agg.summary_text,
    requires_followup: agg.requires_followup,
  });
}

/**
 * Rebuild every (child, date) pair touched by current-version care events
 * in this home. If summaryDate is provided, restricted to that date.
 */
export function rebuildChildDailySummariesForHome(
  homeId: string,
  options: RebuildOptions = {},
): RebuildResult {
  const { summaryDate } = options;
  const events = db.careEvents
    .findCurrent()
    .filter(
      (e) =>
        e.home_id === homeId &&
        e.child_id !== null &&
        !EXCLUDED_STATUSES.has(e.status) &&
        (summaryDate ? e.event_date === summaryDate : true),
    );

  const pairs = new Set<string>();
  for (const e of events) {
    pairs.add(`${e.child_id}::${e.event_date}`);
  }

  const summaries: ChildDailySummary[] = [];
  let skipped = 0;
  for (const pair of pairs) {
    const [childId, date] = pair.split("::");
    if (!childId || !date) continue;
    const out = rebuildChildDailySummary(homeId, childId, date);
    if (out) summaries.push(out);
    else skipped += 1;
  }

  return {
    rebuilt: summaries.length,
    skipped_no_events: skipped,
    summaries,
  };
}
