// ══════════════════════════════════════════════════════════════════════════════
// ARIA — SAFEGUARDING PATTERN ENGINE + EARLY WARNINGS
//
// Scans live records (incidents, missing episodes, restraints) for safeguarding
// patterns that a human reviewer might miss across siloed views. Produces:
//   - AriaSafeguardingPattern records (the detected pattern with evidence)
//   - AriaEarlyWarning records for the highest-severity patterns
//
// All outputs are DRAFT (is_ai_draft = true). Manager review required.
// Detection is idempotent within a window: existing OPEN patterns of the same
// (type, child_id) are not duplicated; new evidence merges into the existing
// record by replacing the evidence_refs and refreshing detected_at.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  AriaSafeguardingPattern,
  AriaSafeguardingPatternType,
  AriaSafeguardingEvidenceRef,
  AriaPatternSeverity,
  AriaEarlyWarning,
} from "@/types/aria-studio";

const DEFAULT_LOOKBACK_DAYS = 30;
const MIN_REPEAT_MISSING = 2;
const MIN_REPEAT_RESTRAINT = 2;
const NIGHT_INCIDENT_MIN = 3;
const NIGHT_PROPORTION = 0.4;
const ESCALATION_WINDOW_DAYS = 14;
const OVERSIGHT_GAP_DAYS = 3;

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

interface DetectedPattern {
  pattern_type: AriaSafeguardingPatternType;
  child_id: string | null;
  title: string;
  description: string;
  severity: AriaPatternSeverity;
  evidence_refs: AriaSafeguardingEvidenceRef[];
  reflective_prompt: string;
  window_start: string;
  window_end: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

// ── Detection rules ──────────────────────────────────────────────────────────

function detectRepeatMissing(
  homeId: string,
  windowStart: string,
  windowEnd: string,
): DetectedPattern[] {
  const episodes = db.missingEpisodes
    .findAll()
    .filter(
      (m) =>
        m.home_id === homeId &&
        m.date_missing >= windowStart &&
        m.date_missing <= windowEnd,
    );
  const byChild: Record<string, typeof episodes> = {};
  for (const e of episodes) (byChild[e.child_id] ??= []).push(e);

  const out: DetectedPattern[] = [];
  for (const [childId, list] of Object.entries(byChild)) {
    if (list.length < MIN_REPEAT_MISSING) continue;
    const highRisk = list.some(
      (e) => e.risk_level === "high" || e.risk_level === "critical",
    );
    out.push({
      pattern_type: "repeat_missing",
      child_id: childId,
      title: `${list.length} missing episodes — ${childId}`,
      description: `Child has gone missing ${list.length} times in the current window. ${highRisk ? "At least one episode was high or critical risk." : ""} Consider whether contextual safeguarding factors, peer influence, or unmet need are driving the pattern.`,
      severity: highRisk ? "critical" : "high",
      evidence_refs: list.slice(0, 5).map((e) => ({
        source_table: "missing_episodes",
        source_id: e.id,
        date: e.date_missing,
        excerpt: `${e.reference} — risk ${e.risk_level}, last seen ${e.location_last_seen}`,
      })),
      reflective_prompt:
        "Has a contextual safeguarding assessment been refreshed? Has the child been spoken to about who they are with when missing? Are return interviews completed and analysed for themes?",
      window_start: windowStart,
      window_end: windowEnd,
    });
  }
  return out;
}

function detectRepeatRestraint(
  homeId: string,
  windowStart: string,
  windowEnd: string,
): DetectedPattern[] {
  const childIdsInHome = new Set(
    db.youngPeople
      .findAll()
      .filter((yp) => yp.home_id === homeId)
      .map((yp) => yp.id),
  );
  const records = db.restraints.findAll().filter((r) => {
    if (!childIdsInHome.has(r.child_id)) return false;
    const d = (r.date ?? "").slice(0, 10);
    return d >= windowStart && d <= windowEnd;
  });
  const byChild: Record<string, typeof records> = {};
  for (const r of records) (byChild[r.child_id] ??= []).push(r);

  const out: DetectedPattern[] = [];
  for (const [childId, list] of Object.entries(byChild)) {
    if (list.length < MIN_REPEAT_RESTRAINT) continue;
    out.push({
      pattern_type: "repeat_restraint",
      child_id: childId,
      title: `${list.length} restraints — ${childId}`,
      description: `${list.length} physical interventions recorded in the current window. Repeat restraint use must be reviewed against the child's positive handling plan and behaviour support plan.`,
      severity: list.length >= 4 ? "critical" : "high",
      evidence_refs: list.slice(0, 5).map((r) => ({
        source_table: "restraints",
        source_id: r.id,
        date: (r.date ?? "").slice(0, 10),
        excerpt: `${r.restraint_type} — reason: ${r.reason}, duration ${r.duration} min`,
      })),
      reflective_prompt:
        "Is the positive handling plan still appropriate? Are de-escalation strategies being attempted? Is the child being debriefed and listened to after each event?",
      window_start: windowStart,
      window_end: windowEnd,
    });
  }
  return out;
}

function detectEscalatingSeverity(
  homeId: string,
  windowStart: string,
  windowEnd: string,
): DetectedPattern[] {
  const incidents = db.incidents
    .findAll()
    .filter(
      (i) =>
        i.home_id === homeId && i.date >= windowStart && i.date <= windowEnd,
    );
  const byChild: Record<string, typeof incidents> = {};
  for (const i of incidents) (byChild[i.child_id] ??= []).push(i);

  const out: DetectedPattern[] = [];
  for (const [childId, list] of Object.entries(byChild)) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    let escalations = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = SEVERITY_WEIGHT[sorted[i - 1].severity] ?? 2;
      const curr = SEVERITY_WEIGHT[sorted[i].severity] ?? 2;
      if (
        curr > prev &&
        daysBetween(sorted[i].date, sorted[i - 1].date) <= ESCALATION_WINDOW_DAYS
      ) {
        escalations++;
      }
    }
    if (escalations >= 2) {
      const last = sorted[sorted.length - 1];
      out.push({
        pattern_type: "escalating_severity",
        child_id: childId,
        title: `Escalating incident severity — ${childId}`,
        description: `Incident severity has stepped up ${escalations} times in the current window. Most recent incident: ${last.severity}. Risk assessment and behaviour support plan should be reviewed urgently.`,
        severity: last.severity === "critical" ? "critical" : "high",
        evidence_refs: sorted.slice(-4).map((i) => ({
          source_table: "incidents",
          source_id: i.id,
          date: i.date,
          excerpt: `${i.reference} — ${i.type} (${i.severity})`,
        })),
        reflective_prompt:
          "What has changed in the child's environment, relationships, or routine? Are current strategies effective? Is a multi-agency response now needed?",
        window_start: windowStart,
        window_end: windowEnd,
      });
    }
  }
  return out;
}

function detectNightTimeCluster(
  homeId: string,
  windowStart: string,
  windowEnd: string,
): DetectedPattern[] {
  const incidents = db.incidents
    .findAll()
    .filter(
      (i) =>
        i.home_id === homeId &&
        i.date >= windowStart &&
        i.date <= windowEnd &&
        !!i.time,
    );
  if (incidents.length < NIGHT_INCIDENT_MIN) return [];
  const night = incidents.filter((i) => {
    const hour = parseInt(i.time.split(":")[0] ?? "12", 10);
    return hour >= 21 || hour < 6;
  });
  if (
    night.length < NIGHT_INCIDENT_MIN ||
    night.length / incidents.length < NIGHT_PROPORTION
  ) {
    return [];
  }
  return [
    {
      pattern_type: "night_time_cluster",
      child_id: null,
      title: `${night.length} of ${incidents.length} incidents at night`,
      description: `${Math.round((night.length / incidents.length) * 100)}% of incidents in the current window happened between 9pm and 6am. Review night staffing, sleep support and bedtime routines.`,
      severity: "medium",
      evidence_refs: night.slice(0, 5).map((i) => ({
        source_table: "incidents",
        source_id: i.id,
        date: i.date,
        excerpt: `${i.reference} at ${i.time} — ${i.type}`,
      })),
      reflective_prompt:
        "Is the night staffing model adequate? Are bedtime routines consistent? Are children able to settle and be supported overnight?",
      window_start: windowStart,
      window_end: windowEnd,
    },
  ];
}

function detectOversightGap(
  homeId: string,
  windowStart: string,
  windowEnd: string,
): DetectedPattern[] {
  const overdue = db.incidents
    .findAll()
    .filter(
      (i) =>
        i.home_id === homeId &&
        i.requires_oversight &&
        !i.oversight_by &&
        i.date >= windowStart &&
        i.date <= windowEnd &&
        daysBetween(i.date, isoDate(new Date())) >= OVERSIGHT_GAP_DAYS,
    );
  if (overdue.length === 0) return [];
  return [
    {
      pattern_type: "oversight_gap",
      child_id: null,
      title: `${overdue.length} incidents lack management oversight after ${OVERSIGHT_GAP_DAYS}+ days`,
      description: `Incidents that require oversight have not received it within ${OVERSIGHT_GAP_DAYS} days. This is a Regulation 13 issue and must be addressed.`,
      severity: overdue.length >= 5 ? "high" : "medium",
      evidence_refs: overdue.slice(0, 5).map((i) => ({
        source_table: "incidents",
        source_id: i.id,
        date: i.date,
        excerpt: `${i.reference} — ${i.type} (${i.severity})`,
      })),
      reflective_prompt:
        "Why has oversight not happened? Is the manager workload sustainable? Should the oversight escalation route be triggered?",
      window_start: windowStart,
      window_end: windowEnd,
    },
  ];
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface SafeguardingScanOptions {
  lookbackDays?: number;
  asOf?: string;
  detectedBy?: string;
}

export interface SafeguardingScanResult {
  patterns: AriaSafeguardingPattern[];
  warnings: AriaEarlyWarning[];
  inspected: {
    incidents: number;
    missing: number;
    restraints: number;
    window_start: string;
    window_end: string;
  };
}

function severityToWarning(severity: AriaPatternSeverity): boolean {
  return severity === "high" || severity === "critical";
}

function recommendedAction(p: DetectedPattern): string {
  switch (p.pattern_type) {
    case "repeat_missing":
      return "Convene a strategy / contextual safeguarding discussion. Refresh return-interview analysis. Review external risk locations and peers.";
    case "repeat_restraint":
      return "Review positive handling plan with the child, behaviour support team and clinical input. Audit recent restraints for de-escalation evidence.";
    case "escalating_severity":
      return "Review risk assessment and behaviour support plan. Consider multi-agency meeting. Discuss in next supervision and team meeting.";
    case "night_time_cluster":
      return "Review night staffing and bedtime routines. Consult sleep records. Consider trauma-informed bedtime support.";
    case "oversight_gap":
      return "Allocate management oversight on each affected incident now. Escalate to the Responsible Individual if pattern persists.";
    case "contextual_safeguarding":
      return "Trigger contextual safeguarding assessment. Liaise with police, school and YOT as applicable.";
    case "cross_child_trend":
      return "Review home dynamics. Consider whether group composition or staffing is contributing.";
    case "unexplained_injury_cluster":
      return "Review body-map records. Speak with the child. Consider LADO or strategy referral if any allegation arises.";
  }
}

export function runSafeguardingScan(
  homeId: string,
  options: SafeguardingScanOptions = {},
): SafeguardingScanResult {
  const lookback = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const asOf = options.asOf ? new Date(options.asOf) : new Date();
  const windowEnd = isoDate(asOf);
  const start = new Date(asOf);
  start.setDate(start.getDate() - lookback);
  const windowStart = isoDate(start);

  const detected: DetectedPattern[] = [
    ...detectRepeatMissing(homeId, windowStart, windowEnd),
    ...detectRepeatRestraint(homeId, windowStart, windowEnd),
    ...detectEscalatingSeverity(homeId, windowStart, windowEnd),
    ...detectNightTimeCluster(homeId, windowStart, windowEnd),
    ...detectOversightGap(homeId, windowStart, windowEnd),
  ];

  const persistedPatterns: AriaSafeguardingPattern[] = [];
  const persistedWarnings: AriaEarlyWarning[] = [];
  const detectedAt = new Date().toISOString();

  for (const p of detected) {
    const existing = db.ariaSafeguardingPatterns
      .findOpen(homeId)
      .find(
        (e) => e.pattern_type === p.pattern_type && e.child_id === p.child_id,
      );

    let pattern: AriaSafeguardingPattern;
    if (existing) {
      const updated = db.ariaSafeguardingPatterns.patch(existing.id, {
        title: p.title,
        description: p.description,
        severity: p.severity,
        evidence_refs: p.evidence_refs,
        window_start: p.window_start,
        window_end: p.window_end,
        detected_at: detectedAt,
      });
      pattern = updated ?? existing;
    } else {
      pattern = db.ariaSafeguardingPatterns.create({
        home_id: homeId,
        child_id: p.child_id,
        pattern_type: p.pattern_type,
        title: p.title,
        description: p.description,
        severity: p.severity,
        window_start: p.window_start,
        window_end: p.window_end,
        evidence_refs: p.evidence_refs,
        reflective_prompt: p.reflective_prompt,
        status: "open",
        acknowledged_by: null,
        acknowledged_at: null,
        resolution_note: null,
        is_ai_draft: true,
        detected_at: detectedAt,
      });
    }
    persistedPatterns.push(pattern);

    if (severityToWarning(p.severity)) {
      const existingWarning = db.ariaEarlyWarnings
        .findActive(homeId)
        .find(
          (w) =>
            w.warning_type === p.pattern_type && w.child_id === p.child_id,
        );
      if (!existingWarning) {
        const w = db.ariaEarlyWarnings.create({
          home_id: homeId,
          child_id: p.child_id,
          source_pattern_id: pattern.id,
          warning_type: p.pattern_type,
          title: p.title,
          rationale: p.description,
          severity: p.severity,
          recommended_action: recommendedAction(p),
          status: "active",
          acknowledged_by: null,
          acknowledged_at: null,
          closed_by: null,
          closed_at: null,
          closure_note: null,
          is_ai_draft: true,
        });
        persistedWarnings.push(w);
      } else {
        persistedWarnings.push(existingWarning);
      }
    }
  }

  void options.detectedBy; // currently audited via route layer

  const inspectedIncidents = db.incidents
    .findAll()
    .filter(
      (i) =>
        i.home_id === homeId && i.date >= windowStart && i.date <= windowEnd,
    ).length;
  const inspectedMissing = db.missingEpisodes
    .findAll()
    .filter(
      (m) =>
        m.home_id === homeId &&
        m.date_missing >= windowStart &&
        m.date_missing <= windowEnd,
    ).length;
  const childIdsInHome = new Set(
    db.youngPeople
      .findAll()
      .filter((yp) => yp.home_id === homeId)
      .map((yp) => yp.id),
  );
  const inspectedRestraints = db.restraints.findAll().filter((r) => {
    if (!childIdsInHome.has(r.child_id)) return false;
    const d = (r.date ?? "").slice(0, 10);
    return d >= windowStart && d <= windowEnd;
  }).length;

  return {
    patterns: persistedPatterns,
    warnings: persistedWarnings,
    inspected: {
      incidents: inspectedIncidents,
      missing: inspectedMissing,
      restraints: inspectedRestraints,
      window_start: windowStart,
      window_end: windowEnd,
    },
  };
}

export function _internal_daysAgoIso(days: number): string {
  return daysAgoIso(days);
}
