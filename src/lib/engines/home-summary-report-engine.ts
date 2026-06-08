// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SUMMARY REPORT ENGINE
//
// Pure deterministic meta-engine — no DB calls, no side effects, no LLM calls.
//
// Aggregates the fleet of home-*-intelligence engines into a single, shareable,
// print-ready report of the home's current standing across six domains —
// suitable to hand to the placing authority, trustees/board, or a LAC review.
// Fills a real gap: rich per-engine intelligence existed, but producing a
// structured summary report meant copy-pasting into Word.
//
// The route layer fans out to the engines and shapes ReportSignalInput[]; this
// engine groups them into named sections, computes a RAG status + narrative per
// section, an overall status, and an executive summary. Deterministic given
// `today` ⇒ unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

// ── Sections (canonical order + titles) ───────────────────────────────────────

export const REPORT_SECTIONS: { key: string; title: string }[] = [
  { key: "safeguarding", title: "Safeguarding & Protection" },
  { key: "health", title: "Health & Wellbeing" },
  { key: "education", title: "Education & Outcomes" },
  { key: "relationships", title: "Relationships & Voice" },
  { key: "workforce", title: "Workforce" },
  { key: "leadership", title: "Leadership & Compliance" },
];

// ── Input Types ───────────────────────────────────────────────────────────────

export interface ReportSignalInput {
  engine_key: string;
  label: string;
  section: string; // one of REPORT_SECTIONS keys
  rating: string | null; // outstanding | good | adequate | requires_improvement | inadequate | insufficient_data | null
  score: number | null;
  headline: string | null;
  concerns: string[];
  strengths: string[];
}

export interface HomeSummaryReportInput {
  period_label: string;
  home_name: string;
  total_children: number;
  total_staff: number;
  signals: ReportSignalInput[];
  engines_queried: number;
  engines_responded: number;
  today?: string;
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type SectionStatus = "green" | "amber" | "red" | "no_data";
export type OverallStatus = "good" | "stable" | "needs_attention" | "serious_concern";

export interface ReportSection {
  key: string;
  title: string;
  status: SectionStatus;
  summary: string;
  rated_engines: number;
  avg_score: number | null;
  inadequate: string[]; // engine labels rated inadequate
  requires_improvement: string[]; // engine labels rated requires_improvement
  highlights: string[]; // top concerns to act on
  positives: string[]; // what's working well
}

export interface HomeSummaryReportResult {
  title: string;
  period_label: string;
  generated_for: string;
  home_name: string;
  total_children: number;
  total_staff: number;
  overall_status: OverallStatus;
  executive_summary: string;
  sections: ReportSection[];
  engines_queried: number;
  engines_responded: number;
  // Optional AI-written narrative (route-attached); null when no LLM configured.
  ai_narrative?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_HIGHLIGHTS = 5;
const MAX_POSITIVES = 4;

function norm(rating: string | null): string {
  return (rating || "").toLowerCase().trim();
}

/** Numeric weight for a rating, to derive a section status when scores are sparse. */
function isInadequate(r: string): boolean {
  return r === "inadequate";
}
function isRequiresImprovement(r: string): boolean {
  return r === "requires_improvement" || r === "requires improvement";
}
function isPositive(r: string): boolean {
  return r === "good" || r === "outstanding";
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function computeHomeSummaryReport(input: HomeSummaryReportInput): HomeSummaryReportResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const signals = input.signals ?? [];

  const sections: ReportSection[] = REPORT_SECTIONS.map(({ key, title }) => {
    const mine = signals.filter((s) => s.section === key);
    const rated = mine.filter((s) => {
      const r = norm(s.rating);
      return r !== "" && r !== "insufficient_data";
    });

    const inadequate = rated.filter((s) => isInadequate(norm(s.rating))).map((s) => s.label);
    const requires_improvement = rated.filter((s) => isRequiresImprovement(norm(s.rating))).map((s) => s.label);

    const scores = rated.map((s) => s.score).filter((n): n is number => typeof n === "number");
    const avg_score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    // Status: red if any inadequate; amber if any requires_improvement or avg<60;
    // green if rated and healthy; no_data if nothing rated.
    let status: SectionStatus;
    if (rated.length === 0) status = "no_data";
    else if (inadequate.length > 0) status = "red";
    else if (requires_improvement.length > 0 || (avg_score != null && avg_score < 60)) status = "amber";
    else status = "green";

    // Highlights: a concise concern line per poor-rated engine (headline preferred,
    // else first concern), capped.
    const poor = rated.filter((s) => isInadequate(norm(s.rating)) || isRequiresImprovement(norm(s.rating)));
    const highlights: string[] = [];
    for (const s of poor) {
      const line = s.headline?.trim() || (s.concerns ?? []).find((c) => c.trim())?.trim();
      if (line) highlights.push(`${s.label}: ${line}`);
      if (highlights.length >= MAX_HIGHLIGHTS) break;
    }

    // Positives: strengths from good/outstanding engines (or their headline), capped.
    const positives: string[] = [];
    for (const s of rated.filter((s) => isPositive(norm(s.rating)))) {
      const line = (s.strengths ?? []).find((c) => c.trim())?.trim() || s.headline?.trim();
      if (line) positives.push(`${s.label}: ${line}`);
      if (positives.length >= MAX_POSITIVES) break;
    }

    // Narrative summary line for the section.
    let summary: string;
    if (status === "no_data") {
      summary = `No assessed data for this area${mine.length ? ` (${mine.length} source${mine.length === 1 ? "" : "s"} not yet populated)` : ""}.`;
    } else {
      const parts: string[] = [`${rated.length} area${rated.length === 1 ? "" : "s"} assessed`];
      if (avg_score != null) parts.push(`average score ${avg_score}`);
      if (inadequate.length) parts.push(`${inadequate.length} inadequate`);
      if (requires_improvement.length) parts.push(`${requires_improvement.length} requiring improvement`);
      summary = parts.join(", ") + ".";
    }

    return { key, title, status, summary, rated_engines: rated.length, avg_score, inadequate, requires_improvement, highlights, positives };
  });

  // Overall status from the worst section.
  const anyRed = sections.some((s) => s.status === "red");
  const anyAmber = sections.some((s) => s.status === "amber");
  const anyGreen = sections.some((s) => s.status === "green");
  const overall_status: OverallStatus = anyRed
    ? "serious_concern"
    : anyAmber
      ? "needs_attention"
      : anyGreen
        ? "good"
        : "stable";

  // Executive summary.
  const greenCount = sections.filter((s) => s.status === "green").length;
  const amberCount = sections.filter((s) => s.status === "amber").length;
  const redCount = sections.filter((s) => s.status === "red").length;
  const assessedSections = sections.filter((s) => s.status !== "no_data").length;
  const redOrAmberTitles = sections.filter((s) => s.status === "red" || s.status === "amber").map((s) => s.title);

  let executive_summary: string;
  if (assessedSections === 0) {
    executive_summary = `This report covers ${input.total_children} child${input.total_children === 1 ? "" : "ren"} and ${input.total_staff} staff at ${input.home_name}. No domains have assessed data yet — populate the underlying records to generate a full picture.`;
  } else {
    const lead = `Across ${assessedSections} assessed domain${assessedSections === 1 ? "" : "s"}, ${greenCount} ${greenCount === 1 ? "is" : "are"} rated good or better${amberCount ? `, ${amberCount} need${amberCount === 1 ? "s" : ""} attention` : ""}${redCount ? `, and ${redCount} ${redCount === 1 ? "is a" : "are"} serious concern${redCount === 1 ? "" : "s"}` : ""}.`;
    const focus = redOrAmberTitles.length ? ` Priority areas: ${redOrAmberTitles.join(", ")}.` : " No areas are currently flagged.";
    executive_summary = `This report covers ${input.total_children} child${input.total_children === 1 ? "" : "ren"} and ${input.total_staff} staff at ${input.home_name}.` + ` ${lead}${focus}`;
  }

  return {
    title: `Home Summary Report — ${input.home_name}`,
    period_label: input.period_label,
    generated_for: today,
    home_name: input.home_name,
    total_children: input.total_children,
    total_staff: input.total_staff,
    overall_status,
    executive_summary,
    sections,
    engines_queried: input.engines_queried,
    engines_responded: input.engines_responded,
  };
}
