// ══════════════════════════════════════════════════════════════════════════════
// Cara V2 — PATTERN DETECTION ENGINE
//
// Analyses incident data to detect behavioural, temporal, and staffing patterns
// that a manager might miss when reviewing incidents individually. Produces
// structured PatternAlert objects for the patterns page and dashboard.
//
// Pattern types:
//   - Escalation: severity increasing over time for a child
//   - Frequency cluster: incidents concentrated in a time window
//   - Time-of-day: incidents clustered at specific times (e.g. bedtime)
//   - Staff correlation: disproportionate incidents involving specific staff
//   - Trigger patterns: same incident type recurring
//   - Missing oversight: incidents without management oversight past SLA
//   - Cross-child: patterns affecting multiple children simultaneously
//
// All outputs are "Cara detected pattern — requires manager review."
// ══════════════════════════════════════════════════════════════════════════════

import type { PatternAlert, PatternSeverity } from "@/types/extended";

export interface IncidentRecord {
  id: string;
  reference: string;
  type: string;
  severity: string;
  child_id: string;
  reported_by: string;
  date: string;
  time?: string;
  location?: string;
  description: string;
  status: string;
  requires_oversight: boolean;
  oversight_by?: string | null;
  oversight_at?: string | null;
  home_id: string;
}

export interface PatternScanConfig {
  homeId: string;
  lookbackDays?: number;
  minClusterSize?: number;
  escalationWindowDays?: number;
}

interface DetectedPattern {
  type: string;
  title: string;
  description: string;
  severity: PatternSeverity;
  evidenceRefs: PatternAlert["evidence_refs"];
  reflectivePrompt: string;
  periodStart: string;
  periodEnd: string;
  childId: string | null;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function uid(): string {
  return `pat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

// ── Main scan ─────────────────────────────────────────────────────────────────

export function scanForPatterns(
  incidents: IncidentRecord[],
  config: PatternScanConfig,
): DetectedPattern[] {
  const lookback = config.lookbackDays ?? 30;
  const minCluster = config.minClusterSize ?? 3;
  const escalationWindow = config.escalationWindowDays ?? 14;
  const cutoff = daysAgo(lookback);

  const recent = incidents
    .filter((i) => i.date >= cutoff && i.home_id === config.homeId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (recent.length === 0) return [];

  const patterns: DetectedPattern[] = [];
  const periodStart = recent[0].date;
  const periodEnd = recent[recent.length - 1].date;

  // ── 1. Escalation pattern per child ───────────────────────────────────
  const byChild = groupBy(recent, "child_id");
  for (const [childId, childIncidents] of Object.entries(byChild)) {
    if (childIncidents.length < 2) continue;
    const sorted = childIncidents.sort((a, b) => a.date.localeCompare(b.date));
    const weights = sorted.map((i) => SEVERITY_WEIGHT[i.severity] ?? 2);

    let escalating = 0;
    for (let i = 1; i < weights.length; i++) {
      if (weights[i] > weights[i - 1] && daysBetween(sorted[i].date, sorted[i - 1].date) <= escalationWindow) {
        escalating++;
      }
    }

    if (escalating >= 2) {
      patterns.push({
        type: "escalation",
        title: `Escalating incident severity — ${childId}`,
        description: `${escalating + 1} incidents with increasing severity over ${lookback} days. The most recent incident was ${sorted[sorted.length - 1].severity} severity. This pattern may indicate that current strategies are not effectively managing risk, or that the child's needs have changed.`,
        severity: "high",
        evidenceRefs: sorted.slice(-4).map((i) => ({
          type: "incident",
          id: i.id,
          date: i.date,
          excerpt: `${i.reference} — ${i.type} (${i.severity})`,
        })),
        reflectivePrompt: "Is the current risk assessment still accurate? Have the child's triggers or circumstances changed? Are staff following the behaviour support plan? Has the child been asked what they need?",
        periodStart,
        periodEnd,
        childId,
      });
    }
  }

  // ── 2. Frequency cluster per child ────────────────────────────────────
  for (const [childId, childIncidents] of Object.entries(byChild)) {
    if (childIncidents.length < minCluster) continue;

    const windows: IncidentRecord[][] = [];
    for (let i = 0; i < childIncidents.length; i++) {
      const window = childIncidents.filter(
        (j) => daysBetween(j.date, childIncidents[i].date) <= 7,
      );
      if (window.length >= minCluster) {
        windows.push(window);
      }
    }

    if (windows.length > 0) {
      const largest = windows.sort((a, b) => b.length - a.length)[0];
      const hasHighSeverity = largest.some((i) => i.severity === "high" || i.severity === "critical");
      patterns.push({
        type: "frequency_cluster",
        title: `${largest.length} incidents in 7 days — ${childId}`,
        description: `A cluster of ${largest.length} incidents within a 7-day window. This concentration may indicate a period of heightened distress, environmental triggers, or an unmet need. The manager should consider whether additional support or an urgent review is needed.`,
        severity: hasHighSeverity ? "high" : "medium",
        evidenceRefs: largest.map((i) => ({
          type: "incident",
          id: i.id,
          date: i.date,
          excerpt: `${i.reference} — ${i.type} (${i.severity})`,
        })),
        reflectivePrompt: "What was happening in the child's life during this period? Were there changes to routine, staffing, family contact, or placement? Has the child been given a safe space to talk about what is causing distress?",
        periodStart: largest[0].date,
        periodEnd: largest[largest.length - 1].date,
        childId,
      });
    }
  }

  // ── 3. Time-of-day patterns ───────────────────────────────────────────
  const withTime = recent.filter((i) => i.time);
  if (withTime.length >= minCluster) {
    const hourBuckets: Record<string, IncidentRecord[]> = {};
    for (const i of withTime) {
      const hour = parseInt(i.time!.split(":")[0], 10);
      let bucket: string;
      if (hour >= 6 && hour < 9) bucket = "morning (6–9am)";
      else if (hour >= 9 && hour < 12) bucket = "late morning (9am–12pm)";
      else if (hour >= 12 && hour < 15) bucket = "afternoon (12–3pm)";
      else if (hour >= 15 && hour < 18) bucket = "late afternoon (3–6pm)";
      else if (hour >= 18 && hour < 21) bucket = "evening (6–9pm)";
      else if (hour >= 21 || hour < 1) bucket = "bedtime (9pm–1am)";
      else bucket = "night (1–6am)";
      (hourBuckets[bucket] ??= []).push(i);
    }

    for (const [bucket, bucketIncidents] of Object.entries(hourBuckets)) {
      const proportion = bucketIncidents.length / withTime.length;
      if (bucketIncidents.length >= minCluster && proportion >= 0.4) {
        patterns.push({
          type: "time_of_day",
          title: `${Math.round(proportion * 100)}% of incidents occur during ${bucket}`,
          description: `${bucketIncidents.length} of ${withTime.length} incidents occurred during the ${bucket} period. This concentration suggests environmental or routine-related triggers during this time. The manager should review staffing levels, routine structure, and transition support during this period.`,
          severity: "medium",
          evidenceRefs: bucketIncidents.slice(0, 5).map((i) => ({
            type: "incident",
            id: i.id,
            date: i.date,
            excerpt: `${i.reference} at ${i.time} — ${i.type}`,
          })),
          reflectivePrompt: "What happens during this time period? Are transitions well-managed? Is staffing adequate? Are there specific triggers related to routine, contact, or anxiety about the next day?",
          periodStart,
          periodEnd,
          childId: null,
        });
      }
    }
  }

  // ── 4. Staff correlation ──────────────────────────────────────────────
  const byStaff = groupBy(recent, "reported_by");
  const avgPerStaff = recent.length / Math.max(Object.keys(byStaff).length, 1);

  for (const [staffId, staffIncidents] of Object.entries(byStaff)) {
    if (staffIncidents.length >= Math.max(minCluster, avgPerStaff * 2)) {
      patterns.push({
        type: "staff_correlation",
        title: `Disproportionate incident reporting — staff ${staffId}`,
        description: `${staffIncidents.length} incidents reported by or involving this staff member, compared to an average of ${avgPerStaff.toFixed(1)} per staff member. This does not necessarily indicate poor practice — it may reflect shift patterns, allocated children, or diligent reporting. The manager should explore the context before drawing conclusions.`,
        severity: "medium",
        evidenceRefs: staffIncidents.slice(0, 5).map((i) => ({
          type: "incident",
          id: i.id,
          date: i.date,
          excerpt: `${i.reference} — ${i.type} reported by ${staffId}`,
        })),
        reflectivePrompt: "Is this staff member working more shifts than average? Are they allocated to higher-need children? Are they reporting more diligently than colleagues, or is there a practice concern? Have they been offered support?",
        periodStart,
        periodEnd,
        childId: null,
      });
    }
  }

  // ── 5. Recurring incident type ────────────────────────────────────────
  for (const [childId, childIncidents] of Object.entries(byChild)) {
    const byType = groupBy(childIncidents, "type");
    for (const [type, typeIncidents] of Object.entries(byType)) {
      if (typeIncidents.length >= minCluster) {
        patterns.push({
          type: "trigger_pattern",
          title: `Recurring ${type.replace(/_/g, " ")} — ${childId}`,
          description: `${typeIncidents.length} ${type.replace(/_/g, " ")} incidents for this child in ${lookback} days. Recurring incidents of the same type often indicate an unaddressed trigger, an ineffective strategy, or an unmet need that current plans have not resolved.`,
          severity: typeIncidents.some((i) => i.severity === "critical") ? "high" : "medium",
          evidenceRefs: typeIncidents.map((i) => ({
            type: "incident",
            id: i.id,
            date: i.date,
            excerpt: `${i.reference} — ${i.severity} severity`,
          })),
          reflectivePrompt: "What triggers are common across these incidents? Is the behaviour support plan addressing the right things? Has the child been involved in reviewing their support? Are staff consistently following the agreed strategies?",
          periodStart: typeIncidents[0].date,
          periodEnd: typeIncidents[typeIncidents.length - 1].date,
          childId,
        });
      }
    }
  }

  // ── 6. Missing oversight ──────────────────────────────────────────────
  const oversightSLADays = 2;
  const today = new Date().toISOString().split("T")[0];
  const missingOversight = recent.filter(
    (i) => i.requires_oversight && !i.oversight_by && daysBetween(i.date, today) > oversightSLADays,
  );

  if (missingOversight.length > 0) {
    patterns.push({
      type: "missing_oversight",
      title: `${missingOversight.length} incident(s) without management oversight`,
      description: `${missingOversight.length} incident(s) requiring management oversight have not been reviewed within ${oversightSLADays} days. Timely oversight is a regulatory requirement and demonstrates that the home is actively managing risk and learning from incidents.`,
      severity: missingOversight.some((i) => i.severity === "critical" || i.severity === "high") ? "high" : "medium",
      evidenceRefs: missingOversight.map((i) => ({
        type: "incident",
        id: i.id,
        date: i.date,
        excerpt: `${i.reference} — ${i.severity} severity, oversight pending since ${i.date}`,
      })),
      reflectivePrompt: "Why has oversight been delayed? Is there a capacity issue, an absence, or a process gap? Which of these incidents is most time-critical?",
      periodStart: missingOversight[0].date,
      periodEnd: today,
      childId: null,
    });
  }

  // ── 7. Cross-child pattern ────────────────────────────────────────────
  const recentWeek = recent.filter((i) => daysBetween(i.date, today) <= 7);
  const uniqueChildrenThisWeek = new Set(recentWeek.map((i) => i.child_id)).size;
  if (recentWeek.length >= minCluster * 2 && uniqueChildrenThisWeek >= 2) {
    patterns.push({
      type: "cross_child",
      title: `${recentWeek.length} incidents across ${uniqueChildrenThisWeek} children this week`,
      description: `A high volume of incidents affecting multiple children in the same week. This may indicate an environmental factor, a staffing issue, or a group dynamic that is affecting the whole home rather than one individual.`,
      severity: recentWeek.some((i) => i.severity === "critical") ? "critical" : "high",
      evidenceRefs: recentWeek.slice(0, 6).map((i) => ({
        type: "incident",
        id: i.id,
        date: i.date,
        excerpt: `${i.reference} — ${i.child_id} (${i.type})`,
      })),
      reflectivePrompt: "Is something affecting the whole home? Has there been a staffing change, a new admission, a departure, or an external event? Are the children influencing each other's behaviour? Is the atmosphere in the home settled?",
      periodStart: recentWeek[0].date,
      periodEnd: recentWeek[recentWeek.length - 1].date,
      childId: null,
    });
  }

  return deduplicatePatterns(patterns);
}

// ── Convert to PatternAlert ───────────────────────────────────────────────────

export function patternsToAlerts(patterns: DetectedPattern[], homeId: string): Omit<PatternAlert, "created_at">[] {
  const now = new Date().toISOString();
  return patterns.map((p) => ({
    id: uid(),
    home_id: homeId,
    child_id: p.childId,
    alert_type: p.type,
    title: p.title,
    description: p.description,
    severity: p.severity,
    status: "active" as const,
    evidence_refs: p.evidenceRefs,
    reflective_prompt: p.reflectivePrompt,
    detected_at: now,
    period_start: p.periodStart,
    period_end: p.periodEnd,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = String(item[key]);
    (result[k] ??= []).push(item);
  }
  return result;
}

function deduplicatePatterns(patterns: DetectedPattern[]): DetectedPattern[] {
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = `${p.type}:${p.childId ?? "home"}:${p.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
