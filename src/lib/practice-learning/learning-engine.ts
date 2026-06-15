// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEARNING ENGINE (Layer 5)
//
// learnFromEvents(input) → a retrospective learning record: what worked, what
// didn't, what to do differently, recurring learning themes, durable
// organisational memory, and forward-looking watch-points ("what Cara should
// learn"). Pure + deterministic; every theme/watch-point is evidence-counted.
// ══════════════════════════════════════════════════════════════════════════════

import {
  LEARNING_ENGINE_VERSION,
  LEARNING_DISCLAIMER,
  type LearningInput,
  type LearningRecord,
  type LearningTheme,
  type WatchPoint,
  type Confidence,
} from "./types";

// Curated, deterministic theme patterns mined from event text. Each maps to a
// human theme label and (where it recurs) a forward-looking watch-point.
const THEME_PATTERNS: Array<{ key: string; label: string; re: RegExp; watch: string }> = [
  {
    key: "family_contact",
    label: "Distress around family contact",
    re: /\bfamily\b|\bcontact\b|phone call|\bparent\b|mother|father|\bvisit\b/i,
    watch: "When family contact is upcoming, consider pre-contact preparation and a trusted adult on hand.",
  },
  {
    key: "community",
    label: "Risk during community / unsupervised time",
    re: /communit|unsupervised|\bpark\b|\btown\b|outside the home/i,
    watch: "Review the plan for community / unsupervised time and agree a clear return arrangement.",
  },
  {
    key: "transitions",
    label: "Difficult transitions, news or changes to plan",
    re: /refused|\bchange|transition|\bnews\b|\bcourt\b|leaving|moving|told (?:that|about)/i,
    watch: "Prepare for known transitions and difficult news, and plan how it will be shared and supported.",
  },
  {
    key: "exploitation",
    label: "Possible exploitation / extra-familial risk",
    re: /exploit|county lines|carry items|grooming|older peer|missing/i,
    watch: "Hold a contextual-safeguarding lens and keep the multi-agency picture current.",
  },
  {
    key: "evening_night",
    label: "Evening / night-time escalation",
    re: /evening|night|bedtime|\blate\b|\b1[0-9]:[0-5][0-9]|\b2[0-3]:[0-5][0-9]/i,
    watch: "Consider staffing, routine and wind-down support at higher-risk times of day.",
  },
  {
    key: "education",
    label: "Education-related distress",
    re: /\bschool\b|education|\bclass\b|teacher|college|\bAP\b/i,
    watch: "Coordinate with education and plan support around school pressure points.",
  },
];

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = norm(raw);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function freqConfidence(freq: number): Confidence {
  return freq >= 4 ? "high" : freq >= 2 ? "medium" : "low";
}

export function learnFromEvents(input: LearningInput): LearningRecord {
  const events = input.events;
  const n = events.length;

  // ── Aggregate the recorded learning ────────────────────────────────────────
  const whatWorked = dedupe(events.flatMap((e) => e.whatWorked));
  const whatDidntWork = dedupe(events.flatMap((e) => e.whatDidntWork));
  const doDifferently = dedupe([
    ...events.flatMap((e) => e.lessonsLearned),
    ...events.flatMap((e) => e.changesNeeded),
  ]);

  // ── Recurring themes (text mining + repeated event types) ───────────────────
  const learningThemes: LearningTheme[] = [];
  for (const p of THEME_PATTERNS) {
    const freq = events.filter((e) => p.re.test(e.text)).length;
    if (freq >= 2) {
      learningThemes.push({
        key: p.key,
        theme: p.label,
        frequency: freq,
        confidence: freqConfidence(freq),
        basis: `Matched in ${freq} of ${n} events.`,
      });
    }
  }
  // Repeated event type is itself a theme.
  const typeCounts = new Map<string, number>();
  for (const e of events) typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
  for (const [type, freq] of typeCounts) {
    if (freq >= 2) {
      learningThemes.push({
        key: `type:${type}`,
        theme: `Repeated ${type.replace(/_/g, " ")} events`,
        frequency: freq,
        confidence: freqConfidence(freq),
        basis: `${freq} events of this type in the window.`,
      });
    }
  }
  learningThemes.sort((a, b) => b.frequency - a.frequency);

  // ── What Cara should learn (forward-looking watch-points) ───────────────────
  const whatCaraShouldLearn: WatchPoint[] = [];
  for (const p of THEME_PATTERNS) {
    const t = learningThemes.find((x) => x.key === p.key);
    if (t) {
      whatCaraShouldLearn.push({
        trigger: t.theme,
        suggestion: p.watch,
        confidence: t.confidence,
      });
    }
  }
  // A repeatedly-effective strategy is worth remembering.
  if (whatWorked.length) {
    whatCaraShouldLearn.push({
      trigger: "What has helped before",
      suggestion: `Reinforce what has worked: ${whatWorked.slice(0, 3).join("; ")}.`,
      confidence: whatWorked.length >= 2 ? "medium" : "low",
    });
  }

  // ── Organisational memory (durable statements) ──────────────────────────────
  const who = input.scope === "child" ? input.childName ?? "this child" : "this home";
  const organisationalMemory: string[] = [];
  if (learningThemes.length) {
    organisationalMemory.push(
      `Across ${n} event(s) for ${who}, the strongest recurring theme is "${learningThemes[0].theme}" (${learningThemes[0].frequency}×).`,
    );
  }
  if (doDifferently.length) {
    organisationalMemory.push(`Recorded learning to carry forward: ${doDifferently.slice(0, 3).join("; ")}.`);
  }
  const unreviewed = events.filter((e) => !e.reviewed).length;
  if (unreviewed) {
    organisationalMemory.push(
      `${unreviewed} event(s) have no recorded management oversight, so the learning from them is not yet captured — complete oversight to close the loop.`,
    );
  }
  if (!organisationalMemory.length) {
    organisationalMemory.push(
      n
        ? `No strong cross-event pattern yet for ${who}; keep capturing debrief learning so themes can emerge.`
        : `No events in the last ${input.windowDays} days for ${who}.`,
    );
  }

  // ── Overall confidence ──────────────────────────────────────────────────────
  const learningSignals = whatWorked.length + whatDidntWork.length + doDifferently.length;
  const confidence: Confidence = n >= 3 && learningSignals >= 3 ? "high" : n >= 2 || learningSignals >= 1 ? "medium" : "low";

  return {
    scope: input.scope,
    childName: input.childName,
    eventsConsidered: n,
    windowDays: input.windowDays,
    whatWorked,
    whatDidntWork,
    doDifferently,
    learningThemes,
    whatCaraShouldLearn,
    organisationalMemory,
    confidence,
    disclaimer: LEARNING_DISCLAIMER,
    engineVersion: LEARNING_ENGINE_VERSION,
    generatedAt: input.today,
  };
}
