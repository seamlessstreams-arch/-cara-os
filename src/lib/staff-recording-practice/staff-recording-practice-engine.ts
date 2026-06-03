// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RECORDING PRACTICE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Composes the Recording Quality engine: it takes the per-record quality scores
// and rolls them up BY STAFF MEMBER, so a manager can see whose recording is
// strong and whose needs coaching — and on which dimension. This turns recording
// quality into a concrete, named supervision input (distinct from the existing
// staff engines, which cover supervision/training compliance, not the writing).
//
// Regulatory: CHR 2015 Reg 33 (supervision & staff development), Reg 36 (records),
// Reg 13 (leadership oversight of record quality). SCCIF: staff are supported to
// record well; leaders know their team's practice.
// ══════════════════════════════════════════════════════════════════════════════

import type { ScoredRecord, QualityBand, DimensionAverages } from "@/lib/recording-quality/recording-quality-engine";
import { bandOf } from "@/lib/recording-quality/recording-quality-engine";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface StaffRecordingPracticeInput {
  records: ScoredRecord[];           // output of computeRecordingQuality
  staff?: { id: string; name: string }[];
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface StaffPractice {
  staff_id: string;
  staff_name: string;
  records_authored: number;
  avg_overall: number;
  band: QualityBand;
  dimension_averages: DimensionAverages;
  weakest_dimension: keyof DimensionAverages;
  poor_count: number;
  below_threshold: number;           // overall < 70
  top_suggestion: string | null;     // most common improvement theme for this staff member
}

export interface StaffRecordingOverview {
  staff_analysed: number;
  home_avg_overall: number;
  needing_support: number;           // staff whose avg band is needs_improvement/poor
  strongest_staff: string | null;
  weakest_staff: string | null;
}

export interface StaffRecordingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  staff_id?: string;
}

export interface AriaStaffRecordingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface StaffRecordingPracticeResult {
  overview: StaffRecordingOverview;
  staff_profiles: StaffPractice[];
  alerts: StaffRecordingAlert[];
  insights: AriaStaffRecordingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DIM_KEYS: (keyof DimensionAverages)[] = [
  "completeness", "clarity", "professionalLanguage", "factuality", "childCentredness", "riskRelevance",
];
const DIM_HUMAN: Record<string, string> = {
  completeness: "completeness", clarity: "clarity", professionalLanguage: "professional language",
  factuality: "factuality", childCentredness: "the child's voice", riskRelevance: "risk relevance",
};

function round(n: number): number { return Math.round(n); }

/** Map a full suggestion sentence to a short coaching theme. */
export function suggestionTheme(s: string): string {
  if (/child'?s voice/i.test(s)) return "capture the child's voice";
  if (/add detail/i.test(s)) return "add more detail";
  if (/missing field/i.test(s)) return "complete all fields";
  if (/reword/i.test(s)) return "professional language";
  if (/separate fact/i.test(s)) return "fact vs opinion";
  if (/state the risk/i.test(s)) return "record risk & actions";
  return s.slice(0, 40);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeStaffRecordingPractice(input: StaffRecordingPracticeInput): StaffRecordingPracticeResult {
  const nameById = new Map((input.staff ?? []).map((s) => [s.id, s.name]));

  // Group scored records by author.
  const byStaff = new Map<string, ScoredRecord[]>();
  for (const r of input.records) {
    if (!r.staff_id) continue;
    const arr = byStaff.get(r.staff_id) ?? [];
    arr.push(r);
    byStaff.set(r.staff_id, arr);
  }

  const staff_profiles: StaffPractice[] = [];
  for (const [staffId, recs] of byStaff) {
    const n = recs.length;
    const avgDim = (k: keyof DimensionAverages) => round(recs.reduce((s, r) => s + r.score[k], 0) / n);
    const dimension_averages: DimensionAverages = {
      completeness: avgDim("completeness"),
      clarity: avgDim("clarity"),
      professionalLanguage: avgDim("professionalLanguage"),
      factuality: avgDim("factuality"),
      childCentredness: avgDim("childCentredness"),
      riskRelevance: avgDim("riskRelevance"),
    };
    const weakest_dimension = [...DIM_KEYS].sort((a, b) => dimension_averages[a] - dimension_averages[b])[0];
    const avg_overall = round(recs.reduce((s, r) => s + r.overall, 0) / n);

    // Most common improvement theme across this member's records.
    const themeCounts = new Map<string, number>();
    for (const r of recs) for (const sug of r.score.ariaSuggestions) {
      const t = suggestionTheme(sug);
      themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
    }
    const top_suggestion = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    staff_profiles.push({
      staff_id: staffId,
      staff_name: nameById.get(staffId) ?? staffId,
      records_authored: n,
      avg_overall,
      band: bandOf(avg_overall),
      dimension_averages,
      weakest_dimension,
      poor_count: recs.filter((r) => r.band === "poor").length,
      below_threshold: recs.filter((r) => r.overall < 70).length,
      top_suggestion,
    });
  }

  staff_profiles.sort((a, b) => a.avg_overall - b.avg_overall); // weakest practice first

  const overview = buildOverview(staff_profiles);
  const alerts = buildAlerts(staff_profiles);
  const insights = buildInsights(staff_profiles, overview);

  return { overview, staff_profiles, alerts, insights };
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function buildOverview(profiles: StaffPractice[]): StaffRecordingOverview {
  const n = profiles.length;
  const weakest = profiles[0] ?? null;          // sorted weakest-first
  const strongest = profiles[n - 1] ?? null;
  return {
    staff_analysed: n,
    home_avg_overall: n === 0 ? 0 : round(profiles.reduce((s, p) => s + p.avg_overall, 0) / n),
    needing_support: profiles.filter((p) => p.band === "needs_improvement" || p.band === "poor").length,
    strongest_staff: strongest && strongest.avg_overall > 0 ? strongest.staff_name : null,
    weakest_staff: weakest && (weakest.band === "needs_improvement" || weakest.band === "poor") ? weakest.staff_name : null,
  };
}

function buildAlerts(profiles: StaffPractice[]): StaffRecordingAlert[] {
  const alerts: StaffRecordingAlert[] = [];
  for (const p of profiles) {
    if (p.band === "poor") {
      alerts.push({ severity: "high", staff_id: p.staff_id, message: `${p.staff_name}'s recording averages ${p.avg_overall}/100 (poor) across ${p.records_authored} record${p.records_authored === 1 ? "" : "s"} — prioritise in supervision` });
    } else if (p.band === "needs_improvement") {
      alerts.push({ severity: "medium", staff_id: p.staff_id, message: `${p.staff_name}'s recording needs improvement (${p.avg_overall}/100), weakest on ${DIM_HUMAN[p.weakest_dimension] ?? p.weakest_dimension}` });
    }
  }
  return alerts;
}

function buildInsights(profiles: StaffPractice[], overview: StaffRecordingOverview): AriaStaffRecordingInsight[] {
  const insights: AriaStaffRecordingInsight[] = [];
  if (profiles.length === 0) return insights;

  // Is the child's voice a team-wide gap?
  const voiceWeak = profiles.filter((p) => p.weakest_dimension === "childCentredness");
  if (voiceWeak.length >= Math.max(2, Math.ceil(profiles.length / 2))) {
    insights.push({
      severity: "warning",
      text: `For ${voiceWeak.length} of ${profiles.length} staff, the child's voice is their weakest recording dimension — this is a team-wide coaching theme, not just individuals. A short group session on capturing the child's words would lift records across the home.`,
    });
  }

  if (overview.needing_support > 0) {
    const names = profiles.filter((p) => p.band === "needs_improvement" || p.band === "poor").slice(0, 3).map((p) => p.staff_name).join(", ");
    insights.push({
      severity: overview.needing_support >= profiles.length / 2 ? "critical" : "warning",
      text: `${overview.needing_support} staff member${overview.needing_support === 1 ? "" : "s"} would benefit from recording support (${names}). Each has a named weakest dimension and a top suggestion — use them as concrete supervision targets with examples from their own records.`,
    });
  }

  if (overview.strongest_staff && overview.needing_support === 0) {
    insights.push({
      severity: "positive",
      text: `Recording practice is consistently strong across the team (home average ${overview.home_avg_overall}/100), led by ${overview.strongest_staff}. Consider peer modelling — strong recorders supporting others sustains quality better than top-down correction.`,
    });
  }
  return insights;
}
