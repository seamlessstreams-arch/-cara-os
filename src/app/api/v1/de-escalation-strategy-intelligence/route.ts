// ══════════════════════════════════════════════════════════════════════════════
// CARA — DE-ESCALATION STRATEGY EFFECTIVENESS INTELLIGENCE
// GET /api/v1/de-escalation-strategy-intelligence
//
// Analyses the real behaviourLog to answer the questions that matter most for
// therapeutic residential practice:
//
//   - Which de-escalation approaches are being used — and do they work?
//   - What time of day is highest risk for each child?
//   - Are staff applying strategies consistently?
//   - Is behaviour improving (last 30d vs prior 30d)?
//
// Unlike the engine-based behaviour-trigger-patterns route, this reads directly
// from store.behaviourLog and produces practice-facing effectiveness signals.
//
// Ofsted SCCIF: "Children are helped to understand their behaviour and manage
// their emotions." CHR 2015 Reg 11 (behaviour management).
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Types ─────────────────────────────────────────────────────────────────────

type BehaviourSignal = "strengths" | "progressing" | "developing" | "needs_support";

interface TimeSlot {
  slot: string;
  concerningCount: number;
  positiveCount: number;
}

interface StrategyResult {
  strategy: string;
  usageCount: number;
  resolvedCount: number;
  escalatedCount: number;
  resolutionRate: number;
}

interface StaffEngagementProfile {
  staffId: string;
  staffName: string;
  totalEntries: number;
  positiveEntries: number;
  positiveRate: number;
}

interface ChildBehaviourProfile {
  childId: string;
  childName: string;
  totalEntries: number;
  positiveCount: number;
  concerningCount: number;
  positiveRatio: number | null; // 0–100; null when nothing has been recorded for this child
  last30dConcerning: number;
  prior30dConcerning: number;
  concernTrend: "improving" | "stable" | "worsening";
  severeEntries: number;
  topStrategies: StrategyResult[];
  timeRisk: TimeSlot[];
  signal: BehaviourSignal;
  supervisionPrompt: string;
}

interface DeEscalationSummary {
  totalEntries: number;
  totalPositive: number;
  totalConcerning: number;
  homePositiveRatio: number | null;
  homeConcernTrend: "improving" | "stable" | "worsening";
  mostEffectiveStrategies: StrategyResult[];
  highRiskTimeSlots: TimeSlot[];
  staffEngagementProfiles: StaffEngagementProfile[];
  ofstedNote: string;
}

// ── Strategy classification ───────────────────────────────────────────────────

const STRATEGY_KEYWORDS: Record<string, string[]> = {
  "Low-arousal approach":     ["low-arousal", "low arousal", "minimal language", "calm presence"],
  "Space and time":           ["space and time", "gave space", "offered space", "quiet space", "cooling off"],
  "Verbal de-escalation":     ["verbal de-escalation", "verbal reassurance", "de-escalation"],
  "Relationship-based":       ["1:1", "one to one", "offered walk", "side by side", "key worker"],
  "Proactive/environmental":  ["visual schedule", "choice board", "morning preparation", "social story", "structured routine"],
  "Child-initiated":          ["self-initiated", "own strategy", "asked to leave", "grounding", "5-4-3-2-1", "breathing"],
  "Physical separation":      ["physical separation", "separated", "team teach", "hold", "pi", "restraint"],
  "Distraction/activity":     ["distraction", "activity", "redirect", "game", "cooking", "walk"],
};

function classifyStrategy(strategy: string): string {
  if (!strategy || strategy.trim().length === 0) return "No strategy recorded";
  const lower = strategy.toLowerCase();
  for (const [label, keywords] of Object.entries(STRATEGY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return label;
  }
  return "Other approach";
}

function classifyOutcome(outcome: string, direction: string): "resolved" | "escalated" | "partial" {
  if (direction === "positive") return "resolved";
  if (!outcome) return "partial";
  const lower = outcome.toLowerCase();
  if (lower.includes("settled") || lower.includes("calmed") || lower.includes("regulated") ||
      lower.includes("engaged") || lower.includes("apologi") || lower.includes("self-regul")) {
    return "resolved";
  }
  if (lower.includes("pi used") || lower.includes("pi required") || lower.includes("team teach hold") ||
      lower.includes("ambulance") || lower.includes("refused debrief") || lower.includes("self-harm")) {
    return "escalated";
  }
  return "partial";
}

function timeSlot(time: string): string {
  const h = parseInt(time?.slice(0, 2) ?? "12", 10);
  if (h >= 6 && h < 12) return "Morning (6-12)";
  if (h >= 12 && h < 17) return "Afternoon (12-17)";
  if (h >= 17 && h < 21) return "Evening (17-21)";
  return "Night (21-6)";
}

function behaviourSignal(
  positiveRatio: number | null,
  concernTrend: "improving" | "stable" | "worsening",
  severeEntries: number,
): BehaviourSignal {
  if (severeEntries >= 2 || concernTrend === "worsening") return "needs_support";
  if (meets(positiveRatio, 60)) return "strengths";
  if (meets(positiveRatio, 40) || concernTrend === "improving") return "progressing";
  return "developing";
}

function buildSupervisionPrompt(
  name: string,
  signal: BehaviourSignal,
  positiveRatio: number | null,
  concernTrend: "improving" | "stable" | "worsening",
  topStrategy: StrategyResult | undefined,
  severeEntries: number,
  highRiskSlot: TimeSlot | undefined,
): string {
  if (positiveRatio === null) {
    return `No behaviour entries have been recorded for ${name}, so there is no picture to read yet. In supervision: is this an accurate reflection of a settled placement, or is day-to-day behaviour support going unrecorded?`;
  }
  if (signal === "needs_support") {
    if (severeEntries >= 2) {
      return `${name} has had ${severeEntries} severe behaviour entries. In supervision: review the pattern — is there an unmet need, an unresolved trauma trigger, or a systemic factor driving the intensity? Does the risk management plan reflect current presentations?`;
    }
    return `${name}'s behaviour is worsening. In supervision: what has changed in the last two to three weeks? Is the therapeutic approach still right? Review with the team — is everyone using the agreed strategies consistently?`;
  }
  if (concernTrend === "improving") {
    return `${name}'s behaviour is improving. In supervision: what is working? Identify and name the strategies or relational shifts that are making the difference. How can the team consolidate these gains?`;
  }
  if (topStrategy && topStrategy.resolutionRate < 50) {
    return `The most common de-escalation approach for ${name} (${topStrategy.strategy}) resolves the concern only ${topStrategy.resolutionRate}% of the time. In supervision: is this the right approach for ${name.split(" ")[0]}? What does ${name.split(" ")[0]} say helps them most?`;
  }
  if (highRiskSlot && highRiskSlot.concerningCount >= 3) {
    return `${name}'s concerning behaviours cluster during the ${highRiskSlot.slot.toLowerCase()} period. In supervision: what environmental or relational factors drive this? Is there adequate staffing and preparation during this time?`;
  }
  return `${name}'s behaviour picture is broadly positive (${formatRate(positiveRatio)} positive entries). In supervision: what conditions support ${name.split(" ")[0]}'s best self? How can these be sustained and replicated?`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const staffMembers = (store.staff ?? []) as Array<{
    id: string; full_name: string;
  }>;

  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    id: string;
    child_id: string;
    date: string;
    time: string;
    direction: string;
    intensity: string;
    title: string;
    strategy_used: string;
    outcome: string;
    recorded_by: string;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // Index by child
  const entriesByChild = new Map<string, typeof behaviourLog>();
  for (const e of behaviourLog) {
    const arr = entriesByChild.get(e.child_id) ?? [];
    arr.push(e);
    entriesByChild.set(e.child_id, arr);
  }

  // Staff name lookup
  const staffNames = new Map(staffMembers.map((s) => [s.id, s.full_name]));

  // ── Per-child profiles ────────────────────────────────────────────────────
  const childProfiles: ChildBehaviourProfile[] = currentChildren.map((yp) => {
    const entries = entriesByChild.get(yp.id) ?? [];

    const positiveCount = entries.filter((e) => e.direction === "positive").length;
    const concerningCount = entries.filter((e) => e.direction !== "positive").length;
    // An empty behaviour log is silence, not a wholly positive picture.
    const positiveRatio = rate(positiveCount, entries.length);

    const last30d = entries.filter((e) => new Date(e.date) >= cutoff30d);
    const prior30d = entries.filter(
      (e) => new Date(e.date) < cutoff30d && new Date(e.date) >= cutoff60d,
    );
    const last30dConcerning = last30d.filter((e) => e.direction !== "positive").length;
    const prior30dConcerning = prior30d.filter((e) => e.direction !== "positive").length;

    const concernTrend: "improving" | "stable" | "worsening" =
      prior30dConcerning === 0
        ? last30dConcerning === 0 ? "stable" : "worsening"
        : last30dConcerning < prior30dConcerning * 0.75
        ? "improving"
        : last30dConcerning > prior30dConcerning * 1.25
        ? "worsening"
        : "stable";

    const severeEntries = entries.filter(
      (e) => e.intensity === "severe" || e.intensity === "critical" || e.intensity === "high",
    ).length;

    // Strategy effectiveness for concerning entries
    const concerningEntries = entries.filter((e) => e.direction !== "positive");
    const strategyMap = new Map<string, { usage: number; resolved: number; escalated: number }>();
    for (const e of concerningEntries) {
      const label = classifyStrategy(e.strategy_used);
      const outcome = classifyOutcome(e.outcome, e.direction);
      const current = strategyMap.get(label) ?? { usage: 0, resolved: 0, escalated: 0 };
      current.usage++;
      if (outcome === "resolved") current.resolved++;
      if (outcome === "escalated") current.escalated++;
      strategyMap.set(label, current);
    }
    const topStrategies: StrategyResult[] = [...strategyMap.entries()]
      .map(([strategy, { usage, resolved, escalated }]) => ({
        strategy,
        usageCount: usage,
        resolvedCount: resolved,
        escalatedCount: escalated,
        resolutionRate: usage > 0 ? Math.round((resolved / usage) * 100) : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 4);

    // Time-of-day risk
    const slotMap = new Map<string, { concerning: number; positive: number }>();
    for (const e of entries) {
      const slot = timeSlot(e.time);
      const current = slotMap.get(slot) ?? { concerning: 0, positive: 0 };
      if (e.direction === "positive") current.positive++;
      else current.concerning++;
      slotMap.set(slot, current);
    }
    const timeRisk: TimeSlot[] = [...slotMap.entries()]
      .map(([slot, { concerning, positive }]) => ({
        slot, concerningCount: concerning, positiveCount: positive,
      }))
      .sort((a, b) => b.concerningCount - a.concerningCount);

    const highRiskSlot = timeRisk[0]?.concerningCount >= 2 ? timeRisk[0] : undefined;

    const signal = behaviourSignal(positiveRatio, concernTrend, severeEntries);

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      totalEntries: entries.length,
      positiveCount,
      concerningCount,
      positiveRatio,
      last30dConcerning,
      prior30dConcerning,
      concernTrend,
      severeEntries,
      topStrategies,
      timeRisk,
      signal,
      supervisionPrompt: buildSupervisionPrompt(
        `${yp.first_name} ${yp.last_name}`, signal, positiveRatio, concernTrend,
        topStrategies[0], severeEntries, highRiskSlot,
      ),
    };
  });

  // Sort: needs_support → developing → progressing → strengths
  const SIGNAL_ORDER: Record<BehaviourSignal, number> = {
    needs_support: 0, developing: 1, progressing: 2, strengths: 3,
  };
  childProfiles.sort((a, b) => SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]);

  // ── Home summary ──────────────────────────────────────────────────────────
  const allEntries = behaviourLog;
  const totalPositive = allEntries.filter((e) => e.direction === "positive").length;
  const totalConcerning = allEntries.filter((e) => e.direction !== "positive").length;
  const homePositiveRatio = rate(totalPositive, allEntries.length);

  const homeLast30d = allEntries.filter((e) => new Date(e.date) >= cutoff30d);
  const homePrior30d = allEntries.filter(
    (e) => new Date(e.date) < cutoff30d && new Date(e.date) >= cutoff60d,
  );
  const homeL30Concerning = homeLast30d.filter((e) => e.direction !== "positive").length;
  const homeP30Concerning = homePrior30d.filter((e) => e.direction !== "positive").length;
  const homeConcernTrend: "improving" | "stable" | "worsening" =
    homeP30Concerning === 0
      ? homeL30Concerning === 0 ? "stable" : "worsening"
      : homeL30Concerning < homeP30Concerning * 0.75
      ? "improving"
      : homeL30Concerning > homeP30Concerning * 1.25
      ? "worsening"
      : "stable";

  // Home-wide strategy effectiveness
  const homeStrategyMap = new Map<string, { usage: number; resolved: number; escalated: number }>();
  for (const e of allEntries.filter((e) => e.direction !== "positive")) {
    const label = classifyStrategy(e.strategy_used);
    const outcome = classifyOutcome(e.outcome, e.direction);
    const current = homeStrategyMap.get(label) ?? { usage: 0, resolved: 0, escalated: 0 };
    current.usage++;
    if (outcome === "resolved") current.resolved++;
    if (outcome === "escalated") current.escalated++;
    homeStrategyMap.set(label, current);
  }
  const mostEffectiveStrategies: StrategyResult[] = [...homeStrategyMap.entries()]
    .filter(([, { usage }]) => usage >= 2)
    .map(([strategy, { usage, resolved, escalated }]) => ({
      strategy,
      usageCount: usage,
      resolvedCount: resolved,
      escalatedCount: escalated,
      resolutionRate: usage > 0 ? Math.round((resolved / usage) * 100) : 0,
    }))
    .sort((a, b) => b.resolutionRate - a.resolutionRate);

  // High-risk time slots (across home)
  const homeSlotMap = new Map<string, { concerning: number; positive: number }>();
  for (const e of allEntries) {
    const slot = timeSlot(e.time);
    const current = homeSlotMap.get(slot) ?? { concerning: 0, positive: 0 };
    if (e.direction === "positive") current.positive++;
    else current.concerning++;
    homeSlotMap.set(slot, current);
  }
  const highRiskTimeSlots: TimeSlot[] = [...homeSlotMap.entries()]
    .map(([slot, { concerning, positive }]) => ({
      slot, concerningCount: concerning, positiveCount: positive,
    }))
    .sort((a, b) => b.concerningCount - a.concerningCount);

  // Staff engagement profiles (which staff have most positive interactions)
  const staffEntryMap = new Map<string, { total: number; positive: number }>();
  for (const e of allEntries) {
    const current = staffEntryMap.get(e.recorded_by) ?? { total: 0, positive: 0 };
    current.total++;
    if (e.direction === "positive") current.positive++;
    staffEntryMap.set(e.recorded_by, current);
  }
  const staffEngagementProfiles: StaffEngagementProfile[] = [...staffEntryMap.entries()]
    .map(([staffId, { total, positive }]) => ({
      staffId,
      staffName: staffNames.get(staffId) ?? staffId,
      totalEntries: total,
      positiveEntries: positive,
      positiveRate: total > 0 ? Math.round((positive / total) * 100) : 0,
    }))
    .sort((a, b) => b.totalEntries - a.totalEntries);

  // Ofsted note
  const ofstedNote =
    homePositiveRatio === null
      ? "No behaviour entries have been recorded across the home. An inspector will ask how everyday behaviour support and de-escalation are captured — an empty log is the finding, not evidence of a settled home."
      : homeConcernTrend === "worsening"
      ? "Concerning behaviour frequency is increasing across the home. An inspector will ask whether each child's care plan reflects current presentations and whether staff are supported to understand and respond therapeutically."
      : childProfiles.some((p) => p.signal === "needs_support")
      ? "One or more children have a needs-support behaviour signal. An inspector will ask about the therapeutic response, whether risk management plans are current, and whether staff feel supported."
      : mostEffectiveStrategies.some((s) => s.resolutionRate < 40)
      ? "Some de-escalation strategies have low resolution rates. Review whether staff are using the agreed approaches and whether plans reflect what actually helps each child."
      : `Home behaviour picture: ${formatRate(homePositiveRatio)} positive entries. Trend: ${homeConcernTrend}. Demonstrate that the team understands each child's triggers and is applying person-centred, therapeutic responses consistently.`;

  return NextResponse.json({
    data: {
      childProfiles,
      summary: {
        totalEntries: allEntries.length,
        totalPositive,
        totalConcerning,
        homePositiveRatio,
        homeConcernTrend,
        mostEffectiveStrategies,
        highRiskTimeSlots,
        staffEngagementProfiles,
        ofstedNote,
      },
    },
  });
}
