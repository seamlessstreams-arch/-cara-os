// ══════════════════════════════════════════════════════════════════════════════
// Cara — INCIDENT ANALYSIS
//
// Analyses incident records to surface:
//   - Frequency trends (increasing/decreasing)
//   - Restraint usage and de-escalation success
//   - Time/day patterns (peak hours, weekend variance)
//   - Trigger analysis (repeated antecedents)
//   - Per-child breakdown
//   - Notification compliance (Reg 40)
//   - Staff involvement patterns
//
// CHR 2015 Reg 12 (The Protection of Children Standard — Restraint)
// CHR 2015 Reg 40 (Notification of Serious Events)
// SCCIF: Safety / Leadership and Management
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface IncidentRecord {
  id: string;
  date: string;                // YYYY-MM-DD
  time: string;                // HH:MM
  childId: string;
  childName: string;
  category: IncidentCategory;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  trigger?: string;
  deEscalationAttempted: boolean;
  deEscalationSuccessful?: boolean;
  restraintUsed: boolean;
  restraintType?: "physical" | "mechanical" | "chemical";
  restraintDurationMinutes?: number;
  staffInvolved: string[];
  injuryToChild: boolean;
  injuryToStaff: boolean;
  notifiedOfsted: boolean;
  notifiedSocialWorker: boolean;
  notifiedParent: boolean;
  bodyMapCompleted?: boolean;
  debriefCompleted?: boolean;
}

export type IncidentCategory =
  | "aggression_verbal"
  | "aggression_physical"
  | "self_harm"
  | "property_damage"
  | "missing"
  | "substance_use"
  | "sexual_behaviour"
  | "criminal_activity"
  | "bullying"
  | "exploitation_concern"
  | "other";

// ── Output Types ────────────────────────────────────────────────────────────

export interface IncidentAnalysis {
  homeId: string;
  analysisDate: string;
  windowDays: number;

  // Overview
  totalIncidents: number;
  incidentsPerWeek: number;
  trend: "increasing" | "stable" | "decreasing";
  trendDescription: string;

  // Severity breakdown
  severityBreakdown: { severity: string; count: number; percent: number }[];

  // Category breakdown
  categoryBreakdown: { category: IncidentCategory; label: string; count: number; percent: number }[];

  // Restraint analysis
  restraintAnalysis: RestraintAnalysis;

  // Time patterns
  timePatterns: TimePattern;

  // Per-child
  childBreakdown: ChildIncidentSummary[];

  // Trigger analysis
  triggerAnalysis: TriggerInsight[];

  // Alerts
  alerts: IncidentAlert[];

  // De-escalation
  deEscalationRate: number;

  // Regulatory compliance
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

export interface RestraintAnalysis {
  totalRestraints: number;
  restraintRate: number;        // % of incidents involving restraint
  averageDuration: number;      // minutes
  physicalCount: number;
  deEscalationBeforeRestraint: number;  // % that attempted de-escalation first
  injuryDuringRestraint: number;
  debriefCompleted: number;
  debriefRate: number;
}

export interface TimePattern {
  peakHour: number;             // 0-23
  peakHourLabel: string;
  peakDay: string;              // Day name
  hourDistribution: { hour: number; count: number }[];
  weekdayVsWeekend: { weekday: number; weekend: number };
}

export interface ChildIncidentSummary {
  childId: string;
  childName: string;
  totalIncidents: number;
  restraints: number;
  mostCommonCategory: string;
  mostCommonTrigger?: string;
  trend: "increasing" | "stable" | "decreasing";
}

export interface TriggerInsight {
  trigger: string;
  count: number;
  percent: number;
  associatedChildren: string[];
}

export interface IncidentAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: "restraint" | "trend" | "notification" | "pattern" | "safeguarding";
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  aggression_verbal: "Verbal Aggression",
  aggression_physical: "Physical Aggression",
  self_harm: "Self-Harm",
  property_damage: "Property Damage",
  missing: "Missing from Care",
  substance_use: "Substance Use",
  sexual_behaviour: "Harmful Sexual Behaviour",
  criminal_activity: "Criminal Activity",
  bullying: "Bullying",
  exploitation_concern: "Exploitation Concern",
  other: "Other",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseIncidents(
  records: IncidentRecord[],
  homeId: string = "home_oak",
  windowDays: number = 28,
): IncidentAnalysis {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: IncidentAlert[] = [];

  const totalIncidents = records.length;
  const incidentsPerWeek = windowDays > 0 ? Math.round((totalIncidents / windowDays) * 7 * 10) / 10 : 0;

  // Trend analysis (first half vs second half of window by date)
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  let trendDescription = "Incident levels are stable";
  if (records.length >= 4) {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const midDate = sorted.length >= 2
      ? new Date((new Date(sorted[0].date).getTime() + new Date(sorted[sorted.length - 1].date).getTime()) / 2).toISOString().slice(0, 10)
      : today;
    const firstHalf = sorted.filter((r) => r.date <= midDate).length;
    const secondHalf = sorted.filter((r) => r.date > midDate).length;
    if (secondHalf > firstHalf * 1.3) {
      trend = "increasing";
      trendDescription = `Incidents increasing — ${secondHalf} in recent period vs ${firstHalf} earlier`;
    } else if (firstHalf > secondHalf * 1.3) {
      trend = "decreasing";
      trendDescription = `Incidents decreasing — ${secondHalf} in recent period vs ${firstHalf} earlier`;
    }
  }

  // Severity breakdown
  const severityCounts = new Map<string, number>();
  for (const r of records) {
    severityCounts.set(r.severity, (severityCounts.get(r.severity) ?? 0) + 1);
  }
  const severityBreakdown = ["critical", "high", "medium", "low"].map((sev) => ({
    severity: sev,
    count: severityCounts.get(sev) ?? 0,
    percent: totalIncidents > 0 ? Math.round(((severityCounts.get(sev) ?? 0) / totalIncidents) * 100) : 0,
  }));

  // Category breakdown
  const categoryCounts = new Map<IncidentCategory, number>();
  for (const r of records) {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  }
  const categoryBreakdown = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      count,
      percent: totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0,
    }));

  // Restraint analysis
  const restraints = records.filter((r) => r.restraintUsed);
  const restraintRate = totalIncidents > 0 ? Math.round((restraints.length / totalIncidents) * 100) : 0;
  const avgDuration = restraints.length > 0
    ? Math.round(restraints.reduce((s, r) => s + (r.restraintDurationMinutes ?? 0), 0) / restraints.length)
    : 0;
  const deEscBeforeRestraint = restraints.filter((r) => r.deEscalationAttempted).length;
  const injuryDuring = restraints.filter((r) => r.injuryToChild || r.injuryToStaff).length;
  const debriefsDone = restraints.filter((r) => r.debriefCompleted).length;

  const restraintAnalysis: RestraintAnalysis = {
    totalRestraints: restraints.length,
    restraintRate,
    averageDuration: avgDuration,
    physicalCount: restraints.filter((r) => r.restraintType === "physical").length,
    deEscalationBeforeRestraint: restraints.length > 0 ? Math.round((deEscBeforeRestraint / restraints.length) * 100) : 100,
    injuryDuringRestraint: injuryDuring,
    debriefCompleted: debriefsDone,
    debriefRate: restraints.length > 0 ? Math.round((debriefsDone / restraints.length) * 100) : 100,
  };

  // Time patterns
  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<number, number>();
  let weekdayCount = 0;
  let weekendCount = 0;

  for (const r of records) {
    const hour = parseInt(r.time.split(":")[0], 10);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    const dow = new Date(r.date).getDay();
    dayCounts.set(dow, (dayCounts.get(dow) ?? 0) + 1);
    if (dow === 0 || dow === 6) weekendCount++;
    else weekdayCount++;
  }

  const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  const peakDay = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const hourDistribution = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourCounts.get(h) ?? 0,
  }));

  const timePatterns: TimePattern = {
    peakHour,
    peakHourLabel: `${String(peakHour).padStart(2, "0")}:00–${String(peakHour + 1).padStart(2, "0")}:00`,
    peakDay: DAY_NAMES[peakDay],
    hourDistribution,
    weekdayVsWeekend: { weekday: weekdayCount, weekend: weekendCount },
  };

  // Per-child breakdown
  const childIds = [...new Set(records.map((r) => r.childId))];
  const childBreakdown: ChildIncidentSummary[] = childIds.map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childRestraints = childRecords.filter((r) => r.restraintUsed).length;

    // Most common category
    const catCounts = new Map<string, number>();
    for (const r of childRecords) {
      catCounts.set(r.category, (catCounts.get(r.category) ?? 0) + 1);
    }
    const topCat = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";

    // Most common trigger
    const trigCounts = new Map<string, number>();
    for (const r of childRecords) {
      if (r.trigger) trigCounts.set(r.trigger, (trigCounts.get(r.trigger) ?? 0) + 1);
    }
    const topTrig = [...trigCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    // Trend
    let childTrend: "increasing" | "stable" | "decreasing" = "stable";
    if (childRecords.length >= 3) {
      const sorted = [...childRecords].sort((a, b) => a.date.localeCompare(b.date));
      const midDate = new Date((new Date(sorted[0].date).getTime() + new Date(sorted[sorted.length - 1].date).getTime()) / 2).toISOString().slice(0, 10);
      const first = sorted.filter((r) => r.date <= midDate).length;
      const second = sorted.filter((r) => r.date > midDate).length;
      if (second > first * 1.3) childTrend = "increasing";
      else if (first > second * 1.3) childTrend = "decreasing";
    }

    return {
      childId,
      childName: childRecords[0].childName,
      totalIncidents: childRecords.length,
      restraints: childRestraints,
      mostCommonCategory: CATEGORY_LABELS[topCat as IncidentCategory] ?? topCat,
      mostCommonTrigger: topTrig,
      trend: childTrend,
    };
  }).sort((a, b) => b.totalIncidents - a.totalIncidents);

  // Trigger analysis
  const triggerCounts = new Map<string, { count: number; children: Set<string> }>();
  for (const r of records) {
    if (r.trigger) {
      if (!triggerCounts.has(r.trigger)) triggerCounts.set(r.trigger, { count: 0, children: new Set() });
      const entry = triggerCounts.get(r.trigger)!;
      entry.count++;
      entry.children.add(r.childName);
    }
  }
  const triggerAnalysis: TriggerInsight[] = [...triggerCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([trigger, data]) => ({
      trigger,
      count: data.count,
      percent: totalIncidents > 0 ? Math.round((data.count / totalIncidents) * 100) : 0,
      associatedChildren: [...data.children],
    }));

  // De-escalation rate
  const deEscAttempted = records.filter((r) => r.deEscalationAttempted);
  const deEscSuccessful = deEscAttempted.filter((r) => r.deEscalationSuccessful);
  const deEscalationRate = deEscAttempted.length > 0
    ? Math.round((deEscSuccessful.length / deEscAttempted.length) * 100)
    : 100;

  // Generate alerts
  // Increasing trend
  if (trend === "increasing") {
    alerts.push({
      severity: "high",
      category: "trend",
      title: "Incident frequency increasing",
      description: trendDescription,
      action: "Review environmental factors, staffing, and individual care plans. Consider team debrief.",
      regulation: "CHR 2015 Reg 12 / SCCIF Safety",
    });
  }

  // High restraint rate
  if (restraintRate > 30 && restraints.length >= 3) {
    alerts.push({
      severity: "high",
      category: "restraint",
      title: `High restraint rate (${restraintRate}% of incidents)`,
      description: `${restraints.length} restraints used in ${windowDays} days. Consider restraint reduction strategies.`,
      action: "Review de-escalation training. Consider specialist support. Reg 12 requires minimising restraint.",
      regulation: "CHR 2015 Reg 12",
    });
  }

  // Restraint without de-escalation
  if (restraintAnalysis.deEscalationBeforeRestraint < 100 && restraints.length > 0) {
    const withoutDeEsc = restraints.length - deEscBeforeRestraint;
    if (withoutDeEsc > 0) {
      alerts.push({
        severity: "critical",
        category: "restraint",
        title: `${withoutDeEsc} restraint(s) without de-escalation attempt`,
        description: "Restraint must always be a last resort after de-escalation has been attempted.",
        action: "Investigate immediately. Review training. Consider whether restraint was lawful.",
        regulation: "CHR 2015 Reg 12(3)",
      });
    }
  }

  // Missing Ofsted notifications for critical/high incidents
  const notifiable = records.filter((r) => r.severity === "critical" || (r.severity === "high" && (r.category === "missing" || r.restraintUsed)));
  const unnotified = notifiable.filter((r) => !r.notifiedOfsted);
  if (unnotified.length > 0) {
    alerts.push({
      severity: "critical",
      category: "notification",
      title: `${unnotified.length} incident(s) not notified to Ofsted`,
      description: "Serious incidents must be notified to Ofsted within 24 hours.",
      action: "Review each incident and submit Reg 40 notifications immediately if required.",
      regulation: "CHR 2015 Reg 40",
    });
  }

  // Debrief not completed after restraint
  if (restraints.length > 0 && restraintAnalysis.debriefRate < 100) {
    const noDebrief = restraints.length - debriefsDone;
    alerts.push({
      severity: "medium",
      category: "restraint",
      title: `${noDebrief} restraint(s) without debrief`,
      description: "Post-restraint debrief is essential for learning and child welfare.",
      action: "Complete outstanding debriefs with all parties. Record outcomes.",
    });
  }

  // Self-harm pattern
  const selfHarm = records.filter((r) => r.category === "self_harm");
  if (selfHarm.length >= 3) {
    alerts.push({
      severity: "high",
      category: "safeguarding",
      title: `${selfHarm.length} self-harm incidents in ${windowDays} days`,
      description: "Pattern of self-harm requires immediate clinical review.",
      action: "Refer to CAMHS/crisis team. Review risk assessment. Increase observation level. Update safety plan.",
      regulation: "CHR 2015 Reg 12 / Safeguarding",
    });
  }

  // Regulatory status
  const issues: string[] = [];
  const strengths: string[] = [];

  if (unnotified.length > 0) issues.push(`${unnotified.length} missing Reg 40 notifications`);
  if (restraintAnalysis.deEscalationBeforeRestraint < 100 && restraints.length > 0) issues.push("Restraint used without de-escalation");
  if (trend === "increasing") issues.push("Incident frequency increasing");
  if (restraintRate > 30 && restraints.length >= 3) issues.push(`High restraint rate (${restraintRate}%)`);

  if (deEscalationRate >= 80) strengths.push(`Good de-escalation success rate (${deEscalationRate}%)`);
  if (trend === "decreasing") strengths.push("Incidents decreasing — positive trend");
  if (restraints.length === 0) strengths.push("No restraints used in the period");
  if (restraintAnalysis.debriefRate === 100 && restraints.length > 0) strengths.push("All restraints followed up with debrief");
  if (unnotified.length === 0 && notifiable.length > 0) strengths.push("All notifiable incidents properly reported");

  return {
    homeId,
    analysisDate: today,
    windowDays,
    totalIncidents,
    incidentsPerWeek,
    trend,
    trendDescription,
    severityBreakdown,
    categoryBreakdown,
    restraintAnalysis,
    timePatterns,
    childBreakdown,
    triggerAnalysis,
    deEscalationRate,
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    regulatoryStatus: {
      compliant: issues.length === 0,
      issues,
      strengths,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function severityOrder(s: "critical" | "high" | "medium" | "advisory"): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
  }
}
