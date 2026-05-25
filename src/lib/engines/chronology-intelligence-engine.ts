// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses children's chronologies for event patterns, frequency, gaps,
// regulatory event completeness, and narrative quality indicators.
//
// Regulatory: Reg 36 (Case records), Reg 12 (Assessment of children),
// SCCIF: "Does the home maintain a comprehensive, factual chronology?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type EventCategory =
  | "placement"
  | "education"
  | "health"
  | "behaviour"
  | "safeguarding"
  | "missing"
  | "review"
  | "contact"
  | "legal"
  | "achievement"
  | "other";

export type EventSignificance = "critical" | "significant" | "routine";

export interface ChildInput {
  id: string;
  name: string;
  placement_start_date: string;
}

export interface ChronologyEventInput {
  id: string;
  child_id: string;
  date: string;
  category: EventCategory;
  title: string;
  significance: EventSignificance;
  has_linked_incident: boolean;
}

export interface ChronologyIntelligenceInput {
  children: ChildInput[];
  events: ChronologyEventInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface ChronologyOverview {
  total_events: number;
  events_30d: number;
  events_90d: number;
  critical_events_total: number;
  significant_events_total: number;
  children_with_chronology: number;
  avg_events_per_child: number;
  category_coverage: number; // number of distinct categories used
  recording_frequency_30d: number; // events per child per 30 days
}

export interface ChildChronologyProfile {
  child_id: string;
  child_name: string;
  total_events: number;
  events_30d: number;
  critical_count: number;
  significant_count: number;
  categories_covered: string[];
  days_since_last_entry: number;
  placement_duration_days: number;
  recording_rate: number; // events per 30d
  has_gap: boolean; // > 14 days since last entry
}

export interface CategoryBreakdown {
  category: EventCategory;
  count: number;
  critical: number;
  significant: number;
  routine: number;
  pct_of_total: number;
}

export interface TimelinePattern {
  period: string; // e.g., "2026-05", "2026-04"
  count: number;
  critical: number;
}

export interface ChronologyAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaChronologyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChronologyIntelligenceResult {
  overview: ChronologyOverview;
  child_profiles: ChildChronologyProfile[];
  category_breakdown: CategoryBreakdown[];
  timeline: TimelinePattern[];
  alerts: ChronologyAlert[];
  insights: AriaChronologyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function dateToMonth(date: string): string {
  return date.slice(0, 7); // "2026-05"
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChronologyIntelligence(
  input: ChronologyIntelligenceInput,
): ChronologyIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, events } = input;

  const thirtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  // ── Events by child ────────────────────────────────────────────────────
  const eventsByChild = new Map<string, ChronologyEventInput[]>();
  for (const e of events) {
    const arr = eventsByChild.get(e.child_id) ?? [];
    arr.push(e);
    eventsByChild.set(e.child_id, arr);
  }

  // ── Overview ──────────────────────────────────────────────────────────
  const events30d = events.filter((e) => e.date >= thirtyDaysAgo && e.date <= today);
  const events90d = events.filter((e) => e.date >= ninetyDaysAgo && e.date <= today);
  const criticalEvents = events.filter((e) => e.significance === "critical");
  const significantEvents = events.filter((e) => e.significance === "significant");

  const childrenWithChronology = children.filter((c) => (eventsByChild.get(c.id) ?? []).length > 0).length;
  const allCategories = new Set(events.map((e) => e.category));

  const avgEventsPerChild = children.length > 0
    ? Math.round((events.length / children.length) * 10) / 10
    : 0;

  const recordingFrequency30d = children.length > 0
    ? Math.round((events30d.length / children.length) * 10) / 10
    : 0;

  const overview: ChronologyOverview = {
    total_events: events.length,
    events_30d: events30d.length,
    events_90d: events90d.length,
    critical_events_total: criticalEvents.length,
    significant_events_total: significantEvents.length,
    children_with_chronology: childrenWithChronology,
    avg_events_per_child: avgEventsPerChild,
    category_coverage: allCategories.size,
    recording_frequency_30d: recordingFrequency30d,
  };

  // ── Child Profiles ────────────────────────────────────────────────────
  const child_profiles: ChildChronologyProfile[] = children.map((child) => {
    const childEvents = eventsByChild.get(child.id) ?? [];
    const childEvents30d = childEvents.filter((e) => e.date >= thirtyDaysAgo && e.date <= today);
    const critical = childEvents.filter((e) => e.significance === "critical").length;
    const significant = childEvents.filter((e) => e.significance === "significant").length;
    const categories = [...new Set(childEvents.map((e) => e.category))];

    // Days since last entry
    const sortedEvents = [...childEvents].sort((a, b) => b.date.localeCompare(a.date));
    const lastEntry = sortedEvents[0]?.date ?? child.placement_start_date;
    const daysSinceLast = daysBetween(lastEntry, today);

    const placementDays = daysBetween(child.placement_start_date, today);

    // Recording rate: events per 30 days (over placement duration)
    const placementMonths = Math.max(1, placementDays / 30);
    const recordingRate = Math.round((childEvents.length / placementMonths) * 10) / 10;

    return {
      child_id: child.id,
      child_name: child.name,
      total_events: childEvents.length,
      events_30d: childEvents30d.length,
      critical_count: critical,
      significant_count: significant,
      categories_covered: categories,
      days_since_last_entry: daysSinceLast,
      placement_duration_days: placementDays,
      recording_rate: recordingRate,
      has_gap: daysSinceLast > 14,
    };
  });

  // ── Category Breakdown ────────────────────────────────────────────────
  const catMap = new Map<EventCategory, ChronologyEventInput[]>();
  for (const e of events) {
    const arr = catMap.get(e.category) ?? [];
    arr.push(e);
    catMap.set(e.category, arr);
  }

  const category_breakdown: CategoryBreakdown[] = [...catMap.entries()]
    .map(([category, items]) => ({
      category,
      count: items.length,
      critical: items.filter((e) => e.significance === "critical").length,
      significant: items.filter((e) => e.significance === "significant").length,
      routine: items.filter((e) => e.significance === "routine").length,
      pct_of_total: events.length > 0 ? Math.round((items.length / events.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Timeline ──────────────────────────────────────────────────────────
  const monthMap = new Map<string, { count: number; critical: number }>();
  for (const e of events) {
    const month = dateToMonth(e.date);
    const existing = monthMap.get(month) ?? { count: 0, critical: 0 };
    existing.count++;
    if (e.significance === "critical") existing.critical++;
    monthMap.set(month, existing);
  }

  const timeline: TimelinePattern[] = [...monthMap.entries()]
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => b.period.localeCompare(a.period)) // newest first
    .slice(0, 6); // last 6 months

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: ChronologyAlert[] = [];

  // Critical: children with no chronology entries
  const withoutChronology = children.filter((c) => (eventsByChild.get(c.id) ?? []).length === 0);
  if (withoutChronology.length > 0) {
    for (const child of withoutChronology) {
      alerts.push({
        severity: "critical",
        message: `${child.name} has no chronology entries. Reg 36 requires comprehensive case records — begin chronology immediately.`,
      });
    }
  }

  // High: children with recording gaps (> 14 days)
  const withGaps = child_profiles.filter((p) => p.has_gap && p.total_events > 0);
  for (const p of withGaps) {
    alerts.push({
      severity: "high",
      message: `${p.child_name}'s chronology has a ${p.days_since_last_entry}-day gap since last entry. Regular recording demonstrates ongoing awareness of the child's life.`,
    });
  }

  // Medium: limited category coverage
  const limitedCategories = child_profiles.filter((p) => p.categories_covered.length <= 2 && p.total_events >= 3);
  for (const p of limitedCategories) {
    alerts.push({
      severity: "medium",
      message: `${p.child_name}'s chronology only covers ${p.categories_covered.length} categor${p.categories_covered.length === 1 ? "y" : "ies"}. A comprehensive chronology should reflect all aspects of the child's life.`,
    });
  }

  // Low: recent critical events requiring follow-up
  const recentCritical = events.filter(
    (e) => e.significance === "critical" && e.date >= thirtyDaysAgo && e.date <= today,
  );
  if (recentCritical.length > 0) {
    alerts.push({
      severity: "low",
      message: `${recentCritical.length} critical event${recentCritical.length > 1 ? "s" : ""} recorded in the last 30 days. Ensure follow-up actions and multi-agency responses are documented.`,
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: AriaChronologyInsight[] = [];

  // Critical: children without chronology
  if (withoutChronology.length > 0) {
    insights.push({
      severity: "critical",
      text: `${withoutChronology.length} child(ren) have no chronology entries. Ofsted expects a factual, up-to-date chronology for every child from the point of admission. This is a fundamental recording gap.`,
    });
  }

  // Warning: recording gaps
  if (withGaps.length > 0) {
    const names = withGaps.map((p) => p.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `${withGaps.length} child(ren) have recording gaps exceeding 14 days: ${names}. A living chronology should be updated at least fortnightly to reflect the child's ongoing journey.`,
    });
  }

  // Warning: low recording frequency
  const lowRecording = child_profiles.filter((p) => p.recording_rate < 2 && p.placement_duration_days > 30);
  if (lowRecording.length > 0 && children.length > 0) {
    insights.push({
      severity: "warning",
      text: `${lowRecording.length} child(ren) with fewer than 2 chronology events per month. Comprehensive recording helps inspectors understand the child's story and demonstrates proactive care.`,
    });
  }

  // Positive: all children have chronologies
  if (childrenWithChronology === children.length && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have active chronologies. This demonstrates a strong commitment to maintaining factual records of each child's journey — a key Reg 36 requirement.`,
    });
  }

  // Positive: good category breadth
  if (allCategories.size >= 5 && events.length >= 10) {
    insights.push({
      severity: "positive",
      text: `Chronology entries span ${allCategories.size} different categories. Broad recording across placement, education, health, safeguarding, and social domains gives inspectors a holistic picture of children's lives.`,
    });
  }

  // Positive: frequent recording
  if (recordingFrequency30d >= 3 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `Recording frequency of ${recordingFrequency30d} events per child in the last 30 days shows active, engaged chronology management. This level of recording captures the child's daily narrative effectively.`,
    });
  }

  return {
    overview,
    child_profiles,
    category_breakdown,
    timeline,
    alerts,
    insights,
  };
}
