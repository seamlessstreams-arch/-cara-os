// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBehaviourIntelligence,
  classifyBehaviourCategory,
  classifyIncidentAsBehaviour,
  getTimeBlock,
  wasDeEscalationSuccessful,
  computeChildTrend,
  computeChildSeverity,
  type BehaviourEntryInput,
  type IncidentInput,
  type RestraintInput,
  type SanctionRewardInput,
  type BehaviourEngineInput,
} from "../behaviour-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeBehaviourEntry(overrides: Partial<BehaviourEntryInput> = {}): BehaviourEntryInput {
  return {
    id: "beh_test",
    child_id: "yp_test",
    date: "2026-05-20",
    time: "14:00",
    direction: "positive",
    intensity: "low",
    title: "Test entry",
    antecedent: "",
    behaviour: "Positive behaviour",
    consequence: "Praise",
    trigger: "",
    strategy_used: "",
    outcome: "Good outcome",
    recorded_by: "staff_test",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_test",
    child_id: "yp_test",
    date: "2026-05-20",
    time: "14:00",
    type: "physical_intervention",
    severity: "high",
    description: "PI incident",
    immediate_action: "Hold applied",
    status: "closed",
    body_map_completed: false,
    reported_by: "staff_test",
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_test",
    child_id: "yp_test",
    date: "2026-05-20",
    start_time: "14:00",
    end_time: "14:05",
    duration: 5,
    reason: "imminent_harm_to_others",
    restraint_type: "planned_hold",
    antecedent: "Agitated",
    de_escalation_attempts: ["Verbal", "Space offered"],
    child_debriefed: true,
    staff_debriefed: true,
    injuries: [],
    review_status: "reviewed",
    recorded_by: "staff_test",
    ...overrides,
  };
}

function makeSanctionReward(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return {
    id: "sr_test",
    child_id: "yp_test",
    date: "2026-05-20",
    direction: "reward",
    title: "Test reward",
    description: "Good behaviour",
    context: "Morning routine",
    child_response: "Happy",
    outcome: "Positive",
    proportionate: true,
    recorded_by: "staff_test",
    ...overrides,
  };
}

// ── classifyBehaviourCategory ───────────────────────────────────────────────

describe("classifyBehaviourCategory", () => {
  it("returns positive for positive direction entries", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({ direction: "positive" }))).toBe("positive");
  });

  it("classifies self-harm from behaviour text", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      behaviour: "Attempted self-harm with sharp object",
    }))).toBe("self_harm");
  });

  it("classifies aggression from behaviour text", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      behaviour: "Hit staff member with fist",
    }))).toBe("aggression");
  });

  it("classifies property damage from behaviour text", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      title: "Property damage in bedroom",
      behaviour: "Threw controller and smashed wall",
    }))).toBe("property_damage");
  });

  it("classifies verbal aggression from behaviour text", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      behaviour: "Shouting verbal threats at staff",
    }))).toBe("verbal_aggression");
  });

  it("classifies absconding from behaviour text", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      behaviour: "Left without permission",
    }))).toBe("absconding");
  });

  it("classifies escalating for high intensity without other keywords", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      intensity: "high",
      behaviour: "Increasingly agitated during evening",
    }))).toBe("escalating");
  });

  it("classifies concerning for medium intensity without keywords", () => {
    expect(classifyBehaviourCategory(makeBehaviourEntry({
      direction: "concerning",
      intensity: "medium",
      behaviour: "Refused to engage with group activity",
    }))).toBe("concerning");
  });
});

// ── classifyIncidentAsBehaviour ─────────────────────────────────────────────

describe("classifyIncidentAsBehaviour", () => {
  it("classifies physical_intervention as aggression", () => {
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "physical_intervention" }))).toBe("aggression");
  });

  it("classifies self_harm", () => {
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "self_harm" }))).toBe("self_harm");
  });

  it("classifies missing_from_care as absconding", () => {
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "missing_from_care" }))).toBe("absconding");
  });

  it("returns null for non-behaviour incidents", () => {
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "medication_error" }))).toBeNull();
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "complaint" }))).toBeNull();
    expect(classifyIncidentAsBehaviour(makeIncident({ type: "safeguarding_concern" }))).toBeNull();
  });
});

// ── getTimeBlock ────────────────────────────────────────────────────────────

describe("getTimeBlock", () => {
  it("classifies night (0-6)", () => {
    expect(getTimeBlock(3)).toEqual({ block: "00:00-06:00", label: "Night" });
  });

  it("classifies early morning (6-9)", () => {
    expect(getTimeBlock(7)).toEqual({ block: "06:00-09:00", label: "Early Morning" });
  });

  it("classifies morning (9-12)", () => {
    expect(getTimeBlock(10)).toEqual({ block: "09:00-12:00", label: "Morning" });
  });

  it("classifies afternoon (12-15)", () => {
    expect(getTimeBlock(13)).toEqual({ block: "12:00-15:00", label: "Afternoon" });
  });

  it("classifies late afternoon (15-18)", () => {
    expect(getTimeBlock(16)).toEqual({ block: "15:00-18:00", label: "Late Afternoon" });
  });

  it("classifies evening (18-21)", () => {
    expect(getTimeBlock(19)).toEqual({ block: "18:00-21:00", label: "Evening" });
  });

  it("classifies late evening (21-24)", () => {
    expect(getTimeBlock(22)).toEqual({ block: "21:00-00:00", label: "Late Evening" });
  });
});

// ── wasDeEscalationSuccessful ───────────────────────────────────────────────

describe("wasDeEscalationSuccessful", () => {
  it("returns true when strategy used and outcome indicates success", () => {
    expect(wasDeEscalationSuccessful(makeBehaviourEntry({
      direction: "concerning",
      strategy_used: "Verbal reassurance and space",
      outcome: "Alex settled after 15 minutes",
    }))).toBe(true);
  });

  it("returns true for de-escalated outcome", () => {
    expect(wasDeEscalationSuccessful(makeBehaviourEntry({
      direction: "concerning",
      strategy_used: "Low-arousal approach",
      outcome: "Child de-escalated and returned to activity",
    }))).toBe(true);
  });

  it("returns false when no strategy used", () => {
    expect(wasDeEscalationSuccessful(makeBehaviourEntry({
      direction: "concerning",
      strategy_used: "",
      outcome: "Eventually settled",
    }))).toBe(false);
  });

  it("returns false when strategy is none", () => {
    expect(wasDeEscalationSuccessful(makeBehaviourEntry({
      direction: "concerning",
      strategy_used: "none",
      outcome: "Settled",
    }))).toBe(false);
  });

  it("returns false when outcome does not indicate success", () => {
    expect(wasDeEscalationSuccessful(makeBehaviourEntry({
      direction: "concerning",
      strategy_used: "Verbal de-escalation",
      outcome: "PI required. Hold applied for safety.",
    }))).toBe(false);
  });
});

// ── computeChildTrend ───────────────────────────────────────────────────────

describe("computeChildTrend", () => {
  it("returns improving when recent positive ratio increases significantly", () => {
    expect(computeChildTrend(5, 2, 2, 5)).toBe("improving");
  });

  it("returns declining when recent positive ratio decreases significantly", () => {
    expect(computeChildTrend(1, 5, 5, 1)).toBe("declining");
  });

  it("returns stable when ratios are similar", () => {
    expect(computeChildTrend(3, 3, 3, 3)).toBe("stable");
  });

  it("returns insufficient_data when totals are too low", () => {
    expect(computeChildTrend(0, 1, 0, 1)).toBe("insufficient_data");
  });

  it("returns stable when older period is zero but recent exists", () => {
    expect(computeChildTrend(3, 2, 0, 0)).toBe("stable");
  });
});

// ── computeChildSeverity ────────────────────────────────────────────────────

describe("computeChildSeverity", () => {
  it("returns critical for 3+ PIs", () => {
    expect(computeChildSeverity(3, 2, "stable")).toBe("critical");
  });

  it("returns critical for 5+ concerning with declining trend", () => {
    expect(computeChildSeverity(0, 5, "declining")).toBe("critical");
  });

  it("returns high for 2 PIs", () => {
    expect(computeChildSeverity(2, 1, "stable")).toBe("high");
  });

  it("returns high for 4+ concerning entries", () => {
    expect(computeChildSeverity(0, 4, "stable")).toBe("high");
  });

  it("returns medium for 1 PI", () => {
    expect(computeChildSeverity(1, 1, "stable")).toBe("medium");
  });

  it("returns low for 1 concerning entry, no PIs", () => {
    expect(computeChildSeverity(0, 1, "stable")).toBe("low");
  });

  it("returns positive for zero concerning, zero PIs", () => {
    expect(computeChildSeverity(0, 0, "stable")).toBe("positive");
  });
});

// ── computeBehaviourIntelligence — Empty ────────────────────────────────────

describe("computeBehaviourIntelligence — empty inputs", () => {
  it("handles empty arrays gracefully", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.profile.total_entries).toBe(0);
    expect(result.profile.positive_percentage).toBe(100);
    expect(result.profile.pi_count).toBe(0);
    expect(result.categories).toHaveLength(0);
    expect(result.pi_entries).toHaveLength(0);
    expect(result.rewards_sanctions.total_rewards).toBe(0);
    expect(result.rewards_sanctions.total_sanctions).toBe(0);
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
    expect(result.insights[0].text).toContain("No behaviour entries recorded");
  });
});

// ── computeBehaviourIntelligence — Profile ──────────────────────────────────

describe("computeBehaviourIntelligence — profile computation", () => {
  const baseInput: BehaviourEngineInput = {
    behaviourEntries: [
      makeBehaviourEntry({ id: "b1", direction: "positive", date: "2026-05-20" }),
      makeBehaviourEntry({ id: "b2", direction: "positive", date: "2026-05-19" }),
      makeBehaviourEntry({ id: "b3", direction: "concerning", intensity: "medium", date: "2026-05-18", behaviour: "Refused to engage" }),
      makeBehaviourEntry({ id: "b4", direction: "concerning", intensity: "high", date: "2026-05-17", behaviour: "Increasingly agitated" }),
    ],
    incidents: [
      makeIncident({ id: "i1", type: "physical_intervention", date: "2026-05-15" }),
    ],
    restraints: [
      makeRestraint({ id: "r1", date: "2026-05-15", child_debriefed: true }),
    ],
    sanctionRewards: [],
    today: "2026-05-23",
  };

  it("counts total entries including behaviour-relevant incidents", () => {
    const result = computeBehaviourIntelligence(baseInput);
    // 4 behaviour entries + 1 PI incident (behaviour-relevant) = 5
    expect(result.profile.total_entries).toBe(5);
  });

  it("counts positive entries correctly", () => {
    const result = computeBehaviourIntelligence(baseInput);
    expect(result.profile.positive_count).toBe(2);
  });

  it("calculates positive percentage", () => {
    const result = computeBehaviourIntelligence(baseInput);
    expect(result.profile.positive_percentage).toBe(40); // 2/5 = 40%
  });

  it("counts PI events from restraints", () => {
    const result = computeBehaviourIntelligence(baseInput);
    expect(result.profile.pi_count).toBe(1); // restraint deduplicates with incident
  });

  it("calculates PI debrief rate", () => {
    const result = computeBehaviourIntelligence(baseInput);
    expect(result.profile.pi_debrief_completion_rate).toBe(100);
  });
});

// ── computeBehaviourIntelligence — Categories ───────────────────────────────

describe("computeBehaviourIntelligence — categories", () => {
  it("breaks down entries into categories", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "positive" }),
        makeBehaviourEntry({ id: "b2", direction: "positive" }),
        makeBehaviourEntry({ id: "b3", direction: "concerning", behaviour: "Hit staff", intensity: "high" }),
        makeBehaviourEntry({ id: "b4", direction: "concerning", behaviour: "Threw chair at wall", intensity: "medium" }),
        makeBehaviourEntry({ id: "b5", direction: "concerning", behaviour: "Shouting verbal abuse", intensity: "medium" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const catMap = new Map(result.categories.map((c) => [c.category, c.count]));
    expect(catMap.get("positive")).toBe(2);
    expect(catMap.get("aggression")).toBe(1);
    expect(catMap.get("property_damage")).toBe(1);
    expect(catMap.get("verbal_aggression")).toBe(1);
  });

  it("includes behaviour-relevant incidents in category counts", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "positive" }),
      ],
      incidents: [
        makeIncident({ id: "i1", type: "physical_intervention" }),
        makeIncident({ id: "i2", type: "missing_from_care" }),
      ],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const catMap = new Map(result.categories.map((c) => [c.category, c.count]));
    expect(catMap.get("aggression")).toBe(1);
    expect(catMap.get("absconding")).toBe(1);
  });
});

// ── computeBehaviourIntelligence — PI entries ───────────────────────────────

describe("computeBehaviourIntelligence — PI entries", () => {
  it("populates PI entries from restraints", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [
        makeRestraint({ id: "r1", duration: 3, restraint_type: "planned_hold", child_debriefed: true }),
        makeRestraint({ id: "r2", duration: 5, restraint_type: "wrap_hold", child_debriefed: false, injuries: [{ person: "child", description: "bruise" }] }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.pi_entries).toHaveLength(2);
    expect(result.profile.pi_count).toBe(2);
    expect(result.profile.pi_injury_rate).toBe(50); // 1/2
    expect(result.profile.pi_debrief_completion_rate).toBe(50); // 1/2
    expect(result.profile.pi_avg_duration_minutes).toBe(4); // (3+5)/2
  });

  it("deduplicates PI incidents that match restraint dates", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [
        makeIncident({ id: "i1", type: "physical_intervention", date: "2026-05-20", child_id: "yp_test" }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", child_id: "yp_test" }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    // Should only count once (from restraint)
    expect(result.pi_entries).toHaveLength(1);
    expect(result.pi_entries[0].id).toBe("r1");
  });

  it("adds PI incidents when no matching restraint exists", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [
        makeIncident({
          id: "i1", type: "physical_intervention", date: "2026-05-18", child_id: "yp_test",
          description: "Team Teach hold used for approximately 4 minutes",
        }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", child_id: "yp_test" }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.pi_entries).toHaveLength(2);
  });

  it("extracts technique and duration from incident descriptions", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [
        makeIncident({
          id: "i1", type: "physical_intervention", date: "2026-05-18", child_id: "yp_unique",
          description: "A wrap hold was used for approximately 7 minutes until child de-escalated.",
        }),
      ],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.pi_entries[0].technique).toBe("Wrap hold");
    expect(result.pi_entries[0].duration_minutes).toBe(7);
  });
});

// ── computeBehaviourIntelligence — Rewards/Sanctions ────────────────────────

describe("computeBehaviourIntelligence — rewards/sanctions", () => {
  it("counts rewards and sanctions", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [],
      sanctionRewards: [
        makeSanctionReward({ id: "sr1", direction: "reward" }),
        makeSanctionReward({ id: "sr2", direction: "reward" }),
        makeSanctionReward({ id: "sr3", direction: "reward" }),
        makeSanctionReward({ id: "sr4", direction: "sanction" }),
      ],
      today: "2026-05-23",
    });

    expect(result.rewards_sanctions.total_rewards).toBe(3);
    expect(result.rewards_sanctions.total_sanctions).toBe(1);
    expect(result.rewards_sanctions.ratio).toBe(75); // 3/(3+1) * 100
    expect(result.rewards_sanctions.reward_to_sanction).toBe("3.0:1");
  });

  it("identifies children with disproportionate sanctions", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [],
      sanctionRewards: [
        makeSanctionReward({ id: "sr1", child_id: "yp_problem", direction: "sanction" }),
        makeSanctionReward({ id: "sr2", child_id: "yp_problem", direction: "sanction" }),
        makeSanctionReward({ id: "sr3", child_id: "yp_problem", direction: "reward" }),
        makeSanctionReward({ id: "sr4", child_id: "yp_good", direction: "reward" }),
        makeSanctionReward({ id: "sr5", child_id: "yp_good", direction: "reward" }),
        makeSanctionReward({ id: "sr6", child_id: "yp_good", direction: "reward" }),
      ],
      today: "2026-05-23",
    });

    expect(result.rewards_sanctions.disproportionate_children).toContain("yp_problem");
    expect(result.rewards_sanctions.disproportionate_children).not.toContain("yp_good");
  });

  it("returns 100% ratio when no entries exist", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.rewards_sanctions.ratio).toBe(100);
  });
});

// ── computeBehaviourIntelligence — Time patterns ────────────────────────────

describe("computeBehaviourIntelligence — time patterns", () => {
  it("maps entries to correct time blocks", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", time: "07:00", direction: "positive" }),
        makeBehaviourEntry({ id: "b2", time: "19:30", direction: "concerning", behaviour: "Agitated" }),
        makeBehaviourEntry({ id: "b3", time: "20:00", direction: "concerning", behaviour: "Shouting" }),
        makeBehaviourEntry({ id: "b4", time: "22:00", direction: "concerning", behaviour: "Refused bedtime" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const evening = result.time_patterns.find((t) => t.label === "Evening");
    expect(evening?.count).toBe(2);
    expect(evening?.concerning_count).toBe(2);

    const earlyMorning = result.time_patterns.find((t) => t.label === "Early Morning");
    expect(earlyMorning?.count).toBe(1);
    expect(earlyMorning?.positive_count).toBe(1);
  });

  it("always returns all 7 time blocks", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [makeBehaviourEntry({ id: "b1" })],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    expect(result.time_patterns).toHaveLength(7);
  });
});

// ── computeBehaviourIntelligence — Child trajectories ───────────────────────

describe("computeBehaviourIntelligence — child trajectories", () => {
  it("computes per-child trajectory with trend", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        // Recent (last 14 days) — mostly positive
        makeBehaviourEntry({ id: "b1", child_id: "yp_good", date: "2026-05-20", direction: "positive" }),
        makeBehaviourEntry({ id: "b2", child_id: "yp_good", date: "2026-05-18", direction: "positive" }),
        makeBehaviourEntry({ id: "b3", child_id: "yp_good", date: "2026-05-16", direction: "concerning", behaviour: "Minor refusal" }),
        // Older (14-28 days ago) — mostly concerning
        makeBehaviourEntry({ id: "b4", child_id: "yp_good", date: "2026-05-05", direction: "concerning", behaviour: "Escalating behaviour" }),
        makeBehaviourEntry({ id: "b5", child_id: "yp_good", date: "2026-05-03", direction: "concerning", behaviour: "Verbal aggression" }),
        makeBehaviourEntry({ id: "b6", child_id: "yp_good", date: "2026-05-01", direction: "positive" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const trajectory = result.child_trajectories.find((t) => t.child_id === "yp_good");
    expect(trajectory).toBeDefined();
    expect(trajectory!.trend).toBe("improving");
    expect(trajectory!.positive_recent).toBe(2);
    expect(trajectory!.concerning_recent).toBe(1);
  });

  it("identifies declining trajectory", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        // Recent — mostly concerning
        makeBehaviourEntry({ id: "b1", child_id: "yp_bad", date: "2026-05-22", direction: "concerning", behaviour: "Hit peer" }),
        makeBehaviourEntry({ id: "b2", child_id: "yp_bad", date: "2026-05-20", direction: "concerning", behaviour: "Verbal threats" }),
        makeBehaviourEntry({ id: "b3", child_id: "yp_bad", date: "2026-05-18", direction: "concerning", behaviour: "Property damage" }),
        // Older — mostly positive
        makeBehaviourEntry({ id: "b4", child_id: "yp_bad", date: "2026-05-05", direction: "positive" }),
        makeBehaviourEntry({ id: "b5", child_id: "yp_bad", date: "2026-05-03", direction: "positive" }),
        makeBehaviourEntry({ id: "b6", child_id: "yp_bad", date: "2026-05-01", direction: "positive" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const trajectory = result.child_trajectories.find((t) => t.child_id === "yp_bad");
    expect(trajectory!.trend).toBe("declining");
  });

  it("sorts trajectories by severity (critical first)", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", child_id: "yp_a", date: "2026-05-20", direction: "positive" }),
        makeBehaviourEntry({ id: "b2", child_id: "yp_b", date: "2026-05-20", direction: "concerning", behaviour: "Agitated", intensity: "high" }),
      ],
      incidents: [],
      restraints: [
        makeRestraint({ id: "r1", child_id: "yp_b", date: "2026-05-20" }),
        makeRestraint({ id: "r2", child_id: "yp_b", date: "2026-05-18" }),
        makeRestraint({ id: "r3", child_id: "yp_b", date: "2026-05-16" }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    // yp_b has 3 PIs — critical severity, should be first
    expect(result.child_trajectories[0].child_id).toBe("yp_b");
    expect(result.child_trajectories[0].severity).toBe("critical");
  });
});

// ── computeBehaviourIntelligence — Alerts ───────────────────────────────────

describe("computeBehaviourIntelligence — alerts", () => {
  it("generates alert for PI without debrief", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [
        makeRestraint({ id: "r1", child_id: "yp_test", child_debriefed: false }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
      childNameLookup: () => "Test Child",
    });

    const piAlert = result.alerts.find((a) => a.type === "pi_without_debrief");
    expect(piAlert).toBeDefined();
    expect(piAlert!.severity).toBe("high");
    expect(piAlert!.message).toContain("Test Child");
    expect(piAlert!.message).toContain("no debrief");
  });

  it("generates alert for escalating behaviour pattern", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", child_id: "yp_esc", date: "2026-05-22", direction: "concerning", behaviour: "Agitated" }),
        makeBehaviourEntry({ id: "b2", child_id: "yp_esc", date: "2026-05-21", direction: "concerning", behaviour: "Shouting" }),
        makeBehaviourEntry({ id: "b3", child_id: "yp_esc", date: "2026-05-20", direction: "concerning", behaviour: "Hit wall" }),
        // Older — positive (to create declining trend)
        makeBehaviourEntry({ id: "b4", child_id: "yp_esc", date: "2026-05-05", direction: "positive" }),
        makeBehaviourEntry({ id: "b5", child_id: "yp_esc", date: "2026-05-03", direction: "positive" }),
        makeBehaviourEntry({ id: "b6", child_id: "yp_esc", date: "2026-05-01", direction: "positive" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
      childNameLookup: (id) => id === "yp_esc" ? "Escalating Child" : "Unknown",
    });

    const escAlert = result.alerts.find((a) => a.type === "escalating_behaviour");
    expect(escAlert).toBeDefined();
    expect(escAlert!.severity).toBe("high");
    expect(escAlert!.message).toContain("Escalating Child");
    expect(escAlert!.message).toContain("declining trend");
  });

  it("generates alert for disproportionate sanctions", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [],
      incidents: [],
      restraints: [],
      sanctionRewards: [
        makeSanctionReward({ id: "sr1", child_id: "yp_over", direction: "sanction" }),
        makeSanctionReward({ id: "sr2", child_id: "yp_over", direction: "sanction" }),
        makeSanctionReward({ id: "sr3", child_id: "yp_over", direction: "reward" }),
      ],
      today: "2026-05-23",
      childNameLookup: (id) => id === "yp_over" ? "Over Sanctioned" : "Unknown",
    });

    const sanctionAlert = result.alerts.find((a) => a.type === "disproportionate_sanctions");
    expect(sanctionAlert).toBeDefined();
    expect(sanctionAlert!.message).toContain("Over Sanctioned");
  });
});

// ── computeBehaviourIntelligence — Insights ─────────────────────────────────

describe("computeBehaviourIntelligence — ARIA insights", () => {
  it("generates positive de-escalation insight when rate >= 75%", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "concerning", strategy_used: "Verbal reassurance", outcome: "Settled quickly" }),
        makeBehaviourEntry({ id: "b2", direction: "concerning", strategy_used: "Offered space", outcome: "Calm after 10 min" }),
        makeBehaviourEntry({ id: "b3", direction: "concerning", strategy_used: "Redirect", outcome: "Resolved peacefully" }),
        makeBehaviourEntry({ id: "b4", direction: "concerning", strategy_used: "Verbal", outcome: "PI required" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const deEscInsight = result.insights.find((i) => i.text.includes("De-escalation success rate"));
    expect(deEscInsight).toBeDefined();
    expect(deEscInsight!.severity).toBe("positive");
  });

  it("generates warning insight when de-escalation rate < 75%", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "concerning", strategy_used: "Verbal", outcome: "PI required" }),
        makeBehaviourEntry({ id: "b2", direction: "concerning", strategy_used: "Space", outcome: "Still escalating" }),
        makeBehaviourEntry({ id: "b3", direction: "concerning", strategy_used: "Redirect", outcome: "Settled eventually" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const deEscInsight = result.insights.find((i) => i.text.includes("De-escalation success rate"));
    expect(deEscInsight).toBeDefined();
    expect(deEscInsight!.severity).toBe("warning");
  });

  it("generates positive PI safety insight with zero injuries and full debriefs", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "positive" }),
      ],
      incidents: [],
      restraints: [
        makeRestraint({ id: "r1", child_debriefed: true, injuries: [], duration: 3 }),
        makeRestraint({ id: "r2", child_debriefed: true, injuries: [], duration: 4 }),
      ],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const piInsight = result.insights.find((i) => i.text.includes("Reg 20"));
    expect(piInsight).toBeDefined();
    expect(piInsight!.severity).toBe("positive");
  });

  it("generates positive percentage insight when >= 50%", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "positive" }),
        makeBehaviourEntry({ id: "b2", direction: "positive" }),
        makeBehaviourEntry({ id: "b3", direction: "positive" }),
        makeBehaviourEntry({ id: "b4", direction: "concerning", behaviour: "Refused" }),
        makeBehaviourEntry({ id: "b5", direction: "concerning", behaviour: "Agitated" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const posInsight = result.insights.find((i) => i.text.includes("strength-based"));
    expect(posInsight).toBeDefined();
    expect(posInsight!.severity).toBe("positive");
  });

  it("generates time pattern warning when concerning behaviours cluster", () => {
    const result = computeBehaviourIntelligence({
      behaviourEntries: [
        makeBehaviourEntry({ id: "b1", direction: "concerning", time: "19:00", behaviour: "Verbal" }),
        makeBehaviourEntry({ id: "b2", direction: "concerning", time: "19:30", behaviour: "Agitated" }),
        makeBehaviourEntry({ id: "b3", direction: "concerning", time: "20:00", behaviour: "Refused" }),
        makeBehaviourEntry({ id: "b4", direction: "positive", time: "10:00" }),
        makeBehaviourEntry({ id: "b5", direction: "positive", time: "11:00" }),
      ],
      incidents: [],
      restraints: [],
      sanctionRewards: [],
      today: "2026-05-23",
    });

    const timeInsight = result.insights.find((i) => i.text.includes("cluster during"));
    expect(timeInsight).toBeDefined();
    expect(timeInsight!.severity).toBe("warning");
    expect(timeInsight!.text).toContain("evening");
  });
});

// ── Full Integration Test — Oak House ───────────────────────────────────────

describe("computeBehaviourIntelligence — Oak House integration", () => {
  const today = "2026-05-23";
  const childNameLookup = (id: string): string => {
    const names: Record<string, string> = {
      yp_alex: "Alex W",
      yp_jordan: "Jordan M",
      yp_casey: "Casey R",
    };
    return names[id] ?? "Unknown";
  };

  // Realistic Oak House dataset
  const oakHouseInput: BehaviourEngineInput = {
    behaviourEntries: [
      // Alex — mix (high volatility)
      makeBehaviourEntry({ id: "b1", child_id: "yp_alex", date: "2026-05-22", time: "09:15", direction: "positive", title: "Good morning" }),
      makeBehaviourEntry({ id: "b2", child_id: "yp_alex", date: "2026-05-21", time: "19:30", direction: "concerning", intensity: "medium", behaviour: "Shouted at staff and paced", strategy_used: "Verbal reassurance and space", outcome: "Alex settled after 15 minutes" }),
      makeBehaviourEntry({ id: "b3", child_id: "yp_alex", date: "2026-05-20", time: "16:00", direction: "positive", title: "Helped peer" }),
      makeBehaviourEntry({ id: "b4", child_id: "yp_alex", date: "2026-05-19", time: "21:45", direction: "concerning", intensity: "high", behaviour: "Threw controller and damaged wall", strategy_used: "Low-arousal approach", outcome: "Alex eventually settled but refused debrief" }),
      makeBehaviourEntry({ id: "b5", child_id: "yp_alex", date: "2026-05-18", time: "14:30", direction: "positive", title: "School day" }),
      makeBehaviourEntry({ id: "b6", child_id: "yp_alex", date: "2026-05-17", time: "18:45", direction: "concerning", intensity: "medium", behaviour: "Verbal aggression towards peer", strategy_used: "Verbal reassurance", outcome: "Alex regulated after 20 minutes" }),
      // Jordan — mostly positive
      makeBehaviourEntry({ id: "b7", child_id: "yp_jordan", date: "2026-05-22", time: "14:00", direction: "positive", title: "Football" }),
      makeBehaviourEntry({ id: "b8", child_id: "yp_jordan", date: "2026-05-20", time: "17:00", direction: "concerning", intensity: "low", behaviour: "Withdrew to bedroom after contact call", strategy_used: "Gentle check-ins", outcome: "Jordan came down for supper" }),
      makeBehaviourEntry({ id: "b9", child_id: "yp_jordan", date: "2026-05-18", time: "10:00", direction: "positive", title: "Volunteering" }),
      makeBehaviourEntry({ id: "b10", child_id: "yp_jordan", date: "2026-05-16", time: "08:30", direction: "positive", title: "Independent morning" }),
      // Casey — almost entirely positive
      makeBehaviourEntry({ id: "b11", child_id: "yp_casey", date: "2026-05-22", time: "15:30", direction: "concerning", intensity: "medium", behaviour: "Crying and withdrew after phone call from mother", strategy_used: "Active listening and grounding", outcome: "Casey settled after 20 minutes" }),
      makeBehaviourEntry({ id: "b12", child_id: "yp_casey", date: "2026-05-21", time: "11:00", direction: "positive", title: "Creative writing" }),
      makeBehaviourEntry({ id: "b13", child_id: "yp_casey", date: "2026-05-19", time: "09:00", direction: "positive", title: "Medication willingly" }),
      makeBehaviourEntry({ id: "b14", child_id: "yp_casey", date: "2026-05-17", time: "14:00", direction: "positive", title: "CAMHS" }),
    ],
    incidents: [
      makeIncident({ id: "i1", child_id: "yp_alex", type: "physical_intervention", date: "2026-05-13", time: "18:30", severity: "critical", description: "Team Teach wrap hold used for approximately 7 minutes due to self-harm attempt", body_map_completed: true }),
      makeIncident({ id: "i2", child_id: "yp_alex", type: "physical_intervention", date: "2026-05-01", time: "14:50", severity: "high", description: "Team Teach hold used in corridor for approximately 2 minutes", body_map_completed: true }),
      makeIncident({ id: "i3", child_id: "yp_alex", type: "missing_from_care", date: "2026-05-21", time: "22:40", severity: "high", description: "Alex returned 90 minutes late" }),
    ],
    restraints: [
      makeRestraint({ id: "r1", child_id: "yp_alex", date: "2026-05-13", duration: 7, restraint_type: "wrap_hold", child_debriefed: false, injuries: [{ person: "yp_alex", description: "Minor bruise" }], de_escalation_attempts: ["Verbal", "Offered alternative"] }),
      makeRestraint({ id: "r2", child_id: "yp_alex", date: "2026-05-01", duration: 2, restraint_type: "standing_hold", child_debriefed: true, injuries: [], de_escalation_attempts: ["Verbal", "Space", "Calm voice"] }),
    ],
    sanctionRewards: [
      makeSanctionReward({ id: "sr1", child_id: "yp_alex", direction: "reward", date: "2026-05-22" }),
      makeSanctionReward({ id: "sr2", child_id: "yp_alex", direction: "sanction", date: "2026-05-19" }),
      makeSanctionReward({ id: "sr3", child_id: "yp_alex", direction: "reward", date: "2026-05-18" }),
      makeSanctionReward({ id: "sr4", child_id: "yp_alex", direction: "reward", date: "2026-05-12" }),
      makeSanctionReward({ id: "sr5", child_id: "yp_jordan", direction: "reward", date: "2026-05-22" }),
      makeSanctionReward({ id: "sr6", child_id: "yp_jordan", direction: "reward", date: "2026-05-16" }),
      makeSanctionReward({ id: "sr7", child_id: "yp_casey", direction: "reward", date: "2026-05-21" }),
      makeSanctionReward({ id: "sr8", child_id: "yp_casey", direction: "reward", date: "2026-05-19" }),
    ],
    today,
    childNameLookup,
  };

  it("produces correct profile", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    // 14 behaviour entries + 3 behaviour-relevant incidents = 17
    expect(result.profile.total_entries).toBe(17);
    expect(result.profile.positive_count).toBe(9); // 9 positive entries
    expect(result.profile.pi_count).toBe(2); // 2 restraints (incidents deduplicated)
    expect(result.profile.children_with_entries).toBe(3);
  });

  it("produces correct category breakdown", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    const catMap = new Map(result.categories.map((c) => [c.category, c.count]));
    expect(catMap.get("positive")).toBe(9);
    // PI incidents (2) → aggression, missing_from_care (1) → absconding
    expect(catMap.get("aggression")).toBe(2);
    expect(catMap.get("absconding")).toBe(1);
  });

  it("correctly identifies Alex as high-risk child", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    const alex = result.child_trajectories.find((t) => t.child_id === "yp_alex");
    expect(alex).toBeDefined();
    expect(alex!.pi_count).toBe(2);
    expect(alex!.severity).toBe("high");
  });

  it("produces at least one alert (PI without debrief)", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    const piAlert = result.alerts.find((a) => a.type === "pi_without_debrief");
    expect(piAlert).toBeDefined();
    expect(piAlert!.message).toContain("Alex W");
  });

  it("generates multiple ARIA insights", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    expect(result.insights.length).toBeGreaterThanOrEqual(2);
    // Should have de-escalation insight (positive since most successful)
    const deEsc = result.insights.find((i) => i.text.includes("De-escalation"));
    expect(deEsc).toBeDefined();
  });

  it("rewards/sanctions balance shows healthy ratio", () => {
    const result = computeBehaviourIntelligence(oakHouseInput);

    expect(result.rewards_sanctions.total_rewards).toBe(7);
    expect(result.rewards_sanctions.total_sanctions).toBe(1);
    expect(result.rewards_sanctions.ratio).toBe(88); // 7/8 * 100 rounded
  });
});
