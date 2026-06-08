// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MANAGER PRIORITY BRIEFING ENGINE
//
// Pure deterministic meta-engine — no DB calls, no side effects, no LLM calls.
//
// Complements `manager-briefing-intelligence` (which digests 9 core domains in
// depth). This engine performs a BROAD critical-signal SWEEP across the whole
// fleet of `home-*-intelligence` engines, extracting the highest-severity
// signals (critical insights, inadequate/requires-improvement ratings, urgent
// recommendations, concerns) and ranking them into a single "what needs my
// attention today" feed for the Registered Manager.
//
// The route layer fans out to the engine routes and shapes EngineSignalInput[];
// this engine only ranks/rolls-up. Deterministic given `today` ⇒ unit-testable.
//
// Regulatory framing: CHR 2015 Reg 5 (RM oversight duties); SCCIF leadership &
// management (effective use of monitoring to drive improvement).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

/** One engine's already-extracted signal payload (shaped by the route layer). */
export interface EngineSignalInput {
  engine_key: string; // route slug, e.g. "home-self-harm-safety-plan-intelligence"
  label: string; // human label, e.g. "Self-harm safety plans"
  domain: string; // grouping, e.g. "protection"
  rating: string | null; // e.g. "inadequate" | "requires_improvement" | "good" | null
  score: number | null;
  headline: string | null;
  insights: Array<{ text: string; severity: string }>;
  concerns: string[];
  recommendations: Array<{ text: string; urgency: string; regulatory_ref: string | null }>;
}

export interface ManagerPriorityBriefingInput {
  signals: EngineSignalInput[];
  engines_queried: number;
  engines_responded: number;
  today?: string;
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type SignalSeverity = "critical" | "high" | "warning" | "watch";
export type OverallStatus = "critical" | "elevated" | "watch" | "stable";
export type DomainStatus = "red" | "amber" | "green";

export interface PrioritySignal {
  rank: number;
  severity: SignalSeverity;
  domain: string;
  source_engine: string; // label
  source_key: string; // route slug (for deep-linking)
  message: string;
  origin: "insight" | "rating" | "concern" | "recommendation";
  regulatory_ref: string | null;
}

export interface DomainRollup {
  domain: string;
  status: DomainStatus;
  critical_count: number;
  high_count: number;
  warning_count: number;
  total_signals: number;
  engines_flagging: number;
}

/** An engine that self-reported it has no data to assess (rating === insufficient_data). */
export interface RecordingGap {
  label: string;
  domain: string;
  message: string;
}

export interface PriorityBriefingResult {
  generated_for: string;
  overall_status: OverallStatus;
  headline: string;
  total_critical: number;
  total_high: number;
  total_warning: number;
  total_watch: number;
  total_signals: number;
  engines_queried: number;
  engines_responded: number;
  domains_at_risk: string[];
  priority_signals: PrioritySignal[];
  domain_rollup: DomainRollup[];
  positives: string[];
  // Engines with no data to assess — surfaced separately so "fill this in" never
  // drowns out genuine active concerns in the priority feed.
  recording_gaps: RecordingGap[];
  total_recording_gaps: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Cap the rendered feed so it stays digestible; counts still reflect the full set. */
const MAX_SIGNALS = 60;
const MAX_POSITIVES = 8;
const MAX_RECORDING_GAPS = 24;

const SEVERITY_ORDER: Record<SignalSeverity, number> = {
  critical: 0,
  high: 1,
  warning: 2,
  watch: 3,
};

// ── Normalisers ───────────────────────────────────────────────────────────────

/** Map an engine insight's free-form severity vocab → our 4-tier scale (or null to drop). */
function normaliseInsightSeverity(raw: string): SignalSeverity | null {
  const s = (raw || "").toLowerCase().trim();
  if (s === "critical" || s === "severe" || s === "red" || s === "life_threatening") return "critical";
  if (s === "high" || s === "urgent") return "high";
  if (s === "warning" || s === "concern" || s === "medium" || s === "amber" || s === "moderate") return "warning";
  if (s === "watch" || s === "low" || s === "minor") return "watch";
  // "positive" / "good" / "green" / "none" / "mild" / "no_harm" / unknown → not an attention signal
  return null;
}

/** Map a domain rating → an attention signal severity (or null if it's fine / no data). */
function ratingToSeverity(rating: string | null): SignalSeverity | null {
  const r = (rating || "").toLowerCase().trim();
  if (r === "inadequate") return "critical";
  if (r === "requires_improvement" || r === "requires improvement") return "high";
  // adequate / good / outstanding / insufficient_data → not flagged
  return null;
}

/** Map a recommendation urgency → severity (or null to drop low-urgency items). */
function urgencyToSeverity(urgency: string): SignalSeverity | null {
  const u = (urgency || "").toLowerCase().trim();
  if (u === "immediate" || u === "emergency" || u === "urgent") return "high";
  if (u === "soon") return "warning";
  // "planned" / "routine" / unknown → too low for the attention feed
  return null;
}

function isPositiveRating(rating: string | null): boolean {
  const r = (rating || "").toLowerCase().trim();
  return r === "good" || r === "outstanding";
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function computeManagerPriorityBriefing(
  input: ManagerPriorityBriefingInput,
): PriorityBriefingResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const signals = input.signals ?? [];

  // 1. Flatten every engine's payload into atomic, severity-tagged signals.
  const collected: Omit<PrioritySignal, "rank">[] = [];
  const positives: string[] = [];
  const recordingGaps: RecordingGap[] = [];

  for (const s of signals) {
    // 0) Recording gap: the engine self-reports it has no data to assess. Its
    //    "no data" insights are a "fill this in" task, not an active concern —
    //    divert it so it never drowns out genuine signals in the priority feed.
    if ((s.rating || "").toLowerCase().trim() === "insufficient_data") {
      const firstCritical = (s.insights ?? []).find((i) => normaliseInsightSeverity(i.severity) != null)?.text?.trim();
      recordingGaps.push({
        label: s.label,
        domain: s.domain,
        message: s.headline?.trim() || firstCritical || "No data recorded yet.",
      });
      continue;
    }

    // a) Rating-derived signal (one per engine, if poor)
    const ratingSev = ratingToSeverity(s.rating);
    if (ratingSev) {
      collected.push({
        severity: ratingSev,
        domain: s.domain,
        source_engine: s.label,
        source_key: s.engine_key,
        message: s.headline?.trim()
          ? s.headline.trim()
          : `${s.label} rated ${(s.rating || "").replace(/_/g, " ")}`,
        origin: "rating",
        regulatory_ref: null,
      });
    }

    // b) Insight-derived signals (only attention-worthy severities)
    for (const ins of s.insights ?? []) {
      const sev = normaliseInsightSeverity(ins.severity);
      const text = (ins.text || "").trim();
      if (sev && text) {
        collected.push({
          severity: sev,
          domain: s.domain,
          source_engine: s.label,
          source_key: s.engine_key,
          message: text,
          origin: "insight",
          regulatory_ref: null,
        });
      }
    }

    // c) Urgent recommendation-derived signals
    for (const rec of s.recommendations ?? []) {
      const sev = urgencyToSeverity(rec.urgency);
      const text = (rec.text || "").trim();
      if (sev && text) {
        collected.push({
          severity: sev,
          domain: s.domain,
          source_engine: s.label,
          source_key: s.engine_key,
          message: text,
          origin: "recommendation",
          regulatory_ref: rec.regulatory_ref?.trim() || null,
        });
      }
    }

    // d) Concerns (plain strings → "watch" tier; only when the engine isn't already
    //    rating-flagged, to avoid drowning the feed in low-signal duplicates).
    if (!ratingSev) {
      for (const c of s.concerns ?? []) {
        const text = (c || "").trim();
        if (text) {
          collected.push({
            severity: "watch",
            domain: s.domain,
            source_engine: s.label,
            source_key: s.engine_key,
            message: text,
            origin: "concern",
            regulatory_ref: null,
          });
        }
      }
    }

    // e) Good-news highlights (balanced briefing)
    if (isPositiveRating(s.rating) && s.headline?.trim()) {
      positives.push(`${s.label}: ${s.headline.trim()}`);
    }
  }

  // 2. Stable rank: severity tier first, then domain, then engine label.
  collected.sort((a, b) => {
    const sv = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sv !== 0) return sv;
    if (a.domain !== b.domain) return a.domain < b.domain ? -1 : 1;
    return a.source_engine < b.source_engine ? -1 : a.source_engine > b.source_engine ? 1 : 0;
  });

  const total_critical = collected.filter((c) => c.severity === "critical").length;
  const total_high = collected.filter((c) => c.severity === "high").length;
  const total_warning = collected.filter((c) => c.severity === "warning").length;
  const total_watch = collected.filter((c) => c.severity === "watch").length;

  const priority_signals: PrioritySignal[] = collected
    .slice(0, MAX_SIGNALS)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  // 3. Domain roll-up.
  const domainMap = new Map<string, { crit: number; high: number; warn: number; total: number; engines: Set<string> }>();
  for (const c of collected) {
    const e = domainMap.get(c.domain) ?? { crit: 0, high: 0, warn: 0, total: 0, engines: new Set<string>() };
    if (c.severity === "critical") e.crit++;
    else if (c.severity === "high") e.high++;
    else if (c.severity === "warning") e.warn++;
    e.total++;
    e.engines.add(c.source_key);
    domainMap.set(c.domain, e);
  }
  const domain_rollup: DomainRollup[] = Array.from(domainMap.entries())
    .map(([domain, e]) => ({
      domain,
      status: (e.crit > 0 ? "red" : e.high > 0 || e.warn > 0 ? "amber" : "green") as DomainStatus,
      critical_count: e.crit,
      high_count: e.high,
      warning_count: e.warn,
      total_signals: e.total,
      engines_flagging: e.engines.size,
    }))
    .sort((a, b) => b.critical_count - a.critical_count || b.high_count - a.high_count || b.total_signals - a.total_signals);

  const domains_at_risk = domain_rollup.filter((d) => d.status !== "green").map((d) => d.domain);

  // 4. Overall status + headline.
  const overall_status: OverallStatus =
    total_critical > 0
      ? "critical"
      : total_high > 0
        ? "elevated"
        : total_warning > 0 || total_watch > 0
          ? "watch"
          : "stable";

  const gapTail = recordingGaps.length > 0
    ? ` ${recordingGaps.length} engine${recordingGaps.length === 1 ? "" : "s"} have no data to assess yet.`
    : "";

  let headline: string;
  if (overall_status === "stable") {
    headline = input.engines_responded === 0
      ? "No intelligence available yet — engines returned no data."
      : `No active concerns across ${input.engines_responded} engines. Routine monitoring only.${gapTail}`;
  } else {
    const parts: string[] = [];
    if (total_critical > 0) parts.push(`${total_critical} critical`);
    if (total_high > 0) parts.push(`${total_high} high-priority`);
    if (total_warning > 0) parts.push(`${total_warning} warning`);
    if (total_watch > 0) parts.push(`${total_watch} to watch`);
    const actionable = total_critical + total_high + total_warning;
    if (domains_at_risk.length > 0) {
      headline = `${parts.join(", ")} signal${actionable === 1 ? "" : "s"} across ${domains_at_risk.length} domain${domains_at_risk.length === 1 ? "" : "s"} need your attention.${gapTail}`;
    } else {
      headline = `${parts.join(", ")} low-level item${total_watch === 1 ? "" : "s"} to keep an eye on; nothing critical or high-priority.${gapTail}`;
    }
  }

  return {
    generated_for: today,
    overall_status,
    headline,
    total_critical,
    total_high,
    total_warning,
    total_watch,
    total_signals: collected.length,
    engines_queried: input.engines_queried,
    engines_responded: input.engines_responded,
    domains_at_risk,
    priority_signals,
    domain_rollup,
    positives: positives.slice(0, MAX_POSITIVES),
    recording_gaps: recordingGaps.slice(0, MAX_RECORDING_GAPS),
    total_recording_gaps: recordingGaps.length,
  };
}
