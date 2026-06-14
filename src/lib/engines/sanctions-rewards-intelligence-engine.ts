// ══════════════════════════════════════════════════════════════════════════════
// CARA — SANCTIONS & REWARDS INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses behaviour management: sanction/reward ratios, proportionality,
// per-child breakdown, type distribution, and pattern analysis.
//
// Regulatory: Reg 19 — behaviour management must not include any form of
// corporal punishment or deprivation of food/drink. Reg 35 — behaviour
// management policies must promote positive behaviour. SCCIF: "Helped &
// Protected" and "Experiences & Progress" — do children experience a
// reward-led, restorative approach?
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type Direction = "reward" | "sanction";

export interface SanctionRewardInput {
  id: string;
  child_id: string;
  date: string;                    // ISO date
  time: string;
  direction: Direction;
  reward_type: string | null;      // e.g. "verbal_praise", "privilege", "activity"
  sanction_type: string | null;    // e.g. "loss_of_privilege", "verbal_reminder"
  proportionate: boolean;
  recorded_by: string;
  created_at: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface SanctionsRewardsIntelligenceInput {
  entries: SanctionRewardInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface SROverview {
  total_entries: number;
  total_rewards: number;
  total_sanctions: number;
  reward_to_sanction_ratio: number;    // e.g. 2.5 = 2.5 rewards per sanction
  proportionality_rate: number;        // pct of all entries marked proportionate
  children_with_entries: number;
  children_with_sanctions: number;
  children_with_rewards_only: number;  // children with rewards but 0 sanctions
  staff_recording_count: number;       // unique staff who recorded
}

export interface TypeBreakdown {
  type: string;
  type_label: string;
  count: number;
  percentage: number;
}

export interface ChildBehaviourProfile {
  child_id: string;
  child_name: string;
  rewards: number;
  sanctions: number;
  ratio: number;                       // rewards / sanctions (Infinity if 0 sanctions)
  reward_types: string[];              // unique reward types
  sanction_types: string[];            // unique sanction types
  proportionate_pct: number;
  disproportionate_count: number;
  risk_flags: string[];
}

export interface SRAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraSRInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface SanctionsRewardsIntelligenceResult {
  overview: SROverview;
  reward_types: TypeBreakdown[];
  sanction_types: TypeBreakdown[];
  child_profiles: ChildBehaviourProfile[];
  alerts: SRAlert[];
  insights: CaraSRInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeSanctionsRewardsIntelligence(
  input: SanctionsRewardsIntelligenceInput,
): SanctionsRewardsIntelligenceResult {
  const { entries, children, staff } = input;

  const childMap = new Map(children.map((c) => [c.id, c.name]));

  // ── Totals ──────────────────────────────────────────────────────────
  const rewards = entries.filter((e) => e.direction === "reward");
  const sanctions = entries.filter((e) => e.direction === "sanction");
  const totalRewards = rewards.length;
  const totalSanctions = sanctions.length;
  const ratio = totalSanctions > 0
    ? round1(totalRewards / totalSanctions)
    : totalRewards > 0 ? totalRewards : 0;

  const proportionate = entries.filter((e) => e.proportionate);
  const proportionalityRate = entries.length > 0
    ? Math.round((proportionate.length / entries.length) * 100)
    : 100;

  const childIdSet = new Set(entries.map((e) => e.child_id));
  const childrenWithSanctions = new Set(sanctions.map((e) => e.child_id));
  const childrenWithRewardsOnly = [...childIdSet].filter(
    (id) => !childrenWithSanctions.has(id),
  ).length;

  const uniqueStaff = new Set(entries.map((e) => e.recorded_by));

  const overview: SROverview = {
    total_entries: entries.length,
    total_rewards: totalRewards,
    total_sanctions: totalSanctions,
    reward_to_sanction_ratio: ratio,
    proportionality_rate: proportionalityRate,
    children_with_entries: childIdSet.size,
    children_with_sanctions: childrenWithSanctions.size,
    children_with_rewards_only: childrenWithRewardsOnly,
    staff_recording_count: uniqueStaff.size,
  };

  // ── Type Breakdowns ────────────────────────────────────────────────
  function buildTypeBreakdown(entries: SanctionRewardInput[], direction: Direction): TypeBreakdown[] {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const type = direction === "reward" ? e.reward_type : e.sanction_type;
      if (type) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    const total = entries.length;
    return [...counts.entries()]
      .map(([type, count]) => ({
        type,
        type_label: formatType(type),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  const reward_types = buildTypeBreakdown(rewards, "reward");
  const sanction_types = buildTypeBreakdown(sanctions, "sanction");

  // ── Child Profiles ─────────────────────────────────────────────────
  const childEntriesMap = new Map<string, SanctionRewardInput[]>();
  for (const e of entries) {
    const arr = childEntriesMap.get(e.child_id) ?? [];
    arr.push(e);
    childEntriesMap.set(e.child_id, arr);
  }

  const child_profiles: ChildBehaviourProfile[] = [...childEntriesMap.entries()]
    .map(([child_id, childEntries]) => {
      const childRewards = childEntries.filter((e) => e.direction === "reward");
      const childSanctions = childEntries.filter((e) => e.direction === "sanction");
      const childRatio = childSanctions.length > 0
        ? round1(childRewards.length / childSanctions.length)
        : childRewards.length > 0 ? childRewards.length : 0;

      const rewardTypes = [...new Set(childRewards.map((e) => e.reward_type).filter(Boolean) as string[])];
      const sanctionTypes = [...new Set(childSanctions.map((e) => e.sanction_type).filter(Boolean) as string[])];

      const disproportionate = childEntries.filter((e) => !e.proportionate);
      const proportionatePct = childEntries.length > 0
        ? Math.round(((childEntries.length - disproportionate.length) / childEntries.length) * 100)
        : 100;

      const riskFlags: string[] = [];
      if (childRatio > 0 && childRatio < 2 && childSanctions.length > 0)
        riskFlags.push("low_reward_ratio");
      if (disproportionate.length > 0)
        riskFlags.push("disproportionate_entries");
      if (childSanctions.length >= 5)
        riskFlags.push("high_sanction_count");
      if (childSanctions.length > 0 && childRewards.length === 0)
        riskFlags.push("sanctions_only");

      return {
        child_id,
        child_name: childMap.get(child_id) ?? child_id,
        rewards: childRewards.length,
        sanctions: childSanctions.length,
        ratio: childRatio,
        reward_types: rewardTypes,
        sanction_types: sanctionTypes,
        proportionate_pct: proportionatePct,
        disproportionate_count: disproportionate.length,
        risk_flags: riskFlags,
      };
    })
    .sort((a, b) => {
      // Sort: highest risk first (most flags, then lowest ratio)
      if (b.risk_flags.length !== a.risk_flags.length) return b.risk_flags.length - a.risk_flags.length;
      return a.ratio - b.ratio;
    });

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: SRAlert[] = [];

  // Critical: disproportionate sanctions
  const disproportionateEntries = entries.filter((e) => !e.proportionate);
  if (disproportionateEntries.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${disproportionateEntries.length} entry/entries marked as disproportionate. Reg 19 requires all behaviour management to be proportionate and fair. Each must be reviewed by management.`,
    });
  }

  // High: child with sanctions only (no rewards)
  const sanctionsOnlyChildren = child_profiles.filter((c) => c.risk_flags.includes("sanctions_only"));
  if (sanctionsOnlyChildren.length > 0) {
    const names = sanctionsOnlyChildren.map((c) => c.child_name).join(", ");
    alerts.push({
      severity: "high",
      message: `${sanctionsOnlyChildren.length} child(ren) have received sanctions but no recorded rewards (${names}). Reg 35 requires a positive, reward-led approach to behaviour management.`,
    });
  }

  // High: low overall ratio (< 2:1)
  if (totalSanctions > 0 && ratio < 2) {
    alerts.push({
      severity: "high",
      message: `Reward-to-sanction ratio is ${ratio}:1 (below recommended 2:1 minimum). Research indicates a 3:1 or higher ratio promotes positive outcomes. Review whether rewards are being consistently recognised and recorded.`,
    });
  }

  // Medium: high sanction count for any child (≥5)
  const highSanctionChildren = child_profiles.filter((c) => c.risk_flags.includes("high_sanction_count"));
  if (highSanctionChildren.length > 0) {
    const names = highSanctionChildren.map((c) => `${c.child_name} (${c.sanctions})`).join(", ");
    alerts.push({
      severity: "medium",
      message: `${highSanctionChildren.length} child(ren) with 5+ sanctions: ${names}. Frequent sanctions may indicate the behaviour support plan needs review or a different approach.`,
    });
  }

  // Medium: low reward ratio for individual children
  const lowRatioChildren = child_profiles.filter((c) => c.risk_flags.includes("low_reward_ratio"));
  if (lowRatioChildren.length > 0) {
    const names = lowRatioChildren.map((c) => `${c.child_name} (${c.ratio}:1)`).join(", ");
    alerts.push({
      severity: "medium",
      message: `${lowRatioChildren.length} child(ren) with reward-to-sanction ratio below 2:1: ${names}. Consider targeted positive reinforcement strategies.`,
    });
  }

  // Low: no entries recorded
  if (entries.length === 0) {
    alerts.push({
      severity: "low",
      message: `No sanctions or rewards recorded. Reg 35 requires a behaviour management record. Staff should record both positive recognitions and any sanctions applied.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraSRInsight[] = [];

  // Critical: disproportionate entries
  if (disproportionateEntries.length > 0) {
    insights.push({
      severity: "critical",
      text: `${disproportionateEntries.length} entry/entries flagged as disproportionate. Inspectors will examine whether sanctions are fair, proportionate, and in line with the home's behaviour management policy. Each requires management review and resolution.`,
    });
  }

  // Warning: low ratio
  if (totalSanctions > 0 && ratio < 2) {
    insights.push({
      severity: "warning",
      text: `Reward-to-sanction ratio is ${ratio}:1. Best practice in residential childcare recommends at least 3:1 — children thrive when positive behaviour is consistently noticed and celebrated. Low ratios may indicate a punitive culture that SCCIF will challenge.`,
    });
  }

  // Warning: sanctions-only children
  if (sanctionsOnlyChildren.length > 0) {
    insights.push({
      severity: "warning",
      text: `${sanctionsOnlyChildren.length} child(ren) have received only sanctions with no rewards recorded. This pattern may indicate a lack of therapeutic engagement or inadequate recording of positive interactions.`,
    });
  }

  // Positive: high overall ratio (≥3:1)
  if (totalSanctions > 0 && ratio >= 3) {
    insights.push({
      severity: "positive",
      text: `Reward-to-sanction ratio is ${ratio}:1 — above the recommended 3:1 threshold. This indicates a strongly positive, reward-led culture aligned with Reg 35 and SCCIF best practice.`,
    });
  }

  // Positive: 100% proportionality
  if (proportionalityRate === 100 && entries.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${entries.length} entries are marked as proportionate. 100% proportionality demonstrates that behaviour management is fair and measured — a key Reg 19 compliance indicator.`,
    });
  }

  // Positive: all children have rewards
  if (childIdSet.size > 0 && childrenWithRewardsOnly === childIdSet.size - childrenWithSanctions.size && childrenWithSanctions.size === 0) {
    insights.push({
      severity: "positive",
      text: `All ${childIdSet.size} children with entries have received rewards with no sanctions. A reward-only record demonstrates exceptional positive behaviour management.`,
    });
  } else if (childIdSet.size > 0 && childrenWithRewardsOnly > 0) {
    insights.push({
      severity: "positive",
      text: `${childrenWithRewardsOnly} child(ren) have rewards recorded with zero sanctions. Reward-only profiles indicate positive behaviour patterns and effective support.`,
    });
  }

  // Positive: diverse reward types (≥3)
  if (reward_types.length >= 3) {
    insights.push({
      severity: "positive",
      text: `${reward_types.length} different reward types used (${reward_types.slice(0, 3).map((t) => t.type_label).join(", ")}). A diverse reward approach allows personalisation and demonstrates that staff understand individual children's motivations.`,
    });
  }

  // Positive: multiple staff recording
  if (uniqueStaff.size >= 3) {
    insights.push({
      severity: "positive",
      text: `${uniqueStaff.size} different staff members have recorded sanctions/rewards. Distributed recording indicates whole-team engagement with behaviour management rather than reliance on individual staff.`,
    });
  }

  // Positive: good coverage of children
  if (childIdSet.size >= 3) {
    insights.push({
      severity: "positive",
      text: `Sanctions and rewards recorded for ${childIdSet.size} children. Comprehensive coverage demonstrates that staff are attentive to every child's behaviour and recognise positive contributions.`,
    });
  }

  return {
    overview,
    reward_types,
    sanction_types,
    child_profiles,
    alerts,
    insights,
  };
}
