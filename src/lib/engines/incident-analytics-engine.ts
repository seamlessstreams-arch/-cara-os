// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT ANALYTICS ENGINE
//
// Pure deterministic engine that analyses incident records to produce:
// - Period summary (totals, per-week average, trend comparison)
// - Severity breakdown (critical/high/medium/low)
// - Category breakdown (type frequency ranking)
// - Time-of-day and day-of-week pattern analysis
// - Per-child incident frequency with repeat-child detection
// - Oversight compliance (Reg 45 management review)
// - Auto-generated Cara pattern insights (deterministic)
//
// Key regulatory requirements:
//   Reg 12 — Protection of children
//   Reg 40 — Notification of serious events
//   Reg 45 — Review of quality of care (monitoring incidents)
//   SCCIF: "Leadership and management" — incident analysis
// ══════════════════════════════════════════════════════════════════════════════

import { meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface IncidentInput {
  id: string;
  child_id: string;
  date: string;
  time: string; // HH:MM or time string
  type: string;
  severity: string; // critical, high, medium, low
  status: string; // open, under_review, closed
  requires_oversight: boolean;
  oversight_by: string | null;
}

export interface ChildRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface PeriodSummary {
  total_30d: number;
  total_90d: number;
  average_per_week_30d: number;
  trend_direction: "increasing" | "stable" | "decreasing";
  percentage_change: number; // positive = increase, negative = decrease
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  label: string;
}

export interface TimePattern {
  block: string; // e.g. "Morning", "Afternoon", etc.
  count: number;
}

export interface DayPattern {
  day: string;
  count: number;
}

export interface ChildIncidentProfile {
  child_id: string;
  child_name: string;
  count_30d: number;
  count_90d: number;
  top_type: string;
  highest_severity: string;
}

export interface OversightCompliance {
  total_requiring_oversight: number;
  oversight_completed: number;
  oversight_pending: number;
  // null when no incident has yet required oversight — nothing to review, not full compliance
  compliance_rate: number | null; // percentage
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface IncidentAnalyticsResult {
  summary: PeriodSummary;
  severity: SeverityBreakdown;
  categories: CategoryCount[];
  time_patterns: TimePattern[];
  day_patterns: DayPattern[];
  child_profiles: ChildIncidentProfile[];
  oversight: OversightCompliance;
  insights: CaraInsight[];
}

export interface IncidentAnalyticsInput {
  incidents: IncidentInput[];
  children: ChildRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

/** Extract hour from a time string (accepts HH:MM, HH:MM:SS, or full ISO) */
export function extractHour(time: string): number {
  const match = time.match(/(\d{1,2}):\d{2}/);
  return match ? parseInt(match[1], 10) : 12; // default to noon if unparseable
}

/** Map hour to time-of-day block */
export function getTimeBlock(hour: number): string {
  if (hour >= 6 && hour < 9) return "Early Morning";
  if (hour >= 9 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 14) return "Lunchtime";
  if (hour >= 14 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 20) return "Evening";
  if (hour >= 20 && hour < 23) return "Late Evening";
  return "Night";
}

/** Get day of week from date string */
export function getDayOfWeek(dateStr: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(dateStr + "T00:00:00Z");
  return days[d.getUTCDay()];
}

/** Human-readable label for incident type */
export function categoryLabel(type: string): string {
  const labels: Record<string, string> = {
    safeguarding_concern: "Safeguarding",
    missing_from_care: "Missing from Care",
    physical_intervention: "Physical Intervention",
    self_harm: "Self-Harm",
    damage_to_property: "Property Damage",
    complaint: "Complaint",
    medication_error: "Medication Error",
    allegation: "Allegation",
    police_involvement: "Police Involvement",
    hospital_attendance: "Hospital Attendance",
    behaviour_incident: "Behaviour",
    contextual_safeguarding: "Contextual Safeguarding",
    exploitation_concern: "Exploitation Concern",
    bullying: "Bullying",
    online_safety: "Online Safety",
    behaviour: "Behaviour",
  };
  return labels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Severity rank for sorting (higher = worse) */
const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeIncidentAnalytics(
  input: IncidentAnalyticsInput,
): IncidentAnalyticsResult {
  const today = input.today ?? todayStr();
  const { incidents, children } = input;

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

  const sixtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 10);
  })();

  const incidents30d = incidents.filter((i) => i.date >= thirtyDaysAgo && i.date.slice(0, 10) <= today);
  const incidents90d = incidents.filter((i) => i.date >= ninetyDaysAgo && i.date.slice(0, 10) <= today);

  // ── Period Summary ────────────────────────────────────────────────────

  const recentPeriod = incidents.filter((i) => i.date >= thirtyDaysAgo && i.date.slice(0, 10) <= today).length;
  const olderPeriod = incidents.filter((i) => i.date >= sixtyDaysAgo && i.date < thirtyDaysAgo).length;

  let trendDirection: "increasing" | "stable" | "decreasing" = "stable";
  let percentageChange = 0;

  if (olderPeriod > 0) {
    percentageChange = Math.round(((recentPeriod - olderPeriod) / olderPeriod) * 100);
    if (percentageChange > 10) trendDirection = "increasing";
    else if (percentageChange < -10) trendDirection = "decreasing";
  } else if (recentPeriod > 0) {
    percentageChange = 100;
    trendDirection = "increasing";
  }

  const weeksIn30d = 30 / 7;
  const avgPerWeek = incidents30d.length > 0
    ? Math.round((incidents30d.length / weeksIn30d) * 10) / 10
    : 0;

  const summary: PeriodSummary = {
    total_30d: incidents30d.length,
    total_90d: incidents90d.length,
    average_per_week_30d: avgPerWeek,
    trend_direction: trendDirection,
    percentage_change: percentageChange,
  };

  // ── Severity Breakdown (last 90 days) ─────────────────────────────────

  const severity: SeverityBreakdown = {
    critical: incidents90d.filter((i) => i.severity === "critical").length,
    high: incidents90d.filter((i) => i.severity === "high").length,
    medium: incidents90d.filter((i) => i.severity === "medium").length,
    low: incidents90d.filter((i) => i.severity === "low").length,
  };

  // ── Category Breakdown (last 90 days, sorted by count desc) ───────────

  const catMap = new Map<string, number>();
  for (const inc of incidents90d) {
    catMap.set(inc.type, (catMap.get(inc.type) ?? 0) + 1);
  }
  const categories: CategoryCount[] = Array.from(catMap.entries())
    .map(([cat, count]) => ({ category: cat, count, label: categoryLabel(cat) }))
    .sort((a, b) => b.count - a.count);

  // ── Time-of-Day Patterns (last 90 days) ───────────────────────────────

  const timeBlockCounts = new Map<string, number>();
  for (const inc of incidents90d) {
    const hour = extractHour(inc.time);
    const block = getTimeBlock(hour);
    timeBlockCounts.set(block, (timeBlockCounts.get(block) ?? 0) + 1);
  }

  const blockOrder = ["Early Morning", "Morning", "Lunchtime", "Afternoon", "Evening", "Late Evening", "Night"];
  const timePatterns: TimePattern[] = blockOrder.map((block) => ({
    block,
    count: timeBlockCounts.get(block) ?? 0,
  }));

  // ── Day-of-Week Patterns (last 90 days) ───────────────────────────────

  const dayCounts = new Map<string, number>();
  for (const inc of incidents90d) {
    const day = getDayOfWeek(inc.date);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayPatterns: DayPattern[] = dayOrder.map((day) => ({
    day,
    count: dayCounts.get(day) ?? 0,
  }));

  // ── Child name lookup ─────────────────────────────────────────────────

  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }
  const childName = (id: string) => childNameMap.get(id) ?? "Unknown";

  // ── Per-Child Profiles (last 90 days) ─────────────────────────────────

  const childIncMap = new Map<string, IncidentInput[]>();
  for (const inc of incidents90d) {
    const existing = childIncMap.get(inc.child_id) ?? [];
    existing.push(inc);
    childIncMap.set(inc.child_id, existing);
  }

  const childProfiles: ChildIncidentProfile[] = Array.from(childIncMap.entries())
    .map(([childId, childIncs]) => {
      const count30d = childIncs.filter((i) => i.date >= thirtyDaysAgo).length;
      const typeCounts = new Map<string, number>();
      let highestSev = "low";

      for (const inc of childIncs) {
        typeCounts.set(inc.type, (typeCounts.get(inc.type) ?? 0) + 1);
        if ((SEV_RANK[inc.severity] ?? 0) > (SEV_RANK[highestSev] ?? 0)) {
          highestSev = inc.severity;
        }
      }

      const topType = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

      return {
        child_id: childId,
        child_name: childName(childId),
        count_30d: count30d,
        count_90d: childIncs.length,
        top_type: categoryLabel(topType),
        highest_severity: highestSev,
      };
    })
    .sort((a, b) => b.count_90d - a.count_90d);

  // ── Oversight Compliance ──────────────────────────────────────────────

  const requiresOversight = incidents.filter((i) => i.requires_oversight);
  const oversightCompleted = requiresOversight.filter((i) => i.oversight_by != null).length;
  const oversightPending = requiresOversight.length - oversightCompleted;
  const complianceRate = rate(oversightCompleted, requiresOversight.length);

  const oversight: OversightCompliance = {
    total_requiring_oversight: requiresOversight.length,
    oversight_completed: oversightCompleted,
    oversight_pending: oversightPending,
    compliance_rate: complianceRate,
  };

  // ── Cara Pattern Insights ─────────────────────────────────────────────

  const insights: CaraInsight[] = [];

  // 1. Critical incidents need immediate attention
  if (severity.critical > 0) {
    insights.push({
      severity: "critical",
      text: `${severity.critical} critical-severity incident(s) recorded in the past 90 days. Each requires Reg 40 notification, management review, and documented lessons learned. Ensure Ofsted notification was submitted without delay.`,
    });
  }

  // 2. Oversight pending
  if (oversightPending > 0) {
    insights.push({
      severity: "critical",
      text: `${oversightPending} incident(s) require management oversight but have not been reviewed. Reg 45 requires the registered person to review and monitor the quality and safety of care. Complete reviews without delay.`,
    });
  }

  // 3. Trend analysis
  if (trendDirection === "increasing" && percentageChange > 25) {
    insights.push({
      severity: "warning",
      text: `Incidents increased ${percentageChange}% compared to the previous 30-day period. This trend warrants analysis at the next team meeting. Review whether staffing changes, child dynamics, or environmental factors are contributing.`,
    });
  } else if (trendDirection === "decreasing" && Math.abs(percentageChange) > 10) {
    insights.push({
      severity: "positive",
      text: `Incidents decreased ${Math.abs(percentageChange)}% compared to the previous 30-day period. Continue the strategies that are working and document what has been effective for inspection evidence.`,
    });
  }

  // 4. Repeat-child pattern
  const repeatChildren = childProfiles.filter((c) => c.count_90d >= 3);
  if (repeatChildren.length > 0) {
    const names = repeatChildren.map((c) => `${c.child_name} (${c.count_90d})`).join(", ");
    insights.push({
      severity: "warning",
      text: `${repeatChildren.length} child(ren) with 3+ incidents in 90 days: ${names}. Review behaviour support plans, risk assessments, and consider whether current strategies are effective.`,
    });
  }

  // 5. Time clustering
  const peakTime = timePatterns.reduce((max, t) => t.count > max.count ? t : max, timePatterns[0]);
  if (peakTime && peakTime.count >= 3 && incidents90d.length >= 5) {
    const peakPct = Math.round((peakTime.count / incidents90d.length) * 100);
    if (peakPct >= 40) {
      insights.push({
        severity: "warning",
        text: `${peakPct}% of incidents occur during ${peakTime.block} periods. Consider whether staffing, routine transitions, or environmental factors during this time need review.`,
      });
    }
  }

  // 6. Day clustering
  const peakDay = dayPatterns.reduce((max, d) => d.count > max.count ? d : max, dayPatterns[0]);
  if (peakDay && peakDay.count >= 3 && incidents90d.length >= 5) {
    const dayPct = Math.round((peakDay.count / incidents90d.length) * 100);
    if (dayPct >= 40) {
      insights.push({
        severity: "warning",
        text: `${peakDay.day}s account for ${dayPct}% of all incidents. Investigate whether contact arrangements, staffing rotas, or routine changes on this day may be contributory.`,
      });
    }
  }

  // 7. Category concentration
  if (categories.length > 0 && incidents90d.length >= 3) {
    const topCat = categories[0];
    const topPct = Math.round((topCat.count / incidents90d.length) * 100);
    if (topPct >= 50) {
      insights.push({
        severity: "warning",
        text: `${topCat.label} accounts for ${topPct}% of all incidents. Consider whether targeted interventions (training, environmental changes, individual support plans) could reduce this category.`,
      });
    }
  }

  // 8. Positive patterns
  if (incidents30d.length === 0 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "Zero incidents in the past 30 days. Excellent evidence of effective behaviour support, settled environment, and strong therapeutic relationships.",
    });
  }

  if (severity.critical === 0 && severity.high === 0 && incidents90d.length > 0) {
    insights.push({
      severity: "positive",
      text: "No critical or high-severity incidents in 90 days. Low-level incidents are being managed effectively at point of occurrence.",
    });
  }

  if (meets(complianceRate, 100)) {
    insights.push({
      severity: "positive",
      text: "All incidents requiring management oversight have been reviewed. Reg 45 monitoring compliance is strong. Continue robust recording and review practice.",
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `Incident analytics active. ${incidents90d.length} incident(s) in 90 days. Continue recording all incidents promptly and reviewing patterns at team meetings.`,
    });
  }

  return {
    summary,
    severity,
    categories,
    time_patterns: timePatterns,
    day_patterns: dayPatterns,
    child_profiles: childProfiles,
    oversight,
    insights,
  };
}
