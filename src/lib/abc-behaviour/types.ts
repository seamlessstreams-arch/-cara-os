// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC BEHAVIOUR PATTERNS (types) · §16
//
// The classic Antecedent → Behaviour → Consequence lens, rendered as LINKED
// chains: for each child, what tends to PRECEDE a behaviour (A), the behaviour
// itself (B), and what staff did in response (C) — with how often each chain
// recurs and how often the behaviour stayed contained.
//
// Consumes the SAME behaviour-log shape as behaviour-trigger-patterns and reuses
// its normaliser — it does NOT recompute triggers or escalation trajectory. The
// novel artifact is the A→B→C CHAIN and its visual.
//
// SAFETY: ABC patterns are a lens for reflection and planning, not a judgement or
// a prediction. "Contained" is a signal that a behaviour stayed low/moderate — it
// is not proof a strategy caused it. Human professional judgement decides.
// ══════════════════════════════════════════════════════════════════════════════

export const ABC_BEHAVIOUR_VERSION = "1.0.0";

export interface ABCEntryInput {
  childId: string;
  date: string; // ISO
  antecedent: string;
  trigger: string;
  direction: string; // "positive" | "concern"/"concerning"
  intensity: string; // low | moderate/medium | high | critical
  strategy: string;
}

export interface ColumnItem {
  label: string;
  count: number;
}

export interface ABCChain {
  antecedent: string;
  behaviour: string;
  consequence: string;
  count: number;
  /** Episodes in this chain where the behaviour stayed low/moderate. */
  containedCount: number;
}

export interface StrategyEffect {
  strategy: string;
  uses: number;
  containedRate: number; // 0–100
}

export interface ChildABCProfile {
  childId: string;
  childName: string;
  episodes: number;
  antecedents: ColumnItem[]; // A column, most frequent first
  behaviours: ColumnItem[]; // B column
  consequences: ColumnItem[]; // C column (strategies used)
  chains: ABCChain[]; // linked A→B→C, most frequent first
  strategies: StrategyEffect[]; // containment signal per strategy
  /** Recording-quality signals — share of episodes missing A / C. */
  unrecordedAntecedentRate: number; // 0–100
  unrecordedStrategyRate: number; // 0–100
}

export interface ABCReport {
  homeId: string;
  asOf: string;
  children: ChildABCProfile[];
  summary: { children: number; totalEpisodes: number };
  disclaimer: string;
  engineVersion: string;
}

export interface ABCBehaviourInput {
  homeId: string;
  asOf: string; // YYYY-MM-DD
  children: { id: string; name: string }[];
  entries: ABCEntryInput[];
  /** Max chains / column items kept per child for the visual. Default 6. */
  topN?: number;
}
