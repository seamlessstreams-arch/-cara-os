// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Scores the WRITING of a record across six dimensions (0-100): completeness,
// clarity, professional language, factuality, child-centredness, and risk-
// relevance — the things Ofsted look for in case records — using transparent text
// heuristics and word lists (no black box). Produces missing-field detection and
// concrete improvement suggestions, then aggregates to a home-level QA view.
//
// Distinct from the record-quality (workflow) engine, which scores completion /
// timeliness / sign-off / cross-referencing. This scores the prose itself.
//
// Regulatory: CHR 2015 Reg 36 (records), Reg 13 (leadership — quality of records),
// Reg 6/11 (child-centred care). SCCIF: clear, accurate, child-centred records.
// ══════════════════════════════════════════════════════════════════════════════

import type { RecordQualityScore } from "@/types/record-quality";

// ── Input Types ───────────────────────────────────────────────────────────────

export interface RecordInput {
  id: string;
  type: string;                  // "daily_log" | "incident" | "keywork" | ...
  text: string;                  // the narrative being assessed
  expected_fields: string[];     // fields that should be filled for this record type
  present_fields: string[];      // fields actually filled
  child_name?: string;           // used to detect child-centredness
  is_risk_related?: boolean;
  staff_id?: string;
  date?: string;
}

export interface RecordingQualityInput {
  records: RecordInput[];
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type QualityBand = "strong" | "good" | "needs_improvement" | "poor";

export interface ScoredRecord {
  id: string;
  type: string;
  child_name?: string;
  staff_id?: string;
  date?: string;
  overall: number;
  band: QualityBand;
  score: RecordQualityScore;
}

export interface DimensionAverages {
  completeness: number;
  clarity: number;
  professionalLanguage: number;
  factuality: number;
  childCentredness: number;
  riskRelevance: number;
}

export interface RecordingQualityOverview {
  records_scored: number;
  avg_overall: number;
  dimension_averages: DimensionAverages;
  weakest_dimension: keyof DimensionAverages | null;
  below_threshold: number;       // overall < 70
}

export interface RecordingQualityAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  record_id?: string;
}

export interface CaraQualityInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RecordingQualityResult {
  overview: RecordingQualityOverview;
  records: ScoredRecord[];
  alerts: RecordingQualityAlert[];
  insights: CaraQualityInsight[];
}

// ── Word lists & patterns (transparent, no black box) ───────────────────────────

const UNPROFESSIONAL = /\b(kicked off|naughty|attention[\s-]?seeking|manipulativ\w*|playing up|playing games|brat|chav|little (?:monster|terror)|gonna|wanna|kinda|dunno|lol|nightmare child|difficult child|bad kid)\b/gi;
const SPECULATION = /\b(i think|i reckon|probably|maybe|i guess|i feel like|seems to be|presumably|i assume|might just be|can'?t be bothered)\b/gi;
const CHILD_VOICE = /\b(said|told (?:me|staff)|wanted|felt|asked|chose|expressed|would like|enjoyed|didn'?t want|his views?|her views?|their views?|in (?:his|her|their) words)\b/gi;
const STAFF_CENTRIC = /\b(made him|made her|made them|i told (?:him|her|them)|forced|i made)\b/gi;
const RISK_LANG = /\b(risk|safeguard\w*|action taken|reported|escalat\w*|followed up|review\w*|monitor\w*|protect\w*|strateg\w*|notified|plan)\b/gi;
const TIME_OR_QUOTE = /(\b\d{1,2}[:.]\d{2}\b|["'].{3,}["'])/;

function countMatches(re: RegExp, text: string): number {
  const m = text.match(re);
  return m ? m.length : 0;
}
function distinctMatches(re: RegExp, text: string): number {
  const m = text.match(re);
  if (!m) return 0;
  return new Set(m.map((s) => s.toLowerCase())).size;
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Per-dimension scoring ───────────────────────────────────────────────────

export function scoreCompleteness(expected: string[], present: string[]): { score: number; missing: string[] } {
  if (expected.length === 0) return { score: 100, missing: [] };
  const presentSet = new Set(present);
  const missing = expected.filter((f) => !presentSet.has(f));
  const score = clamp(((expected.length - missing.length) / expected.length) * 100, 0, 100);
  return { score, missing };
}

export function scoreClarity(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  let score: number;
  if (words < 8) score = 30;
  else if (words < 15) score = 55;
  else if (words <= 200) score = 95;
  else if (words <= 320) score = 85;
  else score = 70;
  if (words > 15 && !/[.!?]/.test(text)) score = Math.min(score, 70); // run-on with no sentence breaks
  return clamp(score, 0, 100);
}

export function scoreProfessionalLanguage(text: string): number {
  return clamp(100 - 22 * countMatches(UNPROFESSIONAL, text), 15, 100);
}

export function scoreFactuality(text: string): number {
  let score = 88;
  score -= 16 * countMatches(SPECULATION, text);
  if (TIME_OR_QUOTE.test(text)) score += 12; // a time or a direct quote anchors the record in fact
  return clamp(score, 0, 100);
}

export function scoreChildCentredness(text: string, childName?: string): number {
  const voice = distinctMatches(CHILD_VOICE, text);
  const nameMentioned = !!childName && new RegExp(`\\b${escapeRe(childName)}\\b`, "i").test(text);
  let score = 38 + voice * 13 + (nameMentioned ? 15 : 0);
  if (voice === 0 && countMatches(STAFF_CENTRIC, text) > 0) score = Math.min(score, 35); // "done to", not "with"
  return clamp(score, 0, 100);
}

export function scoreRiskRelevance(text: string, isRiskRelated: boolean | undefined): number {
  if (!isRiskRelated) return 100; // not applicable — does not drag the record down
  return clamp(40 + distinctMatches(RISK_LANG, text) * 14, 0, 100);
}

// ── Score one record ────────────────────────────────────────────────────────

export function scoreRecord(r: RecordInput): RecordQualityScore {
  const text = r.text ?? "";
  const { score: completeness, missing } = scoreCompleteness(r.expected_fields ?? [], r.present_fields ?? []);
  const clarity = scoreClarity(text);
  const professionalLanguage = scoreProfessionalLanguage(text);
  const factuality = scoreFactuality(text);
  const childCentredness = scoreChildCentredness(text, r.child_name);
  const riskRelevance = scoreRiskRelevance(text, r.is_risk_related);

  const caraSuggestions: string[] = [];
  if (missing.length > 0) caraSuggestions.push(`Complete the missing field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  if (clarity < 70) caraSuggestions.push("Add detail — record what happened, when, and the outcome, in clear sentences");
  if (professionalLanguage < 80) caraSuggestions.push("Reword informal or labelling language — describe the behaviour, not the child");
  if (factuality < 70) caraSuggestions.push("Separate fact from opinion — record what was observed, and attribute any view clearly");
  if (childCentredness < 70) caraSuggestions.push("Include the child's voice — what they said, wanted or felt, in their words where possible");
  if (riskRelevance < 70 && r.is_risk_related) caraSuggestions.push("State the risk and the action taken, and whether anyone was notified");

  return { completeness, clarity, professionalLanguage, factuality, childCentredness, riskRelevance, missingFields: missing, caraSuggestions };
}

// ── Overall + band ────────────────────────────────────────────────────────────

const WEIGHTS = {
  completeness: 0.22, clarity: 0.14, professionalLanguage: 0.14,
  factuality: 0.16, childCentredness: 0.18, riskRelevance: 0.16,
};

export function overallOf(s: RecordQualityScore): number {
  return clamp(
    s.completeness * WEIGHTS.completeness +
    s.clarity * WEIGHTS.clarity +
    s.professionalLanguage * WEIGHTS.professionalLanguage +
    s.factuality * WEIGHTS.factuality +
    s.childCentredness * WEIGHTS.childCentredness +
    s.riskRelevance * WEIGHTS.riskRelevance,
    0, 100,
  );
}
export function bandOf(overall: number): QualityBand {
  if (overall >= 85) return "strong";
  if (overall >= 70) return "good";
  if (overall >= 50) return "needs_improvement";
  return "poor";
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export function computeRecordingQuality(input: RecordingQualityInput): RecordingQualityResult {
  const records: ScoredRecord[] = input.records.map((r) => {
    const score = scoreRecord(r);
    const overall = overallOf(score);
    return { id: r.id, type: r.type, child_name: r.child_name, staff_id: r.staff_id, date: r.date, overall, band: bandOf(overall), score };
  });
  records.sort((a, b) => a.overall - b.overall); // weakest first

  const n = records.length;
  const avg = (sel: (s: ScoredRecord) => number) => (n === 0 ? 0 : clamp(records.reduce((s, r) => s + sel(r), 0) / n, 0, 100));
  const dimension_averages: DimensionAverages = {
    completeness: avg((r) => r.score.completeness),
    clarity: avg((r) => r.score.clarity),
    professionalLanguage: avg((r) => r.score.professionalLanguage),
    factuality: avg((r) => r.score.factuality),
    childCentredness: avg((r) => r.score.childCentredness),
    riskRelevance: avg((r) => r.score.riskRelevance),
  };
  const weakest_dimension = (Object.keys(dimension_averages) as (keyof DimensionAverages)[])
    .sort((a, b) => dimension_averages[a] - dimension_averages[b])[0] ?? null;

  const overview: RecordingQualityOverview = {
    records_scored: n,
    avg_overall: avg((r) => r.overall),
    dimension_averages,
    weakest_dimension: n > 0 ? weakest_dimension : null,
    below_threshold: records.filter((r) => r.overall < 70).length,
  };

  return { overview, records, alerts: buildAlerts(records, overview), insights: buildInsights(records, overview) };
}

// ── Alerts & insights ──────────────────────────────────────────────────────────

function buildAlerts(records: ScoredRecord[], overview: RecordingQualityOverview): RecordingQualityAlert[] {
  const alerts: RecordingQualityAlert[] = [];
  for (const r of records) {
    if (r.band === "poor" && r.score.riskRelevance < 70) {
      alerts.push({ severity: "high", record_id: r.id, message: `A ${r.type.replace(/_/g, " ")} record${r.child_name ? ` for ${r.child_name}` : ""} is poor quality and weak on risk (${r.overall}/100) — rewrite with the facts and actions` });
    }
  }
  const poor = records.filter((r) => r.band === "poor");
  if (poor.length >= 3) alerts.push({ severity: "medium", message: `${poor.length} records are poor quality — target recording in supervision` });
  if (overview.weakest_dimension && overview.dimension_averages[overview.weakest_dimension] < 60) {
    alerts.push({ severity: "medium", message: `Recording is weakest on ${humanDim(overview.weakest_dimension)} (avg ${overview.dimension_averages[overview.weakest_dimension]}/100) — focus coaching here` });
  }
  return alerts;
}

function buildInsights(records: ScoredRecord[], overview: RecordingQualityOverview): CaraQualityInsight[] {
  const insights: CaraQualityInsight[] = [];
  if (records.length === 0) return insights;

  if (overview.dimension_averages.childCentredness < 65) {
    insights.push({
      severity: "warning",
      text: `Child-centredness is the weakest part of recording (avg ${overview.dimension_averages.childCentredness}/100). Inspectors look for the child's voice in records — coach staff to capture what the child said, wanted or felt, not only what staff did.`,
    });
  }
  if (overview.below_threshold > 0 && overview.below_threshold >= records.length / 2) {
    insights.push({
      severity: "critical",
      text: `${overview.below_threshold} of ${records.length} records score below 70/100. Weak recording undermines an otherwise good home at inspection — prioritise a recording-quality drive and use the per-record suggestions in supervision.`,
    });
  } else if (overview.below_threshold > 0) {
    insights.push({
      severity: "warning",
      text: `${overview.below_threshold} record${overview.below_threshold === 1 ? "" : "s"} fall below 70/100. Each has specific, actionable suggestions — a quick review would lift overall record quality.`,
    });
  }
  if (overview.avg_overall >= 80 && overview.below_threshold === 0) {
    insights.push({
      severity: "positive",
      text: `Recording quality is strong across the home (avg ${overview.avg_overall}/100) — clear, factual and child-centred records are a real asset at inspection. Keep modelling and quality-assuring it.`,
    });
  }
  return insights;
}

function humanDim(d: keyof DimensionAverages): string {
  return ({
    completeness: "completeness", clarity: "clarity", professionalLanguage: "professional language",
    factuality: "factuality", childCentredness: "the child's voice", riskRelevance: "risk relevance",
  } as Record<string, string>)[d] ?? d;
}
