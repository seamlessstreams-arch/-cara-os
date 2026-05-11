// ══════════════════════════════════════════════════════════════════════════════
// Care Event Pattern Detection  (Milestone 17)
//
// Cross-event analysis over verified care events for one home. Surfaces
// patterns a manager might miss when reviewing entries one at a time.
// All outputs are advisory: ARIA detected — requires manager review.
//
// Patterns:
//   - frequency_cluster   ≥N events of same category for one child
//   - safeguarding_spike  home-level safeguarding count ≥N in lookback
//   - behaviour_escalation  child has rising significance/safeguarding flags
//   - time_of_day_cluster ≥N events for a child within a time band
//   - cross_child_theme   same category appears for ≥N different children
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CareEvent, CareEventCategory } from "@/types/care-events";

export type CareEventPatternType =
  | "frequency_cluster"
  | "safeguarding_spike"
  | "behaviour_escalation"
  | "time_of_day_cluster"
  | "cross_child_theme";

export type CareEventPatternSeverity = "low" | "medium" | "high";

export interface CareEventPattern {
  id: string;
  home_id: string;
  type: CareEventPatternType;
  severity: CareEventPatternSeverity;
  title: string;
  description: string;
  child_id: string | null;
  category: CareEventCategory | null;
  event_ids: string[];
  reflective_prompt: string;
  period_start: string;
  period_end: string;
  generated_at: string;
}

export interface PatternScanOptions {
  lookbackDays?: number;
  minClusterSize?: number;
  timeBandHours?: number;
}

const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_MIN_CLUSTER = 3;
const DEFAULT_TIME_BAND_HOURS = 2;

function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function uid(prefix: string): string {
  return `cep_${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

function inWindow(eventDate: string, start: string, end: string): boolean {
  const d = eventDate.slice(0, 10);
  return d >= start && d <= end;
}

function parseHour(time: string | null): number | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2}):/);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  if (Number.isNaN(h) || h < 0 || h > 23) return null;
  return h;
}

const SAFEGUARDING_CATEGORIES: CareEventCategory[] = [
  "safeguarding", "missing_episode", "physical_intervention", "restraint",
];

const ESCALATING_CATEGORIES: CareEventCategory[] = [
  "behaviour", "safeguarding", "physical_intervention", "restraint",
];

function severityFromCount(count: number): CareEventPatternSeverity {
  if (count >= 6) return "high";
  if (count >= 4) return "medium";
  return "low";
}

// ── Main scan ────────────────────────────────────────────────────────────────

export function scanCareEventPatterns(
  homeId: string,
  options: PatternScanOptions = {},
): CareEventPattern[] {
  const lookback = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const minCluster = options.minClusterSize ?? DEFAULT_MIN_CLUSTER;
  const timeBand = options.timeBandHours ?? DEFAULT_TIME_BAND_HOURS;
  const periodStart = daysAgo(lookback);
  const periodEnd = isoDate(new Date());
  const generatedAt = new Date().toISOString();

  const events = db.careEvents.findCurrent().filter((e) =>
    e.home_id === homeId &&
    inWindow(e.event_date, periodStart, periodEnd) &&
    e.status !== "draft" &&
    e.status !== "returned",
  );

  const patterns: CareEventPattern[] = [];
  const meta = { home_id: homeId, period_start: periodStart, period_end: periodEnd, generated_at: generatedAt };

  // 1. frequency_cluster — per (child_id, category)
  const byChildCat = new Map<string, CareEvent[]>();
  for (const e of events) {
    if (!e.child_id) continue;
    const k = `${e.child_id}::${e.category}`;
    if (!byChildCat.has(k)) byChildCat.set(k, []);
    byChildCat.get(k)!.push(e);
  }
  for (const [key, group] of byChildCat) {
    if (group.length < minCluster) continue;
    const [childId, category] = key.split("::") as [string, CareEventCategory];
    patterns.push({
      id: uid("freq"),
      ...meta,
      type: "frequency_cluster",
      severity: severityFromCount(group.length),
      title: `${group.length} ${category.replace(/_/g, " ")} entries for one child in ${lookback} days`,
      description: `Child ${childId} has ${group.length} ${category} care events in the last ${lookback} days. Review whether risk assessment, behaviour plan or care plan needs updating.`,
      child_id: childId,
      category,
      event_ids: group.map((e) => e.id),
      reflective_prompt: `Is the current plan for this child responding to the ${category.replace(/_/g, " ")} pattern?`,
    });
  }

  // 2. safeguarding_spike — home-level safeguarding count
  const safeguardingEvents = events.filter((e) =>
    SAFEGUARDING_CATEGORIES.includes(e.category) || e.is_safeguarding,
  );
  if (safeguardingEvents.length >= minCluster) {
    patterns.push({
      id: uid("sgspike"),
      ...meta,
      type: "safeguarding_spike",
      severity: severityFromCount(safeguardingEvents.length),
      title: `${safeguardingEvents.length} safeguarding-flagged events in ${lookback} days`,
      description: `The home has logged ${safeguardingEvents.length} safeguarding-related care events in the last ${lookback} days across one or more children. Consider whether contextual safeguarding review is required.`,
      child_id: null,
      category: null,
      event_ids: safeguardingEvents.map((e) => e.id),
      reflective_prompt: "Is there a contextual safeguarding theme across the home that needs escalation?",
    });
  }

  // 3. behaviour_escalation — per child, escalating significance flags
  const byChild = new Map<string, CareEvent[]>();
  for (const e of events) {
    if (!e.child_id) continue;
    if (!ESCALATING_CATEGORIES.includes(e.category)) continue;
    if (!byChild.has(e.child_id)) byChild.set(e.child_id, []);
    byChild.get(e.child_id)!.push(e);
  }
  for (const [childId, group] of byChild) {
    if (group.length < minCluster) continue;
    const sorted = [...group].sort((a, b) => a.event_date.localeCompare(b.event_date));
    const half = Math.floor(sorted.length / 2);
    const earlier = sorted.slice(0, half);
    const later = sorted.slice(half);
    const earlierFlags = earlier.filter((e) => e.is_significant || e.is_safeguarding || e.requires_reg40_triage).length;
    const laterFlags = later.filter((e) => e.is_significant || e.is_safeguarding || e.requires_reg40_triage).length;
    if (laterFlags > earlierFlags && laterFlags >= 2) {
      patterns.push({
        id: uid("esc"),
        ...meta,
        type: "behaviour_escalation",
        severity: laterFlags >= 4 ? "high" : "medium",
        title: `Escalating significance for one child (${earlierFlags} → ${laterFlags} flagged)`,
        description: `Child ${childId} has ${sorted.length} behaviour/safeguarding events in the lookback window with rising flag count. Earlier half: ${earlierFlags}; later half: ${laterFlags}.`,
        child_id: childId,
        category: null,
        event_ids: sorted.map((e) => e.id),
        reflective_prompt: "Has the behaviour support plan kept pace with this escalation?",
      });
    }
  }

  // 4. time_of_day_cluster — per child, events clustered within a time band
  const byChildOnly = new Map<string, CareEvent[]>();
  for (const e of events) {
    if (!e.child_id || !e.event_time) continue;
    if (!byChildOnly.has(e.child_id)) byChildOnly.set(e.child_id, []);
    byChildOnly.get(e.child_id)!.push(e);
  }
  for (const [childId, group] of byChildOnly) {
    const buckets = new Map<number, CareEvent[]>();
    for (const e of group) {
      const h = parseHour(e.event_time);
      if (h === null) continue;
      const bucket = Math.floor(h / timeBand);
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(e);
    }
    for (const [bucket, bgroup] of buckets) {
      if (bgroup.length < minCluster) continue;
      const startHour = bucket * timeBand;
      const endHour = Math.min(startHour + timeBand, 24);
      patterns.push({
        id: uid("tod"),
        ...meta,
        type: "time_of_day_cluster",
        severity: severityFromCount(bgroup.length),
        title: `${bgroup.length} events between ${String(startHour).padStart(2, "0")}:00–${String(endHour).padStart(2, "0")}:00 for one child`,
        description: `Child ${childId} has ${bgroup.length} care events in a recurring ${startHour}:00–${endHour}:00 window over the last ${lookback} days. Consider routine, staffing, environment or trigger review.`,
        child_id: childId,
        category: null,
        event_ids: bgroup.map((e) => e.id),
        reflective_prompt: `What is happening in this child's day around ${startHour}:00 that may be contributing?`,
      });
    }
  }

  // 5. cross_child_theme — same category for ≥N distinct children
  const byCategory = new Map<CareEventCategory, Set<string>>();
  const byCategoryEvents = new Map<CareEventCategory, CareEvent[]>();
  for (const e of events) {
    if (!e.child_id) continue;
    if (!byCategory.has(e.category)) byCategory.set(e.category, new Set());
    if (!byCategoryEvents.has(e.category)) byCategoryEvents.set(e.category, []);
    byCategory.get(e.category)!.add(e.child_id);
    byCategoryEvents.get(e.category)!.push(e);
  }
  for (const [cat, kids] of byCategory) {
    if (kids.size < minCluster) continue;
    if (cat === "general" || cat === "wellbeing" || cat === "activity") continue;
    const evs = byCategoryEvents.get(cat) ?? [];
    patterns.push({
      id: uid("cross"),
      ...meta,
      type: "cross_child_theme",
      severity: kids.size >= 5 ? "high" : "medium",
      title: `${kids.size} children affected by ${cat.replace(/_/g, " ")} in ${lookback} days`,
      description: `${kids.size} different children have logged ${cat} care events in the last ${lookback} days (${evs.length} events total). Consider whether this is a home-wide theme.`,
      child_id: null,
      category: cat,
      event_ids: evs.map((e) => e.id),
      reflective_prompt: `Is there a home dynamic, environment or staffing factor driving the ${cat.replace(/_/g, " ")} theme?`,
    });
  }

  // Highest-severity first; then by event count
  patterns.sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 } as const;
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    return b.event_ids.length - a.event_ids.length;
  });

  return patterns;
}

export interface CareEventPatternSummary {
  home_id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  total_patterns: number;
  by_severity: Record<CareEventPatternSeverity, number>;
  by_type: Record<CareEventPatternType, number>;
  patterns: CareEventPattern[];
}

export function loadCareEventPatterns(
  homeId: string,
  options: PatternScanOptions = {},
): CareEventPatternSummary {
  const patterns = scanCareEventPatterns(homeId, options);
  const lookback = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const by_severity: Record<CareEventPatternSeverity, number> = { low: 0, medium: 0, high: 0 };
  const by_type: Record<CareEventPatternType, number> = {
    frequency_cluster: 0, safeguarding_spike: 0, behaviour_escalation: 0,
    time_of_day_cluster: 0, cross_child_theme: 0,
  };
  for (const p of patterns) {
    by_severity[p.severity] += 1;
    by_type[p.type] += 1;
  }
  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    period_start: daysAgo(lookback),
    period_end: isoDate(new Date()),
    total_patterns: patterns.length,
    by_severity,
    by_type,
    patterns,
  };
}
