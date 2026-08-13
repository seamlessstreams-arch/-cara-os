// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT ANALYTICS SERVICE
// Aggregates incident data for trend analysis, pattern detection,
// regulatory reporting, and Cara intelligence inputs.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

import { londonHour, londonWeekday } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type IncidentCategory =
  | "physical_intervention"
  | "violence"
  | "self_harm"
  | "absconding"
  | "missing"
  | "property_damage"
  | "medication_error"
  | "safeguarding"
  | "bullying"
  | "substance_misuse"
  | "sexual_behaviour"
  | "online_safety"
  | "complaint"
  | "near_miss"
  | "other";

export type IncidentSeverity = "critical" | "major" | "moderate" | "minor";

export type IncidentTrendDirection = "increasing" | "stable" | "decreasing";

export interface IncidentSummary {
  total: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_child: Record<string, number>;
  by_staff_involved: Record<string, number>;
  by_day_of_week: [number, number, number, number, number, number, number];
  by_hour: [
    number, number, number, number, number, number,
    number, number, number, number, number, number,
    number, number, number, number, number, number,
    number, number, number, number, number, number,
  ];
  physical_interventions: number;
  average_per_week: number;
  period_start: string;
  period_end: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const INCIDENT_CATEGORIES: {
  category: IncidentCategory;
  label: string;
  requiresNotification: boolean;
  regulationRef: string | null;
}[] = [
  { category: "physical_intervention", label: "Physical Intervention", requiresNotification: true, regulationRef: "Reg 35" },
  { category: "violence", label: "Violence", requiresNotification: false, regulationRef: null },
  { category: "self_harm", label: "Self-Harm", requiresNotification: false, regulationRef: null },
  { category: "absconding", label: "Absconding", requiresNotification: false, regulationRef: null },
  { category: "missing", label: "Missing", requiresNotification: true, regulationRef: "Reg 34" },
  { category: "property_damage", label: "Property Damage", requiresNotification: false, regulationRef: null },
  { category: "medication_error", label: "Medication Error", requiresNotification: true, regulationRef: "Reg 36" },
  { category: "safeguarding", label: "Safeguarding", requiresNotification: true, regulationRef: "Reg 40(4)(a)" },
  { category: "bullying", label: "Bullying", requiresNotification: false, regulationRef: null },
  { category: "substance_misuse", label: "Substance Misuse", requiresNotification: false, regulationRef: null },
  { category: "sexual_behaviour", label: "Sexual Behaviour", requiresNotification: false, regulationRef: null },
  { category: "online_safety", label: "Online Safety", requiresNotification: false, regulationRef: null },
  { category: "complaint", label: "Complaint", requiresNotification: false, regulationRef: null },
  { category: "near_miss", label: "Near Miss", requiresNotification: false, regulationRef: null },
  { category: "other", label: "Other", requiresNotification: false, regulationRef: null },
];

export const DEBRIEF_REQUIREMENTS: Record<
  IncidentCategory,
  { required: boolean; timeframeHours: number }
> = {
  physical_intervention: { required: true, timeframeHours: 24 },
  violence: { required: true, timeframeHours: 24 },
  self_harm: { required: true, timeframeHours: 24 },
  absconding: { required: true, timeframeHours: 24 },
  missing: { required: true, timeframeHours: 24 },
  medication_error: { required: true, timeframeHours: 48 },
  property_damage: { required: false, timeframeHours: 0 },
  safeguarding: { required: false, timeframeHours: 0 },
  bullying: { required: false, timeframeHours: 0 },
  substance_misuse: { required: false, timeframeHours: 0 },
  sexual_behaviour: { required: false, timeframeHours: 0 },
  online_safety: { required: false, timeframeHours: 0 },
  complaint: { required: false, timeframeHours: 0 },
  near_miss: { required: false, timeframeHours: 0 },
  other: { required: false, timeframeHours: 0 },
};

// ── Pure functions ────────────────────────────────────────────────────────

/**
 * Aggregate raw incident records into an IncidentSummary for the given period.
 */
export function computeIncidentSummary(
  incidents: {
    id: string;
    category: string;
    severity: string;
    child_id: string;
    staff_involved: string[];
    created_at: string;
    physical_intervention_used: boolean;
  }[],
  periodStart: string,
  periodEnd: string,
): IncidentSummary {
  const by_category: Record<string, number> = {};
  const by_severity: Record<string, number> = {};
  const by_child: Record<string, number> = {};
  const by_staff_involved: Record<string, number> = {};
  const by_day_of_week: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
  const by_hour: IncidentSummary["by_hour"] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  let physical_interventions = 0;

  for (const inc of incidents) {
    by_category[inc.category] = (by_category[inc.category] ?? 0) + 1;
    by_severity[inc.severity] = (by_severity[inc.severity] ?? 0) + 1;
    by_child[inc.child_id] = (by_child[inc.child_id] ?? 0) + 1;

    for (const staffId of inc.staff_involved) {
      by_staff_involved[staffId] = (by_staff_involved[staffId] ?? 0) + 1;
    }

    const date = new Date(inc.created_at);
    by_day_of_week[londonWeekday(date)] += 1;
    by_hour[londonHour(date)] += 1;

    if (inc.physical_intervention_used) {
      physical_interventions++;
    }
  }

  const startMs = new Date(periodStart).getTime();
  const endMs = new Date(periodEnd).getTime();
  const weeks = Math.max((endMs - startMs) / (1000 * 60 * 60 * 24 * 7), 1);
  const average_per_week = Math.round((incidents.length / weeks) * 100) / 100;

  return {
    total: incidents.length,
    by_category,
    by_severity,
    by_child,
    by_staff_involved,
    by_day_of_week,
    by_hour,
    physical_interventions,
    average_per_week,
    period_start: periodStart,
    period_end: periodEnd,
  };
}

/**
 * Compare two IncidentSummary periods to determine trend direction
 * and identify emerging patterns.
 */
export function computeIncidentTrend(
  currentPeriod: IncidentSummary,
  previousPeriod: IncidentSummary,
): {
  direction: IncidentTrendDirection;
  percentage_change: number;
  category_changes: {
    category: string;
    current: number;
    previous: number;
    direction: IncidentTrendDirection;
  }[];
  emerging_patterns: string[];
} {
  // Overall direction based on totals
  const prevTotal = previousPeriod.total;
  const currTotal = currentPeriod.total;
  const percentage_change =
    prevTotal === 0
      ? currTotal > 0 ? 100 : 0
      : Math.round(((currTotal - prevTotal) / prevTotal) * 10000) / 100;

  let direction: IncidentTrendDirection;
  if (percentage_change > 10) {
    direction = "increasing";
  } else if (percentage_change < -10) {
    direction = "decreasing";
  } else {
    direction = "stable";
  }

  // Per-category changes
  const allCategories = new Set([
    ...Object.keys(currentPeriod.by_category),
    ...Object.keys(previousPeriod.by_category),
  ]);

  const category_changes: {
    category: string;
    current: number;
    previous: number;
    direction: IncidentTrendDirection;
  }[] = [];

  const emerging_patterns: string[] = [];

  for (const cat of allCategories) {
    const curr = currentPeriod.by_category[cat] ?? 0;
    const prev = previousPeriod.by_category[cat] ?? 0;

    let catDirection: IncidentTrendDirection;
    if (prev === 0) {
      catDirection = curr > 0 ? "increasing" : "stable";
    } else {
      const catChange = ((curr - prev) / prev) * 100;
      if (catChange > 10) catDirection = "increasing";
      else if (catChange < -10) catDirection = "decreasing";
      else catDirection = "stable";
    }

    category_changes.push({ category: cat, current: curr, previous: prev, direction: catDirection });

    // Emerging: went from 0 to >0, or increased >50%
    if (prev === 0 && curr > 0) {
      emerging_patterns.push(cat);
    } else if (prev > 0 && ((curr - prev) / prev) * 100 > 50) {
      emerging_patterns.push(cat);
    }
  }

  return {
    direction,
    percentage_change,
    category_changes,
    emerging_patterns,
  };
}

/**
 * Analyse physical intervention incidents specifically.
 * Returns metrics relevant to PI monitoring and regulatory compliance.
 */
export function computePIAnalysis(
  incidents: {
    id: string;
    child_id: string;
    staff_involved: string[];
    duration_minutes: number | null;
    technique_used: string | null;
    injury_reported: boolean;
    debrief_completed: boolean;
    created_at: string;
  }[],
): {
  total_pi: number;
  unique_children: number;
  unique_staff: number;
  avg_duration_minutes: number | null;
  injury_rate: number | null;
  debrief_completion_rate: number | null;
  repeat_children: { child_id: string; count: number }[];
  by_technique: Record<string, number>;
  trend_direction: IncidentTrendDirection;
} {
  const total_pi = incidents.length;

  const childCounts: Record<string, number> = {};
  const staffSet = new Set<string>();
  const by_technique: Record<string, number> = {};

  let totalDuration = 0;
  let durationCount = 0;
  let injuryCount = 0;
  let debriefCount = 0;

  for (const inc of incidents) {
    childCounts[inc.child_id] = (childCounts[inc.child_id] ?? 0) + 1;

    for (const staffId of inc.staff_involved) {
      staffSet.add(staffId);
    }

    if (inc.duration_minutes != null) {
      totalDuration += inc.duration_minutes;
      durationCount++;
    }

    if (inc.technique_used) {
      by_technique[inc.technique_used] = (by_technique[inc.technique_used] ?? 0) + 1;
    }

    if (inc.injury_reported) injuryCount++;
    if (inc.debrief_completed) debriefCount++;
  }

  const unique_children = Object.keys(childCounts).length;
  const unique_staff = staffSet.size;
  const avg_duration_minutes = durationCount > 0
    ? Math.round((totalDuration / durationCount) * 100) / 100
    : null;
  const injury_rate = total_pi > 0
    ? Math.round((injuryCount / total_pi) * 10000) / 100
    : null;
  const debrief_completion_rate = total_pi > 0
    ? Math.round((debriefCount / total_pi) * 10000) / 100
    : null;

  const repeat_children = Object.entries(childCounts)
    .filter(([, count]) => count > 1)
    .map(([child_id, count]) => ({ child_id, count }))
    .sort((a, b) => b.count - a.count);

  // Trend: split incidents into two halves by created_at to determine direction
  let trend_direction: IncidentTrendDirection = "stable";
  if (incidents.length >= 4) {
    const sorted = [...incidents].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = mid;
    const secondHalf = sorted.length - mid;

    if (firstHalf > 0) {
      const change = ((secondHalf - firstHalf) / firstHalf) * 100;
      if (change > 10) trend_direction = "increasing";
      else if (change < -10) trend_direction = "decreasing";
    }
  }

  return {
    total_pi,
    unique_children,
    unique_staff,
    avg_duration_minutes,
    injury_rate,
    debrief_completion_rate,
    repeat_children,
    by_technique,
    trend_direction,
  };
}

/**
 * Identify high-frequency patterns across incidents:
 * children with many incidents, high-frequency categories, and temporal clustering.
 */
export function identifyHighFrequencyPatterns(
  incidents: {
    category: string;
    child_id: string;
    created_at: string;
  }[],
  thresholds?: {
    childThreshold?: number;
    categoryThreshold?: number;
    clusterWindowHours?: number;
  },
): {
  high_frequency_children: { child_id: string; count: number; categories: string[] }[];
  high_frequency_categories: { category: string; count: number }[];
  clustering: { date_range: string; count: number; description: string }[];
} {
  const childThreshold = thresholds?.childThreshold ?? 3;
  const categoryThreshold = thresholds?.categoryThreshold ?? 5;
  const clusterWindowHours = thresholds?.clusterWindowHours ?? 48;

  // High-frequency children
  const childMap: Record<string, { count: number; categories: Set<string> }> = {};
  for (const inc of incidents) {
    if (!childMap[inc.child_id]) {
      childMap[inc.child_id] = { count: 0, categories: new Set() };
    }
    childMap[inc.child_id].count++;
    childMap[inc.child_id].categories.add(inc.category);
  }

  const high_frequency_children = Object.entries(childMap)
    .filter(([, v]) => v.count >= childThreshold)
    .map(([child_id, v]) => ({
      child_id,
      count: v.count,
      categories: Array.from(v.categories),
    }))
    .sort((a, b) => b.count - a.count);

  // High-frequency categories
  const catMap: Record<string, number> = {};
  for (const inc of incidents) {
    catMap[inc.category] = (catMap[inc.category] ?? 0) + 1;
  }

  const high_frequency_categories = Object.entries(catMap)
    .filter(([, count]) => count >= categoryThreshold)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Temporal clustering: 3+ incidents within any clusterWindowHours window
  const clustering: { date_range: string; count: number; description: string }[] = [];

  if (incidents.length >= 3) {
    const sorted = [...incidents].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const windowMs = clusterWindowHours * 60 * 60 * 1000;
    const usedIndices = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      if (usedIndices.has(i)) continue;

      const windowStart = new Date(sorted[i].created_at).getTime();
      const windowEnd = windowStart + windowMs;

      const clusterIndices: number[] = [i];
      for (let j = i + 1; j < sorted.length; j++) {
        if (new Date(sorted[j].created_at).getTime() <= windowEnd) {
          clusterIndices.push(j);
        }
      }

      if (clusterIndices.length >= 3) {
        for (const idx of clusterIndices) usedIndices.add(idx);

        const clusterCategories = new Set(clusterIndices.map((idx) => sorted[idx].category));
        const startDate = sorted[clusterIndices[0]].created_at;
        const endDate = sorted[clusterIndices[clusterIndices.length - 1]].created_at;

        clustering.push({
          date_range: `${startDate} – ${endDate}`,
          count: clusterIndices.length,
          description: `${clusterIndices.length} incidents within ${clusterWindowHours}h window (categories: ${Array.from(clusterCategories).join(", ")})`,
        });
      }
    }
  }

  return {
    high_frequency_children,
    high_frequency_categories,
    clustering,
  };
}

/**
 * Compute notification compliance based on incident categories
 * that require Ofsted/regulatory notification.
 */
export function computeNotificationRequirements(
  incidents: {
    id: string;
    category: string;
    notification_sent: boolean;
  }[],
): {
  required: number;
  sent: number;
  outstanding: number;
  compliance_percentage: number;
  outstanding_incidents: { id: string; category: string }[];
} {
  const notifiableCategories = new Set(
    INCIDENT_CATEGORIES
      .filter((c) => c.requiresNotification)
      .map((c) => c.category as string),
  );

  const notifiableIncidents = incidents.filter((inc) =>
    notifiableCategories.has(inc.category),
  );

  const required = notifiableIncidents.length;
  const sent = notifiableIncidents.filter((inc) => inc.notification_sent).length;
  const outstanding = required - sent;

  const compliance_percentage = required > 0
    ? Math.round((sent / required) * 10000) / 100
    : 100;

  const outstanding_incidents = notifiableIncidents
    .filter((inc) => !inc.notification_sent)
    .map((inc) => ({ id: inc.id, category: inc.category }));

  return {
    required,
    sent,
    outstanding,
    compliance_percentage,
    outstanding_incidents,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listIncidentAnalytics(
  homeId: string,
  opts?: {
    periodStart?: string;
    periodEnd?: string;
    childId?: string;
    category?: IncidentCategory;
    severity?: IncidentSeverity;
    limit?: number;
  },
): Promise<ServiceResult<{
  id: string;
  category: string;
  severity: string;
  child_id: string;
  staff_involved: string[];
  created_at: string;
  physical_intervention_used: boolean;
}[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_incidents") as SB).select("*").eq("home_id", homeId);

  if (opts?.periodStart) q = q.gte("created_at", opts.periodStart);
  if (opts?.periodEnd) q = q.lte("created_at", opts.periodEnd);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.severity) q = q.eq("severity", opts.severity);

  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 500);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getIncidentAnalytics(
  homeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<ServiceResult<IncidentSummary>> {
  const result = await listIncidentAnalytics(homeId, { periodStart, periodEnd });
  if (!result.ok) return { ok: false, error: result.error };

  const summary = computeIncidentSummary(result.data ?? [], periodStart, periodEnd);
  return { ok: true, data: summary };
}

// ── Testing exports ───────────────────────────────────────────────────────

export const _testing = {
  INCIDENT_CATEGORIES,
  DEBRIEF_REQUIREMENTS,
  computeIncidentSummary,
  computeIncidentTrend,
  computePIAnalysis,
  identifyHighFrequencyPatterns,
  computeNotificationRequirements,
};
