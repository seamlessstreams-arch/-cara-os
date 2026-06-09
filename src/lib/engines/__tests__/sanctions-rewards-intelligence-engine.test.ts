// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS & REWARDS INTELLIGENCE ENGINE — TEST SUITE
// 55+ deterministic tests covering helpers, overview, type breakdowns,
// child profiles, risk flags, alerts, ARIA insights, and Chamberlain House integration.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSanctionsRewardsIntelligence,
  average,
  type SanctionRewardInput,
  type ChildRef,
  type StaffRef,
  type Direction,
} from "../sanctions-rewards-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_ryan", name: "Ryan Mitchell" },
  { id: "staff_anna", name: "Anna Nowak" },
  { id: "staff_chervelle", name: "Chervelle Brown" },
  { id: "staff_edward", name: "Edward Clarke" },
];

// ── Factory ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return {
    id: "sr_test",
    child_id: "yp_alex",
    date: "2026-05-20",
    time: "10:00",
    direction: "reward",
    reward_type: "verbal_praise",
    sanction_type: null,
    proportionate: true,
    recorded_by: "staff_darren",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeReward(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return makeEntry({ direction: "reward", reward_type: "verbal_praise", sanction_type: null, ...overrides });
}

function makeSanction(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return makeEntry({
    direction: "sanction",
    reward_type: null,
    sanction_type: "loss_of_privilege",
    ...overrides,
  });
}

function run(entries: SanctionRewardInput[] = [], childrenOverride?: ChildRef[], staffOverride?: StaffRef[]) {
  return computeSanctionsRewardsIntelligence({
    entries,
    children: childrenOverride ?? CHILDREN,
    staff: staffOverride ?? STAFF,
    today: TODAY,
  });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("average of empty array returns 0", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns sensible defaults with no entries", () => {
    const r = run([]);
    expect(r.overview.total_entries).toBe(0);
    expect(r.overview.total_rewards).toBe(0);
    expect(r.overview.total_sanctions).toBe(0);
    expect(r.overview.reward_to_sanction_ratio).toBe(0);
    expect(r.overview.proportionality_rate).toBe(100);
    expect(r.overview.children_with_entries).toBe(0);
    expect(r.child_profiles.length).toBe(0);
    expect(r.reward_types.length).toBe(0);
    expect(r.sanction_types.length).toBe(0);
  });

  it("generates low alert when no entries exist", () => {
    const r = run([]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low.length).toBe(1);
    expect(low[0].message).toContain("No sanctions or rewards recorded");
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts rewards and sanctions correctly", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeSanction({ id: "s1" }),
    ]);
    expect(r.overview.total_entries).toBe(3);
    expect(r.overview.total_rewards).toBe(2);
    expect(r.overview.total_sanctions).toBe(1);
  });

  it("calculates reward_to_sanction_ratio", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeReward({ id: "r3" }),
      makeSanction({ id: "s1" }),
    ]);
    expect(r.overview.reward_to_sanction_ratio).toBe(3);
  });

  it("ratio equals reward count when no sanctions", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
    ]);
    expect(r.overview.reward_to_sanction_ratio).toBe(2);
  });

  it("ratio is 0 when no entries at all", () => {
    const r = run([]);
    expect(r.overview.reward_to_sanction_ratio).toBe(0);
  });

  it("calculates proportionality_rate", () => {
    const r = run([
      makeReward({ id: "r1", proportionate: true }),
      makeSanction({ id: "s1", proportionate: true }),
      makeSanction({ id: "s2", proportionate: false }),
    ]);
    // 2 of 3 proportionate = 67%
    expect(r.overview.proportionality_rate).toBe(67);
  });

  it("counts unique children with entries", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeReward({ id: "r2", child_id: "yp_casey" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
    ]);
    expect(r.overview.children_with_entries).toBe(2);
  });

  it("counts children with sanctions", () => {
    const r = run([
      makeSanction({ id: "s1", child_id: "yp_alex" }),
      makeSanction({ id: "s2", child_id: "yp_jordan" }),
      makeReward({ id: "r1", child_id: "yp_casey" }),
    ]);
    expect(r.overview.children_with_sanctions).toBe(2);
  });

  it("counts children with rewards only", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_casey" }),
      makeReward({ id: "r2", child_id: "yp_jordan" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
      makeReward({ id: "r3", child_id: "yp_alex" }),
    ]);
    // Casey and Jordan have rewards only
    expect(r.overview.children_with_rewards_only).toBe(2);
  });

  it("counts unique staff recording", () => {
    const r = run([
      makeReward({ id: "r1", recorded_by: "staff_darren" }),
      makeReward({ id: "r2", recorded_by: "staff_anna" }),
      makeSanction({ id: "s1", recorded_by: "staff_darren" }),
    ]);
    expect(r.overview.staff_recording_count).toBe(2);
  });
});

// ── Type Breakdowns ─────────────────────────────────────────────────────────

describe("type breakdowns", () => {
  it("counts reward types with percentages", () => {
    const r = run([
      makeReward({ id: "r1", reward_type: "verbal_praise" }),
      makeReward({ id: "r2", reward_type: "verbal_praise" }),
      makeReward({ id: "r3", reward_type: "privilege" }),
    ]);
    expect(r.reward_types.length).toBe(2);
    const verbal = r.reward_types.find((t) => t.type === "verbal_praise");
    expect(verbal?.count).toBe(2);
    expect(verbal?.percentage).toBe(67);
    expect(verbal?.type_label).toBe("Verbal Praise");
  });

  it("counts sanction types with percentages", () => {
    const r = run([
      makeSanction({ id: "s1", sanction_type: "loss_of_privilege" }),
      makeSanction({ id: "s2", sanction_type: "loss_of_privilege" }),
      makeSanction({ id: "s3", sanction_type: "verbal_reminder" }),
    ]);
    expect(r.sanction_types.length).toBe(2);
    const loss = r.sanction_types.find((t) => t.type === "loss_of_privilege");
    expect(loss?.count).toBe(2);
    expect(loss?.type_label).toBe("Loss Of Privilege");
  });

  it("sorts types by count descending", () => {
    const r = run([
      makeReward({ id: "r1", reward_type: "privilege" }),
      makeReward({ id: "r2", reward_type: "verbal_praise" }),
      makeReward({ id: "r3", reward_type: "verbal_praise" }),
      makeReward({ id: "r4", reward_type: "verbal_praise" }),
    ]);
    expect(r.reward_types[0].type).toBe("verbal_praise");
    expect(r.reward_types[1].type).toBe("privilege");
  });
});

// ── Child Profiles ──────────────────────────────────────────────────────────

describe("child profiles", () => {
  it("creates profile for each child with entries", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeReward({ id: "r2", child_id: "yp_casey" }),
    ]);
    expect(r.child_profiles.length).toBe(2);
  });

  it("calculates per-child ratio correctly", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeReward({ id: "r2", child_id: "yp_alex" }),
      makeReward({ id: "r3", child_id: "yp_alex" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.rewards).toBe(3);
    expect(alex?.sanctions).toBe(1);
    expect(alex?.ratio).toBe(3);
  });

  it("ratio equals reward count when 0 sanctions", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_casey" }),
      makeReward({ id: "r2", child_id: "yp_casey" }),
    ]);
    const casey = r.child_profiles.find((p) => p.child_id === "yp_casey");
    expect(casey?.ratio).toBe(2);
  });

  it("tracks unique reward and sanction types per child", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex", reward_type: "verbal_praise" }),
      makeReward({ id: "r2", child_id: "yp_alex", reward_type: "privilege" }),
      makeSanction({ id: "s1", child_id: "yp_alex", sanction_type: "loss_of_privilege" }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.reward_types).toContain("verbal_praise");
    expect(alex?.reward_types).toContain("privilege");
    expect(alex?.sanction_types).toContain("loss_of_privilege");
  });

  it("calculates proportionate_pct per child", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex", proportionate: true }),
      makeSanction({ id: "s1", child_id: "yp_alex", proportionate: false }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.proportionate_pct).toBe(50);
    expect(alex?.disproportionate_count).toBe(1);
  });

  it("resolves child name from childMap", () => {
    const r = run([makeReward({ id: "r1", child_id: "yp_casey" })]);
    const casey = r.child_profiles.find((p) => p.child_id === "yp_casey");
    expect(casey?.child_name).toBe("Casey");
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags low_reward_ratio when ratio < 2 and sanctions > 0", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).toContain("low_reward_ratio");
  });

  it("does NOT flag low_reward_ratio when ratio >= 2", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeReward({ id: "r2", child_id: "yp_alex" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).not.toContain("low_reward_ratio");
  });

  it("flags disproportionate_entries when any entry is not proportionate", () => {
    const r = run([
      makeSanction({ id: "s1", child_id: "yp_alex", proportionate: false }),
    ]);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).toContain("disproportionate_entries");
  });

  it("flags high_sanction_count when sanctions >= 5", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeSanction({ id: `s_${i}`, child_id: "yp_alex" }),
    );
    const r = run(entries);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).toContain("high_sanction_count");
  });

  it("does NOT flag high_sanction_count when sanctions < 5", () => {
    const entries = Array.from({ length: 4 }, (_, i) =>
      makeSanction({ id: `s_${i}`, child_id: "yp_alex" }),
    );
    const r = run(entries);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).not.toContain("high_sanction_count");
  });

  it("flags sanctions_only when child has sanctions but no rewards", () => {
    const r = run([
      makeSanction({ id: "s1", child_id: "yp_jordan" }),
    ]);
    const jordan = r.child_profiles.find((p) => p.child_id === "yp_jordan");
    expect(jordan?.risk_flags).toContain("sanctions_only");
  });

  it("sorts profiles by most risk flags first", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_casey" }),
      makeSanction({ id: "s1", child_id: "yp_alex", proportionate: false }),
    ]);
    // Alex has: sanctions_only + disproportionate = 2 flags, Casey has 0
    expect(r.child_profiles[0].child_id).toBe("yp_alex");
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical alert for disproportionate entries", () => {
    const r = run([
      makeSanction({ id: "s1", proportionate: false }),
    ]);
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.length).toBe(1);
    expect(crit[0].message).toContain("disproportionate");
  });

  it("high alert for sanctions-only child", () => {
    const r = run([
      makeSanction({ id: "s1", child_id: "yp_jordan" }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("no recorded rewards"));
    expect(high.length).toBe(1);
    expect(high[0].message).toContain("Jordan");
  });

  it("high alert for low overall ratio (< 2:1)", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeSanction({ id: "s1" }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("ratio"));
    expect(high.length).toBe(1);
  });

  it("no ratio alert when ratio >= 2", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeSanction({ id: "s1" }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("ratio"));
    expect(high.length).toBe(0);
  });

  it("medium alert for high sanction count child", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeSanction({ id: `s_${i}`, child_id: "yp_alex" }),
    );
    const r = run(entries);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("5+ sanctions"));
    expect(med.length).toBe(1);
    expect(med[0].message).toContain("Alex");
  });

  it("medium alert for low individual ratio", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeSanction({ id: "s1", child_id: "yp_alex" }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("ratio below 2:1"));
    expect(med.length).toBe(1);
  });

  it("no critical alert when all entries proportionate", () => {
    const r = run([
      makeReward({ id: "r1", proportionate: true }),
      makeSanction({ id: "s1", proportionate: true }),
    ]);
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.length).toBe(0);
  });
});

// ── ARIA Insights ───────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical insight for disproportionate entries", () => {
    const r = run([makeSanction({ id: "s1", proportionate: false })]);
    const crit = r.insights.filter((i) => i.severity === "critical");
    expect(crit.length).toBe(1);
    expect(crit[0].text).toContain("disproportionate");
  });

  it("warning insight for low ratio", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeSanction({ id: "s1" }),
    ]);
    const warn = r.insights.filter((i) => i.severity === "warning" && i.text.includes("ratio"));
    expect(warn.length).toBe(1);
  });

  it("warning insight for sanctions-only children", () => {
    const r = run([makeSanction({ id: "s1", child_id: "yp_jordan" })]);
    const warn = r.insights.filter((i) => i.severity === "warning" && i.text.includes("only sanctions"));
    expect(warn.length).toBe(1);
  });

  it("positive insight for high ratio (≥3:1)", () => {
    const r = run([
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeReward({ id: "r3" }),
      makeSanction({ id: "s1" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3:1"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for 100% proportionality", () => {
    const r = run([
      makeReward({ id: "r1", proportionate: true }),
      makeSanction({ id: "s1", proportionate: true }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("100% proportionality"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for diverse reward types (≥3)", () => {
    const r = run([
      makeReward({ id: "r1", reward_type: "verbal_praise" }),
      makeReward({ id: "r2", reward_type: "privilege" }),
      makeReward({ id: "r3", reward_type: "activity" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3 different reward types"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for multiple staff recording (≥3)", () => {
    const r = run([
      makeReward({ id: "r1", recorded_by: "staff_darren" }),
      makeReward({ id: "r2", recorded_by: "staff_anna" }),
      makeReward({ id: "r3", recorded_by: "staff_ryan" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3 different staff"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for comprehensive child coverage (≥3)", () => {
    const r = run([
      makeReward({ id: "r1", child_id: "yp_alex" }),
      makeReward({ id: "r2", child_id: "yp_jordan" }),
      makeReward({ id: "r3", child_id: "yp_casey" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("recorded for 3 children"));
    expect(pos.length).toBe(1);
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  // Mirrors actual store.sanctionRewards data
  const OAK_HOUSE_ENTRIES: SanctionRewardInput[] = [
    // Alex: 4 rewards, 3 sanctions
    { id: "sr_001", child_id: "yp_alex", date: "2026-05-24", time: "09:30", direction: "reward", reward_type: "privilege", sanction_type: null, proportionate: true, recorded_by: "staff_darren", created_at: "2026-05-24" },
    { id: "sr_002", child_id: "yp_alex", date: "2026-05-21", time: "22:00", direction: "sanction", reward_type: null, sanction_type: "loss_of_privilege", proportionate: true, recorded_by: "staff_chervelle", created_at: "2026-05-21" },
    { id: "sr_003", child_id: "yp_alex", date: "2026-05-20", time: "16:00", direction: "reward", reward_type: "activity", sanction_type: null, proportionate: true, recorded_by: "staff_ryan", created_at: "2026-05-20" },
    { id: "sr_004", child_id: "yp_alex", date: "2026-05-17", time: "11:00", direction: "reward", reward_type: "verbal_praise", sanction_type: null, proportionate: true, recorded_by: "staff_edward", created_at: "2026-05-17" },
    { id: "sr_005", child_id: "yp_alex", date: "2026-05-13", time: "15:15", direction: "reward", reward_type: "verbal_praise", sanction_type: null, proportionate: true, recorded_by: "staff_anna", created_at: "2026-05-13" },
    { id: "sr_006", child_id: "yp_alex", date: "2026-05-09", time: "19:30", direction: "sanction", reward_type: null, sanction_type: "loss_of_privilege", proportionate: true, recorded_by: "staff_chervelle", created_at: "2026-05-09" },
    { id: "sr_007", child_id: "yp_alex", date: "2026-05-03", time: "15:30", direction: "sanction", reward_type: null, sanction_type: "loss_of_privilege", proportionate: true, recorded_by: "staff_ryan", created_at: "2026-05-03" },
    // Jordan: 3 rewards, 0 sanctions
    { id: "sr_008", child_id: "yp_jordan", date: "2026-05-24", time: "17:00", direction: "reward", reward_type: "activity", sanction_type: null, proportionate: true, recorded_by: "staff_anna", created_at: "2026-05-24" },
    { id: "sr_009", child_id: "yp_jordan", date: "2026-05-18", time: "09:00", direction: "reward", reward_type: "privilege", sanction_type: null, proportionate: true, recorded_by: "staff_ryan", created_at: "2026-05-18" },
    { id: "sr_010", child_id: "yp_jordan", date: "2026-05-11", time: "17:30", direction: "reward", reward_type: "verbal_praise", sanction_type: null, proportionate: true, recorded_by: "staff_chervelle", created_at: "2026-05-11" },
    // Casey: 3 rewards, 0 sanctions
    { id: "sr_011", child_id: "yp_casey", date: "2026-05-23", time: "11:30", direction: "reward", reward_type: "privilege", sanction_type: null, proportionate: true, recorded_by: "staff_anna", created_at: "2026-05-23" },
    { id: "sr_012", child_id: "yp_casey", date: "2026-05-21", time: "09:30", direction: "reward", reward_type: "verbal_praise", sanction_type: null, proportionate: true, recorded_by: "staff_darren", created_at: "2026-05-21" },
    { id: "sr_013", child_id: "yp_casey", date: "2026-05-16", time: "15:00", direction: "reward", reward_type: "activity", sanction_type: null, proportionate: true, recorded_by: "staff_chervelle", created_at: "2026-05-16" },
  ];

  it("counts 13 total entries: 10 rewards, 3 sanctions", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    expect(r.overview.total_entries).toBe(13);
    expect(r.overview.total_rewards).toBe(10);
    expect(r.overview.total_sanctions).toBe(3);
  });

  it("reward-to-sanction ratio is 3.3:1", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    expect(r.overview.reward_to_sanction_ratio).toBe(3.3);
  });

  it("proportionality rate is 100%", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    expect(r.overview.proportionality_rate).toBe(100);
  });

  it("3 children have entries, 1 with sanctions, 2 with rewards only", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    expect(r.overview.children_with_entries).toBe(3);
    expect(r.overview.children_with_sanctions).toBe(1);
    expect(r.overview.children_with_rewards_only).toBe(2);
  });

  it("5 unique staff recorded entries", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    expect(r.overview.staff_recording_count).toBe(5);
  });

  it("Alex's profile shows 4 rewards, 3 sanctions, ratio 1.3", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.rewards).toBe(4);
    expect(alex?.sanctions).toBe(3);
    expect(alex?.ratio).toBe(1.3);
  });

  it("Alex has low_reward_ratio flag (1.3 < 2)", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const alex = r.child_profiles.find((p) => p.child_id === "yp_alex");
    expect(alex?.risk_flags).toContain("low_reward_ratio");
  });

  it("Jordan and Casey have no risk flags", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const jordan = r.child_profiles.find((p) => p.child_id === "yp_jordan");
    const casey = r.child_profiles.find((p) => p.child_id === "yp_casey");
    expect(jordan?.risk_flags.length).toBe(0);
    expect(casey?.risk_flags.length).toBe(0);
  });

  it("generates positive insight for ratio ≥ 3:1", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3.3:1"));
    expect(pos.length).toBe(1);
  });

  it("generates positive insight for 100% proportionality", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("100% proportionality"));
    expect(pos.length).toBe(1);
  });

  it("generates positive insight for diverse reward types", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    // verbal_praise, privilege, activity = 3 types
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3 different reward types"));
    expect(pos.length).toBe(1);
  });

  it("generates positive insight for 5 staff recording", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("5 different staff"));
    expect(pos.length).toBe(1);
  });

  it("generates medium alert for Alex's low individual ratio", () => {
    const r = run(OAK_HOUSE_ENTRIES);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("ratio below 2:1"));
    expect(med.length).toBe(1);
    expect(med[0].message).toContain("Alex");
  });
});
