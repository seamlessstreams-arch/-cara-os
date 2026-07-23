// ══════════════════════════════════════════════════════════════════════════════
// Cara — MEDICATION INTELLIGENCE
//
// Analyses medication administration records to surface:
//   - Missed or late doses
//   - Administration patterns (times, refusals)
//   - PRN usage trends
//   - Controlled drug audit gaps
//   - Stock/reorder alerts
//   - Staff competency coverage gaps
//
// CHR 2015 Reg 23 (Health & Medical Needs)
// Children's Homes Medication Policy requirements
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, meets, below, formatRate } from "@/lib/metrics/rate";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MedicationRecord {
  id: string;
  childId: string;
  childName: string;
  medicationName: string;
  dose: string;
  route: string;                  // oral, topical, inhaled, etc.
  type: "regular" | "prn" | "controlled";
  scheduledTime: string;          // HH:MM
  administeredTime?: string;      // HH:MM (null if missed)
  administeredDate: string;       // YYYY-MM-DD
  status: "given" | "refused" | "missed" | "withheld" | "not_available";
  administeredBy?: string;
  witnessedBy?: string;           // Required for controlled drugs
  refusalReason?: string;
  notes?: string;
}

export interface MedicationProfile {
  childId: string;
  childName: string;
  medications: {
    name: string;
    type: "regular" | "prn" | "controlled";
    frequency: string;
    lastReviewDate?: string;
  }[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface MedicationIntelligence {
  homeId: string;
  analysisDate: string;
  windowDays: number;

  // Overview
  totalAdministrations: number;
  complianceRate: number | null;    // % given on time — null when nothing was administered
  missedDoses: number;
  refusals: number;
  lateAdministrations: number;

  // Per-child summaries
  childSummaries: ChildMedSummary[];

  // Alerts
  alerts: MedAlert[];

  // PRN analysis
  prnAnalysis: PRNInsight[];

  // Controlled drug audit
  controlledDrugAudit: ControlledDrugStatus;

  // Patterns
  patterns: MedPattern[];

  // Regulatory status — `compliant` is null when there is nothing on record to judge
  regulatoryStatus: {
    compliant: boolean | null;
    issues: string[];
    strengths: string[];
  };
}

export interface ChildMedSummary {
  childId: string;
  childName: string;
  totalDoses: number;
  givenOnTime: number;
  missed: number;
  refused: number;
  late: number;
  compliancePercent: number | null;
  refusalRate: number | null;
  mostRefusedMedication?: string;
}

export interface MedAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: "missed" | "refusal" | "controlled" | "pattern" | "stock" | "review";
  childId?: string;
  childName?: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

export interface PRNInsight {
  medicationName: string;
  childName: string;
  childId: string;
  usageCount: number;
  averageTimeBetween: number;     // hours
  trend: "increasing" | "stable" | "decreasing";
  concern?: string;
}

export interface ControlledDrugStatus {
  totalAdministrations: number;
  withWitness: number;
  withoutWitness: number;
  witnessCompliancePercent: number | null; // null when no controlled drugs were given
  balanceChecked: boolean | null;          // null until a balance check is evidenced
}

export interface MedPattern {
  type: "time_drift" | "frequent_refusal" | "prn_escalation" | "weekend_variance";
  description: string;
  significance: "high" | "medium" | "low";
}

// ── Constants ────────────────────────────────────────────────────────────────

const LATE_THRESHOLD_MINUTES = 30;
const REFUSAL_CONCERN_THRESHOLD = 3; // 3+ refusals in window = concern
const PRN_ESCALATION_THRESHOLD = 1.5; // 50% increase = escalation

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseMedications(
  records: MedicationRecord[],
  profiles: MedicationProfile[],
  homeId: string = "home_oak",
  windowDays: number = 7,
): MedicationIntelligence {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: MedAlert[] = [];
  const patterns: MedPattern[] = [];

  // Overall stats
  const totalAdministrations = records.length;
  const given = records.filter((r) => r.status === "given");
  const missed = records.filter((r) => r.status === "missed");
  const refused = records.filter((r) => r.status === "refused");
  const late = given.filter((r) => isLate(r));

  const complianceRate = rate(given.length - late.length, totalAdministrations);

  // Per-child summaries
  const childIds = [...new Set(records.map((r) => r.childId))];
  const childSummaries: ChildMedSummary[] = childIds.map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childGiven = childRecords.filter((r) => r.status === "given");
    const childMissed = childRecords.filter((r) => r.status === "missed");
    const childRefused = childRecords.filter((r) => r.status === "refused");
    const childLate = childGiven.filter((r) => isLate(r));

    const refusalsByMed = new Map<string, number>();
    for (const r of childRefused) {
      refusalsByMed.set(r.medicationName, (refusalsByMed.get(r.medicationName) ?? 0) + 1);
    }
    const mostRefused = [...refusalsByMed.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      childId,
      childName: childRecords[0]?.childName ?? childId,
      totalDoses: childRecords.length,
      givenOnTime: childGiven.length - childLate.length,
      missed: childMissed.length,
      refused: childRefused.length,
      late: childLate.length,
      compliancePercent: rate(childGiven.length - childLate.length, childRecords.length),
      refusalRate: rate(childRefused.length, childRecords.length),
      mostRefusedMedication: mostRefused ? mostRefused[0] : undefined,
    };
  });

  // Generate alerts
  // Missed doses
  if (missed.length > 0) {
    const missedByChild = new Map<string, MedicationRecord[]>();
    for (const r of missed) {
      if (!missedByChild.has(r.childId)) missedByChild.set(r.childId, []);
      missedByChild.get(r.childId)!.push(r);
    }

    for (const [childId, childMissed] of missedByChild) {
      if (childMissed.length >= 3) {
        alerts.push({
          severity: "critical",
          category: "missed",
          childId,
          childName: childMissed[0].childName,
          title: `${childMissed.length} missed doses for ${childMissed[0].childName}`,
          description: `${childMissed.length} doses were not administered in the last ${windowDays} days.`,
          action: "Investigate immediately. Record reasons. Notify GP if clinically significant. Update MAR chart.",
          regulation: "CHR 2015 Reg 23 / Medication Policy",
        });
      } else {
        alerts.push({
          severity: "high",
          category: "missed",
          childId,
          childName: childMissed[0].childName,
          title: `Missed dose for ${childMissed[0].childName}`,
          description: `${childMissed[0].medicationName} was not given on ${childMissed[0].administeredDate}.`,
          action: "Record reason. Notify prescriber if required. Review process.",
          regulation: "CHR 2015 Reg 23",
        });
      }
    }
  }

  // Refusal patterns
  for (const summary of childSummaries) {
    if (summary.refused >= REFUSAL_CONCERN_THRESHOLD) {
      alerts.push({
        severity: "high",
        category: "refusal",
        childId: summary.childId,
        childName: summary.childName,
        title: `Persistent medication refusal — ${summary.childName}`,
        description: `${summary.refused} refusals in ${windowDays} days${summary.mostRefusedMedication ? ` (mainly ${summary.mostRefusedMedication})` : ""}.`,
        action: "Discuss with young person in key work. Consider whether medication approach needs reviewing with GP.",
        regulation: "CHR 2015 Reg 23 / Medication Refusal Protocol",
      });

      patterns.push({
        type: "frequent_refusal",
        description: `${summary.childName} frequently refuses medication (${formatRate(summary.refusalRate)} refusal rate)`,
        significance: "high",
      });
    }
  }

  // PRN analysis
  const prnRecords = records.filter((r) => r.type === "prn" && r.status === "given");
  const prnByMedChild = new Map<string, MedicationRecord[]>();
  for (const r of prnRecords) {
    const key = `${r.childId}|${r.medicationName}`;
    if (!prnByMedChild.has(key)) prnByMedChild.set(key, []);
    prnByMedChild.get(key)!.push(r);
  }

  const prnAnalysis: PRNInsight[] = [];
  for (const [key, recs] of prnByMedChild) {
    const sorted = recs.sort((a, b) => a.administeredDate.localeCompare(b.administeredDate));
    let avgHours = 0;
    if (sorted.length >= 2) {
      const totalHours = sorted.reduce((sum, r, i) => {
        if (i === 0) return 0;
        return sum + dateDiffHours(sorted[i - 1].administeredDate, r.administeredDate);
      }, 0);
      avgHours = Math.round(totalHours / (sorted.length - 1));
    }

    // Determine trend (compare usage density in first vs second half of time window)
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (sorted.length >= 3) {
      const earliest = sorted[0].administeredDate;
      const latest = sorted[sorted.length - 1].administeredDate;
      const midDate = new Date((new Date(earliest).getTime() + new Date(latest).getTime()) / 2)
        .toISOString().slice(0, 10);
      const firstHalf = sorted.filter((r) => r.administeredDate <= midDate);
      const secondHalf = sorted.filter((r) => r.administeredDate > midDate);
      const firstRate = firstHalf.length;
      const secondRate = secondHalf.length;
      if (secondRate > firstRate * PRN_ESCALATION_THRESHOLD) trend = "increasing";
      else if (firstRate > secondRate * PRN_ESCALATION_THRESHOLD) trend = "decreasing";
    }

    const insight: PRNInsight = {
      medicationName: recs[0].medicationName,
      childName: recs[0].childName,
      childId: recs[0].childId,
      usageCount: recs.length,
      averageTimeBetween: avgHours,
      trend,
    };

    if (trend === "increasing") {
      insight.concern = "PRN usage is escalating — review with prescriber";
      alerts.push({
        severity: "medium",
        category: "pattern",
        childId: recs[0].childId,
        childName: recs[0].childName,
        title: `PRN escalation — ${recs[0].medicationName} for ${recs[0].childName}`,
        description: `Usage of ${recs[0].medicationName} is increasing. Currently ${recs.length} administrations in ${windowDays} days.`,
        action: "Review with prescriber. Consider whether regular medication adjustment needed.",
      });

      patterns.push({
        type: "prn_escalation",
        description: `${recs[0].medicationName} PRN usage increasing for ${recs[0].childName}`,
        significance: "medium",
      });
    }

    prnAnalysis.push(insight);
  }

  // Controlled drug audit
  const controlledRecords = records.filter((r) => r.type === "controlled");
  const controlledGiven = controlledRecords.filter((r) => r.status === "given");
  const withWitness = controlledGiven.filter((r) => r.witnessedBy);
  const withoutWitness = controlledGiven.filter((r) => !r.witnessedBy);

  if (withoutWitness.length > 0) {
    alerts.push({
      severity: "critical",
      category: "controlled",
      title: `Controlled drug administered without witness (${withoutWitness.length} times)`,
      description: `${withoutWitness.length} controlled drug administration(s) without a second witness recorded.`,
      action: "Investigate immediately. This is a legal requirement. Review with all staff involved.",
      regulation: "Misuse of Drugs Regulations 2001 / CD Policy",
    });
  }

  const controlledDrugAudit: ControlledDrugStatus = {
    totalAdministrations: controlledGiven.length,
    withWitness: withWitness.length,
    withoutWitness: withoutWitness.length,
    witnessCompliancePercent: rate(withWitness.length, controlledGiven.length),
    balanceChecked: null, // No balance-check audit log is wired in yet — unevidenced, not passed
  };

  // Time drift pattern
  const timeVariances = given.map((r) => {
    if (!r.administeredTime || !r.scheduledTime) return 0;
    return timeDiffMinutes(r.scheduledTime, r.administeredTime);
  }).filter((v) => v !== 0);

  if (timeVariances.length > 5) {
    const avgVariance = timeVariances.reduce((s, v) => s + Math.abs(v), 0) / timeVariances.length;
    if (avgVariance > 20) {
      patterns.push({
        type: "time_drift",
        description: `Average administration is ${Math.round(avgVariance)} minutes from scheduled time`,
        significance: "medium",
      });
    }
  }

  // Regulatory status
  const issues: string[] = [];
  const strengths: string[] = [];

  if (missed.length > 0) issues.push(`${missed.length} missed doses in ${windowDays} days`);
  if (withoutWitness.length > 0) issues.push("Controlled drug witness gap");
  if (below(complianceRate, 90)) issues.push(`Compliance rate below 90% (${complianceRate}%)`);

  if (meets(complianceRate, 95)) strengths.push("Excellent medication compliance rate");
  if (meets(controlledDrugAudit.witnessCompliancePercent, 100)) {
    strengths.push("All controlled drugs properly witnessed");
  }
  if (totalAdministrations > 0 && missed.length === 0) {
    strengths.push("No missed doses in the period");
  }

  return {
    homeId,
    analysisDate: today,
    windowDays,
    totalAdministrations,
    complianceRate,
    missedDoses: missed.length,
    refusals: refused.length,
    lateAdministrations: late.length,
    childSummaries,
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    prnAnalysis,
    controlledDrugAudit,
    patterns,
    regulatoryStatus: {
      // No administrations on record is an unmeasured MAR chart, not a compliant one.
      compliant: totalAdministrations === 0 ? null : issues.length === 0,
      issues,
      strengths,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isLate(record: MedicationRecord): boolean {
  if (!record.administeredTime || !record.scheduledTime) return false;
  return Math.abs(timeDiffMinutes(record.scheduledTime, record.administeredTime)) > LATE_THRESHOLD_MINUTES;
}

function timeDiffMinutes(timeA: string, timeB: string): number {
  const [hA, mA] = timeA.split(":").map(Number);
  const [hB, mB] = timeB.split(":").map(Number);
  return (hB * 60 + mB) - (hA * 60 + mA);
}

function dateDiffHours(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 3600000);
}

function severityOrder(s: "critical" | "high" | "medium" | "advisory"): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
  }
}
