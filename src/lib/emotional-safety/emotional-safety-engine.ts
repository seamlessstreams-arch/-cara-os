// ─────────────────────────────────────────────────────────────────────────────
// Emotional Safety Analysis Engine
//
// The relational half asks "who does this child trust?"; this asks "what does
// this child's nervous system need to feel safe?". A PURE, deterministic
// projection over existing records — behaviour log (ABC + trigger + strategy +
// outcome), incidents, key-work mood, and the child's PACE profile — that
// surfaces:
//   • what TRIGGERS dysregulation,
//   • what HELPS them regulate (strategies that actually worked),
//   • escalation patterns (frequency, intensity, time-of-day, direction of
//     travel),
//   • recovery & resilience signals.
//
// No LLM — fully deterministic so it runs in prod with no keys. It informs
// practice; it never decides. People hold the judgement.
// ─────────────────────────────────────────────────────────────────────────────

import type { BehaviourEntry } from "@/types/extended";
import type { Incident } from "@/types";

export type EmotionalSafetyStatus = "secure" | "watch" | "concern";

export interface TriggerSignal {
  label: string;
  count: number;
  fromPace: boolean; // already known to the team (in the PACE profile)
}

export interface RegulationSignal {
  label: string;
  count: number; // times this strategy was followed by regulation
  fromPace: boolean;
}

export interface TimeOfDayPattern {
  morning: number; // 06:00–11:59
  afternoon: number; // 12:00–16:59
  evening: number; // 17:00–21:59
  night: number; // 22:00–05:59
}

export interface EmotionalSafetyInsight {
  key: string;
  tone: "positive" | "watch" | "gap";
  text: string;
}

export interface EmotionalSafetyAnalysis {
  childId: string;
  childName: string;
  generatedAt: string;
  status: EmotionalSafetyStatus;
  statusReason: string;
  triggers: TriggerSignal[];
  whatHelps: RegulationSignal[];
  escalation: {
    concernCount: number;
    highIntensityCount: number;
    incidentCount: number;
    recent30d: number;
    prior30d: number;
    trend: "rising" | "steady" | "easing";
    byTimeOfDay: TimeOfDayPattern;
    peakTime: keyof TimeOfDayPattern | null;
  };
  recovery: {
    recoveryCount: number;
    moodImproved: number;
    moodMeasured: number;
  };
  insights: EmotionalSafetyInsight[];
}

export interface EmotionalSafetyInput {
  childId: string;
  childName: string;
  now: string; // injected ISO → deterministic
  behaviourLog: BehaviourEntry[];
  incidents: Incident[];
  /** Key-work sessions carry mood_before/mood_after — regulation in relational time. */
  keyWorkingSessions: { child_id: string; mood_before?: number; mood_after?: number }[];
  /** PACE-known triggers and calming approaches (the team's existing knowledge). */
  knownTriggers: string[];
  calmingApproaches: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(iso: string, nowIso: string): number {
  const a = Date.parse(iso);
  const b = Date.parse(nowIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return (b - a) / 86_400_000; // signed: negative = future
}

function timeBucket(time: string | undefined): keyof TimeOfDayPattern {
  const hour = Number.parseInt((time ?? "").slice(0, 2), 10);
  if (Number.isNaN(hour)) return "afternoon";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** A short, normalised label so similar free-text triggers aggregate together. */
function normaliseLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/[.;]+$/, "");
}

const REGULATION_WORDS = [
  "calm",
  "settled",
  "regulated",
  "de-escalat",
  "deescalat",
  "resolved",
  "reassur",
  "soothed",
  "relaxed",
  "recovered",
  "co-regulat",
  "grounded",
];

/** Did this behaviour entry end in regulation? (positive direction, or the
 *  outcome text describes the child settling). */
function endedRegulated(b: BehaviourEntry): boolean {
  if (b.direction === "positive") return true;
  const o = (b.outcome ?? "").toLowerCase();
  return REGULATION_WORDS.some((w) => {
    const idx = o.indexOf(w);
    if (idx < 0) return false;
    // Don't credit a NEGATED outcome ("could not calm", "wouldn't settle",
    // "unable to calm down") — check the words immediately before the match.
    const before = o.slice(Math.max(0, idx - 18), idx);
    return !/\b(not|never|unable|cannot|can'?t|won'?t|couldn'?t|wouldn'?t|didn'?t|wasn'?t|weren'?t|don'?t|doesn'?t|isn'?t)\b/.test(before);
  });
}

function rankCounts(
  counts: Map<string, number>,
  paceSet: Set<string>,
  limit: number,
): { label: string; count: number; fromPace: boolean }[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, fromPace: paceSet.has(label.toLowerCase()) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildEmotionalSafetyAnalysis(
  input: EmotionalSafetyInput,
): EmotionalSafetyAnalysis {
  const behaviour = (input.behaviourLog ?? []).filter((b) => b.child_id === input.childId);
  const incidents = (input.incidents ?? []).filter((i) => i.child_id === input.childId);
  const keywork = (input.keyWorkingSessions ?? []).filter((k) => k.child_id === input.childId);

  const concerns = behaviour.filter((b) => b.direction === "concern");
  const positives = behaviour.filter((b) => b.direction === "positive");

  // ── Triggers: behaviour triggers + antecedents, seeded with PACE knowledge ──
  const triggerCounts = new Map<string, number>();
  const paceTriggerSet = new Set(input.knownTriggers.map((t) => t.toLowerCase()));
  for (const t of input.knownTriggers) {
    triggerCounts.set(normaliseLabel(t), (triggerCounts.get(normaliseLabel(t)) ?? 0) + 1);
  }
  for (const b of concerns) {
    const src = (b.trigger || b.antecedent || "").trim();
    if (src) {
      const label = normaliseLabel(src);
      triggerCounts.set(label, (triggerCounts.get(label) ?? 0) + 1);
    }
  }
  const triggers = rankCounts(triggerCounts, paceTriggerSet, 6);

  // ── What helps: strategies that were followed by regulation, + PACE calming ──
  const helpCounts = new Map<string, number>();
  const paceCalmSet = new Set(input.calmingApproaches.map((c) => c.toLowerCase()));
  for (const c of input.calmingApproaches) {
    helpCounts.set(normaliseLabel(c), (helpCounts.get(normaliseLabel(c)) ?? 0) + 1);
  }
  // Only credit a strategy that actually turned an ESCALATION around — a concern
  // entry whose outcome describes regulation. Routine positive logs (a good day,
  // an activity that was simply enjoyed) are NOT evidence that a strategy regulates
  // the child, so they must not inflate "what helps".
  for (const b of concerns) {
    if (b.strategy_used?.trim() && endedRegulated(b)) {
      const label = normaliseLabel(b.strategy_used);
      helpCounts.set(label, (helpCounts.get(label) ?? 0) + 1);
    }
  }
  const whatHelps = rankCounts(helpCounts, paceCalmSet, 6);

  // ── Escalation patterns ──────────────────────────────────────────────────
  const highIntensity = concerns.filter(
    (b) => b.intensity === "high" || b.intensity === "critical",
  ).length;

  const byTimeOfDay: TimeOfDayPattern = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const b of concerns) byTimeOfDay[timeBucket(b.time)] += 1;
  for (const i of incidents) byTimeOfDay[timeBucket(i.time)] += 1;
  const peakEntry = (Object.entries(byTimeOfDay) as [keyof TimeOfDayPattern, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const peakTime = peakEntry && peakEntry[1] > 0 ? peakEntry[0] : null;

  // Direction of travel — escalation events in the last 30d vs the 30d before.
  const escEvents = [
    ...concerns.map((b) => b.date),
    ...incidents.map((i) => i.date),
  ];
  const recent30d = escEvents.filter((d) => {
    const age = daysBetween(d, input.now);
    return age >= 0 && age <= 30;
  }).length;
  const prior30d = escEvents.filter((d) => {
    const age = daysBetween(d, input.now);
    return age > 30 && age <= 60;
  }).length;
  let trend: "rising" | "steady" | "easing";
  if (recent30d > prior30d + 1) trend = "rising";
  else if (recent30d + 1 < prior30d) trend = "easing";
  else trend = "steady";

  // ── Recovery & resilience ─────────────────────────────────────────────────
  const moodMeasured = keywork.filter(
    (k) => typeof k.mood_before === "number" && typeof k.mood_after === "number",
  ).length;
  const moodImproved = keywork.filter(
    (k) =>
      typeof k.mood_before === "number" &&
      typeof k.mood_after === "number" &&
      (k.mood_after as number) > (k.mood_before as number),
  ).length;
  const recoveryCount = positives.length + moodImproved;

  // ── Emotional-safety status (deterministic) ───────────────────────────────
  let status: EmotionalSafetyStatus;
  let statusReason: string;
  const helpsDocumented = whatHelps.length > 0;
  if (trend === "rising" || highIntensity >= 3) {
    status = "concern";
    statusReason =
      trend === "rising"
        ? "Escalations are rising over the last 30 days — review the behaviour support plan together."
        : "Repeated high-intensity escalation — prioritise regulation support and a plan review.";
  } else if (highIntensity >= 1 || (concerns.length > 0 && !helpsDocumented)) {
    status = "watch";
    statusReason = helpsDocumented
      ? "Some escalation, but strategies that regulate this child are documented — keep applying them consistently."
      : "Escalation recorded but no regulating strategy captured yet — note what helps after each episode.";
  } else {
    status = "secure";
    statusReason =
      concerns.length === 0
        ? "No escalation recorded recently — emotional safety looks settled."
        : "Escalation is low and easing, with strategies that help on record.";
  }

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights: EmotionalSafetyInsight[] = [];
  if (triggers[0]) {
    insights.push({
      key: "top-trigger",
      tone: "watch",
      text: `Most frequent trigger: ${triggers[0].label}${triggers[0].fromPace ? " (in the PACE plan)" : " — consider adding to the PACE plan"}.`,
    });
  }
  if (whatHelps[0]) {
    insights.push({
      key: "what-helps",
      tone: "positive",
      text: `"${whatHelps[0].label}" most reliably helps ${input.childName} regulate — share it across the team.`,
    });
  } else if (concerns.length > 0) {
    insights.push({
      key: "no-strategy",
      tone: "gap",
      text: "No regulating strategy has been captured after escalations — recording what helps builds the child's plan.",
    });
  }
  if (peakTime) {
    insights.push({
      key: "peak-time",
      tone: "watch",
      text: `Escalation clusters in the ${peakTime} — review routine, staffing and sensory load at that time.`,
    });
  }
  if (trend === "easing") {
    insights.push({ key: "easing", tone: "positive", text: "Escalations are easing month-on-month — something is working." });
  } else if (trend === "rising") {
    insights.push({ key: "rising", tone: "gap", text: "Escalations are rising month-on-month — bring to supervision and review the plan." });
  }
  if (moodMeasured > 0) {
    insights.push({
      key: "regulation-in-relationship",
      tone: moodImproved * 2 >= moodMeasured ? "positive" : "watch",
      text: `Mood improved in ${moodImproved} of ${moodMeasured} key-work sessions — relational time is regulating.`,
    });
  }

  return {
    childId: input.childId,
    childName: input.childName,
    generatedAt: input.now,
    status,
    statusReason,
    triggers,
    whatHelps,
    escalation: {
      concernCount: concerns.length,
      highIntensityCount: highIntensity,
      incidentCount: incidents.length,
      recent30d,
      prior30d,
      trend,
      byTimeOfDay,
      peakTime,
    },
    recovery: { recoveryCount, moodImproved, moodMeasured },
    insights,
  };
}
