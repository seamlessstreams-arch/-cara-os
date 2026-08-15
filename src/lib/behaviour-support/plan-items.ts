// ─────────────────────────────────────────────────────────────────────────────
// Behaviour Support Plan — clinical item shapes, and the rule for when an item
// is complete enough to save.
//
// #930 had to strip five sections out of the create dialog because it only
// collected free text, and these shapes need per-item judgement: how often a
// behaviour happens, how severe it is, which way it is trending, how likely a
// trigger is, whether a strategy actually works, how many staff a safety
// response needs. Casting free text into them would have stated a severity
// nobody assessed — the fabricate-on-empty prohibition — and left the plan
// view rendering "undefined".
//
// The answer is not to guess the missing fields. It is to ask for them, one
// item at a time, and to refuse to save an item that is still half-answered.
// A behaviour plan is read by staff at the moment a child is escalating; a
// half-filled row is worse than an absent one.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  BSPPrimaryBehaviour,
  BSPKnownTrigger,
  BSPDeEscalationStage,
  BSPPositiveStrategy,
  BSPSafetyPlanItem,
} from "@/types/extended";

export const FREQUENCIES = ["daily", "weekly", "occasional", "rare"] as const;
export const SEVERITIES = ["low", "medium", "high"] as const;
export const TRENDS = ["improving", "stable", "worsening"] as const;
export const TRIGGER_CATEGORIES = [
  "environmental", "emotional", "social", "sensory", "routine_change", "demand", "transition",
] as const;
export const LIKELIHOODS = ["high", "medium", "low"] as const;
export const STAGES = ["green", "amber", "red"] as const;
export const EFFECTIVENESS = [
  "highly_effective", "effective", "partially_effective", "not_effective",
] as const;

/** A row being edited: every field optional until the user has answered it. */
export type DraftBehaviour = Partial<BSPPrimaryBehaviour>;
export type DraftTrigger = Partial<BSPKnownTrigger>;
export type DraftStage = Partial<Omit<BSPDeEscalationStage, "strategies">> & { strategies?: string };
export type DraftStrategy = Partial<BSPPositiveStrategy>;
export type DraftSafetyItem = Partial<Omit<BSPSafetyPlanItem, "staff_required">> & { staff_required?: string };

const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";

export const isBehaviourComplete = (d: DraftBehaviour): boolean =>
  filled(d.behaviour) && !!d.frequency && !!d.severity && !!d.trend;

export const isTriggerComplete = (d: DraftTrigger): boolean =>
  filled(d.trigger) && !!d.category && !!d.likelihood;

export const isStageComplete = (d: DraftStage): boolean =>
  !!d.stage && filled(d.strategies) && filled(d.staff_approach);

export const isStrategyComplete = (d: DraftStrategy): boolean =>
  filled(d.strategy) && filled(d.frequency) && !!d.effectiveness;

export const isSafetyItemComplete = (d: DraftSafetyItem): boolean =>
  filled(d.scenario) && filled(d.response) && Number(d.staff_required) >= 1;

/** Split "a, b" or one-per-line into a clean list. */
export const toList = (s: string): string[] =>
  s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

// ── Draft → record. Only complete rows survive; a half-answered row is
//    dropped rather than stored with a blank the plan view would print.
export const toBehaviours = (rows: DraftBehaviour[]): BSPPrimaryBehaviour[] =>
  rows.filter(isBehaviourComplete).map((d) => ({
    behaviour: d.behaviour!.trim(),
    frequency: d.frequency!,
    severity: d.severity!,
    trend: d.trend!,
  }));

export const toTriggers = (rows: DraftTrigger[]): BSPKnownTrigger[] =>
  rows.filter(isTriggerComplete).map((d) => ({
    trigger: d.trigger!.trim(),
    category: d.category!,
    likelihood: d.likelihood!,
  }));

export const toStages = (rows: DraftStage[]): BSPDeEscalationStage[] =>
  rows.filter(isStageComplete).map((d) => ({
    stage: d.stage!,
    strategies: toList(d.strategies!),
    staff_approach: d.staff_approach!.trim(),
  }));

export const toStrategies = (rows: DraftStrategy[]): BSPPositiveStrategy[] =>
  rows.filter(isStrategyComplete).map((d) => ({
    strategy: d.strategy!.trim(),
    frequency: d.frequency!.trim(),
    effectiveness: d.effectiveness!,
  }));

export const toSafetyItems = (rows: DraftSafetyItem[]): BSPSafetyPlanItem[] =>
  rows.filter(isSafetyItemComplete).map((d) => ({
    scenario: d.scenario!.trim(),
    response: d.response!.trim(),
    staff_required: Number(d.staff_required),
  }));

/** Rows the user started but did not finish — shown back, never saved. */
export function incompleteCount(
  behaviours: DraftBehaviour[],
  triggers: DraftTrigger[],
  stages: DraftStage[],
  strategies: DraftStrategy[],
  safety: DraftSafetyItem[],
): number {
  const started = (o: Record<string, unknown>) =>
    Object.values(o).some((v) => (typeof v === "string" ? v.trim() !== "" : v !== undefined));
  return (
    behaviours.filter((d) => started(d) && !isBehaviourComplete(d)).length +
    triggers.filter((d) => started(d) && !isTriggerComplete(d)).length +
    stages.filter((d) => started(d) && !isStageComplete(d)).length +
    strategies.filter((d) => started(d) && !isStrategyComplete(d)).length +
    safety.filter((d) => started(d) && !isSafetyItemComplete(d)).length
  );
}
