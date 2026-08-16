// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PROGRESS SUMMARY (deterministic)
//
// /children/progress had a "Request Cara Progress Summary" button that revealed
// three HARDCODED paragraphs of prose — the same words about the same child
// whichever child was selected, whatever the goals and outcome scores actually
// said, labelled "Cara suggested draft".
//
// The two buttons under it, "Copy to Clipboard" and "Add to Report", were dead
// (#934 baseline). That inertness is the only thing that kept the text on the
// page. Wiring them as they stood would have carried invented prose about a
// child's progress into a real record — the fabricated-narrative prohibition,
// completed rather than closed.
//
// So the narrative is computed here instead, from the records the page has
// already loaded. Every sentence names its source. Where there is nothing to
// say, it says that: no goals recorded reads as "no goals recorded", never as
// steady progress.
// ══════════════════════════════════════════════════════════════════════════════

export interface SummaryGoal {
  title: string;
  status: "on_track" | "at_risk" | "achieved" | "not_started";
  progress: number;
  area: string;
}

export interface SummaryEntry {
  date: string;
  area: string;
  description: string;
  impactNote: string;
}

export interface SummaryOutcome {
  domain: string;
  score: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
}

export interface ProgressSummaryInput {
  childName: string;
  goals: SummaryGoal[];
  entries: SummaryEntry[];
  outcomes: SummaryOutcome[];
}

const list = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Staff-written text rarely ends in a full stop; without one the next
 *  sentence runs into it. Punctuation is added, never words. */
const sentence = (s: string): string => {
  const t = s.trim();
  return !t || /[.!?]$/.test(t) ? t : `${t}.`;
};

/**
 * A progress summary that only says what the records support.
 *
 * Returns paragraphs rather than one blob so the page can render them, and
 * `hasContent: false` when there is nothing recorded at all — the caller shows
 * the empty state instead of a summary that reads as if the month went fine.
 */
export function buildProgressSummary(input: ProgressSummaryInput): {
  paragraphs: string[];
  hasContent: boolean;
} {
  const { childName, goals, entries, outcomes } = input;
  const paragraphs: string[] = [];

  if (goals.length === 0 && entries.length === 0 && outcomes.length === 0) {
    return {
      hasContent: false,
      paragraphs: [
        `There is nothing recorded for ${childName} yet — no goals, no progress entries and no outcome scores. ` +
          `A summary cannot be written from an empty record, and an empty record is not the same as no progress.`,
      ],
    };
  }

  // ── Goals ──────────────────────────────────────────────────────────────
  if (goals.length > 0) {
    const achieved = goals.filter((g) => g.status === "achieved");
    const atRisk = goals.filter((g) => g.status === "at_risk");
    const notStarted = goals.filter((g) => g.status === "not_started");
    const onTrack = goals.filter((g) => g.status === "on_track");

    const parts: string[] = [
      `${childName} has ${plural(goals.length, "goal", "goals")} recorded.`,
    ];
    if (achieved.length) parts.push(`${plural(achieved.length, "is", "are")} achieved (${list(achieved.map((g) => g.title))}).`);
    if (onTrack.length) parts.push(`${plural(onTrack.length, "is", "are")} on track.`);
    if (atRisk.length) parts.push(`${plural(atRisk.length, "is", "are")} flagged at risk — ${list(atRisk.map((g) => g.title))}.`);
    if (notStarted.length) parts.push(`${plural(notStarted.length, "has", "have")} not been started.`);
    paragraphs.push(parts.join(" "));
  } else {
    paragraphs.push(`No goals are recorded for ${childName}, so progress against goals cannot be described.`);
  }

  // ── Outcome scores ─────────────────────────────────────────────────────
  if (outcomes.length > 0) {
    const up = outcomes.filter((o) => o.trend === "up");
    const down = outcomes.filter((o) => o.trend === "down");
    const stable = outcomes.filter((o) => o.trend === "stable");

    const parts: string[] = [
      `Outcome scores are recorded across ${plural(outcomes.length, "domain", "domains")}.`,
    ];
    if (up.length) parts.push(`${up.length} improved (${list(up.map((o) => `${o.domain} ${o.previousScore}→${o.score}`))}).`);
    if (down.length) parts.push(`${down.length} fell (${list(down.map((o) => `${o.domain} ${o.previousScore}→${o.score}`))}).`);
    if (stable.length) parts.push(`${plural(stable.length, "is", "are")} unchanged.`);
    // No overall verdict. A count of improving domains is a fact; "trajectory
    // is positive" is a judgement, and it is the manager's to make.
    paragraphs.push(parts.join(" "));
  } else {
    paragraphs.push("No outcome scores have been recorded for this period.");
  }

  // ── Recorded progress entries ──────────────────────────────────────────
  if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    // Sorted, not in order of most recent mention: the same records must
    // produce the same sentence every time it is generated, or two copies of
    // "the same" summary in a file disagree.
    const areas = [...new Set(sorted.map((e) => e.area))].sort();
    const withImpact = sorted.filter((e) => e.impactNote.trim());
    const parts: string[] = [
      `${plural(entries.length, "progress entry has", "progress entries have")} been recorded, covering ${list(areas)}.`,
      `The most recent is dated ${sorted[0].date}: ${sentence(sorted[0].description)}`,
    ];
    if (withImpact.length) {
      parts.push(`${plural(withImpact.length, "entry records", "entries record")} the impact on ${childName}.`);
    } else {
      parts.push("None of the entries record what difference it made — that gap is worth closing before the next review.");
    }
    paragraphs.push(parts.join(" "));
  } else {
    paragraphs.push("No progress entries have been recorded, so there is no day-to-day evidence behind these scores.");
  }

  return { paragraphs, hasContent: true };
}

/** The same summary as one block of text, for the clipboard. */
export function progressSummaryText(input: ProgressSummaryInput): string {
  return buildProgressSummary(input).paragraphs.join("\n\n");
}
