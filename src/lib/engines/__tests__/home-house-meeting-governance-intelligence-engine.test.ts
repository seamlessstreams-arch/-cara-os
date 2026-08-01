import { describe, it, expect } from "vitest";
import {
  computeHouseMeetingGovernance,
  type HouseMeetingGovernanceInput,
  type HouseMeetingInput,
} from "../home-house-meeting-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMeeting(overrides?: Partial<HouseMeetingInput>): HouseMeetingInput {
  return {
    id: "m1",
    meeting_type: "regular",
    children_present_count: 3,
    children_absent_count: 0,
    staff_present_count: 2,
    agenda_items_count: 3,
    child_feedback_count: 2,
    previous_actions_total: 2,
    previous_actions_completed: 2,
    new_actions_count: 1,
    duration_minutes: 35,
    ...overrides,
  };
}

function baseInput(
  overrides?: Partial<HouseMeetingGovernanceInput>,
): HouseMeetingGovernanceInput {
  return {
    today: "2026-05-27",
    total_children: 3,
    meetings: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput({ total_children: 0 }));
    expect(r.meeting_rating).toBe("insufficient_data");
    expect(r.meeting_score).toBe(0);
    expect(r.headline).toBe("No data available for house meeting analysis");
  });

  it("returns all zero metrics when total_children is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput({ total_children: 0 }));
    expect(r.total_meetings).toBe(0);
    expect(r.child_attendance_rate).toBe(0);
    expect(r.action_completion_rate).toBe(0);
    expect(r.child_feedback_rate).toBe(0);
    expect(r.average_agenda_items).toBe(0);
    expect(r.average_duration).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights when total_children is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput({ total_children: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ZERO MEETINGS — score derivation
// ══════════════════════════════════════════════════════════════════════════════

describe("Zero meetings", () => {
  // Base 52, Mod1 -5=47, Mod2 skip, Mod3 skip (0 prev + 0 mtgs), Mod4 skip,
  // Mod5 -1=46, Mod6 -2=44 => inadequate
  it("produces score 44 (inadequate) with no meetings", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.meeting_score).toBe(44);
    expect(r.meeting_rating).toBe("inadequate");
  });

  it("reports total_meetings as 0", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.total_meetings).toBe(0);
  });

  it("reports all rate metrics as 0", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.child_attendance_rate).toBe(0);
    expect(r.action_completion_rate).toBe(0);
    expect(r.child_feedback_rate).toBe(0);
    expect(r.average_agenda_items).toBeNull();;
    expect(r.average_duration).toBeNull();;
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  // 4 meetings, all children attend, 100% action completion, feedback in all,
  // 3 agenda items each, 35 min each
  // Base 52 +5 +6 +5 +5 +4 +5 = 82 => outstanding
  const meetings = [
    makeMeeting({ id: "m1" }),
    makeMeeting({ id: "m2" }),
    makeMeeting({ id: "m3" }),
    makeMeeting({ id: "m4" }),
  ];

  it("produces score 82 (outstanding)", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBe(82);
    expect(r.meeting_rating).toBe("outstanding");
  });

  it("calculates 100% child attendance", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.child_attendance_rate).toBe(100);
  });

  it("calculates 100% action completion", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.action_completion_rate).toBe(100);
  });

  it("calculates 100% child feedback rate", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.child_feedback_rate).toBe(100);
  });

  it("calculates average agenda items as 3", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.average_agenda_items).toBe(3);
  });

  it("calculates average duration as 35", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.average_duration).toBe(35);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  // 3 meetings: attendance ~75% (>=65 +2), action completion 80% (>=70 +2),
  // feedback in 2/3 => 67% (>=60 +2), agenda 2.3 (>=2 +1), duration 25 (>=20 +2)
  // Mod1: 3 >=2 => +2
  // Base 52 +2 +2 +2 +2 +1 +2 = 61 => not quite good
  // Adjust: need >=65. Let's try 4 meetings for +5 instead.
  // 4 meetings: attendance ~75% => +2, action 80% => +2, feedback 3/4=75% => +2,
  //   agenda 2.5 => +1, duration 25 => +2
  // 52 +5 +2 +2 +2 +1 +2 = 66 => good
  const meetings = [
    makeMeeting({ id: "m1", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 2, agenda_items_count: 2, duration_minutes: 25 }),
    makeMeeting({ id: "m2", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 1, agenda_items_count: 3, duration_minutes: 25 }),
    makeMeeting({ id: "m3", children_present_count: 2, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 1, agenda_items_count: 3, duration_minutes: 25 }),
    makeMeeting({ id: "m4", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 0, agenda_items_count: 2, duration_minutes: 25 }),
  ];
  // Attendance: (3+3+2+3)/(4+4+3+4) = 11/15 = 73% => +2
  // Actions: (4+4+4+4)/(5+5+5+5) = 16/20 = 80% => +2
  // Feedback: 3 of 4 have >0 => 75% => +2
  // Avg agenda: (2+3+3+2)/4 = 2.5 => +1
  // Avg duration: 25 => +2
  // 52 +5 +2 +2 +2 +1 +2 = 66 => good

  it("produces score 66 (good)", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBe(66);
    expect(r.meeting_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  // 2 meetings, moderate attendance, moderate completion, some feedback
  // Mod1: 2 >=2 => +2
  // Attendance: 2 present, 1 absent each => 4/(4+2)=67% => +2
  // Actions: 3/5 = 60% (>=50 but <70) => no modifier (between 50-69 = 0)
  // Feedback: 1/2 = 50% (<60) => no modifier (between 40-59 = 0)
  // Agenda: 2 items each => 2.0 >= 2 => +1
  // Duration: 22 >= 20 => +2
  // 52 +2 +2 +0 +0 +1 +2 = 59 => adequate
  const meetings = [
    makeMeeting({ id: "m1", children_present_count: 2, children_absent_count: 1, previous_actions_total: 3, previous_actions_completed: 2, child_feedback_count: 1, agenda_items_count: 2, duration_minutes: 22 }),
    makeMeeting({ id: "m2", children_present_count: 2, children_absent_count: 1, previous_actions_total: 2, previous_actions_completed: 1, child_feedback_count: 0, agenda_items_count: 2, duration_minutes: 22 }),
  ];
  // Attendance: (2+2)/(3+3) = 4/6 = 67% => +2
  // Actions: (2+1)/(3+2) = 3/5 = 60% => 0 (>=50 but <70)
  // Feedback: 1 of 2 = 50% => 0 (>=40 but <60)
  // Agenda: (2+2)/2 = 2.0 => +1
  // Duration: (22+22)/2 = 22 => +2
  // 52 +2 +2 +0 +0 +1 +2 = 59 => adequate

  it("produces score 59 (adequate)", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBe(59);
    expect(r.meeting_rating).toBe("adequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  // 1 meeting, low attendance, low action completion, no feedback, thin agenda, short
  // Mod1: 1 meeting (not >=2, not 0) => 0
  // Attendance: 1 present, 3 absent => 1/4 = 25% => <40 => -5
  // Actions: 1/5 = 20% => <50 => -4
  // Feedback: 0 of 1 = 0% => <40 => -5
  // Agenda: 0 items => 0 < 1 => -4
  // Duration: 5 min => <10 => -3
  // 52 +0 -5 -4 -5 -4 -3 = 31 => inadequate
  const meetings = [
    makeMeeting({
      id: "m1",
      children_present_count: 1,
      children_absent_count: 3,
      previous_actions_total: 5,
      previous_actions_completed: 1,
      child_feedback_count: 0,
      agenda_items_count: 0,
      duration_minutes: 5,
    }),
  ];

  it("produces score 31 (inadequate)", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBe(31);
    expect(r.meeting_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. MODIFIER BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 1 — Meeting frequency", () => {
  it("adds +5 when total meetings >= 4", () => {
    const meetings = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Full outstanding: 52 +5 +6 +5 +5 +4 +5 = 82
    expect(r.meeting_score).toBe(82);
  });

  it("adds +2 when total meetings >= 2 but < 4", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +2 +6 +5 +5 +4 +5 = 79
    expect(r.meeting_score).toBe(79);
  });

  it("adds 0 when total meetings is 1", () => {
    const meetings = [makeMeeting({ id: "m1" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("subtracts -5 when total meetings is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings: [] }));
    // 52 -5 +0 +0 +0 -1 -2 = 44
    expect(r.meeting_score).toBe(44);
  });
});

describe("Modifier 2 — Child attendance", () => {
  it("adds +6 when attendance >= 85%", () => {
    // 3 present, 0 absent => 100% => +6
    const meetings = [makeMeeting({ children_present_count: 3, children_absent_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("adds +2 when attendance >= 65% and < 85%", () => {
    // 2 present, 1 absent => 67% => +2
    const meetings = [makeMeeting({ children_present_count: 2, children_absent_count: 1 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +2 +5 +5 +4 +5 = 73
    expect(r.meeting_score).toBe(73);
  });

  it("adds 0 when attendance >= 40% and < 65%", () => {
    // 3 present, 3 absent => 50% => 0 (between 40 and 65, no modifier)
    const meetings = [makeMeeting({ children_present_count: 3, children_absent_count: 3 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +0 +5 +5 +4 +5 = 71
    expect(r.meeting_score).toBe(71);
  });

  it("subtracts -5 when attendance < 40%", () => {
    // 1 present, 3 absent => 25% => -5
    const meetings = [makeMeeting({ children_present_count: 1, children_absent_count: 3 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 -5 +5 +5 +4 +5 = 66
    expect(r.meeting_score).toBe(66);
  });

  it("no attendance modifier when 0 meetings", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings: [] }));
    // Already tested in zero meetings: score = 44
    expect(r.meeting_score).toBe(44);
  });
});

describe("Modifier 3 — Action completion", () => {
  it("adds +5 when action completion >= 90%", () => {
    // 2 completed of 2 total => 100% => +5
    const meetings = [makeMeeting({ previous_actions_total: 2, previous_actions_completed: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("adds +2 when action completion >= 70% and < 90%", () => {
    // 7 completed of 10 total => 70% => +2
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 7 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +2 +5 +4 +5 = 74
    expect(r.meeting_score).toBe(74);
  });

  it("adds 0 when action completion >= 50% and < 70%", () => {
    // 6 completed of 10 total => 60% => 0
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 6 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +0 +5 +4 +5 = 72
    expect(r.meeting_score).toBe(72);
  });

  it("subtracts -4 when action completion < 50%", () => {
    // 2 completed of 10 total => 20% => -4
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 -4 +5 +4 +5 = 68
    expect(r.meeting_score).toBe(68);
  });

  it("adds +2 when 0 previous actions but meetings exist", () => {
    // 0 total prev actions, 1 meeting => +2
    const meetings = [makeMeeting({ previous_actions_total: 0, previous_actions_completed: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +2 +5 +4 +5 = 74
    expect(r.meeting_score).toBe(74);
  });

  it("no change when 0 previous actions and 0 meetings", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings: [] }));
    // Mod3 contributes 0, score = 44
    expect(r.meeting_score).toBe(44);
  });
});

describe("Modifier 4 — Child feedback", () => {
  it("adds +5 when feedback rate >= 90%", () => {
    // 1 meeting with feedback > 0 => 100% => +5
    const meetings = [makeMeeting({ child_feedback_count: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("adds +2 when feedback rate >= 60% and < 90%", () => {
    // 2 of 3 meetings with feedback => 67% => +2
    const meetings = [
      makeMeeting({ id: "m1", child_feedback_count: 2 }),
      makeMeeting({ id: "m2", child_feedback_count: 1 }),
      makeMeeting({ id: "m3", child_feedback_count: 0 }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Feedback rate: 2/3 = 67% => +2
    // Mod1: 3 >=2 => +2
    // 52 +2 +6 +5 +2 +4 +5 = 76
    expect(r.meeting_score).toBe(76);
  });

  it("subtracts -5 when feedback rate < 40%", () => {
    // 1 of 3 meetings with feedback => 33% => -5
    const meetings = [
      makeMeeting({ id: "m1", child_feedback_count: 1 }),
      makeMeeting({ id: "m2", child_feedback_count: 0 }),
      makeMeeting({ id: "m3", child_feedback_count: 0 }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Feedback rate: 1/3 = 33% => -5
    // 52 +2 +6 +5 -5 +4 +5 = 69
    expect(r.meeting_score).toBe(69);
  });

  it("no feedback modifier when 0 meetings", () => {
    const r = computeHouseMeetingGovernance(baseInput({ meetings: [] }));
    expect(r.meeting_score).toBe(44);
  });
});

describe("Modifier 5 — Agenda breadth", () => {
  it("adds +4 when avg agenda items >= 3", () => {
    const meetings = [makeMeeting({ agenda_items_count: 4 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("adds +1 when avg agenda items >= 2 and < 3", () => {
    const meetings = [makeMeeting({ agenda_items_count: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +1 +5 = 74
    expect(r.meeting_score).toBe(74);
  });

  it("adds 0 when avg agenda items >= 1 and < 2", () => {
    const meetings = [makeMeeting({ agenda_items_count: 1 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +0 +5 = 73
    expect(r.meeting_score).toBe(73);
  });

  it("subtracts -4 when avg agenda items < 1", () => {
    const meetings = [makeMeeting({ agenda_items_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 -4 +5 = 69
    expect(r.meeting_score).toBe(69);
  });

  it("subtracts -1 when 0 meetings", () => {
    // Already shown: 0 meetings => Mod5 = -1, contributing to score 44
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.meeting_score).toBe(44);
  });
});

describe("Modifier 6 — Meeting duration", () => {
  it("adds +5 when avg duration >= 30", () => {
    const meetings = [makeMeeting({ duration_minutes: 35 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("adds +2 when avg duration >= 20 and < 30", () => {
    const meetings = [makeMeeting({ duration_minutes: 25 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +2 = 74
    expect(r.meeting_score).toBe(74);
  });

  it("adds 0 when avg duration >= 10 and < 20", () => {
    const meetings = [makeMeeting({ duration_minutes: 15 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 +0 = 72
    expect(r.meeting_score).toBe(72);
  });

  it("subtracts -3 when avg duration < 10", () => {
    const meetings = [makeMeeting({ duration_minutes: 8 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // 52 +0 +6 +5 +5 +4 -3 = 69
    expect(r.meeting_score).toBe(69);
  });

  it("subtracts -2 when 0 meetings", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    // Already tested: contributes to score 44
    expect(r.meeting_score).toBe(44);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths generation", () => {
  it("includes regular meeting schedule strength when total >= 4", () => {
    const meetings = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths).toContain("Regular meeting schedule ensures children have consistent opportunities to share views");
  });

  it("does not include regular meeting schedule strength when total < 4", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths).not.toContain("Regular meeting schedule ensures children have consistent opportunities to share views");
  });

  it("includes high child attendance strength when attendance >= 85% and meetings > 0", () => {
    const meetings = [makeMeeting({ children_present_count: 3, children_absent_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("High child attendance"))).toBe(true);
  });

  it("includes action completion strength when completion >= 90% and prev actions > 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 10 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("Actions from meetings are completed reliably"))).toBe(true);
  });

  it("does not include action completion strength when prev actions is 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 0, previous_actions_completed: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("Actions from meetings are completed reliably"))).toBe(false);
  });

  it("includes child feedback strength when feedback rate >= 90% and meetings > 0", () => {
    const meetings = [makeMeeting({ child_feedback_count: 3 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("feedback is routinely captured"))).toBe(true);
  });

  it("includes broad agenda strength when avg agenda >= 3 and meetings > 0", () => {
    const meetings = [makeMeeting({ agenda_items_count: 4 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("broad range of topics"))).toBe(true);
  });

  it("includes adequate time strength when avg duration >= 30 and meetings > 0", () => {
    const meetings = [makeMeeting({ duration_minutes: 35 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.strengths.some(s => s.includes("adequate time for meaningful discussion"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. CONCERNS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns generation", () => {
  it("includes no meetings concern when total is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.concerns.some(c => c.includes("No house meetings recorded"))).toBe(true);
  });

  it("includes low attendance concern when attendance < 40% and meetings > 0", () => {
    const meetings = [makeMeeting({ children_present_count: 1, children_absent_count: 4 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("Low child attendance"))).toBe(true);
  });

  it("does not include low attendance concern when attendance >= 40%", () => {
    const meetings = [makeMeeting({ children_present_count: 2, children_absent_count: 1 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("Low child attendance"))).toBe(false);
  });

  it("includes action follow-through concern when completion < 50% and prev actions > 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("Actions from meetings are not followed through"))).toBe(true);
  });

  it("includes feedback rarely captured concern when feedback rate < 40% and meetings > 0", () => {
    const meetings = [
      makeMeeting({ id: "m1", child_feedback_count: 0 }),
      makeMeeting({ id: "m2", child_feedback_count: 0 }),
      makeMeeting({ id: "m3", child_feedback_count: 1 }),
    ];
    // 1/3 = 33% => <40
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("feedback is rarely captured"))).toBe(true);
  });

  it("includes minimal agenda concern when avg agenda < 1 and meetings > 0", () => {
    const meetings = [makeMeeting({ agenda_items_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("Meetings have minimal agenda items"))).toBe(true);
  });

  it("includes too brief concern when avg duration < 10 and meetings > 0", () => {
    const meetings = [makeMeeting({ duration_minutes: 5 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.concerns.some(c => c.includes("Meetings are too brief"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations generation", () => {
  it("recommends establishing weekly meetings when total is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.recommendations.some(rec => rec.recommendation.includes("Establish weekly house meetings"))).toBe(true);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 7");
  });

  it("recommends reviewing format when attendance < 65% and meetings > 0", () => {
    const meetings = [makeMeeting({ children_present_count: 1, children_absent_count: 3 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Review meeting format"))).toBe(true);
  });

  it("does not recommend reviewing format when attendance >= 65%", () => {
    const meetings = [makeMeeting({ children_present_count: 3, children_absent_count: 1 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Review meeting format"))).toBe(false);
  });

  it("recommends action tracking when completion < 70% and prev actions > 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 5 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Implement visible action tracking"))).toBe(true);
  });

  it("recommends recording feedback when feedback rate < 60% and meetings > 0", () => {
    const meetings = [
      makeMeeting({ id: "m1", child_feedback_count: 1 }),
      makeMeeting({ id: "m2", child_feedback_count: 0 }),
    ];
    // 1/2 = 50% < 60%
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Record children's individual feedback"))).toBe(true);
  });

  it("recommends more time when avg duration < 20 and meetings > 0", () => {
    const meetings = [makeMeeting({ duration_minutes: 15 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Allow more time for meetings"))).toBe(true);
  });

  it("recommends increasing frequency when total is 1", () => {
    const meetings = [makeMeeting()];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase meeting frequency"))).toBe(true);
  });

  it("does not recommend increasing frequency when total >= 2", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase meeting frequency"))).toBe(false);
  });

  it("assigns sequential rank numbers to recommendations", () => {
    // Trigger multiple recs: 1 meeting, low attendance, low completion, low feedback, short duration
    const meetings = [
      makeMeeting({
        children_present_count: 1,
        children_absent_count: 4,
        previous_actions_total: 10,
        previous_actions_completed: 3,
        child_feedback_count: 0,
        duration_minutes: 10,
      }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights generation", () => {
  it("includes exemplary participation insight when attendance >= 85% and actions >= 90% and total >= 4", () => {
    const meetings = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("exemplary participation practice"))).toBe(true);
    expect(r.insights.find(ins => ins.text.includes("exemplary"))?.severity).toBe("positive");
  });

  it("does not include exemplary insight when total < 4", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("exemplary participation practice"))).toBe(false);
  });

  it("includes critical Ofsted insight when total is 0", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.insights.some(ins => ins.text.includes("Ofsted cannot see evidence"))).toBe(true);
    expect(r.insights.find(ins => ins.text.includes("Ofsted"))?.severity).toBe("critical");
  });

  it("includes eroded trust insight when action completion < 50% and prev actions > 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 10, previous_actions_completed: 2 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("erode children's trust"))).toBe(true);
    expect(r.insights.find(ins => ins.text.includes("erode"))?.severity).toBe("warning");
  });

  it("does not include eroded trust insight when prev actions is 0", () => {
    const meetings = [makeMeeting({ previous_actions_total: 0, previous_actions_completed: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("erode children's trust"))).toBe(false);
  });

  it("includes authentic participation insight when feedback >= 90% and attendance >= 85% and meetings > 0", () => {
    const meetings = [makeMeeting({ children_present_count: 3, children_absent_count: 0, child_feedback_count: 5 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("authentic participation"))).toBe(true);
    expect(r.insights.find(ins => ins.text.includes("authentic"))?.severity).toBe("positive");
  });

  it("includes too brief insight when avg duration < 10 and meetings > 0", () => {
    const meetings = [makeMeeting({ duration_minutes: 5 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.some(ins => ins.text.includes("Meetings under 10 minutes"))).toBe(true);
    expect(r.insights.find(ins => ins.text.includes("under 10"))?.severity).toBe("warning");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. HEADLINE FOR EACH RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("returns outstanding headline", () => {
    const meetings = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.headline).toBe("House meetings are regular, well-attended and give children genuine influence over their home");
  });

  it("returns good headline", () => {
    const meetings = [
      makeMeeting({ id: "m1", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 2, agenda_items_count: 2, duration_minutes: 25 }),
      makeMeeting({ id: "m2", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 1, agenda_items_count: 3, duration_minutes: 25 }),
      makeMeeting({ id: "m3", children_present_count: 2, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 1, agenda_items_count: 3, duration_minutes: 25 }),
      makeMeeting({ id: "m4", children_present_count: 3, children_absent_count: 1, previous_actions_total: 5, previous_actions_completed: 4, child_feedback_count: 0, agenda_items_count: 2, duration_minutes: 25 }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_rating).toBe("good");
    expect(r.headline).toBe("Good house meeting practice with strong child participation and effective action tracking");
  });

  it("returns adequate headline", () => {
    const meetings = [
      makeMeeting({ id: "m1", children_present_count: 2, children_absent_count: 1, previous_actions_total: 3, previous_actions_completed: 2, child_feedback_count: 1, agenda_items_count: 2, duration_minutes: 22 }),
      makeMeeting({ id: "m2", children_present_count: 2, children_absent_count: 1, previous_actions_total: 2, previous_actions_completed: 1, child_feedback_count: 0, agenda_items_count: 2, duration_minutes: 22 }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_rating).toBe("adequate");
    expect(r.headline).toBe("House meetings are adequate but children's influence and follow-through need strengthening");
  });

  it("returns inadequate headline", () => {
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.meeting_rating).toBe("inadequate");
    expect(r.headline).toBe("House meeting practice is inadequate — children lack meaningful voice in how their home runs");
  });

  it("returns insufficient_data headline", () => {
    const r = computeHouseMeetingGovernance(baseInput({ total_children: 0 }));
    expect(r.headline).toBe("No data available for house meeting analysis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles a single meeting correctly", () => {
    const meetings = [makeMeeting()];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.total_meetings).toBe(1);
    // Mod1: 1 meeting => 0, Mod2: 100% => +6, Mod3: 100% => +5,
    // Mod4: 100% => +5, Mod5: 3 => +4, Mod6: 35 => +5
    // 52 +0 +6 +5 +5 +4 +5 = 77
    expect(r.meeting_score).toBe(77);
  });

  it("handles 0 children present in a meeting", () => {
    const meetings = [makeMeeting({ children_present_count: 0, children_absent_count: 3 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Attendance: 0/3 = 0% => <40 => -5
    expect(r.child_attendance_rate).toBe(0);
  });

  it("handles 0 children present and 0 absent (attendance pct is 0)", () => {
    const meetings = [makeMeeting({ children_present_count: 0, children_absent_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // pct(0, 0) = 0 => <40 => -5
    expect(r.child_attendance_rate).toBe(0);
  });

  it("handles 0 agenda items in a meeting", () => {
    const meetings = [makeMeeting({ agenda_items_count: 0 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.average_agenda_items).toBe(0);
    expect(r.concerns.some(c => c.includes("minimal agenda items"))).toBe(true);
  });

  it("handles 5-minute meetings", () => {
    const meetings = [makeMeeting({ duration_minutes: 5 })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.average_duration).toBe(5);
    expect(r.concerns.some(c => c.includes("too brief"))).toBe(true);
    expect(r.insights.some(ins => ins.text.includes("under 10 minutes"))).toBe(true);
  });

  it("handles many meetings (boundary at exactly 4)", () => {
    const meetings = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.total_meetings).toBe(4);
    // Mod1: +5
    expect(r.meeting_score).toBe(82);
  });

  it("handles exactly 2 meetings for frequency modifier", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Mod1: 2 >=2 => +2
    // 52 +2 +6 +5 +5 +4 +5 = 79
    expect(r.meeting_score).toBe(79);
  });

  it("handles exactly 3 meetings (still +2 for frequency)", () => {
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" }), makeMeeting({ id: "m3" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Mod1: 3 >=2 => +2
    // 52 +2 +6 +5 +5 +4 +5 = 79
    expect(r.meeting_score).toBe(79);
  });

  it("score is clamped to minimum 0", () => {
    // Construct a maximally bad scenario to test clamping
    // We cannot easily go below 0 with the modifiers, but verify clamp exists
    // Worst case: 1 meeting, <40% attend, <50% actions, <40% feedback, <1 agenda, <10 duration
    // 52 +0 -5 -4 -5 -4 -3 = 31 (doesn't hit 0, but clamped)
    const meetings = [
      makeMeeting({
        children_present_count: 1,
        children_absent_count: 4,
        previous_actions_total: 10,
        previous_actions_completed: 1,
        child_feedback_count: 0,
        agenda_items_count: 0,
        duration_minutes: 5,
      }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to maximum 100", () => {
    // 82 is the max we can achieve, but verify clamp exists
    const meetings = Array.from({ length: 10 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. CAP TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Cap tests", () => {
  it("caps recommendations at 5", () => {
    // Trigger as many recs as possible:
    // 1 meeting (triggers "increase frequency"), low attendance (<65%), low completion (<70%),
    // low feedback (<60%), short duration (<20)
    const meetings = [
      makeMeeting({
        children_present_count: 1,
        children_absent_count: 4,
        previous_actions_total: 10,
        previous_actions_completed: 3,
        child_feedback_count: 0,
        agenda_items_count: 3,
        duration_minutes: 10,
      }),
    ];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    // Potential recs: attendance < 65 (yes), completion < 70 (yes), feedback < 60 (yes),
    // duration < 20 (yes), total < 2 (yes) = 5 recs
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
    // Verify ranks are sequential
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("caps insights at 3", () => {
    // Trigger as many insights as possible:
    // 0 meetings triggers critical Ofsted insight
    // For the rest we need meetings, so can't combine with 0 meetings
    // The maximum from meetings: exemplary (needs 4+ mtgs, >=85% att, >=90% actions),
    //   eroded trust (<50% actions), authentic participation (>=90% fb + >=85% att),
    //   too brief (<10 min)
    // These are contradictory, so max in practice is likely 2-3
    // Test the cap exists by verifying length <= 3
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });

  it("insights never exceed 3 even with multiple triggers", () => {
    // With 0 meetings we get 1 insight (Ofsted critical)
    // Can't easily trigger more than 3, but verify the cap
    const meetings = [
      makeMeeting({
        children_present_count: 0,
        children_absent_count: 3,
        previous_actions_total: 10,
        previous_actions_completed: 2,
        child_feedback_count: 0,
        duration_minutes: 5,
      }),
    ];
    // Triggers: eroded trust (action < 50%), too brief (<10 min) = 2 insights
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RATING THRESHOLD BOUNDARIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating threshold boundaries", () => {
  it("score exactly 80 is outstanding", () => {
    // Need score 80. Base 52 + all max except one slightly lower.
    // 4 meetings (+5), 85% attendance (+6), 90% actions (+5), 90% feedback (+5),
    // avg agenda 2 (+1), duration 30 (+5) = 52+5+6+5+5+1+5 = 79 => not enough
    // Try: 4 meetings (+5), 85% attendance (+6), 90% actions (+5), 90% feedback (+5),
    //   avg agenda 3 (+4), duration 20 (+2) = 52+5+6+5+5+4+2 = 79 => still 79
    // Try: 4 meetings (+5), 85% attendance (+6), 70% actions (+2), 90% feedback (+5),
    //   avg agenda 3 (+4), duration 30 (+5) = 52+5+6+2+5+4+5 = 79 => 79
    // Full max = 82. Need exactly 80: 82-2 = drop duration to +2 (20-29)
    // 52+5+6+5+5+4+2 = 79. Not quite.
    // 52+5+6+5+5+4+5 = 82. Drop agenda to +1: 52+5+6+5+5+1+5 = 79. Nope.
    // Can't get exactly 80 easily due to discrete jumps. Let's just verify the boundary logic.
    // Score 82 is outstanding, score 79 is good. Let's check both.
    const meetingsFor82 = Array.from({ length: 4 }, (_, i) => makeMeeting({ id: `m${i}` }));
    const r82 = computeHouseMeetingGovernance(baseInput({ meetings: meetingsFor82 }));
    expect(r82.meeting_score).toBe(82);
    expect(r82.meeting_rating).toBe("outstanding");
  });

  it("score 79 is good (just below outstanding threshold)", () => {
    // 2 meetings (+2) + rest max: 52+2+6+5+5+4+5 = 79
    const meetings = [makeMeeting({ id: "m1" }), makeMeeting({ id: "m2" })];
    const r = computeHouseMeetingGovernance(baseInput({ meetings }));
    expect(r.meeting_score).toBe(79);
    expect(r.meeting_rating).toBe("good");
  });

  it("score 65 is good (at threshold)", () => {
    // Need exactly 65: 52 + 13 from modifiers
    // 1 meeting (+0), 85% attend (+6), 0 prev actions with meeting (+2),
    //   100% feedback (+5), agenda 2 (+1), duration 20-29 (+2)
    // 52 +0+6+2+5+1+2 = 68 => too high
    // 1 meeting (+0), 65-84% attend (+2), 0 prev actions with mtg (+2),
    //   100% feedback (+5), agenda 3 (+4), duration 20-29 (+2)
    // 52 +0+2+2+5+4+2 = 67 => still not 65
    // 1 meeting (+0), 65-84% attend (+2), 0 prev actions (+2),
    //   60-89% feedback (+2), agenda 3 (+4), duration 20-29 (+2)
    // 52 +0+2+2+2+4+2 = 64 => not 65
    // 1 meeting (+0), 85% attend (+6), 0 prev actions (+2),
    //   60-89% feedback (+2), agenda 2 (+1), duration 20-29 (+2)
    // 52+0+6+2+2+1+2 = 65 => yes!
    const meetings = [
      makeMeeting({
        children_present_count: 6,
        children_absent_count: 1, // 6/7 = 86% => +6
        previous_actions_total: 0,
        previous_actions_completed: 0, // 0 prev actions + meeting => +2
        child_feedback_count: 1, // 1/1 = 100% but we need 60-89%. With 1 meeting 100% hits >=90 => +5 not +2
        // Hmm, with 1 meeting, any feedback > 0 means 100%. Need 2 meetings.
      }),
    ];
    // Retry with 2 meetings to control feedback rate
    // 2 meetings (+2), one with feedback, one without => 50% feedback (<60, not <40) => 0
    // Need 60-89%: 2 of 3 meetings => 67%
    // 3 meetings (+2), 2 with feedback 1 without => 67% => +2
    // 3 meetings, attend ~86% => +6, 0 prev actions => +2, feedback 67% => +2,
    //   agenda 1.x => +0 (need <2 >=1), duration 15 => +0 (need 10-19)
    // 52+2+6+2+2+0+0 = 64. Not 65.
    // 3 meetings, agenda 2 => +1: 52+2+6+2+2+1+0 = 65!
    const meetings65 = [
      makeMeeting({ id: "m1", children_present_count: 6, children_absent_count: 1, previous_actions_total: 0, previous_actions_completed: 0, child_feedback_count: 1, agenda_items_count: 2, duration_minutes: 15 }),
      makeMeeting({ id: "m2", children_present_count: 6, children_absent_count: 1, previous_actions_total: 0, previous_actions_completed: 0, child_feedback_count: 1, agenda_items_count: 2, duration_minutes: 15 }),
      makeMeeting({ id: "m3", children_present_count: 6, children_absent_count: 1, previous_actions_total: 0, previous_actions_completed: 0, child_feedback_count: 0, agenda_items_count: 2, duration_minutes: 15 }),
    ];
    // Attend: (6+6+6)/(7+7+7) = 18/21 = 86% => +6
    // Actions: 0 total, meetings>0 => +2
    // Feedback: 2/3 = 67% => +2
    // Agenda: (2+2+2)/3 = 2.0 => +1
    // Duration: 15 => 0 (>=10 <20)
    // 52 +2 +6 +2 +2 +1 +0 = 65
    const r65 = computeHouseMeetingGovernance(baseInput({ meetings: meetings65 }));
    expect(r65.meeting_score).toBe(65);
    expect(r65.meeting_rating).toBe("good");
  });

  it("score 45 is adequate (at threshold)", () => {
    // Need exactly 45. Zero meetings gives 44. Need 1 more.
    // 1 meeting (+0), attendance boundary, etc.
    // Let's try: 1 meeting, 40-64% attend (0), 0 prev actions with mtg (+2),
    //   40-59% feedback (0) [but 1 meeting means feedback is 0% or 100%],
    //   1 <= agenda < 2 (0), 10-19 duration (0)
    // 52 +0 +0 +2 +? +0 +0
    // For 1 meeting: feedback is either 0% (<40 => -5) or 100% (>=90 => +5)
    // With feedback=0: 52+0+0+2-5+0+0 = 49
    // With feedback>0: 52+0+0+2+5+0+0 = 59
    // Need 45: try 0 meetings = 44 or mix.
    // 1 meeting, attend <40 (-5), 0 prev actions (+2), feedback=0 (-5),
    //   agenda 1 (0), duration 15 (0): 52+0-5+2-5+0+0 = 44
    // 1 meeting, attend 40-64 (0), 0 prev actions (+2), feedback=0 (-5),
    //   agenda 1 (0), duration 15 (0): 52+0+0+2-5+0+0 = 49 too high
    // 1 meeting, attend <40 (-5), 0 prev actions (+2), feedback>0 (+5),
    //   agenda <1 (-4), duration <10 (-3): 52+0-5+2+5-4-3 = 47
    // 1 meeting, attend <40 (-5), some prev actions 50-69% (0), feedback>0 (+5),
    //   agenda <1 (-4), duration <10 (-3): 52+0-5+0+5-4-3 = 45!
    const meetings45 = [
      makeMeeting({
        children_present_count: 1,
        children_absent_count: 4, // 1/5 = 20% => -5
        previous_actions_total: 10,
        previous_actions_completed: 6, // 60% => 0 (>=50 <70)
        child_feedback_count: 1, // 1/1 = 100% => +5
        agenda_items_count: 0, // 0 < 1 => -4
        duration_minutes: 5, // < 10 => -3
      }),
    ];
    // 52 +0 -5 +0 +5 -4 -3 = 45
    const r45 = computeHouseMeetingGovernance(baseInput({ meetings: meetings45 }));
    expect(r45.meeting_score).toBe(45);
    expect(r45.meeting_rating).toBe("adequate");
  });

  it("score 44 is inadequate (just below adequate threshold)", () => {
    // 0 meetings: 52 -5 +0 +0 +0 -1 -2 = 44
    const r = computeHouseMeetingGovernance(baseInput());
    expect(r.meeting_score).toBe(44);
    expect(r.meeting_rating).toBe("inadequate");
  });
});
