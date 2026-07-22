// ══════════════════════════════════════════════════════════════════════════════
// CARA VISUAL TOOLKIT — INCIDENT TIMING & DURATION INTELLIGENCE
// GET /api/v1/cara-toolkit/incident-timing
//
// Surfaces when incidents cluster by time of day, peak risk windows, severity
// by period, type distribution, and deterministic prevention insights.
// CHR 2015 Reg 36 (notifiable events), Reg 40 (manager oversight).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import type {
  IncidentTimingAnalysis,
  PeriodCount,
  HourlyBucket,
  TimePeriod,
} from "@/lib/cara-visual-toolkit/types";

const PERIOD_MAP: Record<
  TimePeriod,
  { label: string; hours: string; range: [number, number] }
> = {
  night:     { label: "Night",     hours: "00:00–05:59", range: [0,  5]  },
  morning:   { label: "Morning",   hours: "06:00–11:59", range: [6,  11] },
  afternoon: { label: "Afternoon", hours: "12:00–17:59", range: [12, 17] },
  evening:   { label: "Evening",   hours: "18:00–23:59", range: [18, 23] },
};

const TYPE_LABELS: Record<string, string> = {
  missing_from_care:    "Missing from care",
  physical_intervention:"Physical intervention",
  safeguarding_concern: "Safeguarding concern",
  medication_error:     "Medication error",
  complaint:            "Complaint",
  behaviour:            "Behaviour",
  injury:               "Injury",
  environmental:        "Environmental",
  peer_conflict:        "Peer conflict",
  self_harm:            "Self-harm",
  other:                "Other",
};

function periodForHour(hour: number): TimePeriod {
  if (hour <= 5)  return "night";
  if (hour <= 11) return "morning";
  if (hour <= 17) return "afternoon";
  return "evening";
}

function parseHour(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const match = String(timeStr).match(/^(\d{1,2}):/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  return h >= 0 && h <= 23 ? h : null;
}

function toSignalColour(count: number, max: number) {
  if (max === 0) return "grey";
  const pct = count / max;
  if (pct >= 0.5) return "red";
  if (pct >= 0.25) return "amber";
  return "green";
}

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const incidents = await safeList(dal.incidents.findAll());

  // ── Parse incidents with a valid time ────────────────────────────────────
  const parsed = incidents
    .map((inc: any) => {
      const hour = parseHour(inc.time);
      return hour !== null ? { ...inc, hour } : null;
    })
    .filter(Boolean) as any[];

  const total = parsed.length;

  // ── Hourly buckets (0–23) ─────────────────────────────────────────────────
  const hourCounts: number[] = Array(24).fill(0);
  for (const inc of parsed) hourCounts[inc.hour]++;

  const hourlyBuckets: HourlyBucket[] = hourCounts.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    count,
  }));

  // ── Period counts ─────────────────────────────────────────────────────────
  const periodData: Record<TimePeriod, { count: number; sev: Record<string, number> }> = {
    night:     { count: 0, sev: {} },
    morning:   { count: 0, sev: {} },
    afternoon: { count: 0, sev: {} },
    evening:   { count: 0, sev: {} },
  };

  for (const inc of parsed) {
    const p = periodForHour(inc.hour);
    periodData[p].count++;
    const sev = inc.severity ?? "unknown";
    periodData[p].sev[sev] = (periodData[p].sev[sev] ?? 0) + 1;
  }

  const maxPeriod = Math.max(...Object.values(periodData).map((v) => v.count), 1);

  const periodCounts: PeriodCount[] = (
    ["night", "morning", "afternoon", "evening"] as TimePeriod[]
  ).map((p) => ({
    period: p,
    label: PERIOD_MAP[p].label,
    hours: PERIOD_MAP[p].hours,
    count: periodData[p].count,
    severityCounts: periodData[p].sev,
    pct: total > 0 ? Math.round((periodData[p].count / total) * 100) : 0,
  }));

  // Peak period
  let peakPeriod: TimePeriod | null = null;
  let peakCount = 0;
  for (const [p, d] of Object.entries(periodData) as [TimePeriod, any][]) {
    if (d.count > peakCount) { peakCount = d.count; peakPeriod = p; }
  }

  // ── Type breakdown ────────────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  for (const inc of incidents) {
    const t = inc.type ?? "other";
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }
  const typeBreakdown = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, label: TYPE_LABELS[type] ?? type, count }))
    .sort((a, b) => b.count - a.count);

  // ── Severity breakdown ────────────────────────────────────────────────────
  const sevCounts: Record<string, number> = {};
  for (const inc of incidents) {
    const s = inc.severity ?? "unknown";
    sevCounts[s] = (sevCounts[s] ?? 0) + 1;
  }
  const severityBreakdown = Object.entries(sevCounts)
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    });

  // ── Deterministic insights ────────────────────────────────────────────────
  const insights: string[] = [];

  const eveningCount  = periodData.evening.count;
  const morningCount  = periodData.morning.count;
  const nightCount    = periodData.night.count;
  const afternoonCount = periodData.afternoon.count;

  if (total === 0) {
    insights.push("No incidents with recorded times found. Ensure all incident records include a time field to enable pattern analysis.");
  } else {
    if (eveningCount >= morningCount * 2 || eveningCount === peakCount && eveningCount > 1) {
      insights.push(
        "Incidents are clustering during the evening period (18:00–23:59). This may suggest links to medication routines, bedtime anxiety, sensory fatigue, reduced structure, family contact, attachment-related distress, or cumulative stress from the day. Consider enhanced relational support before escalation typically begins."
      );
    }

    if (nightCount > 0) {
      insights.push(
        `${nightCount} incident${nightCount > 1 ? "s" : ""} occurred during the night period (00:00–05:59). Night-time incidents may indicate sleep disturbance, anxiety, trauma responses, or unmet need. Review sleep plans, night staffing ratios, and emotional support at bedtime.`
      );
    }

    const piCount = typeCounts["physical_intervention"] ?? 0;
    const piEvening = parsed.filter((i: any) => i.type === "physical_intervention" && periodForHour(i.hour) === "evening").length;
    if (piCount >= 2) {
      insights.push(
        `${piCount} physical intervention${piCount > 1 ? "s" : ""} recorded. Review whether de-escalation strategies are being applied consistently at the early warning stage. Consider whether environmental or relational factors are contributing.`
      );
    }
    if (piEvening > 0 && piEvening >= piCount * 0.5) {
      insights.push(
        "Physical interventions are concentrated in the evening. Review staffing levels, handover quality, and emotional support during the transition from afternoon to evening routines."
      );
    }

    const criticalCount = sevCounts["critical"] ?? 0;
    if (criticalCount > 0) {
      insights.push(
        `${criticalCount} critical-severity incident${criticalCount > 1 ? "s" : ""} recorded. Ensure all critical incidents have been overseen by the registered manager, notifications are complete, and learning has been captured and shared with the team.`
      );
    }

    const safeguardingCount = typeCounts["safeguarding_concern"] ?? 0;
    if (safeguardingCount > 0) {
      insights.push(
        `${safeguardingCount} safeguarding concern${safeguardingCount > 1 ? "s" : ""} recorded. Ensure these have been escalated appropriately, referrals made where required, and risk assessments updated. Multi-agency communication should be documented.`
      );
    }

    if (morningCount >= eveningCount && morningCount > 1) {
      insights.push(
        "A notable proportion of incidents are occurring during the morning period. Consider whether morning routines, medication administration, transitions to school, or family contact are contributing factors."
      );
    }
  }

  // Prevention window
  let preventionWindow = "No clear prevention window identified from current data.";
  if (peakPeriod === "evening") {
    preventionWindow =
      "Consider introducing structured relational support and a predictable wind-down routine from 17:00 onwards — before escalation typically begins.";
  } else if (peakPeriod === "morning") {
    preventionWindow =
      "Consider enhanced staff presence and structured predictability during the morning routine, particularly around medication, breakfast, and transitions.";
  } else if (peakPeriod === "afternoon") {
    preventionWindow =
      "Consider reviewing afternoon activities, peer interactions, and transitions from school or community time as potential prevention opportunities.";
  } else if (peakPeriod === "night") {
    preventionWindow =
      "Consider reviewing bedtime routines, night-time check procedures, sleep plans, and emotional support offered at the end of the day.";
  }

  // Safeguarding override note
  let safeguardingNote: string | null = null;
  const openCritical = incidents.filter(
    (i: any) => i.status === "open" && (i.severity === "critical" || i.type === "safeguarding_concern")
  );
  if (openCritical.length > 0) {
    safeguardingNote = `${openCritical.length} open critical or safeguarding incident${openCritical.length > 1 ? "s" : ""} require immediate manager review and completion of notifications and oversight.`;
  }

  const result: IncidentTimingAnalysis = {
    totalAnalysed: total,
    periodCounts,
    hourlyBuckets,
    peakPeriod,
    peakPeriodLabel: peakPeriod ? PERIOD_MAP[peakPeriod].label : "None",
    typeBreakdown,
    severityBreakdown,
    insights,
    preventionWindow,
    safeguardingNote,
  };

  return NextResponse.json({ data: result });
}
