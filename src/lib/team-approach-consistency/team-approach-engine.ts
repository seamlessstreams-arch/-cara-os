// ══════════════════════════════════════════════════════════════════════════════
// CARA — TEAM APPROACH CONSISTENCY INTELLIGENCE — pure engine
//
// Analyses how consistently different staff members approach the same child.
// Detects divergence in practice approach across the team — a key indicator
// of whether children experience a coherent, predictable care environment.
//
// "Children in residential care need a consistent therapeutic environment.
//  Inconsistency in staff approach is itself a risk factor — it recreates the
//  unpredictability that caused harm in the first place."
//  — Good Care Guide; 21 Skills for Residential Workers
//
// Method:
//  1. For each child, categorise behaviour log entries by staff member
//  2. Classify each entry's strategy_used into one of 4 approach types:
//     • therapeutic  — PACE, co-regulation, empathy, connection-based
//     • boundary     — consequence/limit-setting/sanction
//     • physical     — restraint/physical intervention
//     • undocumented — empty or insufficient detail
//  3. Compute per-staff approach profile for each child
//  4. Flag children where staff approaches diverge significantly
//
// All deterministic. No LLM calls. Pure — the store is passed IN, so this is
// fully unit-testable and never touches NextResponse or getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

export type ApproachType = "therapeutic" | "boundary" | "physical" | "undocumented";
export type ConsistencyLevel = "consistent" | "mixed" | "divergent";

export interface StaffApproachProfile {
  staffId: string;
  staffName: string;
  totalEntries: number;
  therapeuticCount: number;
  boundaryCount: number;
  physicalCount: number;
  undocumentedCount: number;
  therapeuticRate: number;   // 0–100
  dominantApproach: ApproachType;
}

export interface ChildConsistencyProfile {
  childId: string;
  childName: string;
  totalEntries: number;
  staffProfiles: StaffApproachProfile[];
  consistencyLevel: ConsistencyLevel;
  overallTherapeuticRate: number;  // 0–100 across all staff
  therapeuticRateVariance: number; // range = max - min across staff (0–100)
  mostTherapeuticStaff: string | null;
  leastTherapeuticStaff: string | null;
  supervisionPrompt: string;
}

export interface ApproachSummary {
  totalChildren: number;
  consistentCount: number;
  mixedCount: number;
  divergentCount: number;
  overallTherapeuticRate: number;
  mostCommonDivergencePattern: string;
}

export interface TeamApproachData {
  childProfiles: ChildConsistencyProfile[];
  summary: ApproachSummary;
}

// ── Approach classification keywords ─────────────────────────────────────────

const THERAPEUTIC_PHRASES = [
  "calm", "de-escalat", "co-regulat", "connection", "curiosity", "empathy", "PACE",
  "pace", "accept", "grounding", "sensory", "comfort", "reassur", "sat with",
  "space", "walked with", "gentle", "validated", "acknowledged", "listened",
  "offered support", "distraction", "redirected", "time together", "engaged",
  "key work", "therapeutic", "playful", "humour", "humor",
];

const BOUNDARY_PHRASES = [
  "consequence", "sanction", "privilege", "removed privilege", "restricted",
  "warning", "reminded", "informed", "contract", "boundary", "limit",
  "expectations", "stated that", "made clear", "not acceptable",
];

const PHYSICAL_PHRASES = [
  // NB: "managed" and "supported to" removed — they are not restraint and were
  // stealing therapeutic credit ("supported to settle", "managed calmly").
  "held", "restraint", "physical intervention", "pi", "team teach", "pbi",
  "mapa", "escorted", "physically",
];

// Whole-word-ish matching. The banks use intentional PREFIXES (e.g. "de-escalat"
// → "de-escalated", "reassur" → "reassured"), so anchor only the LEADING word
// boundary — except very short tokens (≤3 chars, e.g. the abbreviation "pi"/"pbi")
// which must match as COMPLETE words, or they fire inside ordinary words ("pi" in
// "copied", "coping", "happier") and mislabel therapeutic work as restraint.
function phraseMatches(lower: string, phrase: string): boolean {
  const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const anchored = phrase.length <= 3 ? `\\b${escaped}\\b` : `\\b${escaped}`;
  return new RegExp(anchored).test(lower);
}

function classify(strategy: string): ApproachType {
  if (!strategy || strategy.trim().length < 3) return "undocumented";
  const lower = strategy.toLowerCase();
  if (PHYSICAL_PHRASES.some((p) => phraseMatches(lower, p))) return "physical";
  if (THERAPEUTIC_PHRASES.some((p) => phraseMatches(lower, p))) return "therapeutic";
  if (BOUNDARY_PHRASES.some((p) => phraseMatches(lower, p))) return "boundary";
  return "undocumented";
}

function dominantApproach(
  t: number, b: number, ph: number, u: number,
): ApproachType {
  const max = Math.max(t, b, ph, u);
  if (max === 0) return "undocumented";
  if (t === max) return "therapeutic";
  if (b === max) return "boundary";
  if (ph === max) return "physical";
  return "undocumented";
}

// ── Consistency level from variance in therapeutic rate ───────────────────────

// A staff member needs at least this many behaviour-log entries for their
// therapeutic rate to be treated as a reliable signal (not a single data point).
const MIN_ENTRIES_FOR_SIGNAL = 2;

function deriveConsistency(variance: number, staffCount: number): ConsistencyLevel {
  if (staffCount < 2) return "consistent";
  if (variance >= 50) return "divergent";
  if (variance >= 25) return "mixed";
  return "consistent";
}

// ── Supervision prompts ───────────────────────────────────────────────────────

function buildSupervisionPrompt(
  childName: string,
  level: ConsistencyLevel,
  overallRate: number,
  mostTherapeutic: string | null,
  leastTherapeutic: string | null,
  variance: number,
): string {
  if (level === "consistent" && overallRate >= 60) {
    return `${childName}'s team shows consistent therapeutic approach across staff (${overallRate}% therapeutic). In supervision, celebrate this consistency and explore what makes it work.`;
  }
  if (level === "consistent" && overallRate < 60) {
    return `${childName}'s team is consistent but predominantly using boundary or physical approaches. In supervision, explore: what is making therapeutic approaches harder to use with this child?`;
  }
  if (level === "divergent") {
    const names = [mostTherapeutic, leastTherapeutic].filter(Boolean).join(" and ");
    return `${childName} is experiencing a ${variance}-point variance in therapeutic approach across the team${names ? ` (including ${names})` : ""}. This inconsistency may recreate unpredictability for the child. Priority discussion for next team meeting: what does a consistent approach look like for this child?`;
  }
  return `${childName}'s team shows some variation in approach. Explore in supervision: is the team using the child's PACE profile to guide their responses? Are newer staff getting modelling support from more experienced colleagues?`;
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildTeamApproachConsistency(store: ReturnType<typeof getStore>): TeamApproachData {
  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    id: string; child_id: string; date: string;
    strategy_used: string; recorded_by: string;
  }>;

  const staffMembers = (store.staff ?? []) as Array<{
    id: string; first_name: string; last_name: string; full_name?: string;
  }>;

  const nameById = new Map<string, string>();
  for (const s of staffMembers) {
    nameById.set(s.id, s.full_name ?? `${s.first_name} ${s.last_name}`);
  }
  for (const yp of youngPeople) {
    nameById.set(yp.id, `${yp.first_name} ${yp.last_name}`);
  }

  // ── Group entries by child → staff ───────────────────────────────────────
  type StaffEntries = Map<string, string[]>; // staffId → strategy_used[]
  const childStaffMap = new Map<string, StaffEntries>();
  let totalTherapeutic = 0;
  let totalEntries = 0;

  for (const entry of behaviourLog) {
    let staffMap = childStaffMap.get(entry.child_id);
    if (!staffMap) { staffMap = new Map(); childStaffMap.set(entry.child_id, staffMap); }
    const strategies = staffMap.get(entry.recorded_by) ?? [];
    strategies.push(entry.strategy_used ?? "");
    staffMap.set(entry.recorded_by, strategies);

    const type = classify(entry.strategy_used ?? "");
    if (type === "therapeutic") totalTherapeutic++;
    totalEntries++;
  }

  // ── Build per-child profiles ──────────────────────────────────────────────
  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  const childProfiles: ChildConsistencyProfile[] = [];

  for (const yp of currentChildren) {
    const staffMap = childStaffMap.get(yp.id);
    if (!staffMap || staffMap.size === 0) continue; // no behaviour log entries for this child

    const staffProfiles: StaffApproachProfile[] = [];
    let totalForChild = 0;
    let therapeuticForChild = 0;

    for (const [staffId, strategies] of staffMap.entries()) {
      let t = 0, b = 0, ph = 0, u = 0;
      for (const s of strategies) {
        const type = classify(s);
        if (type === "therapeutic") t++;
        else if (type === "boundary") b++;
        else if (type === "physical") ph++;
        else u++;
      }
      const total = strategies.length;
      const tRate = total > 0 ? Math.round((t / total) * 100) : 0;
      totalForChild += total;
      therapeuticForChild += t;

      staffProfiles.push({
        staffId,
        staffName: nameById.get(staffId) ?? staffId,
        totalEntries: total,
        therapeuticCount: t,
        boundaryCount: b,
        physicalCount: ph,
        undocumentedCount: u,
        therapeuticRate: tRate,
        dominantApproach: dominantApproach(t, b, ph, u),
      });
    }

    // Variance = range of therapeuticRate across staff who have enough entries to
    // be a reliable signal. A single entry per staff is noise, not divergence.
    const reliableRates = staffProfiles
      .filter((p) => p.totalEntries >= MIN_ENTRIES_FOR_SIGNAL)
      .map((p) => p.therapeuticRate);
    const variance =
      reliableRates.length >= 2 ? Math.max(...reliableRates) - Math.min(...reliableRates) : 0;

    const overallRate = totalForChild > 0 ? Math.round((therapeuticForChild / totalForChild) * 100) : 0;
    const level = deriveConsistency(variance, staffProfiles.length);

    // Sort staff by therapeutic rate for naming
    const sorted = [...staffProfiles].sort((a, b) => b.therapeuticRate - a.therapeuticRate);
    const mostTherapeutic = staffProfiles.length > 1 ? sorted[0].staffName : null;
    const leastTherapeutic = staffProfiles.length > 1 ? sorted[sorted.length - 1].staffName : null;

    childProfiles.push({
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      totalEntries: totalForChild,
      staffProfiles: sorted,
      consistencyLevel: level,
      overallTherapeuticRate: overallRate,
      therapeuticRateVariance: variance,
      mostTherapeuticStaff: mostTherapeutic,
      leastTherapeuticStaff: leastTherapeutic,
      supervisionPrompt: buildSupervisionPrompt(
        `${yp.first_name} ${yp.last_name}`, level, overallRate,
        mostTherapeutic, leastTherapeutic, variance,
      ),
    });
  }

  // Sort: divergent first, then mixed, then consistent
  const ORDER: Record<ConsistencyLevel, number> = { divergent: 0, mixed: 1, consistent: 2 };
  childProfiles.sort((a, b) => ORDER[a.consistencyLevel] - ORDER[b.consistencyLevel]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const consistent = childProfiles.filter((c) => c.consistencyLevel === "consistent").length;
  const mixed      = childProfiles.filter((c) => c.consistencyLevel === "mixed").length;
  const divergent  = childProfiles.filter((c) => c.consistencyLevel === "divergent").length;
  const overallTherapeuticRate = totalEntries > 0 ? Math.round((totalTherapeutic / totalEntries) * 100) : 0;

  // Most common divergence pattern
  const lowTherapeuticStaff = childProfiles
    .flatMap((c) =>
      c.staffProfiles
        .filter((s) => s.therapeuticRate < 30 && s.totalEntries >= MIN_ENTRIES_FOR_SIGNAL)
        .map((s) => s.staffName),
    );
  const dominanceCount: Record<string, number> = {};
  for (const name of lowTherapeuticStaff) {
    dominanceCount[name] = (dominanceCount[name] ?? 0) + 1;
  }
  // "across multiple children" must mean ≥2 children, not a single thin record.
  const topDivergent = Object.entries(dominanceCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostCommonDivergencePattern = topDivergent
    ? `${topDivergent} shows low therapeutic approach rate across multiple children`
    : "No clear divergence pattern detected";

  const summary: ApproachSummary = {
    totalChildren: childProfiles.length,
    consistentCount: consistent,
    mixedCount: mixed,
    divergentCount: divergent,
    overallTherapeuticRate,
    mostCommonDivergencePattern,
  };

  return { childProfiles, summary };
}
