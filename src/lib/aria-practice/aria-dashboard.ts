// ══════════════════════════════════════════════════════════════════════════════
// ARIA PRACTICE INTELLIGENCE — DASHBOARD AGGREGATOR
//
// Pure, deterministic aggregation of persisted ARIA practice signals into the
// manager / RI dashboard cards: gap heatmap, practice-drift warnings, protective-
// factor weaknesses, relationship-depth map, threshold watchlist, wellbeing
// signals (role-restricted) and the safeguarding culture radar.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  AriaPracticeFlag,
  AriaThresholdConsultation,
  AriaStaffWellbeingSignal,
  AriaDevelopmentalGapRecord,
  AriaProtectiveFactorReview,
  AriaRelationshipDepthReview,
  AriaPracticeAssessment,
  AriaSeverity,
} from "./types";

export interface PracticeDashboardInput {
  flags: AriaPracticeFlag[];
  thresholdConsultations: AriaThresholdConsultation[];
  wellbeingSignals: AriaStaffWellbeingSignal[];
  developmentalGaps: AriaDevelopmentalGapRecord[];
  protectiveFactorReviews: AriaProtectiveFactorReview[];
  relationshipDepthReviews: AriaRelationshipDepthReview[];
  assessments: AriaPracticeAssessment[];
  /** Role-derived: may the viewer see staff wellbeing signals for others? */
  canSeeWellbeing: boolean;
  /** The viewer's own staff id — they may always see their own wellbeing. */
  viewerStaffId?: string | null;
}

export interface CultureRadarIndicator {
  key: string;
  label: string;
  level: AriaSeverity;
  detail: string;
  count: number;
}

export interface PracticeDashboard {
  summary: {
    openFlags: number;
    criticalFlags: number;
    highFlags: number;
    managerReviewQueue: number;
    riReviewQueue: number;
    avgPracticeQuality: number | null;
  };
  openFlags: AriaPracticeFlag[];
  developmentalGapHeatmap: {
    byChild: Record<string, Record<string, number>>;
    byDomain: Record<string, number>;
  };
  practiceDriftWarnings: AriaPracticeFlag[];
  protectiveFactorWeaknesses: Array<{ source: "flag" | "review"; childId: string | null; description: string; severity: AriaSeverity }>;
  relationshipDepthMap: Array<{ childId: string | null; stageOrFlag: string; detail: string }>;
  thresholdWatchlist: Array<{ id: string; childId: string | null; kind: string; severity: AriaSeverity; title: string; strategyDiscussion?: boolean; lado?: boolean }>;
  staffWellbeingSignals: AriaStaffWellbeingSignal[];
  cultureRadar: CultureRadarIndicator[];
}

const DRIFT_TYPES = new Set(["activity_over_impact", "vague_recording", "weak_child_voice", "culture_drift", "risk_drift"]);

function sev(count: number): AriaSeverity {
  if (count >= 6) return "high";
  if (count >= 3) return "medium";
  return "low";
}

export function buildPracticeDashboard(input: PracticeDashboardInput): PracticeDashboard {
  const open = input.flags.filter((f) => !f.resolved);

  // Heatmap — from persisted developmental-gap records + developmental_gap flags.
  const byChild: Record<string, Record<string, number>> = {};
  const byDomain: Record<string, number> = {};
  const addGap = (childId: string | null, domain: string) => {
    const c = childId ?? "unassigned";
    byChild[c] = byChild[c] ?? {};
    byChild[c][domain] = (byChild[c][domain] ?? 0) + 1;
    byDomain[domain] = (byDomain[domain] ?? 0) + 1;
  };
  for (const g of input.developmentalGaps) addGap(g.child_id, g.domain);
  for (const f of open.filter((x) => x.flag_type === "developmental_gap")) {
    for (const d of (f.evidence ?? "").split(";").map((s) => s.trim()).filter(Boolean)) addGap(f.child_id, d);
  }

  // Practice drift.
  const practiceDriftWarnings = open.filter((f) => DRIFT_TYPES.has(f.flag_type as string));

  // Protective-factor weaknesses.
  const protectiveFactorWeaknesses = [
    ...open
      .filter((f) => f.flag_type === "overstated_protective_factor")
      .map((f) => ({ source: "flag" as const, childId: f.child_id, description: f.title, severity: f.severity })),
    ...input.protectiveFactorReviews
      .filter((r) => !r.is_real)
      .map((r) => ({ source: "review" as const, childId: r.child_id, description: r.factor_description, severity: r.risk_of_overstatement })),
  ];

  // Relationship-depth map.
  const relationshipDepthMap = [
    ...open
      .filter((f) => f.flag_type === "relationship_depth")
      .map((f) => ({ childId: f.child_id, stageOrFlag: f.title, detail: f.description })),
    ...input.relationshipDepthReviews.map((r) => ({ childId: r.child_id, stageOrFlag: r.stage_label, detail: r.next_relational_step })),
  ];

  // Threshold / LADO watchlist.
  const thresholdWatchlist = [
    ...open
      .filter((f) => ["safeguarding_threshold", "immediate_safety", "lado_consideration"].includes(f.flag_type as string))
      .map((f) => ({ id: f.id, childId: f.child_id, kind: f.flag_type as string, severity: f.severity, title: f.title })),
    ...input.thresholdConsultations
      .filter((c) => !c.manager_decision)
      .map((c) => ({
        id: c.id,
        childId: c.child_id,
        kind: "threshold_consultation",
        severity: (c.emergency_action_recommended ? "critical" : "high") as AriaSeverity,
        title: c.aria_summary || "Threshold consultation",
        strategyDiscussion: c.strategy_discussion_recommended,
        lado: c.lado_consultation_recommended,
      })),
  ];

  // Staff wellbeing — role-restricted.
  const staffWellbeingSignals = input.wellbeingSignals.filter(
    (s) => input.canSeeWellbeing || (input.viewerStaffId != null && s.staff_id === input.viewerStaffId),
  );

  // Culture radar — derived from flag patterns.
  const driftCount = practiceDriftWarnings.length;
  const sgCount = open.filter((f) => ["safeguarding_threshold", "immediate_safety"].includes(f.flag_type as string)).length;
  const vagueCount = open.filter((f) => f.flag_type === "vague_recording").length;
  const cultureRadar: CultureRadarIndicator[] = [];
  if (driftCount > 0)
    cultureRadar.push({ key: "compliance_over_impact", label: "Compliance over impact", level: sev(driftCount), detail: `${driftCount} record(s) document activity without evidencing child impact.`, count: driftCount });
  if (sgCount >= 3)
    cultureRadar.push({ key: "normalised_risk", label: "Risk may be normalising", level: sev(sgCount), detail: `${sgCount} unresolved safeguarding signal(s) — guard against high-risk becoming routine.`, count: sgCount });
  if (vagueCount >= 3)
    cultureRadar.push({ key: "recording_over_relationships", label: "Recording replacing relationships", level: sev(vagueCount), detail: `${vagueCount} vague record(s) — ensure children stay more visible than paperwork.`, count: vagueCount });

  const qualityScores = input.assessments.map((a) => a.overall_practice_quality_score).filter((n) => typeof n === "number");
  const avgPracticeQuality = qualityScores.length ? Math.round(qualityScores.reduce((s, n) => s + n, 0) / qualityScores.length) : null;

  return {
    summary: {
      openFlags: open.length,
      criticalFlags: open.filter((f) => f.severity === "critical").length,
      highFlags: open.filter((f) => f.severity === "high").length,
      managerReviewQueue: open.filter((f) => f.requires_manager_review).length,
      riReviewQueue: open.filter((f) => f.requires_ri_review).length,
      avgPracticeQuality,
    },
    openFlags: open,
    developmentalGapHeatmap: { byChild, byDomain },
    practiceDriftWarnings,
    protectiveFactorWeaknesses,
    relationshipDepthMap,
    thresholdWatchlist,
    staffWellbeingSignals,
    cultureRadar,
  };
}
