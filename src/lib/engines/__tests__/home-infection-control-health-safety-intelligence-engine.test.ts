// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INFECTION CONTROL & HEALTH SAFETY INTELLIGENCE ENGINE — TESTS
// Tracks infection management, medication administration accuracy, staff medication
// training, and first aid coverage to ensure children's health and safety.
// Pure deterministic engine. CHR 2015 Reg 12/31.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeInfectionControlHealthSafety,
  type InfectionControlInput,
  type InfectionRecordInput,
  type MarEntryInput,
  type MedTrainingInput,
  type FirstAiderInput,
} from "../home-infection-control-health-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeInfection(overrides: Partial<InfectionRecordInput> = {}): InfectionRecordInput {
  return {
    id: "inf_1",
    date: "2026-05-10",
    severity: "mild",
    status: "resolved",
    gp_consulted: true,
    control_measures_applied: true,
    other_cases: 0,
    ...overrides,
  };
}

function makeMar(overrides: Partial<MarEntryInput> = {}): MarEntryInput {
  return {
    id: "mar_1",
    child_id: "yp_alex",
    date: "2026-05-20",
    administered_correctly: true,
    missed: false,
    reason_for_miss: null,
    ...overrides,
  };
}

function makeMedTraining(overrides: Partial<MedTrainingInput> = {}): MedTrainingInput {
  return {
    id: "mt_1",
    staff_id: "staff_1",
    training_type: "medication_administration",
    completed: true,
    expiry_date: "2027-06-01",
    ...overrides,
  };
}

function makeFirstAider(overrides: Partial<FirstAiderInput> = {}): FirstAiderInput {
  return {
    id: "fa_1",
    staff_id: "staff_1",
    qualification: "first_aid_at_work",
    expiry_date: "2027-06-01",
    is_current: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<InfectionControlInput> = {}): InfectionControlInput {
  // 4 children, 8 staff. Best case: 0 infections, 8 correct MAR entries,
  // 8 completed+future med training, 4 current first aiders.
  return {
    today: "2026-05-27",
    total_children: 4,
    total_staff: 8,
    infections: [],
    mar_entries: Array.from({ length: 8 }, (_, i) =>
      makeMar({ id: `mar_${i}`, child_id: `yp_${i % 4}` }),
    ),
    med_training: Array.from({ length: 8 }, (_, i) =>
      makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
    ),
    first_aiders: Array.from({ length: 4 }, (_, i) =>
      makeFirstAider({ id: `fa_${i}`, staff_id: `staff_${i}` }),
    ),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({ total_children: 0 }));
    expect(r.infection_rating).toBe("insufficient_data");
    expect(r.infection_score).toBe(0);
  });

  it("populates all metrics with zeros for insufficient data", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({ total_children: 0 }));
    expect(r.active_infections).toBe(0);
    expect(r.mar_accuracy_rate).toBe(0);
    expect(r.med_training_rate).toBe(0);
    expect(r.first_aid_coverage).toBe(0);
    expect(r.infection_resolution_rate).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding rating", () => {
  it("returns outstanding for best-case base input", () => {
    // Base: 0 infections, 8/8 MAR correct, 8/8 training, 4/8 first aiders
    // Mod1: 0 infections → +5
    // Mod2: 100% MAR accuracy → +6
    // Mod3: 0% miss rate → +5
    // Mod4: 100% training → +5
    // Mod5: 50% first aid → +5
    // Mod6: 0 infections → +4
    // Total: 52 + 5+6+5+5+5+4 = 82
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.infection_rating).toBe("outstanding");
    expect(r.infection_score).toBe(82);
  });

  it("still outstanding with resolved infections when other mods are top", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "resolved", severity: "mild" }),
        makeInfection({ id: "inf_2", status: "resolved", severity: "moderate" }),
      ],
    }));
    // Mod1: all resolved → +4
    // Mod6: 0 severe → +4
    // Total: 52 + 4+6+5+5+5+4 = 81
    expect(r.infection_rating).toBe("outstanding");
    expect(r.infection_score).toBe(81);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. GOOD RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("good rating", () => {
  it("returns good when 3-4 mods at top but 2 degraded", () => {
    // Keep infections, MAR accuracy, miss rate, and severity control at top.
    // Degrade training (mod4) and first aid (mod5).
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      // 0 infections → mod1 +5, mod6 +4
      // 8/8 correct MAR → mod2 +6, mod3 +5
      // 5/8 training (62.5%) → mod4 +0
      // 1/8 first aiders (12.5%) → mod5 -5
      med_training: [
        ...Array.from({ length: 5 }, (_, i) =>
          makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          makeMedTraining({ id: `mt_${5 + i}`, staff_id: `staff_${5 + i}`, completed: false }),
        ),
      ],
      first_aiders: [
        makeFirstAider({ id: "fa_0", staff_id: "staff_0" }),
      ],
    }));
    // Total: 52 + 5+6+5+0+(-5)+4 = 67
    expect(r.infection_rating).toBe("good");
    expect(r.infection_score).toBe(67);
  });

  it("returns good with moderate training and adequate first aid", () => {
    // 0 infections, perfect MAR, 75% training, 33% first aid
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [
        ...Array.from({ length: 6 }, (_, i) =>
          makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
        ),
        ...Array.from({ length: 2 }, (_, i) =>
          makeMedTraining({ id: `mt_${6 + i}`, staff_id: `staff_${6 + i}`, completed: false }),
        ),
      ],
      first_aiders: [
        makeFirstAider({ id: "fa_0", staff_id: "staff_0" }),
        makeFirstAider({ id: "fa_1", staff_id: "staff_1" }),
        makeFirstAider({ id: "fa_2", staff_id: "staff_2" }),
      ],
    }));
    // mod4: 75% → +3; mod5: 3/8=37.5% → +3
    // Total: 52 + 5+6+5+3+3+4 = 78
    expect(r.infection_rating).toBe("good");
    expect(r.infection_score).toBe(78);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate rating", () => {
  it("returns adequate when several modifiers are neutral or slightly negative", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active", severity: "mild" }),
        makeInfection({ id: "inf_2", status: "active", severity: "moderate" }),
        makeInfection({ id: "inf_3", status: "resolved", severity: "mild" }),
      ],
      // 60% resolution rate → mod1: +0
      // mod6: 0 severe → +4
      med_training: [
        ...Array.from({ length: 4 }, (_, i) =>
          makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          makeMedTraining({ id: `mt_${4 + i}`, staff_id: `staff_${4 + i}`, completed: false }),
        ),
      ],
      // 4/8 = 50% → mod4: +0
      first_aiders: [
        makeFirstAider({ id: "fa_0", staff_id: "staff_0" }),
        makeFirstAider({ id: "fa_1", staff_id: "staff_1" }),
      ],
      // 2/8 = 25% → mod5: +0
    }));
    // 52 + 0 + 6 + 5 + 0 + 0 + 4 = 67
    // Wait, resolution is 1/3=33% which is <60 → mod1: -5
    // 52 + (-5) + 6 + 5 + 0 + 0 + 4 = 62 — adequate
    expect(r.infection_rating).toBe("adequate");
    expect(r.infection_score).toBeLessThan(65);
    expect(r.infection_score).toBeGreaterThanOrEqual(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. INADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate rating", () => {
  it("returns inadequate when multiple modifiers are deeply negative", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active", severity: "severe", gp_consulted: false, control_measures_applied: false }),
        makeInfection({ id: "inf_2", status: "active", severity: "severe", gp_consulted: false, control_measures_applied: false }),
      ],
      // 0% resolution → mod1: -5
      // 2 severe, not GP consulted → mod6: -4
      mar_entries: [
        makeMar({ id: "mar_0", administered_correctly: false, missed: true, reason_for_miss: "staff forgot" }),
        makeMar({ id: "mar_1", administered_correctly: false, missed: true, reason_for_miss: "staff forgot" }),
        makeMar({ id: "mar_2", administered_correctly: true, missed: false }),
        makeMar({ id: "mar_3", administered_correctly: true, missed: false }),
      ],
      // accuracy 50% → mod2: -6
      // miss rate 50% → mod3: -5
      med_training: [
        makeMedTraining({ id: "mt_0", completed: false }),
        makeMedTraining({ id: "mt_1", completed: false }),
      ],
      // 0/8 valid → mod4: -5
      first_aiders: [
        makeFirstAider({ id: "fa_0", is_current: false }),
      ],
      // 0/8 current → mod5: -5
    }));
    // 52 + (-5) + (-6) + (-5) + (-5) + (-5) + (-4) = 22
    expect(r.infection_rating).toBe("inadequate");
    expect(r.infection_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. METRICS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics", () => {
  it("calculates active_infections correctly", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active" }),
        makeInfection({ id: "inf_2", status: "resolved" }),
        makeInfection({ id: "inf_3", status: "monitoring" }),
      ],
    }));
    expect(r.active_infections).toBe(1);
  });

  it("calculates mar_accuracy_rate correctly", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      mar_entries: [
        makeMar({ id: "m1", administered_correctly: true, missed: false }),
        makeMar({ id: "m2", administered_correctly: true, missed: false }),
        makeMar({ id: "m3", administered_correctly: false, missed: false }),
        makeMar({ id: "m4", administered_correctly: true, missed: true, reason_for_miss: "refused" }),
      ],
    }));
    // correct && !missed: m1, m2 = 2/4 = 50%
    expect(r.mar_accuracy_rate).toBe(50);
  });

  it("calculates med_training_rate as pct of total_staff", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [
        makeMedTraining({ id: "mt_0", staff_id: "s0", completed: true, expiry_date: "2027-01-01" }),
        makeMedTraining({ id: "mt_1", staff_id: "s1", completed: true, expiry_date: "2026-01-01" }), // expired
        makeMedTraining({ id: "mt_2", staff_id: "s2", completed: false }),
      ],
    }));
    // 1 valid out of 8 staff = 13%
    expect(r.med_training_rate).toBe(13);
  });

  it("calculates first_aid_coverage as pct of total_staff", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      first_aiders: [
        makeFirstAider({ id: "fa_0", is_current: true }),
        makeFirstAider({ id: "fa_1", is_current: false }),
        makeFirstAider({ id: "fa_2", is_current: true }),
      ],
    }));
    // 2 current out of 8 staff = 25%
    expect(r.first_aid_coverage).toBe(25);
  });

  it("calculates infection_resolution_rate correctly", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "resolved" }),
        makeInfection({ id: "inf_2", status: "resolved" }),
        makeInfection({ id: "inf_3", status: "active" }),
        makeInfection({ id: "inf_4", status: "monitoring" }),
      ],
    }));
    // 2 resolved / 4 total = 50%
    expect(r.infection_resolution_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: infection management", () => {
  it("awards +5 for zero infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({ infections: [] }));
    // base input has all other mods at top. With mod1=+5 + mod6=+4 for 0 infections
    // Total: 52 + 5 + 6 + 5 + 5 + 5 + 4 = 82
    expect(r.infection_score).toBe(82);
  });

  it("awards +4 when all infections resolved", () => {
    const with0 = computeHomeInfectionControlHealthSafety(baseInput({ infections: [] }));
    const allResolved = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [makeInfection({ id: "inf_1", status: "resolved", severity: "mild" })],
    }));
    // 0 infections: mod1 +5, mod6 +4. All resolved: mod1 +4, mod6 +4 (no severe). diff = 1
    expect(with0.infection_score - allResolved.infection_score).toBe(1);
  });

  it("penalises -5 when resolution rate < 60%", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active" }),
        makeInfection({ id: "inf_2", status: "active" }),
        makeInfection({ id: "inf_3", status: "active" }),
      ],
    }));
    // 0% resolution → mod1: -5, mod6: +4 (0 severe)
    // 52 + (-5) + 6 + 5 + 5 + 5 + 4 = 72
    expect(r.infection_score).toBe(72);
  });
});

describe("mod2: MAR accuracy", () => {
  it("awards +6 for >= 98% accuracy", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    // 100% accuracy → +6
    expect(r.mar_accuracy_rate).toBe(100);
    expect(r.infection_score).toBe(82);
  });

  it("awards +2 for no MAR entries", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: [] }));
    // mod2 +2, mod3 +2 instead of +6, +5
    // 52 + 5 + 2 + 2 + 5 + 5 + 4 = 75
    expect(r.infection_score).toBe(75);
  });

  it("penalises -6 for < 90% accuracy", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeMar({
        id: `mar_${i}`,
        administered_correctly: i < 8,
        missed: i >= 8,
        reason_for_miss: i >= 8 ? "forgot" : null,
      }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    // accuracy = 8/10 = 80% → mod2: -6
    // miss rate = 2/10 = 20% → mod3: -5
    expect(r.mar_accuracy_rate).toBe(80);
  });
});

describe("mod3: missed medication", () => {
  it("awards +5 for <= 2% miss rate", () => {
    // 100 entries, 2 missed = 2%
    const entries = Array.from({ length: 100 }, (_, i) =>
      makeMar({
        id: `mar_${i}`,
        administered_correctly: i >= 2,
        missed: i < 2,
        reason_for_miss: i < 2 ? "refused" : null,
      }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    expect(r.infection_score).toBeGreaterThanOrEqual(80);
  });

  it("penalises -5 for > 10% miss rate", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeMar({
        id: `mar_${i}`,
        administered_correctly: i < 8,
        missed: i >= 8,
        reason_for_miss: i >= 8 ? "forgot" : null,
      }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    // 20% miss rate → mod3: -5
    // 80% accuracy → mod2: -6
    // 52 + 5 + (-6) + (-5) + 5 + 5 + 4 = 60
    expect(r.infection_score).toBe(60);
  });
});

describe("mod4: med training compliance", () => {
  it("awards +5 for >= 90% training", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    // 8/8 = 100% → +5
    expect(r.med_training_rate).toBe(100);
  });

  it("penalises -5 for < 50% training", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [
        makeMedTraining({ id: "mt_0", staff_id: "s0", completed: true }),
        makeMedTraining({ id: "mt_1", staff_id: "s1", completed: true }),
        makeMedTraining({ id: "mt_2", staff_id: "s2", completed: true }),
      ],
    }));
    // 3/8 = 37.5% → -5
    // 52 + 5 + 6 + 5 + (-5) + 5 + 4 = 72
    expect(r.infection_score).toBe(72);
  });
});

describe("mod5: first aid coverage", () => {
  it("awards +5 for >= 50% coverage", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    // 4/8 = 50% → +5
    expect(r.first_aid_coverage).toBe(50);
  });

  it("penalises -5 for < 20% coverage", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      first_aiders: [
        makeFirstAider({ id: "fa_0", is_current: true }),
      ],
    }));
    // 1/8 = 12.5% → -5
    // 52 + 5 + 6 + 5 + 5 + (-5) + 4 = 72
    expect(r.infection_score).toBe(72);
  });
});

describe("mod6: infection severity control", () => {
  it("awards +4 for zero infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.infection_score).toBe(82);
  });

  it("awards +4 for no severe infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", severity: "mild", status: "resolved" }),
        makeInfection({ id: "inf_2", severity: "moderate", status: "resolved" }),
      ],
    }));
    // mod1: all resolved → +4, mod6: 0 severe → +4
    // 52 + 4 + 6 + 5 + 5 + 5 + 4 = 81
    expect(r.infection_score).toBe(81);
  });

  it("awards +1 for severe with GP + control measures", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", severity: "severe", status: "resolved", gp_consulted: true, control_measures_applied: true }),
      ],
    }));
    // mod1: all resolved → +4, mod6: severe but managed → +1
    // 52 + 4 + 6 + 5 + 5 + 5 + 1 = 78
    expect(r.infection_score).toBe(78);
  });

  it("penalises -4 for severe without full management", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", severity: "severe", status: "active", gp_consulted: false, control_measures_applied: false }),
      ],
    }));
    // mod1: 0% resolution → -5, mod6: severe unmanaged → -4
    // 52 + (-5) + 6 + 5 + 5 + 5 + (-4) = 64
    expect(r.infection_score).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes zero infections strength", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.strengths.some(s => s.includes("No infections recorded"))).toBe(true);
  });

  it("includes MAR accuracy strength for >= 98%", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.strengths.some(s => s.includes("MAR accuracy rate") && s.includes("exemplary"))).toBe(true);
  });

  it("includes training compliance strength for >= 90%", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.strengths.some(s => s.includes("training compliance"))).toBe(true);
  });

  it("includes first aid coverage strength for >= 50%", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.strengths.some(s => s.includes("First aid coverage"))).toBe(true);
  });

  it("includes all-resolved strength", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "resolved" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("All recorded infections have been resolved"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags active infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [makeInfection({ id: "inf_1", status: "active" })],
    }));
    expect(r.concerns.some(c => c.includes("active infection"))).toBe(true);
  });

  it("flags low MAR accuracy", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeMar({ id: `mar_${i}`, administered_correctly: i < 8, missed: false }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    // 80% accuracy
    expect(r.concerns.some(c => c.includes("MAR accuracy rate"))).toBe(true);
  });

  it("flags high missed medication rate", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeMar({
        id: `mar_${i}`,
        administered_correctly: i < 4,
        missed: i >= 4,
        reason_for_miss: i >= 4 ? "forgot" : null,
      }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    // 20% miss rate
    expect(r.concerns.some(c => c.includes("Missed medication rate"))).toBe(true);
  });

  it("flags low training compliance", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [makeMedTraining({ id: "mt_0", completed: false })],
    }));
    // 0/8 → 0%
    expect(r.concerns.some(c => c.includes("training compliance"))).toBe(true);
  });

  it("flags low first aid coverage", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      first_aiders: [],
    }));
    // 0/8 → 0%
    expect(r.concerns.some(c => c.includes("first aid coverage") || c.includes("First aid coverage"))).toBe(true);
  });

  it("flags unmanaged severe infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", severity: "severe", gp_consulted: false, control_measures_applied: false }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("severe infection"))).toBe(true);
  });

  it("flags spreading infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", other_cases: 3 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("additional cases") || c.includes("spreading"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for active infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [makeInfection({ id: "inf_1", status: "active" })],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("active infection"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Reg 12");
  });

  it("generates rec for low MAR accuracy", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeMar({ id: `mar_${i}`, administered_correctly: i < 9, missed: false }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    // 90% accuracy → triggers rec (< 95)
    const rec = r.recommendations.find(r => r.recommendation.includes("medication administration audit"));
    expect(rec).toBeDefined();
  });

  it("generates immediate rec for low training compliance", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [makeMedTraining({ id: "mt_0", completed: false })],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("medication training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Reg 31");
  });

  it("generates rec for low first aid coverage", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      first_aiders: [makeFirstAider({ id: "fa_0", is_current: true })],
    }));
    // 1/8 = 12.5% → immediate
    const rec = r.recommendations.find(r => r.recommendation.includes("first aid"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("ranks recommendations sequentially", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [makeInfection({ id: "inf_1", status: "active", severity: "severe", gp_consulted: false, other_cases: 2 })],
      med_training: [makeMedTraining({ id: "mt_0", completed: false })],
      first_aiders: [],
    }));
    expect(r.recommendations.length).toBeGreaterThan(1);
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates positive insight for exemplary practice", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    const ins = r.insights.find(i => i.text.includes("exemplary levels"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });

  it("generates warning for multiple active infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active" }),
        makeInfection({ id: "inf_2", status: "active" }),
      ],
    }));
    const ins = r.insights.find(i => i.text.includes("concurrent active infections"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });

  it("generates critical insight for unmanaged severe infections", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", severity: "severe", gp_consulted: false }),
      ],
    }));
    const ins = r.insights.find(i => i.text.includes("direct risk to children"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates critical insight for low MAR accuracy", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeMar({ id: `mar_${i}`, administered_correctly: i < 8, missed: false }),
    );
    const r = computeHomeInfectionControlHealthSafety(baseInput({ mar_entries: entries }));
    const ins = r.insights.find(i => i.text.includes("MAR accuracy"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates positive insight for exemplary medication administration", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    const ins = r.insights.find(i => i.text.includes("Medication administration is exemplary"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. HEADLINE
// ═══════════════════════════════════════════════════════════════════════════

describe("headline", () => {
  it("produces outstanding headline", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.headline).toContain("Outstanding");
    expect(r.headline).toContain("zero infections");
  });

  it("produces good headline", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: [
        ...Array.from({ length: 5 }, (_, i) =>
          makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          makeMedTraining({ id: `mt_${5 + i}`, staff_id: `staff_${5 + i}`, completed: false }),
        ),
      ],
      first_aiders: [
        makeFirstAider({ id: "fa_0", staff_id: "staff_0" }),
      ],
    }));
    expect(r.headline).toContain("Good");
  });

  it("produces adequate headline with concern count", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active" }),
        makeInfection({ id: "inf_2", status: "active" }),
        makeInfection({ id: "inf_3", status: "active" }),
      ],
      med_training: [
        ...Array.from({ length: 4 }, (_, i) =>
          makeMedTraining({ id: `mt_${i}`, staff_id: `staff_${i}` }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          makeMedTraining({ id: `mt_${4 + i}`, staff_id: `staff_${4 + i}`, completed: false }),
        ),
      ],
      first_aiders: [
        makeFirstAider({ id: "fa_0", staff_id: "staff_0" }),
        makeFirstAider({ id: "fa_1", staff_id: "staff_1" }),
      ],
    }));
    expect(r.headline).toContain("requires attention");
  });

  it("produces inadequate headline", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active", severity: "severe", gp_consulted: false, control_measures_applied: false }),
      ],
      mar_entries: Array.from({ length: 10 }, (_, i) =>
        makeMar({ id: `mar_${i}`, administered_correctly: i < 5, missed: i >= 5, reason_for_miss: i >= 5 ? "forgot" : null }),
      ),
      med_training: [],
      first_aiders: [],
    }));
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("Immediate action required");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. SCORE CLAMPING & EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput());
    expect(r.infection_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      infections: [
        makeInfection({ id: "inf_1", status: "active", severity: "severe", gp_consulted: false, control_measures_applied: false }),
        makeInfection({ id: "inf_2", status: "active", severity: "severe", gp_consulted: false, control_measures_applied: false }),
      ],
      mar_entries: Array.from({ length: 10 }, (_, i) =>
        makeMar({ id: `mar_${i}`, administered_correctly: false, missed: true, reason_for_miss: "forgot" }),
      ),
      med_training: [],
      first_aiders: [],
    }));
    expect(r.infection_score).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  it("handles empty arrays for all data except children/staff", () => {
    const r = computeHomeInfectionControlHealthSafety({
      today: "2026-05-27",
      total_children: 4,
      total_staff: 8,
      infections: [],
      mar_entries: [],
      med_training: [],
      first_aiders: [],
    });
    // mod1: +5, mod2: +2, mod3: +2, mod4: -5 (0%), mod5: -5 (0%), mod6: +4
    // 52 + 5 + 2 + 2 + (-5) + (-5) + 4 = 55
    expect(r.infection_rating).toBe("adequate");
    expect(r.infection_score).toBe(55);
  });

  it("handles single staff member", () => {
    const r = computeHomeInfectionControlHealthSafety({
      today: "2026-05-27",
      total_children: 1,
      total_staff: 1,
      infections: [],
      mar_entries: [makeMar({ id: "m1" })],
      med_training: [makeMedTraining({ id: "mt_1", staff_id: "s1" })],
      first_aiders: [makeFirstAider({ id: "fa_1", staff_id: "s1" })],
    });
    // mod4: 1/1 = 100% → +5, mod5: 1/1 = 100% → +5
    expect(r.infection_rating).toBe("outstanding");
  });

  it("handles expired training correctly", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      med_training: Array.from({ length: 8 }, (_, i) =>
        makeMedTraining({
          id: `mt_${i}`,
          staff_id: `staff_${i}`,
          completed: true,
          expiry_date: "2025-01-01", // expired
        }),
      ),
    }));
    // 0/8 valid → mod4: -5
    expect(r.med_training_rate).toBe(0);
  });

  it("distinguishes between administered_correctly false and missed", () => {
    const r = computeHomeInfectionControlHealthSafety(baseInput({
      mar_entries: [
        makeMar({ id: "m1", administered_correctly: false, missed: false }),
        makeMar({ id: "m2", administered_correctly: true, missed: true, reason_for_miss: "refused" }),
        makeMar({ id: "m3", administered_correctly: true, missed: false }),
      ],
    }));
    // correct && !missed: only m3 = 1/3 = 33%
    expect(r.mar_accuracy_rate).toBe(33);
  });
});
