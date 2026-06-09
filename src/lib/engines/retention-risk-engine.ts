// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RETENTION & SUPPORT-INDICATOR ENGINE (pure / deterministic)
//
// A NON-CLINICAL view of where staff may need support, to help managers offer
// timely help and protect retention. Fans in everyday operational signals —
// missed supervision, low wellbeing/confidence support indicators, overdue
// training, repeated incident involvement, high overtime, sickness pattern and
// probation — into a per-staff "support indicator" level.
//
// HARD RULE (spec §11): these are SUPPORT / RETENTION-RISK indicators ONLY.
// They are never a diagnosis, a mental-health assessment, or a judgement about
// the person. The wording across the engine and UI must reflect this. The point
// is to OFFER SUPPORT — never to label.
// ══════════════════════════════════════════════════════════════════════════════

export const RETENTION_DISCLAIMER =
  "These are non-clinical support indicators to help you offer timely support and protect retention — not a diagnosis, a mental-health assessment, or a judgement about the person. Use them to start a supportive conversation, never to label.";

export type SupervisionStatusLite = "current" | "due_soon" | "overdue" | "never";

export interface StaffSignalsInput {
  staff_id: string;
  staff_name: string;
  role?: string | null;
  supervision_status?: SupervisionStatusLite | null;
  wellbeing_score?: number | null;        // 1–5 (from latest supervision)
  confidence_score?: number | null;       // 1–5
  overdue_training_count?: number;
  incidents_recent?: number;              // incident involvement in look-back window
  overtime_minutes_30d?: number;
  sickness_days_90d?: number;
  in_probation?: boolean;
}

export interface SupportIndicator {
  key: string;
  label: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export type RetentionBand = "settled" | "watch" | "support" | "priority";

export interface StaffRetentionResult {
  staff_id: string;
  staff_name: string;
  role: string | null;
  score: number;
  band: RetentionBand;
  indicators: SupportIndicator[];
  suggested_support: string[];
}

export interface RetentionOverview {
  summary: { total: number; settled: number; watch: number; support: number; priority: number; with_indicators: number };
  by_staff: StaffRetentionResult[];
  top_drivers: { key: string; label: string; count: number }[];
  headline: string;
  disclaimer: string;
}

const BAND_RANK: Record<RetentionBand, number> = { priority: 0, support: 1, watch: 2, settled: 3 };

export function bandFor(score: number): RetentionBand {
  if (score >= 7) return "priority";
  if (score >= 4) return "support";
  if (score >= 2) return "watch";
  return "settled";
}

const SUPPORT_BY_KEY: Record<string, string> = {
  supervision: "Book a supervision and a check-in.",
  wellbeing: "Offer a wellbeing conversation, review workload and signpost support (e.g. EAP).",
  confidence: "Pair with a mentor, use reflective supervision and affirm strengths.",
  training: "Schedule the overdue training and protect time to complete it.",
  incidents: "Offer a debrief and reflective support after recent incidents.",
  overtime: "Review the rota and protect rest days to prevent fatigue.",
  sickness: "Hold a supportive return-to-work conversation and check what would help.",
  probation: "Provide structured probation support with regular check-ins.",
};

export function computeRetentionRisk(input: { staff: StaffSignalsInput[] }): RetentionOverview {
  const by_staff: StaffRetentionResult[] = input.staff.map((s) => {
    const indicators: SupportIndicator[] = [];
    let score = 0;

    // missed supervision
    if (s.supervision_status === "never") { score += 3; indicators.push({ key: "supervision", label: "No supervision on record", severity: "high", note: "No reflective supervision recorded — overdue a check-in." }); }
    else if (s.supervision_status === "overdue") { score += 2; indicators.push({ key: "supervision", label: "Supervision overdue", severity: "medium", note: "Supervision is past due — book one soon." }); }

    // low wellbeing (support indicator, not a diagnosis)
    if ((s.wellbeing_score ?? 5) <= 2) { score += 3; indicators.push({ key: "wellbeing", label: "Low wellbeing indicator", severity: "high", note: "Recent supervision noted low wellbeing — offer support." }); }
    else if ((s.wellbeing_score ?? 5) === 3) { score += 1; indicators.push({ key: "wellbeing", label: "Wellbeing worth watching", severity: "low", note: "Wellbeing mid-range — keep an eye and check in." }); }

    // low confidence
    if ((s.confidence_score ?? 5) <= 2) { score += 1; indicators.push({ key: "confidence", label: "Building confidence", severity: "low", note: "Lower confidence — developmental support and reassurance." }); }

    // overdue training
    const ot = s.overdue_training_count ?? 0;
    if (ot >= 3) { score += 2; indicators.push({ key: "training", label: `${ot} training items overdue`, severity: "medium", note: "Several mandatory training items overdue." }); }
    else if (ot >= 1) { score += 1; indicators.push({ key: "training", label: `${ot} training item${ot === 1 ? "" : "s"} overdue`, severity: "low", note: "Training currency slipping." }); }

    // repeated incident involvement
    const inc = s.incidents_recent ?? 0;
    if (inc >= 3) { score += 2; indicators.push({ key: "incidents", label: `Involved in ${inc} recent incidents`, severity: "medium", note: "Repeated incident involvement — may benefit from debrief and support." }); }
    else if (inc >= 1) { score += 1; indicators.push({ key: "incidents", label: `Involved in ${inc} recent incident${inc === 1 ? "" : "s"}`, severity: "low", note: "Recent incident involvement — offer a debrief." }); }

    // high overtime
    const ovt = s.overtime_minutes_30d ?? 0;
    if (ovt >= 1200) { score += 2; indicators.push({ key: "overtime", label: `${Math.round(ovt / 60)}h overtime (30d)`, severity: "medium", note: "High overtime — watch for fatigue and protect rest." }); }
    else if (ovt >= 600) { score += 1; indicators.push({ key: "overtime", label: `${Math.round(ovt / 60)}h overtime (30d)`, severity: "low", note: "Notable overtime — keep an eye on workload." }); }

    // sickness pattern
    const sick = s.sickness_days_90d ?? 0;
    if (sick >= 5) { score += 2; indicators.push({ key: "sickness", label: `${sick} sickness days (90d)`, severity: "medium", note: "Sickness pattern — a supportive conversation may help." }); }
    else if (sick >= 2) { score += 1; indicators.push({ key: "sickness", label: `${sick} sickness days (90d)`, severity: "low", note: "Some recent sickness — check what would help." }); }

    // probation (a support window, not a negative)
    if (s.in_probation) { score += 1; indicators.push({ key: "probation", label: "In probation", severity: "low", note: "New starter in probation — structured support window." }); }

    const band = bandFor(score);
    const keys = [...new Set(indicators.map((i) => i.key))];
    const suggested_support = keys.map((k) => SUPPORT_BY_KEY[k]).filter(Boolean);

    return { staff_id: s.staff_id, staff_name: s.staff_name, role: s.role ?? null, score, band, indicators, suggested_support };
  });

  by_staff.sort((a, b) => b.score - a.score || a.staff_name.localeCompare(b.staff_name));

  const count = (b: RetentionBand) => by_staff.filter((s) => s.band === b).length;
  const summary = {
    total: by_staff.length,
    settled: count("settled"), watch: count("watch"), support: count("support"), priority: count("priority"),
    with_indicators: by_staff.filter((s) => s.indicators.length > 0).length,
  };

  const driverCounts = new Map<string, { label: string; count: number }>();
  for (const s of by_staff) for (const i of s.indicators) {
    const cur = driverCounts.get(i.key);
    if (cur) cur.count++;
    else driverCounts.set(i.key, { label: driverLabel(i.key), count: 1 });
  }
  const top_drivers = [...driverCounts.entries()]
    .map(([key, v]) => ({ key, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const needSupport = summary.support + summary.priority;
  const parts = [`${needSupport} of ${summary.total} staff may need support now`];
  if (summary.priority > 0) parts.push(`${summary.priority} priority`);
  if (summary.watch > 0) parts.push(`${summary.watch} to keep an eye on`);
  const headline = parts.join(" · ") + ".";

  // keep the worst-first ordering by band for ties already handled by score sort
  by_staff.sort((a, b) => BAND_RANK[a.band] - BAND_RANK[b.band] || b.score - a.score || a.staff_name.localeCompare(b.staff_name));

  return { summary, by_staff, top_drivers, headline, disclaimer: RETENTION_DISCLAIMER };
}

function driverLabel(key: string): string {
  return ({
    supervision: "Missed supervision", wellbeing: "Low wellbeing", confidence: "Building confidence",
    training: "Overdue training", incidents: "Incident involvement", overtime: "High overtime",
    sickness: "Sickness pattern", probation: "In probation",
  } as Record<string, string>)[key] ?? key;
}
