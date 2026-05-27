// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF REFLECTIVE PRACTICE INTELLIGENCE ENGINE — TESTS
// Reg 32/33: staff development, supervision, reflective practice.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeStaffReflectivePractice,
  type StaffReflectivePracticeInput,
  type StaffReflectionInput,
  type SupervisionThemeInput,
  type ShadowingInput,
  type StaffMeetingInput,
} from "../home-staff-reflective-practice-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeReflection(
  id: string,
  staffId: string,
  overrides: Partial<StaffReflectionInput> = {},
): StaffReflectionInput {
  return {
    id,
    staff_id: staffId,
    date: "2026-05-01",
    shared_with_manager: true,
    has_development_goal: true,
    linked_to_incident: false,
    ...overrides,
  };
}

function makeTheme(
  id: string,
  overrides: Partial<SupervisionThemeInput> = {},
): SupervisionThemeInput {
  return {
    id,
    theme_area: "practice",
    frequency_across_team: 3,
    status: "resolved",
    has_organisational_response: true,
    has_training_implications: true,
    ...overrides,
  };
}

function makeShadowing(
  id: string,
  staffId: string,
  overrides: Partial<ShadowingInput> = {},
): ShadowingInput {
  return {
    id,
    staff_id: staffId,
    date: "2026-04-01",
    hours_shadowed: 8,
    shadow_number: 3,
    total_shadows_required: 3,
    signed_off: true,
    ready_to_work_solo: "yes",
    ...overrides,
  };
}

function makeMeeting(
  id: string,
  overrides: Partial<StaffMeetingInput> = {},
): StaffMeetingInput {
  return {
    id,
    date: "2026-05-01",
    attendees_count: 8,
    total_staff: 8,
    actions_from_previous_completed: 4,
    actions_from_previous_total: 4,
    new_actions_count: 3,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<StaffReflectivePracticeInput> = {},
): StaffReflectivePracticeInput {
  // 7 unique staff reflecting out of 8 (88%), 3 linked to incidents (43%)
  // 2 themes both resolved, 2 shadowings both signed off, 2 meetings full attendance
  // Score: 52 + 6 + 5 + 5 + 5 + 5 + 4 = 82 → outstanding
  return {
    today: "2026-05-15",
    total_staff: 8,
    reflections: [
      makeReflection("ref_1", "staff_1", { linked_to_incident: true }),
      makeReflection("ref_2", "staff_2", { linked_to_incident: true }),
      makeReflection("ref_3", "staff_3", { linked_to_incident: true }),
      makeReflection("ref_4", "staff_4"),
      makeReflection("ref_5", "staff_5"),
      makeReflection("ref_6", "staff_6"),
      makeReflection("ref_7", "staff_7"),
    ],
    supervision_themes: [
      makeTheme("theme_1"),
      makeTheme("theme_2"),
    ],
    shadowings: [
      makeShadowing("shad_1", "staff_new_1"),
      makeShadowing("shad_2", "staff_new_2"),
    ],
    staff_meetings: [
      makeMeeting("meet_1"),
      makeMeeting("meet_2"),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ total_staff: 0 }));
    expect(r.reflective_rating).toBe("insufficient_data");
    expect(r.reflective_score).toBe(0);
  });

  it("populates all metrics with zeros on insufficient data", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ total_staff: 0 }));
    expect(r.staff_reflecting).toBe(0);
    expect(r.reflection_sharing_rate).toBe(0);
    expect(r.shadowing_completion_rate).toBe(0);
    expect(r.meeting_attendance_rate).toBe(0);
    expect(r.themes_resolved_rate).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  it("returns outstanding with clean baseInput", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.reflective_rating).toBe("outstanding");
    expect(r.reflective_score).toBeGreaterThanOrEqual(80);
  });

  it("scores exactly 82 with baseInput", () => {
    // 52 base + 6 (mod1) + 5 (mod2) + 5 (mod3) + 5 (mod4) + 5 (mod5) + 4 (mod6)
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.reflective_score).toBe(82);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. GOOD SCENARIO (65-79)
// ═══════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  it("returns good when themes and meetings are slightly degraded", () => {
    // Keep reflection engagement high (7/8 → 88% → +6)
    // Keep sharing/goals high (+5)
    // Themes: 3 total, 2 resolved → 67% → +2
    // Shadowings: 2 signed off → +5
    // Meetings: 5/8 attend → 63%, actions 3/5 → 60%. Both >= 60 → +2
    // No incident links → +0
    // Score: 52 + 6 + 5 + 2 + 5 + 2 + 0 = 72
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
        makeReflection("ref_6", "staff_6"),
        makeReflection("ref_7", "staff_7"),
      ],
      supervision_themes: [
        makeTheme("theme_1"),
        makeTheme("theme_2"),
        makeTheme("theme_3", { status: "active" }),
      ],
      staff_meetings: [
        makeMeeting("meet_1", { attendees_count: 5, actions_from_previous_completed: 3, actions_from_previous_total: 5 }),
        makeMeeting("meet_2", { attendees_count: 5, actions_from_previous_completed: 3, actions_from_previous_total: 5 }),
      ],
    }));
    expect(r.reflective_rating).toBe("good");
    expect(r.reflective_score).toBe(72);
    expect(r.reflective_score).toBeGreaterThanOrEqual(65);
    expect(r.reflective_score).toBeLessThan(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ADEQUATE SCENARIO (45-64)
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  it("returns adequate when moderate degradation across domains", () => {
    // 4/8 staff reflecting → 50% → mod1: +0
    // Sharing 100%, goals 100% → mod2: +5
    // 2 themes, 1 resolved → 50% → mod3: +0
    // 2 shadowings, 1 signed off → 50% → mod4: +0
    // No meetings → mod5: -2
    // No incident links, reflections > 0 → mod6: +0
    // Score: 52 + 0 + 5 + 0 + 0 + (-2) + 0 = 55
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
      ],
      supervision_themes: [
        makeTheme("theme_1"),
        makeTheme("theme_2", { status: "active" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "staff_new_1"),
        makeShadowing("shad_2", "staff_new_2", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    expect(r.reflective_rating).toBe("adequate");
    expect(r.reflective_score).toBe(55);
    expect(r.reflective_score).toBeGreaterThanOrEqual(45);
    expect(r.reflective_score).toBeLessThan(65);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. INADEQUATE SCENARIO (<45)
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate scenario", () => {
  it("returns inadequate when severely degraded", () => {
    // 1/8 staff reflecting → 13% → mod1: -6
    // 1 reflection not shared, no goal → shared 0%, goal 0% → mod2: -5
    // 4 themes, 0 resolved → 0% → mod3: -5
    // 3 shadowings, 0 signed off → 0% → mod4: -5
    // No meetings → mod5: -2
    // No incident links, 1 reflection > 0 → mod6: +0
    // Score: 52 + (-6) + (-5) + (-5) + (-5) + (-2) + 0 = 29
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1", { shared_with_manager: false, has_development_goal: false }),
      ],
      supervision_themes: [
        makeTheme("theme_1", { status: "active" }),
        makeTheme("theme_2", { status: "active" }),
        makeTheme("theme_3", { status: "active" }),
        makeTheme("theme_4", { status: "monitoring" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "staff_new_1", { signed_off: false }),
        makeShadowing("shad_2", "staff_new_2", { signed_off: false }),
        makeShadowing("shad_3", "staff_new_3", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    expect(r.reflective_rating).toBe("inadequate");
    expect(r.reflective_score).toBe(29);
    expect(r.reflective_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. METRIC CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("metric calculations", () => {
  it("counts unique staff reflecting", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_1"),  // same staff, second reflection
        makeReflection("ref_3", "staff_2"),
      ],
    }));
    expect(r.staff_reflecting).toBe(2);
  });

  it("calculates reflection sharing rate", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1", { shared_with_manager: true }),
        makeReflection("ref_2", "staff_2", { shared_with_manager: true }),
        makeReflection("ref_3", "staff_3", { shared_with_manager: false }),
        makeReflection("ref_4", "staff_4", { shared_with_manager: false }),
      ],
    }));
    expect(r.reflection_sharing_rate).toBe(50);
  });

  it("calculates shadowing completion rate", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: true }),
        makeShadowing("shad_2", "s2", { signed_off: true }),
        makeShadowing("shad_3", "s3", { signed_off: false }),
      ],
    }));
    expect(r.shadowing_completion_rate).toBe(67);
  });

  it("calculates meeting attendance rate as average across meetings", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      staff_meetings: [
        makeMeeting("meet_1", { attendees_count: 8, total_staff: 8 }),  // 100%
        makeMeeting("meet_2", { attendees_count: 4, total_staff: 8 }),  // 50%
      ],
    }));
    // avg(100, 50) = 75
    expect(r.meeting_attendance_rate).toBe(75);
  });

  it("calculates themes resolved rate", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      supervision_themes: [
        makeTheme("t1", { status: "resolved" }),
        makeTheme("t2", { status: "active" }),
        makeTheme("t3", { status: "monitoring" }),
      ],
    }));
    expect(r.themes_resolved_rate).toBe(33);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: reflection engagement", () => {
  it("awards +6 for reflectionRate >= 80%", () => {
    // 7/8 = 88% → +6 vs 5/8 = 63% → +3. Diff = 3
    const high = baseInput(); // 7/8 unique staff
    const mid = baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1", { linked_to_incident: true }),
        makeReflection("ref_2", "staff_2", { linked_to_incident: true }),
        makeReflection("ref_3", "staff_3", { linked_to_incident: true }),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
      ],
    });
    // mid: 5/8 = 63% → mod1: +3. incidentLinkedRate = pct(3,5) = 60% >= 30 && reflectionRate 63% >= 60 → mod6: +4
    // high: 7/8 = 88% → mod1: +6. incidentLinkedRate = pct(3,7) = 43% >= 30 && reflectionRate 88% >= 60 → mod6: +4
    // Diff = mod1 only: 6 - 3 = 3
    const rHigh = computeHomeStaffReflectivePractice(high);
    const rMid = computeHomeStaffReflectivePractice(mid);
    expect(rHigh.reflective_score - rMid.reflective_score).toBe(3);
  });

  it("penalises -6 for reflectionRate < 40%", () => {
    // 2/8 = 25% → -6, incidentLinked: 0% → mod6: +0
    const low = baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
      ],
    });
    // 3/8 = 38% → -6, incidentLinked: 0% → mod6: +0 (same as above)
    const alsoLow = baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
      ],
    });
    // Both < 40% → both mod1: -6. Same mod6: +0.
    const rA = computeHomeStaffReflectivePractice(low);
    const rB = computeHomeStaffReflectivePractice(alsoLow);
    expect(rA.reflective_score).toBe(rB.reflective_score);
  });
});

describe("mod2: reflection quality", () => {
  it("awards +5 when both sharedRate and goalRate >= 80%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    // All reflections: shared=true, goal=true → both 100%
    // This contributes +5 to the score
    expect(r.reflection_sharing_rate).toBe(100);
  });

  it("returns +0 when no reflections (neutral)", () => {
    // No reflections → mod2: +0. Also mod1: reflectionRate 0% → -6. mod6: -1
    // Score: 52 + (-6) + 0 + 5 + 5 + 5 + (-1) = 60
    const r = computeHomeStaffReflectivePractice(baseInput({ reflections: [] }));
    expect(r.reflective_score).toBe(60);
  });
});

describe("mod3: supervision themes management", () => {
  it("awards +5 for resolvedRate >= 80%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    // 2 themes, both resolved → 100% → +5
    expect(r.themes_resolved_rate).toBe(100);
  });

  it("returns +2 neutral when no themes", () => {
    // Base: 52 + 6 + 5 + 5 + 5 + 5 + 4 = 82. Themes contribute +5.
    // No themes: mod3 → +2 instead of +5. Score: 82 - 3 = 79
    const r = computeHomeStaffReflectivePractice(baseInput({ supervision_themes: [] }));
    expect(r.reflective_score).toBe(79);
  });
});

describe("mod4: shadowing completion", () => {
  it("awards +5 for signedOffRate >= 90%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.shadowing_completion_rate).toBe(100);
  });

  it("returns +1 neutral when no shadowings", () => {
    // Base: 82. Shadowings contribute +5. No shadowings: mod4 → +1 instead of +5.
    // Score: 82 - 4 = 78
    const r = computeHomeStaffReflectivePractice(baseInput({ shadowings: [] }));
    expect(r.reflective_score).toBe(78);
  });
});

describe("mod5: staff meeting attendance & action completion", () => {
  it("awards +5 when both avgAttendRate and actionCompRate >= 80%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.meeting_attendance_rate).toBe(100);
  });

  it("penalises -2 when no meetings", () => {
    // Base: 82. Meetings contribute +5. No meetings: mod5 → -2.
    // Score: 82 - 7 = 75
    const r = computeHomeStaffReflectivePractice(baseInput({ staff_meetings: [] }));
    expect(r.reflective_score).toBe(75);
  });
});

describe("mod6: reflective culture indicators", () => {
  it("awards +4 when incidentLinkedRate >= 30% and reflectionRate >= 60%", () => {
    // baseInput has 3/7 linked (43%) and 7/8 reflecting (88%) → +4
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.reflective_score).toBe(82);
  });

  it("awards +2 when incidentLinkedRate >= 15%", () => {
    // 1/7 linked → pct(1,7) = 14% < 15 → +0 (not enough)
    // 2/7 linked → pct(2,7) = 29% >= 15 but < 30 → +2
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1", { linked_to_incident: true }),
        makeReflection("ref_2", "staff_2", { linked_to_incident: true }),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
        makeReflection("ref_6", "staff_6"),
        makeReflection("ref_7", "staff_7"),
      ],
    }));
    // mod6: incidentLinkedRate = pct(2,7) = 29%. >= 15 but < 30 → +2
    // vs base mod6 = +4. Diff = -2. Score: 82 - 2 = 80
    expect(r.reflective_score).toBe(80);
  });

  it("returns -1 when no reflections", () => {
    // No reflections → mod6: -1. Also mod1: -6, mod2: +0
    // Score: 52 + (-6) + 0 + 5 + 5 + 5 + (-1) = 60
    const r = computeHomeStaffReflectivePractice(baseInput({ reflections: [] }));
    expect(r.reflective_score).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes reflection engagement strength when reflectionRate >= 80%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.strengths.some((s) => s.includes("Over 80% of staff submit reflections"))).toBe(true);
  });

  it("includes sharing strength when sharedRate >= 80% and reflections exist", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.strengths.some((s) => s.includes("share reflections with managers"))).toBe(true);
  });

  it("includes theme resolution strength when resolvedRate >= 80% and themes exist", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.strengths.some((s) => s.includes("Supervision themes are actively resolved"))).toBe(true);
  });

  it("includes shadowing strength when signedOffRate >= 90% and shadowings exist", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.strengths.some((s) => s.includes("Shadowing sign-off rate over 90%"))).toBe(true);
  });

  it("includes meeting actions strength when actionCompRate >= 80% and meetings exist", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.strengths.some((s) => s.includes("Staff meeting actions completed"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags low reflection rate when < 40%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1")],
    }));
    // 1/8 = 13% < 40
    expect(r.concerns.some((c) => c.includes("Under 40% of staff engage in reflection"))).toBe(true);
  });

  it("flags unresolved themes when resolvedRate < 40% and themes >= 3", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
        makeTheme("t3", { status: "monitoring" }),
      ],
    }));
    // 0/3 = 0% < 40
    expect(r.concerns.some((c) => c.includes("supervision themes unresolved"))).toBe(true);
  });

  it("flags low shadowing sign-off when < 50% and shadowings >= 2", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: false }),
        makeShadowing("shad_2", "s2", { signed_off: false }),
        makeShadowing("shad_3", "s3", { signed_off: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Under 50% of shadowings signed off"))).toBe(true);
  });

  it("flags no meetings recorded", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ staff_meetings: [] }));
    expect(r.concerns.some((c) => c.includes("No staff meetings recorded"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends structured reflective practice when reflectionRate < 60%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
      ],
    }));
    // 3/8 = 38% < 60
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("structured reflective practice"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("Reg 33");
  });

  it("recommends escalating supervision themes when resolvedRate < 60% and themes >= 2", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
      ],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Escalate unresolved"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Reg 33");
  });

  it("recommends completing shadowing sign-offs when signedOffRate < 70% and shadowings >= 2", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: false }),
        makeShadowing("shad_2", "s2", { signed_off: false }),
      ],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("shadowing sign-offs"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("Reg 32");
  });

  it("recommends improvement plan when score < 65", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1")],
      supervision_themes: [makeTheme("t1", { status: "active" }), makeTheme("t2", { status: "active" })],
      shadowings: [makeShadowing("shad_1", "s1", { signed_off: false }), makeShadowing("shad_2", "s2", { signed_off: false })],
      staff_meetings: [],
    }));
    expect(r.reflective_score).toBeLessThan(65);
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("improvement plan"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("assigns sequential rank numbers", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1")],
      supervision_themes: [makeTheme("t1", { status: "active" }), makeTheme("t2", { status: "active" })],
      shadowings: [makeShadowing("shad_1", "s1", { signed_off: false }), makeShadowing("shad_2", "s2", { signed_off: false })],
      staff_meetings: [],
    }));
    expect(r.recommendations.length).toBeGreaterThanOrEqual(2);
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("includes positive insight for outstanding rating", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.reflective_rating).toBe("outstanding");
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("embedded and active"))).toBe(true);
  });

  it("includes critical insight for inadequate rating", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1", { shared_with_manager: false, has_development_goal: false })],
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
        makeTheme("t3", { status: "active" }),
        makeTheme("t4", { status: "monitoring" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: false }),
        makeShadowing("shad_2", "s2", { signed_off: false }),
        makeShadowing("shad_3", "s3", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    expect(r.reflective_rating).toBe("inadequate");
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("significantly weak"))).toBe(true);
  });

  it("includes learning loop insight when incidentLinkedRate >= 30% and sharedRate >= 70%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    // baseInput: 3/7 linked (43%), all shared (100%)
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("learning loop"))).toBe(true);
  });

  it("includes systemic issues warning when themes >= 5 and resolvedRate < 40%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
        makeTheme("t3", { status: "active" }),
        makeTheme("t4", { status: "monitoring" }),
        makeTheme("t5", { status: "active" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("systemic issues"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline contains 'Outstanding'", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline contains 'Good'", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
        makeReflection("ref_6", "staff_6"),
        makeReflection("ref_7", "staff_7"),
      ],
      supervision_themes: [
        makeTheme("theme_1"),
        makeTheme("theme_2"),
        makeTheme("theme_3", { status: "active" }),
      ],
      staff_meetings: [
        makeMeeting("meet_1", { attendees_count: 5, actions_from_previous_completed: 3, actions_from_previous_total: 5 }),
        makeMeeting("meet_2", { attendees_count: 5, actions_from_previous_completed: 3, actions_from_previous_total: 5 }),
      ],
    }));
    expect(r.headline).toContain("Good");
  });

  it("adequate headline contains 'Adequate' and 'engagement' when reflectionRate < 60%", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
      ],
      supervision_themes: [
        makeTheme("theme_1"),
        makeTheme("theme_2", { status: "active" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "staff_new_1"),
        makeShadowing("shad_2", "staff_new_2", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    // reflectionRate = 4/8 = 50% < 60 → "engagement"
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("engagement");
  });

  it("inadequate headline contains 'inadequate'", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1", { shared_with_manager: false, has_development_goal: false })],
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
        makeTheme("t3", { status: "active" }),
        makeTheme("t4", { status: "monitoring" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: false }),
        makeShadowing("shad_2", "s2", { signed_off: false }),
        makeShadowing("shad_3", "s3", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    expect(r.headline).toContain("inadequate");
  });

  it("good headline shows area count when concerns exist", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
        makeReflection("ref_6", "staff_6"),
        makeReflection("ref_7", "staff_7"),
      ],
      supervision_themes: [
        makeTheme("theme_1"),
        makeTheme("theme_2"),
        makeTheme("theme_3", { status: "active" }),
      ],
      staff_meetings: [],
    }));
    // No meetings → concern. Score: 52+6+5+2+5+(-2)+0 = 68 → good
    expect(r.headline).toContain("area(s) to address");
  });

  it("good headline shows 'consistent engagement' when no concerns", () => {
    // Keep all strong but remove incident links so mod6 = +0 → score = 78
    // 78 is still good, and no concerns should be triggered
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_2"),
        makeReflection("ref_3", "staff_3"),
        makeReflection("ref_4", "staff_4"),
        makeReflection("ref_5", "staff_5"),
        makeReflection("ref_6", "staff_6"),
        makeReflection("ref_7", "staff_7"),
      ],
    }));
    // reflectionRate 88% → no low reflection concern
    // resolvedRate 100% → no unresolved concern
    // signedOffRate 100% → no shadowing concern
    // meetings exist → no meeting concern
    // Score: 52+6+5+5+5+5+0 = 78 → good, 0 concerns
    expect(r.reflective_rating).toBe("good");
    expect(r.concerns).toHaveLength(0);
    expect(r.headline).toContain("consistent engagement");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const r = computeHomeStaffReflectivePractice(baseInput());
    expect(r.reflective_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    // Maximise penalties: 52 + (-6) + (-5) + (-5) + (-5) + (-5) + (-4) = 22
    // Still above 0, but confirm clamping works
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1", { shared_with_manager: false, has_development_goal: false })],
      supervision_themes: [
        makeTheme("t1", { status: "active" }),
        makeTheme("t2", { status: "active" }),
      ],
      shadowings: [
        makeShadowing("shad_1", "s1", { signed_off: false }),
        makeShadowing("shad_2", "s2", { signed_off: false }),
      ],
      staff_meetings: [],
    }));
    expect(r.reflective_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles empty reflections collection", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ reflections: [] }));
    expect(r.staff_reflecting).toBe(0);
    expect(r.reflection_sharing_rate).toBe(0);
    expect(r.reflective_rating).not.toBe("insufficient_data");
  });

  it("handles empty themes collection", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ supervision_themes: [] }));
    expect(r.themes_resolved_rate).toBe(0);
    expect(r.reflective_rating).not.toBe("insufficient_data");
  });

  it("handles empty shadowings collection", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ shadowings: [] }));
    expect(r.shadowing_completion_rate).toBe(0);
    expect(r.reflective_rating).not.toBe("insufficient_data");
  });

  it("handles empty meetings collection", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({ staff_meetings: [] }));
    expect(r.meeting_attendance_rate).toBe(0);
    expect(r.reflective_rating).not.toBe("insufficient_data");
  });

  it("handles all empty collections (but staff > 0)", () => {
    const r = computeHomeStaffReflectivePractice({
      today: "2026-05-15",
      total_staff: 8,
      reflections: [],
      supervision_themes: [],
      shadowings: [],
      staff_meetings: [],
    });
    // mod1: 0% → -6, mod2: no reflections → +0, mod3: no themes → +2,
    // mod4: no shadowings → +1, mod5: no meetings → -2, mod6: no reflections → -1
    // Score: 52 + (-6) + 0 + 2 + 1 + (-2) + (-1) = 46
    expect(r.reflective_score).toBe(46);
    expect(r.reflective_rating).toBe("adequate");
  });

  it("handles single reflection from single staff", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [makeReflection("ref_1", "staff_1")],
      total_staff: 1,
    }));
    // reflectionRate = pct(1,1) = 100% → mod1: +6
    expect(r.staff_reflecting).toBe(1);
  });

  it("handles duplicate staff IDs across reflections correctly", () => {
    const r = computeHomeStaffReflectivePractice(baseInput({
      reflections: [
        makeReflection("ref_1", "staff_1"),
        makeReflection("ref_2", "staff_1"),
        makeReflection("ref_3", "staff_1"),
      ],
    }));
    expect(r.staff_reflecting).toBe(1);
  });
});
