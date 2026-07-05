// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC BEHAVIOUR PATTERNS (pure engine) · §16
//
// buildABCProfiles(input) turns behaviour-log entries into per-child Antecedent →
// Behaviour → Consequence chains: the recurring A→B→C triples, the tally in each
// column, and a containment signal per strategy. Pure — no store, no model.
//
// Reuses normaliseTrigger from behaviour-trigger-patterns (no duplicate
// normalisation) and deliberately does NOT recompute triggers or escalation
// trajectory — that engine already does. This is the CHAIN + the visual's data.
// ══════════════════════════════════════════════════════════════════════════════

import { normaliseTrigger } from "@/lib/behaviour-trigger-patterns/behaviour-trigger-patterns-engine";
import {
  ABC_BEHAVIOUR_VERSION,
  type ABCBehaviourInput,
  type ABCChain,
  type ABCEntryInput,
  type ABCReport,
  type ChildABCProfile,
  type ColumnItem,
  type StrategyEffect,
} from "./types";

const DISCLAIMER =
  "ABC patterns show what tends to precede and follow a behaviour — a lens for reflection and planning, not a judgement or a prediction. 'Contained' means the behaviour stayed low or moderate; it is a signal, not proof a strategy caused it. Human professional judgement decides.";

const titleCase = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Behaviour (B) descriptor from the data we hold: direction + intensity band. */
function behaviourLabel(direction: string, intensity: string): string {
  const d = (direction ?? "").toLowerCase();
  if (d.startsWith("pos")) return "Positive behaviour";
  const i = intensityBand(intensity);
  return `${titleCase(i)}-level concern`;
}

function intensityBand(intensity: string): "low" | "moderate" | "high" | "critical" {
  const i = (intensity ?? "").toLowerCase();
  if (i === "critical") return "critical";
  if (i === "high") return "high";
  if (i === "medium" || i === "moderate") return "moderate";
  return "low";
}

/** A behaviour is "contained" if it stayed low or moderate (not high/critical). */
function isContained(direction: string, intensity: string): boolean {
  if ((direction ?? "").toLowerCase().startsWith("pos")) return true;
  const b = intensityBand(intensity);
  return b === "low" || b === "moderate";
}

const anteLabel = (e: ABCEntryInput): string => {
  const a = normaliseTrigger(e.antecedent) || normaliseTrigger(e.trigger);
  return a ? titleCase(a) : "Antecedent not recorded";
};
const consLabel = (e: ABCEntryInput): string => {
  const c = normaliseTrigger(e.strategy);
  return c ? titleCase(c) : "No strategy recorded";
};

function tally(labels: string[]): ColumnItem[] {
  const m = new Map<string, number>();
  for (const l of labels) m.set(l, (m.get(l) ?? 0) + 1);
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : 1));
}

export function buildABCProfiles(input: ABCBehaviourInput): ABCReport {
  const topN = input.topN ?? 6;
  const nameById = new Map(input.children.map((c) => [c.id, c.name]));
  const byChild = new Map<string, ABCEntryInput[]>();
  for (const e of input.entries) {
    if (!byChild.has(e.childId)) byChild.set(e.childId, []);
    byChild.get(e.childId)!.push(e);
  }

  const children: ChildABCProfile[] = [];
  for (const [childId, entries] of byChild) {
    const chainMap = new Map<string, ABCChain>();
    const stratMap = new Map<string, { uses: number; contained: number }>();
    let missingAnte = 0;
    let missingStrat = 0;

    for (const e of entries) {
      const A = anteLabel(e);
      const B = behaviourLabel(e.direction, e.intensity);
      const C = consLabel(e);
      const contained = isContained(e.direction, e.intensity);
      if (A === "Antecedent not recorded") missingAnte++;
      if (C === "No strategy recorded") missingStrat++;

      const key = `${A}|||${B}|||${C}`;
      const chain = chainMap.get(key) ?? { antecedent: A, behaviour: B, consequence: C, count: 0, containedCount: 0 };
      chain.count++;
      if (contained) chain.containedCount++;
      chainMap.set(key, chain);

      if (C !== "No strategy recorded") {
        const s = stratMap.get(C) ?? { uses: 0, contained: 0 };
        s.uses++;
        if (contained) s.contained++;
        stratMap.set(C, s);
      }
    }

    const chains = [...chainMap.values()].sort((a, b) => b.count - a.count || b.containedCount - a.containedCount).slice(0, topN);
    const strategies: StrategyEffect[] = [...stratMap.entries()]
      .map(([strategy, s]) => ({ strategy, uses: s.uses, containedRate: Math.round((s.contained / s.uses) * 100) }))
      .sort((a, b) => b.uses - a.uses || b.containedRate - a.containedRate);

    const episodes = entries.length;
    children.push({
      childId,
      childName: nameById.get(childId) ?? childId,
      episodes,
      antecedents: tally(entries.map(anteLabel)).slice(0, topN),
      behaviours: tally(entries.map((e) => behaviourLabel(e.direction, e.intensity))).slice(0, topN),
      consequences: tally(entries.map(consLabel)).slice(0, topN),
      chains,
      strategies,
      unrecordedAntecedentRate: episodes ? Math.round((missingAnte / episodes) * 100) : 0,
      unrecordedStrategyRate: episodes ? Math.round((missingStrat / episodes) * 100) : 0,
    });
  }

  children.sort((a, b) => b.episodes - a.episodes || (a.childName < b.childName ? -1 : 1));

  return {
    homeId: input.homeId,
    asOf: input.asOf,
    children,
    summary: { children: children.length, totalEpisodes: input.entries.length },
    disclaimer: DISCLAIMER,
    engineVersion: ABC_BEHAVIOUR_VERSION,
  };
}

export { ABC_BEHAVIOUR_VERSION };
