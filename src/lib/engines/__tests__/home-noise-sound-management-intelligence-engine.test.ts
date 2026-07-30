// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOISE & SOUND MANAGEMENT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering scoring, rates, strengths, concerns,
// recommendations, insights, edge cases, bonuses, and penalties.
// CHR 2015 Reg 25, Reg 5; SCCIF Experiences/progress, Living in the home.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeNoiseSoundManagement,
  type NoiseSoundInput,
  type NoiseMonitoringRecordInput,
  type QuietHoursRecordInput,
  type SensoryEnvironmentRecordInput,
  type SoundInsulationRecordInput,
  type ChildComfortRecordInput,
} from "../home-noise-sound-management-intelligence-engine";

const TODAY = "2026-05-29";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `rec_${++_id}`;
}

function baseInput(overrides: Partial<NoiseSoundInput> = {}): NoiseSoundInput {
  return {
    today: TODAY,
    total_children: 3,
    noise_monitoring_records: [],
    quiet_hours_records: [],
    sensory_environment_records: [],
    sound_insulation_records: [],
    child_comfort_records: [],
    ...overrides,
  };
}

function makeMonitoring(
  overrides: Partial<NoiseMonitoringRecordInput> = {},
): NoiseMonitoringRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    time_of_day: "morning",
    location: "communal_area",
    decibel_reading: 45,
    acceptable_level: true,
    source_identified: true,
    source_type: "children",
    action_taken: false,
    action_description: "",
    staff_member: "staff_ryan",
    monitoring_method: "observation",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeQuietHours(
  overrides: Partial<QuietHoursRecordInput> = {},
): QuietHoursRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    quiet_hours_start: "21:00",
    quiet_hours_end: "07:00",
    compliant: true,
    disruptions_count: 0,
    disruption_type: "none",
    duration_of_disruption_minutes: 0,
    children_affected_count: 0,
    resolution_effective: true,
    staff_responded_promptly: true,
    child_feedback_obtained: true,
    notes: "",
    created_at: "2026-05-20T21:00:00Z",
    ...overrides,
  };
}

function makeSensory(
  overrides: Partial<SensoryEnvironmentRecordInput> = {},
): SensoryEnvironmentRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    child_id: "child_1",
    adaptation_type: "quiet_space",
    adaptation_in_place: true,
    child_using_adaptation: true,
    effectiveness_rating: 4,
    child_feedback_positive: true,
    reviewed_with_child: true,
    linked_to_care_plan: true,
    professional_recommended: true,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeInsulation(
  overrides: Partial<SoundInsulationRecordInput> = {},
): SoundInsulationRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    location: "bedroom",
    insulation_type: "walls",
    condition: "good",
    meets_standard: true,
    last_inspected: "2026-05-01",
    maintenance_needed: false,
    maintenance_scheduled: false,
    maintenance_completed: false,
    impact_on_children: "none",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeComfort(
  overrides: Partial<ChildComfortRecordInput> = {},
): ChildComfortRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-20",
    comfort_level: "comfortable",
    noise_sensitivity: "moderate",
    sleep_disrupted_by_noise: false,
    specific_noise_concerns: [],
    feels_heard_about_noise: true,
    preferred_noise_level: "quiet",
    staff_responsive_to_concerns: true,
    adaptations_helpful: true,
    overall_satisfaction: 4,
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

// Helpers for bulk generation
function repeat<T>(n: number, fn: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i));
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. INSUFFICIENT DATA ────────────────────────────────────────────────

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 0 }));
    expect(r.noise_rating).toBe("insufficient_data");
    expect(r.noise_score).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 0 }));
    expect(r.headline).toContain("insufficient data");
  });

  it("all counters are 0", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 0 }));
    expect(r.total_monitoring_records).toBe(0);
    expect(r.total_quiet_hours_records).toBe(0);
    expect(r.total_sensory_environment_records).toBe(0);
    expect(r.total_insulation_records).toBe(0);
    expect(r.total_comfort_records).toBe(0);
  });

  it("all rates are 0", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 0 }));
    expect(r.noise_monitoring_rate).toBeNull();
    expect(r.quiet_hours_compliance_rate).toBe(0);
    expect(r.sensory_environment_rate).toBeNull();
    expect(r.sound_insulation_rate).toBeNull();
    expect(r.child_comfort_rate).toBeNull();
    expect(r.staff_awareness_rate).toBe(0);
  });
});

// ── 2. INADEQUATE FLOOR (all empty, children > 0) ──────────────────────

describe("inadequate floor — all empty with children on placement", () => {
  it("returns inadequate with score 15", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.noise_rating).toBe("inadequate");
    expect(r.noise_score).toBe(15);
  });

  it("has one concern about missing records", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No noise monitoring records");
  });

  it("has two immediate recommendations", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has one critical insight", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.headline).toContain("urgent attention");
  });

  it("all rates are 0", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3 }));
    expect(r.noise_monitoring_rate).toBeNull();
    expect(r.quiet_hours_compliance_rate).toBe(0);
    expect(r.sensory_environment_rate).toBeNull();
    expect(r.sound_insulation_rate).toBeNull();
    expect(r.child_comfort_rate).toBeNull();
    expect(r.staff_awareness_rate).toBe(0);
  });

  it("works with total_children = 1", () => {
    const r = computeNoiseSoundManagement(baseInput({ total_children: 1 }));
    expect(r.noise_rating).toBe("inadequate");
    expect(r.noise_score).toBe(15);
  });
});

// ── 3. pct(0,0) = 0 ────────────────────────────────────────────────────

describe("pct(0,0) edge case", () => {
  it("rates are 0 when arrays are empty (pct with 0 denominator)", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 0,
      }),
    );
    expect(r.noise_monitoring_rate).toBeNull();
    expect(r.quiet_hours_compliance_rate).toBe(0);
    expect(r.sensory_environment_rate).toBeNull();
    expect(r.sound_insulation_rate).toBeNull();
    expect(r.child_comfort_rate).toBeNull();
    expect(r.staff_awareness_rate).toBe(0);
  });
});

// ── 4. OUTSTANDING SCENARIO ─────────────────────────────────────────────

describe("outstanding scenario", () => {
  function outstandingInput(): NoiseSoundInput {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        action_taken: true,
        monitoring_method: "meter",
        time_of_day: i < 3 ? "night" : "morning",
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i % 5],
      }),
    );
    const quietHours = repeat(10, () =>
      makeQuietHours({
        compliant: true,
        disruptions_count: 0,
        child_feedback_obtained: true,
      }),
    );
    const sensory = repeat(3, (i) =>
      makeSensory({
        child_id: `child_${i + 1}`,
        adaptation_in_place: true,
        child_using_adaptation: true,
        effectiveness_rating: 5,
        child_feedback_positive: true,
        reviewed_with_child: true,
        linked_to_care_plan: true,
      }),
    );
    const insulation = repeat(5, () =>
      makeInsulation({
        condition: "excellent",
        meets_standard: true,
        impact_on_children: "none",
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: "very_comfortable",
        feels_heard_about_noise: true,
        staff_responsive_to_concerns: true,
        overall_satisfaction: 5,
        sleep_disrupted_by_noise: false,
        adaptations_helpful: true,
      }),
    );
    return baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    });
  }

  it("rates outstanding", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.noise_rating).toBe("outstanding");
  });

  it("score is 80 or above", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.noise_score).toBeGreaterThanOrEqual(80);
  });

  it("score equals base + all bonuses = 80", () => {
    // base 52 + 4 + 5 + 4 + 3 + 4 + 3 + 3 + 2 = 80
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.noise_score).toBe(80);
  });

  it("headline says outstanding", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has strengths", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("has zero concerns", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("has zero recommendations", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights including outstanding insight", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.length).toBeGreaterThan(0);
    expect(positives.some((i) => i.text.includes("outstanding"))).toBe(true);
  });

  it("all six rates are high", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.noise_monitoring_rate).toBeGreaterThanOrEqual(90);
    expect(r.quiet_hours_compliance_rate).toBe(100);
    expect(r.sensory_environment_rate).toBeGreaterThanOrEqual(90);
    expect(r.sound_insulation_rate).toBe(100);
    expect(r.child_comfort_rate).toBeGreaterThanOrEqual(90);
    expect(r.staff_awareness_rate).toBeGreaterThanOrEqual(90);
  });

  it("total records are correct", () => {
    const r = computeNoiseSoundManagement(outstandingInput());
    expect(r.total_monitoring_records).toBe(10);
    expect(r.total_quiet_hours_records).toBe(10);
    expect(r.total_sensory_environment_records).toBe(3);
    expect(r.total_insulation_records).toBe(5);
    expect(r.total_comfort_records).toBe(3);
  });
});

// ── 5. GOOD SCENARIO ───────────────────────────────────────────────────

describe("good scenario", () => {
  function goodInput(): NoiseSoundInput {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({
        acceptable_level: i < 8,
        source_identified: i < 8,
        action_taken: i >= 8,
        location: (["bedroom", "communal_area", "kitchen"] as const)[i % 3],
      }),
    );
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 9,
        disruptions_count: i >= 9 ? 1 : 0,
        disruption_type: i >= 9 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 9 ? 15 : 0,
        children_affected_count: i >= 9 ? 1 : 0,
        resolution_effective: true,
        staff_responded_promptly: true,
        child_feedback_obtained: i < 8,
      }),
    );
    const sensory = repeat(3, (i) =>
      makeSensory({
        child_id: `child_${i + 1}`,
        adaptation_in_place: true,
        child_feedback_positive: i < 2,
        reviewed_with_child: i < 2,
        linked_to_care_plan: i < 2,
      }),
    );
    const insulation = repeat(5, (i) =>
      makeInsulation({
        condition: i < 4 ? "good" : "fair",
        meets_standard: i < 4,
        impact_on_children: i < 4 ? "none" : "minor",
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: i < 2 ? "comfortable" : "neutral",
        feels_heard_about_noise: i < 2,
        staff_responsive_to_concerns: i < 2,
        overall_satisfaction: i < 2 ? 4 : 3,
      }),
    );
    return baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    });
  }

  it("rates good (score 65-79)", () => {
    const r = computeNoiseSoundManagement(goodInput());
    expect(r.noise_rating).toBe("good");
    expect(r.noise_score).toBeGreaterThanOrEqual(65);
    expect(r.noise_score).toBeLessThan(80);
  });

  it("headline mentions good", () => {
    const r = computeNoiseSoundManagement(goodInput());
    expect(r.headline).toContain("Good");
  });

  it("has strengths and possibly concerns", () => {
    const r = computeNoiseSoundManagement(goodInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });
});

// ── 6. ADEQUATE SCENARIO ───────────────────────────────────────────────

describe("adequate scenario", () => {
  function adequateInput(): NoiseSoundInput {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({
        acceptable_level: i < 6,
        source_identified: i < 6,
        action_taken: i >= 6 && i < 8,
        location: "communal_area",
      }),
    );
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 6,
        disruptions_count: i >= 6 ? 2 : 0,
        disruption_type: i >= 6 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 6 ? 20 : 0,
        children_affected_count: i >= 6 ? 1 : 0,
        resolution_effective: i >= 6 && i < 8,
        staff_responded_promptly: i >= 6 && i < 8,
        child_feedback_obtained: i < 5,
      }),
    );
    const sensory = repeat(3, (i) =>
      makeSensory({
        child_id: `child_${i + 1}`,
        adaptation_in_place: i < 2,
        child_feedback_positive: i < 1,
        reviewed_with_child: i < 1,
        linked_to_care_plan: i < 1,
      }),
    );
    const insulation = repeat(5, (i) =>
      makeInsulation({
        condition: i < 3 ? "good" : "fair",
        meets_standard: i < 3,
        impact_on_children: i < 3 ? "none" : "minor",
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: i < 1 ? "comfortable" : "neutral",
        feels_heard_about_noise: i < 2,
        staff_responsive_to_concerns: i < 1,
        overall_satisfaction: 3,
      }),
    );
    return baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    });
  }

  it("rates adequate (score 45-64)", () => {
    const r = computeNoiseSoundManagement(adequateInput());
    expect(r.noise_rating).toBe("adequate");
    expect(r.noise_score).toBeGreaterThanOrEqual(45);
    expect(r.noise_score).toBeLessThan(65);
  });

  it("headline mentions adequate", () => {
    const r = computeNoiseSoundManagement(adequateInput());
    expect(r.headline).toContain("Adequate");
  });

  it("has concerns", () => {
    const r = computeNoiseSoundManagement(adequateInput());
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ── 7. INADEQUATE SCENARIO ─────────────────────────────────────────────

describe("inadequate scenario", () => {
  function inadequateInput(): NoiseSoundInput {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({
        acceptable_level: i < 2,
        source_identified: i < 3,
        action_taken: false,
        location: "communal_area",
      }),
    );
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 3 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 45 : 0,
        children_affected_count: i >= 3 ? 2 : 0,
        resolution_effective: false,
        staff_responded_promptly: i < 2,
        child_feedback_obtained: i < 2,
      }),
    );
    const sensory = repeat(5, (i) =>
      makeSensory({
        child_id: `child_${(i % 3) + 1}`,
        adaptation_in_place: i < 1,
        child_feedback_positive: false,
        reviewed_with_child: i < 1,
        linked_to_care_plan: i < 1,
        effectiveness_rating: 1,
      }),
    );
    const insulation = repeat(5, (i) =>
      makeInsulation({
        condition: i < 2 ? "poor" : "failed",
        meets_standard: false,
        impact_on_children: i < 2 ? "moderate" : "significant",
        maintenance_needed: true,
        maintenance_scheduled: i < 1,
        maintenance_completed: false,
      }),
    );
    const comfort = repeat(4, (i) =>
      makeComfort({
        child_id: `child_${(i % 3) + 1}`,
        comfort_level: i < 1 ? "neutral" : "very_uncomfortable",
        feels_heard_about_noise: false,
        staff_responsive_to_concerns: false,
        overall_satisfaction: 1,
        sleep_disrupted_by_noise: true,
        noise_sensitivity: "very_high",
      }),
    );
    return baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    });
  }

  it("rates inadequate (score < 45)", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    expect(r.noise_rating).toBe("inadequate");
    expect(r.noise_score).toBeLessThan(45);
  });

  it("headline mentions inadequate and urgent action", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent action");
  });

  it("has multiple concerns", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    expect(r.concerns.length).toBeGreaterThan(3);
  });

  it("has immediate recommendations", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    const immediate = r.recommendations.filter((r) => r.urgency === "immediate");
    expect(immediate.length).toBeGreaterThan(0);
  });

  it("has critical insights", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
  });

  it("recommendation ranks are sequential", () => {
    const r = computeNoiseSoundManagement(inadequateInput());
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ── 8. BONUS ISOLATION ─────────────────────────────────────────────────

describe("bonus isolation — each bonus in isolation", () => {
  // For each bonus test, we construct minimal input so only that bonus fires.
  // base = 52, no penalties.

  describe("Bonus 1: noiseMonitoringRate >= 90 → +4", () => {
    it("adds +4 when noiseMonitoringRate >= 90", () => {
      // all acceptable, all source identified, all action taken (via no unacceptable),
      // 5 locations → 100% for all components → rate ~100
      const monitoring = repeat(5, (i) =>
        makeMonitoring({
          acceptable_level: true,
          source_identified: true,
          location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      expect(r.noise_monitoring_rate).toBeGreaterThanOrEqual(90);
      // score = 52 + B1(+4) + B6(staffAwareness=100% from source_identified → +3) = 59
      expect(r.noise_score).toBe(59);
    });

    it("adds +2 when noiseMonitoringRate >= 70 but < 90", () => {
      // 70% acceptable, 70% source identified, 100% action (all acceptable), low location coverage
      // Components: 0.4*70 + 0.25*70 + 0.2*100 + 0.15*20 = 28+17.5+20+3 = 68.5 → 69
      // Need to fine-tune. Let's try: 8/10 acceptable (80%), 8/10 source (80%), all acceptable so action=100%, 1 location (20%)
      // 0.4*80 + 0.25*80 + 0.2*100 + 0.15*20 = 32+20+20+3 = 75
      const monitoring = repeat(10, (i) =>
        makeMonitoring({
          acceptable_level: i < 8,
          source_identified: i < 8,
          action_taken: i >= 8, // unacceptable ones get action taken (2 out of 2)
          location: "communal_area",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      expect(r.noise_monitoring_rate).toBeGreaterThanOrEqual(70);
      expect(r.noise_monitoring_rate).toBeLessThan(90);
      // B1(+2) + B6(staffAwareness = (8+2)/(10+2) = 83% → +1) = 52+2+1 = 55
      expect(r.noise_score).toBe(55);
    });

    it("no bonus when noiseMonitoringRate < 70", () => {
      // 3/10 acceptable (30%), 3/10 source (30%), 0 action on unacceptable, 1 location
      const monitoring = repeat(10, (i) =>
        makeMonitoring({
          acceptable_level: i < 3,
          source_identified: i < 3,
          action_taken: false,
          location: "communal_area",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      expect(r.noise_monitoring_rate).toBeLessThan(70);
      // score = 52 (no bonus), but might hit penalties — check
      // No quiet hours, comfort, insulation records → no penalties (guarded by length > 0)
      expect(r.noise_score).toBe(52);
    });
  });

  describe("Bonus 2: quietHoursComplianceRate >= 95 → +5", () => {
    it("adds +5 when compliance >= 95", () => {
      const quietHours = repeat(20, () =>
        makeQuietHours({ compliant: true }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(100);
      expect(r.noise_score).toBe(57); // 52 + 5
    });

    it("adds +3 when compliance >= 80 but < 95", () => {
      // 9/10 compliant = 90%
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 9,
          disruptions_count: i >= 9 ? 1 : 0,
          disruption_type: i >= 9 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 9 ? 10 : 0,
          children_affected_count: i >= 9 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(90);
      // B2(+3) + B6(staffAwareness: 1 disrupted with prompt response → 1/1=100% → +3) = 52+3+3 = 58
      expect(r.noise_score).toBe(58);
    });

    it("no bonus when compliance < 80", () => {
      // 7/10 compliant = 70%
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 7,
          disruptions_count: i >= 7 ? 1 : 0,
          disruption_type: i >= 7 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 7 ? 10 : 0,
          children_affected_count: i >= 7 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(70);
      // B6(staffAwareness: 3 disrupted, all staff_responded_promptly=true → 3/3=100% → +3) = 52+3 = 55
      expect(r.noise_score).toBe(55);
    });
  });

  describe("Bonus 3: sensoryEnvironmentRate >= 90 → +4", () => {
    it("adds +4 when sensoryEnvironmentRate >= 90", () => {
      const sensory = repeat(5, (i) =>
        makeSensory({
          child_id: `child_${i + 1}`,
          adaptation_in_place: true,
          child_feedback_positive: true,
          reviewed_with_child: true,
          linked_to_care_plan: true,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sensory_environment_records: sensory }),
      );
      expect(r.sensory_environment_rate).toBeGreaterThanOrEqual(90);
      // B3(+4) + B6(staffAwareness: reviewed_with_child 5/5=100% → +3) = 52+4+3 = 59
      expect(r.noise_score).toBe(59);
    });

    it("adds +2 when sensoryEnvironmentRate >= 70 but < 90", () => {
      // 0.3*100 + 0.25*60 + 0.25*60 + 0.2*60 = 30+15+15+12 = 72
      const sensory = repeat(5, (i) =>
        makeSensory({
          child_id: `child_${i + 1}`,
          adaptation_in_place: true,
          child_feedback_positive: i < 3,
          reviewed_with_child: i < 3,
          linked_to_care_plan: i < 3,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sensory_environment_records: sensory }),
      );
      expect(r.sensory_environment_rate).toBeGreaterThanOrEqual(70);
      expect(r.sensory_environment_rate).toBeLessThan(90);
      expect(r.noise_score).toBe(54); // 52 + 2
    });
  });

  describe("Bonus 4: soundInsulationRate >= 90 → +3", () => {
    it("adds +3 when soundInsulationRate >= 90", () => {
      const insulation = repeat(5, () =>
        makeInsulation({
          meets_standard: true,
          condition: "excellent",
          impact_on_children: "none",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sound_insulation_records: insulation }),
      );
      expect(r.sound_insulation_rate).toBe(100);
      expect(r.noise_score).toBe(55); // 52 + 3
    });

    it("adds +1 when soundInsulationRate >= 70 but < 90", () => {
      // 0.4*80 + 0.3*60 + 0.3*60 = 32+18+18 = 68 → need higher
      // 0.4*80 + 0.3*80 + 0.3*60 = 32+24+18 = 74
      const insulation = repeat(5, (i) =>
        makeInsulation({
          meets_standard: i < 4,
          condition: i < 4 ? "good" : "fair",
          impact_on_children: i < 3 ? "none" : "minor",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sound_insulation_records: insulation }),
      );
      expect(r.sound_insulation_rate).toBeGreaterThanOrEqual(70);
      expect(r.sound_insulation_rate).toBeLessThan(90);
      expect(r.noise_score).toBe(53); // 52 + 1
    });
  });

  describe("Bonus 5: childComfortRate >= 90 → +4", () => {
    it("adds +4 when childComfortRate >= 90", () => {
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          comfort_level: "very_comfortable",
          feels_heard_about_noise: true,
          staff_responsive_to_concerns: true,
          overall_satisfaction: 5,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ child_comfort_records: comfort }),
      );
      expect(r.child_comfort_rate).toBeGreaterThanOrEqual(90);
      // B5(+4) + B6(staffAwareness: 3/3 staff_responsive=100% → +3) + B7(coverage=100% → +3) + B8(avgSat=5 → +2) = 52+4+3+3+2 = 64
      expect(r.noise_score).toBe(64);
    });

    it("adds +2 when childComfortRate >= 70 but < 90", () => {
      // 0.35*67 + 0.25*67 + 0.25*67 + 0.15*67 = 67 → try 2/3
      // 0.35*67 + 0.25*100 + 0.25*67 + 0.15*67 = 23.45+25+16.75+10.05 = 75.25 → 75
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          comfort_level: i < 2 ? "comfortable" : "neutral",
          feels_heard_about_noise: true,
          staff_responsive_to_concerns: i < 2,
          overall_satisfaction: i < 2 ? 4 : 3,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ child_comfort_records: comfort }),
      );
      expect(r.child_comfort_rate).toBeGreaterThanOrEqual(70);
      expect(r.child_comfort_rate).toBeLessThan(90);
      // B5(+2) + B7(coverage=100% → +3) + B8(avgSat=3.67 → +1) = 52+2+3+1 = 58
      expect(r.noise_score).toBe(58);
    });
  });

  describe("Bonus 6: staffAwarenessRate >= 90 → +3", () => {
    it("adds +3 when staffAwarenessRate >= 90", () => {
      // Staff awareness = source_identified + action_taken_on_unacceptable + staff_responded_promptly + staff_responsive + reviewed_with_child
      // Use monitoring (all source identified), no unacceptable, comfort (all staff responsive), sensory (all reviewed)
      const monitoring = repeat(5, () =>
        makeMonitoring({ source_identified: true, acceptable_level: true }),
      );
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          staff_responsive_to_concerns: true,
          // Keep comfort rate < 70 to avoid Bonus 5
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          overall_satisfaction: 2,
        }),
      );
      const sensory = repeat(3, (i) =>
        makeSensory({
          child_id: `child_${i + 1}`,
          reviewed_with_child: true,
          // Keep sensory rate low to avoid Bonus 3
          adaptation_in_place: false,
          child_feedback_positive: false,
          linked_to_care_plan: false,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({
          noise_monitoring_records: monitoring,
          child_comfort_records: comfort,
          sensory_environment_records: sensory,
        }),
      );
      // staff awareness = (5+3+3) / (5+3+3) = 11/11 = 100%
      expect(r.staff_awareness_rate).toBeGreaterThanOrEqual(90);
      // Bonus 1: noiseMonitoringRate: 0.4*100 + 0.25*100 + 0.2*100 + 0.15*20 = 88 → +2
      // Bonus 5: childComfortRate: 0.35*0 + 0.25*0 + 0.25*100 + 0.15*0 = 25 → no bonus
      // Bonus 3: sensoryEnvironmentRate: 0.3*0 + 0.25*0 + 0.25*100 + 0.2*0 = 25 → no bonus
      // Bonus 6: +3
      // Also penalty 2: childComfortRate=25 < 40 → -5
      // score = 52 + 2 + 3 - 5 = 52
      // That's messy. Let me simplify: only use monitoring for staff awareness.
      const r2 = computeNoiseSoundManagement(
        baseInput({
          noise_monitoring_records: monitoring,
        }),
      );
      // staffAwareness = 5/5 = 100% → +3
      // noiseMonitoringRate: 0.4*100 + 0.25*100 + 0.2*100 + 0.15*20 = 88 → +2 (Bonus 1)
      // score = 52 + 2 + 3 = 57
      expect(r2.staff_awareness_rate).toBe(100);
      expect(r2.noise_score).toBe(57); // 52 + 2(B1) + 3(B6)
    });
  });

  describe("Bonus 7: comfortSurveyCoverage >= 100 → +3", () => {
    it("adds +3 when all children surveyed (100% coverage)", () => {
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          // Keep comfort rate low enough so Bonus 5 doesn't fire
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 2,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      // comfortSurveyCoverage = 3 unique / 3 total = 100%
      // childComfortRate: 0.35*0 + 0.25*0 + 0.25*0 + 0.15*0 = 0 → no Bonus 5
      // staffAwarenessRate: 0/3 = 0 → no Bonus 6
      // Penalty 2: childComfortRate=0 < 40 → -5
      // score = 52 + 3 - 5 = 50
      expect(r.noise_score).toBe(50);
    });

    it("adds +1 when coverage >= 80 but < 100", () => {
      // 4 unique children, 5 total = 80%
      const comfort = repeat(4, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 2,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 5, child_comfort_records: comfort }),
      );
      // coverage = 80%
      // Penalty 2: childComfortRate = 0 < 40 → -5
      // score = 52 + 1 - 5 = 48
      expect(r.noise_score).toBe(48);
    });
  });

  describe("Bonus 8: avgSatisfaction >= 4.5 → +2", () => {
    it("adds +2 when avgSatisfaction >= 4.5", () => {
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          overall_satisfaction: 5,
          // Avoid Bonus 5 by keeping other fields low
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      // avgSatisfaction = 5 → +2 (Bonus 8)
      // highSatisfactionRate = 100% → childComfortRate = 0.35*0+0.25*0+0.25*0+0.15*100 = 15 → no Bonus 5
      // comfortSurveyCoverage = 100% → +3 (Bonus 7)
      // Penalty 2: childComfortRate=15 < 40 → -5
      // score = 52 + 2 + 3 - 5 = 52
      expect(r.noise_score).toBe(52);
    });

    it("adds +1 when avgSatisfaction >= 3.5 but < 4.5", () => {
      const comfort = repeat(3, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          overall_satisfaction: 4,
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      // avgSatisfaction = 4 → +1 (Bonus 8)
      // highSatisfactionRate = 100% → childComfortRate = 15 → no Bonus 5
      // comfortSurveyCoverage = 100% → +3 (Bonus 7)
      // Penalty 2: childComfortRate=15 < 40 → -5
      // score = 52 + 1 + 3 - 5 = 51
      expect(r.noise_score).toBe(51);
    });
  });
});

// ── 9. PENALTY ISOLATION ────────────────────────────────────────────────

describe("penalty isolation", () => {
  describe("Penalty 1: quietHoursComplianceRate < 50 → -6", () => {
    it("applies -6 when compliance < 50", () => {
      // 4/10 compliant = 40%
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 4,
          disruptions_count: i >= 4 ? 1 : 0,
          disruption_type: i >= 4 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 4 ? 10 : 0,
          children_affected_count: i >= 4 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(40);
      // B6(staffAwareness: 6 disrupted, all prompt → 6/6=100% → +3) - P1(-6) = 52+3-6 = 49
      expect(r.noise_score).toBe(49);
    });

    it("no penalty at exactly 50%", () => {
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 5,
          disruptions_count: i >= 5 ? 1 : 0,
          disruption_type: i >= 5 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 5 ? 10 : 0,
          children_affected_count: i >= 5 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(50);
      // B6(staffAwareness: 5 disrupted, all prompt → 5/5=100% → +3) = 52+3 = 55
      expect(r.noise_score).toBe(55);
    });
  });

  describe("Penalty 2: childComfortRate < 40 → -5", () => {
    it("applies -5 when childComfortRate < 40", () => {
      const comfort = repeat(5, (i) =>
        makeComfort({
          child_id: `child_${(i % 3) + 1}`,
          comfort_level: "very_uncomfortable",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 1,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      expect(r.child_comfort_rate).toBeLessThan(40);
      // Bonus 7: coverage = 3/3=100% → +3
      // score = 52 + 3 - 5 = 50
      expect(r.noise_score).toBe(50);
    });
  });

  describe("Penalty 3: poorConditionRate > 30 → -4", () => {
    it("applies -4 when poor/failed > 30%", () => {
      // 2/5 = 40% poor
      const insulation = repeat(5, (i) =>
        makeInsulation({
          condition: i < 2 ? "poor" : "good",
          meets_standard: i >= 2,
          impact_on_children: i < 2 ? "moderate" : "none",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sound_insulation_records: insulation }),
      );
      // poorConditionRate = 40% > 30 → -4
      // soundInsulationRate: 0.4*60 + 0.3*60 + 0.3*60 = 24+18+18 = 60 → no bonus (< 70)
      // score = 52 - 4 = 48
      expect(r.noise_score).toBe(48);
    });

    it("no penalty at exactly 30%", () => {
      // 3/10 = 30% poor — NOT > 30
      const insulation = repeat(10, (i) =>
        makeInsulation({
          condition: i < 3 ? "poor" : "good",
          meets_standard: i >= 3,
          impact_on_children: i < 3 ? "moderate" : "none",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sound_insulation_records: insulation }),
      );
      // poorConditionRate = 30% — NOT > 30 → no penalty
      // soundInsulationRate = 0.4*70 + 0.3*70 + 0.3*70 = 28+21+21 = 70 → +1 (Bonus 4)
      expect(r.noise_score).toBe(53); // 52 + 1
    });
  });

  describe("Penalty 4: sleepDisruptionRate > 40 → -3", () => {
    it("applies -3 when sleepDisruptionRate > 40%", () => {
      // 3/5 = 60% sleep disrupted
      const comfort = repeat(5, (i) =>
        makeComfort({
          child_id: `child_${(i % 3) + 1}`,
          sleep_disrupted_by_noise: i < 3,
          // Keep other fields low
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 2,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      // sleepDisruptionRate = 60% > 40 → -3
      // childComfortRate = 0.35*0 + 0.25*0 + 0.25*0 + 0.15*0 = 0 → Penalty 2: -5
      // Bonus 7: 3/3 = 100% → +3
      // score = 52 + 3 - 5 - 3 = 47
      expect(r.noise_score).toBe(47);
    });

    it("no penalty at exactly 40%", () => {
      // 2/5 = 40% — NOT > 40
      const comfort = repeat(5, (i) =>
        makeComfort({
          child_id: `child_${(i % 3) + 1}`,
          sleep_disrupted_by_noise: i < 2,
          comfort_level: "neutral",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 2,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, child_comfort_records: comfort }),
      );
      // sleepDisruptionRate = 40% — NOT > 40 → no Penalty 4
      // Penalty 2: childComfortRate = 0 < 40 → -5
      // Bonus 7: +3
      // score = 52 + 3 - 5 = 50
      expect(r.noise_score).toBe(50);
    });
  });

  describe("all penalties stacking", () => {
    it("applies all 4 penalties when conditions met", () => {
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 3,
          disruptions_count: i >= 3 ? 2 : 0,
          disruption_type: i >= 3 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 3 ? 20 : 0,
          children_affected_count: i >= 3 ? 1 : 0,
        }),
      );
      const insulation = repeat(5, (i) =>
        makeInsulation({
          condition: i < 3 ? "failed" : "good",
          meets_standard: i >= 3,
          impact_on_children: i < 3 ? "significant" : "none",
        }),
      );
      const comfort = repeat(5, (i) =>
        makeComfort({
          child_id: `child_${(i % 3) + 1}`,
          comfort_level: "very_uncomfortable",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 1,
          sleep_disrupted_by_noise: true,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({
          total_children: 3,
          quiet_hours_records: quietHours,
          sound_insulation_records: insulation,
          child_comfort_records: comfort,
        }),
      );
      // quietHoursCompliance = 30% < 50 → -6
      // childComfortRate = 0 < 40 → -5
      // poorConditionRate = 60% > 30 → -4
      // sleepDisruptionRate = 100% > 40 → -3
      // Bonus 7: coverage = 3/3 = 100% → +3
      // score = 52 + 3 - 6 - 5 - 4 - 3 = 37
      expect(r.noise_score).toBe(37);
      expect(r.noise_rating).toBe("inadequate");
    });
  });
});

// ── 10. SIX RATE CALCULATIONS ──────────────────────────────────────────

describe("rate calculations", () => {
  describe("noise_monitoring_rate", () => {
    it("is 0 when no monitoring records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.noise_monitoring_rate).toBeNull();
    });

    it("weighted: 40% acceptable + 25% source + 20% action + 15% location", () => {
      // 10 records: all acceptable, all source identified, all acceptable so action=100%, 3 locations (60%)
      const monitoring = repeat(10, (i) =>
        makeMonitoring({
          acceptable_level: true,
          source_identified: true,
          location: (["bedroom", "communal_area", "kitchen"] as const)[i % 3],
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      // 0.4*100 + 0.25*100 + 0.2*100 + 0.15*60 = 40+25+20+9 = 94
      expect(r.noise_monitoring_rate).toBe(94);
    });

    it("action rate is 100% when all noise is acceptable", () => {
      const monitoring = [makeMonitoring({ acceptable_level: true })];
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      // 1 location = 20%, 0.4*100 + 0.25*100 + 0.2*100 + 0.15*20 = 88
      expect(r.noise_monitoring_rate).toBe(88);
    });

    it("location coverage caps at 5 distinct locations", () => {
      const locations = ["bedroom", "communal_area", "kitchen", "bathroom", "garden", "hallway", "study_room"] as const;
      const monitoring = repeat(7, (i) =>
        makeMonitoring({
          acceptable_level: true,
          source_identified: true,
          location: locations[i],
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ noise_monitoring_records: monitoring }),
      );
      // locationCoverage capped at 100% (>=5 locations)
      // 0.4*100 + 0.25*100 + 0.2*100 + 0.15*100 = 100
      expect(r.noise_monitoring_rate).toBe(100);
    });
  });

  describe("quiet_hours_compliance_rate", () => {
    it("is 0 when no quiet hours records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.quiet_hours_compliance_rate).toBe(0);
    });

    it("calculates correctly", () => {
      const quietHours = repeat(4, (i) =>
        makeQuietHours({ compliant: i < 3 }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ quiet_hours_records: quietHours }),
      );
      expect(r.quiet_hours_compliance_rate).toBe(75); // 3/4
    });
  });

  describe("sensory_environment_rate", () => {
    it("is 0 when no sensory records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.sensory_environment_rate).toBeNull();
    });

    it("weighted: 30% in_place + 25% positive_feedback + 25% reviewed + 20% care_plan", () => {
      const sensory = repeat(10, (i) =>
        makeSensory({
          child_id: `child_${i + 1}`,
          adaptation_in_place: true,
          child_feedback_positive: i < 8,
          reviewed_with_child: i < 7,
          linked_to_care_plan: i < 6,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sensory_environment_records: sensory }),
      );
      // positive feedback: 8/10 in_place = 80%
      // reviewed: 7/10 = 70%
      // care plan: 6/10 = 60%
      // 0.3*100 + 0.25*80 + 0.25*70 + 0.2*60 = 30+20+17.5+12 = 79.5 → 80
      expect(r.sensory_environment_rate).toBe(80);
    });
  });

  describe("sound_insulation_rate", () => {
    it("is 0 when no insulation records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.sound_insulation_rate).toBeNull();
    });

    it("weighted: 40% meets_standard + 30% good_condition + 30% no_impact", () => {
      const insulation = repeat(10, (i) =>
        makeInsulation({
          meets_standard: i < 8,
          condition: i < 7 ? "good" : "fair",
          impact_on_children: i < 6 ? "none" : "minor",
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ sound_insulation_records: insulation }),
      );
      // 0.4*80 + 0.3*70 + 0.3*60 = 32+21+18 = 71
      expect(r.sound_insulation_rate).toBe(71);
    });
  });

  describe("child_comfort_rate", () => {
    it("is 0 when no comfort records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.child_comfort_rate).toBeNull();
    });

    it("weighted: 35% comfortable + 25% feels_heard + 25% staff_responsive + 15% high_satisfaction", () => {
      const comfort = repeat(10, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          comfort_level: i < 8 ? "comfortable" : "neutral",
          feels_heard_about_noise: i < 7,
          staff_responsive_to_concerns: i < 9,
          overall_satisfaction: i < 6 ? 4 : 3,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 10, child_comfort_records: comfort }),
      );
      // 0.35*80 + 0.25*70 + 0.25*90 + 0.15*60 = 28+17.5+22.5+9 = 77
      expect(r.child_comfort_rate).toBe(77);
    });
  });

  describe("staff_awareness_rate", () => {
    it("is 0 when no contributing records", () => {
      const r = computeNoiseSoundManagement(baseInput());
      expect(r.staff_awareness_rate).toBe(0);
    });

    it("combines source_identified, action_taken, staff_prompt_response, staff_responsive, reviewed_with_child", () => {
      const monitoring = repeat(4, (i) =>
        makeMonitoring({
          source_identified: i < 3,
          acceptable_level: i < 2,
          action_taken: i >= 2 && i < 3, // 1 out of 2 unacceptable
        }),
      );
      const quietHours = repeat(4, (i) =>
        makeQuietHours({
          compliant: i < 2,
          disruptions_count: i >= 2 ? 1 : 0,
          staff_responded_promptly: i >= 2 && i < 3,
          disruption_type: i >= 2 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 2 ? 10 : 0,
          children_affected_count: i >= 2 ? 1 : 0,
        }),
      );
      const comfort = repeat(4, (i) =>
        makeComfort({
          child_id: `child_${i + 1}`,
          staff_responsive_to_concerns: i < 3,
        }),
      );
      const sensory = repeat(4, (i) =>
        makeSensory({
          child_id: `child_${i + 1}`,
          reviewed_with_child: i < 2,
        }),
      );
      const r = computeNoiseSoundManagement(
        baseInput({
          total_children: 4,
          noise_monitoring_records: monitoring,
          quiet_hours_records: quietHours,
          child_comfort_records: comfort,
          sensory_environment_records: sensory,
        }),
      );
      // Numerators: source_identified=3, action_taken=1, staff_prompt=1, staff_responsive=3, reviewed=2 = 10
      // Denominators: monitoring=4, unacceptable=2, disrupted=2, comfort=4, sensory=4 = 16
      // 10/16 = 62.5 → 63
      expect(r.staff_awareness_rate).toBe(63);
    });
  });
});

// ── 11. RATING THRESHOLDS ──────────────────────────────────────────────

describe("rating thresholds (toRating)", () => {
  it("score 80 → outstanding", () => {
    // Use outstanding input from above — already tested
    const monitoring = repeat(5, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
      }),
    );
    const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
    const sensory = repeat(3, (i) =>
      makeSensory({ child_id: `child_${i + 1}`, adaptation_in_place: true, child_feedback_positive: true, reviewed_with_child: true, linked_to_care_plan: true }),
    );
    const insulation = repeat(5, () => makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }));
    const comfort = repeat(3, (i) =>
      makeComfort({ child_id: `child_${i + 1}`, comfort_level: "very_comfortable", feels_heard_about_noise: true, staff_responsive_to_concerns: true, overall_satisfaction: 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    }));
    expect(r.noise_score).toBeGreaterThanOrEqual(80);
    expect(r.noise_rating).toBe("outstanding");
  });

  it("score 65-79 → good", () => {
    // base=52 + B1(+4) + B2(+5) + B4(+3) = 64? Need 65
    // B1(+4) + B2(+5) + B4(+3) + B6(+3) = +15 → 67
    const monitoring = repeat(5, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
      }),
    );
    const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
    const insulation = repeat(5, () => makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }));
    const r = computeNoiseSoundManagement(baseInput({
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sound_insulation_records: insulation,
    }));
    expect(r.noise_score).toBeGreaterThanOrEqual(65);
    expect(r.noise_score).toBeLessThan(80);
    expect(r.noise_rating).toBe("good");
  });

  it("score 45-64 → adequate", () => {
    // base=52, no bonuses, no penalties
    const r = computeNoiseSoundManagement(
      baseInput({
        noise_monitoring_records: [makeMonitoring({ acceptable_level: false, source_identified: false, action_taken: false })],
      }),
    );
    expect(r.noise_score).toBe(52);
    expect(r.noise_rating).toBe("adequate");
  });

  it("score < 45 → inadequate", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 1 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 10 : 0,
        children_affected_count: i >= 3 ? 1 : 0,
        staff_responded_promptly: false,
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: "very_uncomfortable",
        feels_heard_about_noise: false,
        staff_responsive_to_concerns: false,
        overall_satisfaction: 1,
      }),
    );
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        quiet_hours_records: quietHours,
        child_comfort_records: comfort,
      }),
    );
    // P1(-6) + P2(-5) + B7(+3) + B6(staffAwareness: 0/7+0/3=0/10=0% → no bonus) = 52+3-6-5 = 44
    expect(r.noise_score).toBe(44);
    expect(r.noise_rating).toBe("inadequate");
  });
});

// ── 12. STRENGTHS ──────────────────────────────────────────────────────

describe("strengths", () => {
  it("acceptableNoiseRate >= 90 strength", () => {
    const monitoring = repeat(10, () => makeMonitoring({ acceptable_level: true }));
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("acceptable levels"))).toBe(true);
  });

  it("acceptableNoiseRate 70-89 strength", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ acceptable_level: i < 8 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("acceptable levels"))).toBe(true);
  });

  it("sourceIdentificationRate >= 90 strength", () => {
    const monitoring = repeat(10, () => makeMonitoring({ source_identified: true }));
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.strengths.some((s) => s.includes("source identification"))).toBe(true);
  });

  it("actionTakenRate >= 90 strength (when unacceptable noise exists)", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({
        acceptable_level: i < 5,
        action_taken: i >= 5,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.strengths.some((s) => s.includes("action taken"))).toBe(true);
  });

  it("quietHoursComplianceRate >= 95 strength", () => {
    const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.strengths.some((s) => s.includes("quiet hours compliance"))).toBe(true);
  });

  it("quietHoursComplianceRate 80-94 strength", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 9,
        disruptions_count: i >= 9 ? 1 : 0,
        disruption_type: i >= 9 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 9 ? 10 : 0,
        children_affected_count: i >= 9 ? 1 : 0,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("quiet hours compliance"))).toBe(true);
  });

  it("zeroDisruptionRate >= 80 strength", () => {
    const quietHours = repeat(10, () =>
      makeQuietHours({ compliant: true, disruptions_count: 0 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.strengths.some((s) => s.includes("zero disruptions"))).toBe(true);
  });

  it("staffPromptResponseRate >= 90 strength", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: false,
        disruptions_count: 1,
        staff_responded_promptly: true,
        disruption_type: "child_disturbance",
        duration_of_disruption_minutes: 10,
        children_affected_count: 1,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.strengths.some((s) => s.includes("prompt staff response"))).toBe(true);
  });

  it("adaptationInPlaceRate >= 90 strength", () => {
    const sensory = repeat(10, () =>
      makeSensory({ adaptation_in_place: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.strengths.some((s) => s.includes("sensory adaptations in place"))).toBe(true);
  });

  it("adaptationInPlaceRate 70-89 strength", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ adaptation_in_place: i < 8 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("sensory adaptations in place"))).toBe(true);
  });

  it("sensoryPositiveFeedbackRate >= 90 strength", () => {
    const sensory = repeat(10, () =>
      makeSensory({ adaptation_in_place: true, child_feedback_positive: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.strengths.some((s) => s.includes("positive child feedback on sensory"))).toBe(true);
  });

  it("linkedToCarePlanRate >= 90 strength", () => {
    const sensory = repeat(10, () =>
      makeSensory({ linked_to_care_plan: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.strengths.some((s) => s.includes("linked to care plans"))).toBe(true);
  });

  it("meetsStandardRate >= 90 strength", () => {
    const insulation = repeat(10, () =>
      makeInsulation({ meets_standard: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.strengths.some((s) => s.includes("sound insulation meets required standards"))).toBe(true);
  });

  it("meetsStandardRate 70-89 strength", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ meets_standard: i < 8 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("sound insulation meets standards"))).toBe(true);
  });

  it("maintenanceCompletionRate >= 90 strength", () => {
    const insulation = repeat(10, () =>
      makeInsulation({
        maintenance_needed: true,
        maintenance_completed: true,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.strengths.some((s) => s.includes("insulation maintenance completed"))).toBe(true);
  });

  it("comfortableRate >= 90 strength", () => {
    const comfort = repeat(10, () =>
      makeComfort({ comfort_level: "very_comfortable" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("comfortable or very comfortable"))).toBe(true);
  });

  it("comfortableRate 70-89 strength", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ comfort_level: i < 8 ? "comfortable" : "neutral" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("comfortable with noise"))).toBe(true);
  });

  it("feelsHeardRate >= 90 strength", () => {
    const comfort = repeat(10, () =>
      makeComfort({ feels_heard_about_noise: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("feel heard about noise"))).toBe(true);
  });

  it("feelsHeardRate 70-89 strength", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ feels_heard_about_noise: i < 8 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("feel heard"))).toBe(true);
  });

  it("avgSatisfaction >= 4.5 strength", () => {
    const comfort = repeat(10, () => makeComfort({ overall_satisfaction: 5 }));
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("5/5") && s.includes("highly satisfied"))).toBe(true);
  });

  it("avgSatisfaction 3.5-4.49 strength", () => {
    const comfort = repeat(10, () => makeComfort({ overall_satisfaction: 4 }));
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("4/5") && s.includes("generally satisfied"))).toBe(true);
  });

  it("comfortSurveyCoverage >= 100 strength", () => {
    const comfort = repeat(3, (i) =>
      makeComfort({ child_id: `child_${i + 1}` }),
    );
    const r = computeNoiseSoundManagement(baseInput({ total_children: 3, child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("Every child has been surveyed"))).toBe(true);
  });

  it("comfortSurveyCoverage 80-99 strength", () => {
    const comfort = repeat(4, (i) =>
      makeComfort({ child_id: `child_${i + 1}` }),
    );
    const r = computeNoiseSoundManagement(baseInput({ total_children: 5, child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("surveyed about noise comfort"))).toBe(true);
  });

  it("staffAwarenessRate >= 90 strength", () => {
    const monitoring = repeat(10, () =>
      makeMonitoring({ source_identified: true, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    // staffAwareness = 10/10 = 100%
    expect(r.strengths.some((s) => s.includes("staff awareness composite"))).toBe(true);
  });

  it("staffAwarenessRate 70-89 strength", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 8, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    // staffAwareness = 8/10 = 80%
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("staff awareness"))).toBe(true);
  });

  it("sleepDisruptionRate === 0 strength", () => {
    const comfort = repeat(5, () =>
      makeComfort({ sleep_disrupted_by_noise: false }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.some((s) => s.includes("No children report sleep disruption"))).toBe(true);
  });
});

// ── 13. CONCERNS ───────────────────────────────────────────────────────

describe("concerns", () => {
  it("acceptableNoiseRate < 40 concern", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ acceptable_level: i < 2 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("acceptable levels"))).toBe(true);
  });

  it("acceptableNoiseRate 40-69 concern", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ acceptable_level: i < 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("inconsistent"))).toBe(true);
  });

  it("sourceIdentificationRate < 50 concern", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("sources identified"))).toBe(true);
  });

  it("actionTakenRate < 50 concern", () => {
    const monitoring = repeat(10, () =>
      makeMonitoring({ acceptable_level: false, action_taken: false }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("Action taken"))).toBe(true);
  });

  it("quietHoursComplianceRate < 50 concern", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 1 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 10 : 0,
        children_affected_count: i >= 3 ? 1 : 0,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("quiet hours compliance"))).toBe(true);
  });

  it("quietHoursComplianceRate 50-79 concern", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 6,
        disruptions_count: i >= 6 ? 1 : 0,
        disruption_type: i >= 6 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 6 ? 10 : 0,
        children_affected_count: i >= 6 ? 1 : 0,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Quiet hours compliance"))).toBe(true);
  });

  it("avgDisruptionMinutes > 30 concern", () => {
    const quietHours = repeat(5, () =>
      makeQuietHours({
        compliant: false,
        disruptions_count: 1,
        duration_of_disruption_minutes: 45,
        disruption_type: "child_disturbance",
        children_affected_count: 1,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.concerns.some((c) => c.includes("45 minutes") && c.includes("prolonged disruptions"))).toBe(true);
  });

  it("staffPromptResponseRate < 50 concern", () => {
    const quietHours = repeat(10, () =>
      makeQuietHours({
        compliant: false,
        disruptions_count: 1,
        staff_responded_promptly: false,
        disruption_type: "child_disturbance",
        duration_of_disruption_minutes: 10,
        children_affected_count: 1,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("Staff responded promptly"))).toBe(true);
  });

  it("adaptationInPlaceRate < 50 concern", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ adaptation_in_place: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("sensory adaptations in place"))).toBe(true);
  });

  it("adaptationInPlaceRate 50-69 concern", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ adaptation_in_place: i < 6 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Sensory adaptation rate"))).toBe(true);
  });

  it("reviewedWithChildRate < 50 concern", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ reviewed_with_child: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("sensory adaptations reviewed"))).toBe(true);
  });

  it("avgEffectiveness < 2.5 concern", () => {
    const sensory = repeat(5, () =>
      makeSensory({ adaptation_in_place: true, effectiveness_rating: 2 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.concerns.some((c) => c.includes("2/5") && c.includes("effectiveness"))).toBe(true);
  });

  it("meetsStandardRate < 50 concern", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ meets_standard: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("sound insulation meets standards"))).toBe(true);
  });

  it("meetsStandardRate 50-69 concern", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ meets_standard: i < 6 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Sound insulation"))).toBe(true);
  });

  it("poorConditionRate > 30 concern", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ condition: i < 4 ? "poor" : "good" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("poor or failed condition"))).toBe(true);
  });

  it("poorConditionRate 16-30 concern", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ condition: i < 2 ? "poor" : "good" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("poor or failed condition"))).toBe(true);
  });

  it("significantImpact > 0 concern", () => {
    const insulation = [
      makeInsulation({ impact_on_children: "significant" }),
      makeInsulation({ impact_on_children: "none" }),
    ];
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("1 insulation area has significant impact"))).toBe(true);
  });

  it("significantImpact plural concern", () => {
    const insulation = [
      makeInsulation({ impact_on_children: "significant" }),
      makeInsulation({ impact_on_children: "significant" }),
      makeInsulation({ impact_on_children: "none" }),
    ];
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.concerns.some((c) => c.includes("2 insulation areas have significant impact"))).toBe(true);
  });

  it("uncomfortableRate > 30 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ comfort_level: i < 4 ? "uncomfortable" : "comfortable" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("uncomfortable"))).toBe(true);
  });

  it("uncomfortableRate 16-30 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ comfort_level: i < 2 ? "uncomfortable" : "comfortable" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("uncomfortable with noise"))).toBe(true);
  });

  it("sleepDisruptionRate > 40 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ sleep_disrupted_by_noise: i < 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("noise-disrupted sleep"))).toBe(true);
  });

  it("sleepDisruptionRate 21-40 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ sleep_disrupted_by_noise: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("noise-disrupted sleep"))).toBe(true);
  });

  it("feelsHeardRate < 50 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ feels_heard_about_noise: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("feel heard"))).toBe(true);
  });

  it("feelsHeardRate 50-69 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ feels_heard_about_noise: i < 6 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("feel heard"))).toBe(true);
  });

  it("staffResponsiveRate < 50 concern", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ staff_responsive_to_concerns: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("Staff responsiveness"))).toBe(true);
  });

  it("avgSatisfaction < 2.5 concern", () => {
    const comfort = repeat(5, () => makeComfort({ overall_satisfaction: 1 }));
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("1/5") && c.includes("dissatisfied"))).toBe(true);
  });

  it("avgSatisfaction 2.5-2.99 concern", () => {
    // Average 2.8: 4 records at 3, 1 record at 2 = 14/5=2.8
    const comfort = repeat(5, (i) =>
      makeComfort({ overall_satisfaction: i < 4 ? 3 : 2 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("2.8/5") && c.includes("below an acceptable level"))).toBe(true);
  });

  it("comfortSurveyCoverage < 50 concern", () => {
    const comfort = [makeComfort({ child_id: "child_1" })];
    const r = computeNoiseSoundManagement(baseInput({ total_children: 5, child_comfort_records: comfort }));
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("surveyed"))).toBe(true);
  });

  it("staffAwarenessRate < 40 concern", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 2, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    // staffAwareness = 2/10 = 20%
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("Staff awareness"))).toBe(true);
  });

  it("staffAwarenessRate 40-69 concern", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 5, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    // staffAwareness = 5/10 = 50%
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("Staff awareness"))).toBe(true);
  });

  it("no comfort records but children on placement concern", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        noise_monitoring_records: [makeMonitoring()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No child comfort surveys"))).toBe(true);
  });

  it("no quiet hours records concern", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        noise_monitoring_records: [makeMonitoring()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No quiet hours compliance records"))).toBe(true);
  });

  it("no monitoring records concern (when not allEmpty)", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        quiet_hours_records: [makeQuietHours()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No noise monitoring records"))).toBe(true);
  });
});

// ── 14. RECOMMENDATIONS ────────────────────────────────────────────────

describe("recommendations", () => {
  it("quiet hours < 50 → immediate recommendation", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 1 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 10 : 0,
        children_affected_count: i >= 3 ? 1 : 0,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("quiet hours management"))).toBe(true);
  });

  it("sleepDisruptionRate > 40 → immediate recommendation", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ sleep_disrupted_by_noise: i < 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("sleep disruption"))).toBe(true);
  });

  it("uncomfortableRate > 30 → immediate recommendation", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ comfort_level: i < 4 ? "very_uncomfortable" : "comfortable" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("noise discomfort"))).toBe(true);
  });

  it("poorConditionRate > 30 → immediate recommendation", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ condition: i < 4 ? "failed" : "good" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("sound insulation"))).toBe(true);
  });

  it("adaptationInPlaceRate < 50 → immediate recommendation", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ adaptation_in_place: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("sensory adaptations"))).toBe(true);
  });

  it("feelsHeardRate < 50 → immediate recommendation", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ feels_heard_about_noise: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("hearing children"))).toBe(true);
  });

  it("actionTakenRate < 50 → immediate recommendation", () => {
    const monitoring = repeat(10, () =>
      makeMonitoring({ acceptable_level: false, action_taken: false }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("act on all unacceptable"))).toBe(true);
  });

  it("staffAwarenessRate < 40 → immediate recommendation", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 2, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("noise awareness training"))).toBe(true);
  });

  it("no comfort records → immediate recommendation", () => {
    const r = computeNoiseSoundManagement(
      baseInput({ total_children: 3, noise_monitoring_records: [makeMonitoring()] }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("child comfort surveys"))).toBe(true);
  });

  it("no quiet hours records → immediate recommendation", () => {
    const r = computeNoiseSoundManagement(
      baseInput({ total_children: 3, noise_monitoring_records: [makeMonitoring()] }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("quiet hours compliance"))).toBe(true);
  });

  it("quiet hours 50-79 → soon recommendation", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 6,
        disruptions_count: i >= 6 ? 1 : 0,
        disruption_type: i >= 6 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 6 ? 10 : 0,
        children_affected_count: i >= 6 ? 1 : 0,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("quiet hours compliance towards 80%"))).toBe(true);
  });

  it("sleepDisruptionRate 21-40 → soon recommendation", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ sleep_disrupted_by_noise: i < 3 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("sleep disruption"))).toBe(true);
  });

  it("meetsStandardRate 50-69 → soon recommendation", () => {
    const insulation = repeat(10, (i) =>
      makeInsulation({ meets_standard: i < 6 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("sound insulation improvement"))).toBe(true);
  });

  it("maintenanceScheduledRate < 50 → soon recommendation", () => {
    const insulation = repeat(5, () =>
      makeInsulation({
        maintenance_needed: true,
        maintenance_scheduled: false,
      }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Schedule all outstanding"))).toBe(true);
  });

  it("adaptationInPlaceRate 50-69 → soon recommendation", () => {
    const sensory = repeat(10, (i) =>
      makeSensory({ adaptation_in_place: i < 6 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("outstanding sensory adaptations"))).toBe(true);
  });

  it("staffAwarenessRate 40-69 → soon recommendation", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ source_identified: i < 5, acceptable_level: true }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen staff noise awareness"))).toBe(true);
  });

  it("acceptableNoiseRate 40-69 → planned recommendation", () => {
    const monitoring = repeat(10, (i) =>
      makeMonitoring({ acceptable_level: i < 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("noise reduction plan"))).toBe(true);
  });

  it("meterMonitoringRate < 30 with > 3 records → planned recommendation", () => {
    const monitoring = repeat(5, () =>
      makeMonitoring({ monitoring_method: "observation" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("decibel meter"))).toBe(true);
  });

  it("comfortSurveyCoverage 50-79 → planned recommendation", () => {
    const comfort = repeat(3, (i) =>
      makeComfort({ child_id: `child_${i + 1}` }),
    );
    const r = computeNoiseSoundManagement(baseInput({ total_children: 5, child_comfort_records: comfort }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Extend noise comfort surveys"))).toBe(true);
  });

  it("highSensitivityRate > 30 with no sensory records → planned recommendation", () => {
    const comfort = repeat(10, (i) =>
      makeComfort({ noise_sensitivity: i < 4 ? "very_high" : "moderate" }),
    );
    const r = computeNoiseSoundManagement(
      baseInput({ child_comfort_records: comfort, sensory_environment_records: [] }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("sensory plans"))).toBe(true);
  });

  it("nightMonitoringRate < 10 with > 3 records → planned recommendation", () => {
    const monitoring = repeat(5, () =>
      makeMonitoring({ time_of_day: "morning" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("night-time noise monitoring"))).toBe(true);
  });

  it("recommendation ranks are sequential", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 1 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 10 : 0,
        children_affected_count: i >= 3 ? 1 : 0,
      }),
    );
    const comfort = repeat(10, (i) =>
      makeComfort({
        comfort_level: i < 5 ? "very_uncomfortable" : "comfortable",
        feels_heard_about_noise: i < 3,
        sleep_disrupted_by_noise: i < 5,
        staff_responsive_to_concerns: i < 2,
        overall_satisfaction: 1,
      }),
    );
    const r = computeNoiseSoundManagement(
      baseInput({ quiet_hours_records: quietHours, child_comfort_records: comfort }),
    );
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        noise_monitoring_records: [makeMonitoring()],
      }),
    );
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ── 15. INSIGHTS ───────────────────────────────────────────────────────

describe("insights", () => {
  describe("critical insights", () => {
    it("quiet hours < 50 → critical insight", () => {
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 4,
          disruptions_count: i >= 4 ? 1 : 0,
          disruption_type: i >= 4 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 4 ? 10 : 0,
          children_affected_count: i >= 4 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("40%") && i.text.includes("quiet hours"))).toBe(true);
    });

    it("sleepDisruptionRate > 40 → critical insight", () => {
      const comfort = repeat(10, (i) =>
        makeComfort({ sleep_disrupted_by_noise: i < 5 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("50%") && i.text.includes("sleep"))).toBe(true);
    });

    it("childComfortRate < 40 → critical insight", () => {
      const comfort = repeat(5, () =>
        makeComfort({
          comfort_level: "very_uncomfortable",
          feels_heard_about_noise: false,
          staff_responsive_to_concerns: false,
          overall_satisfaction: 1,
        }),
      );
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Child comfort composite"))).toBe(true);
    });

    it("poorConditionRate > 30 → critical insight", () => {
      const insulation = repeat(10, (i) =>
        makeInsulation({ condition: i < 4 ? "failed" : "good" }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("40%") && i.text.includes("poor or failed"))).toBe(true);
    });

    it("no comfort records with children → critical insight", () => {
      const r = computeNoiseSoundManagement(
        baseInput({ total_children: 3, noise_monitoring_records: [makeMonitoring()] }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No child comfort records"))).toBe(true);
    });

    it("adaptationInPlaceRate < 50 → critical insight", () => {
      const sensory = repeat(10, (i) =>
        makeSensory({ adaptation_in_place: i < 3 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("30%") && i.text.includes("sensory adaptations"))).toBe(true);
    });
  });

  describe("warning insights", () => {
    it("quiet hours 50-79 → warning insight", () => {
      const quietHours = repeat(10, (i) =>
        makeQuietHours({
          compliant: i < 7,
          disruptions_count: i >= 7 ? 1 : 0,
          disruption_type: i >= 7 ? "child_disturbance" : "none",
          duration_of_disruption_minutes: i >= 7 ? 10 : 0,
          children_affected_count: i >= 7 ? 1 : 0,
        }),
      );
      const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("70%") && i.text.includes("Quiet hours compliance"))).toBe(true);
    });

    it("acceptableNoiseRate 40-69 → warning insight", () => {
      const monitoring = repeat(10, (i) =>
        makeMonitoring({ acceptable_level: i < 5 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Acceptable noise levels"))).toBe(true);
    });

    it("sleepDisruptionRate 21-40 → warning insight", () => {
      const comfort = repeat(10, (i) =>
        makeComfort({ sleep_disrupted_by_noise: i < 3 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("30%") && i.text.includes("sleep"))).toBe(true);
    });

    it("staffAwarenessRate 40-69 → warning insight", () => {
      const monitoring = repeat(10, (i) =>
        makeMonitoring({ source_identified: i < 5, acceptable_level: true }),
      );
      const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Staff awareness"))).toBe(true);
    });

    it("meetsStandardRate 50-69 → warning insight", () => {
      const insulation = repeat(10, (i) =>
        makeInsulation({ meets_standard: i < 6 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Sound insulation"))).toBe(true);
    });

    it("avgSatisfaction 2.5-3.49 → warning insight", () => {
      const comfort = repeat(10, () => makeComfort({ overall_satisfaction: 3 }));
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("3/5") && i.text.includes("mediocre"))).toBe(true);
    });

    it("avgEffectiveness 2.5-3.49 → warning insight", () => {
      const sensory = repeat(5, () =>
        makeSensory({ adaptation_in_place: true, effectiveness_rating: 3 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("3/5") && i.text.includes("not working optimally"))).toBe(true);
    });

    it("limited adaptation types → warning insight", () => {
      const sensory = repeat(5, () =>
        makeSensory({ adaptation_type: "quiet_space" }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1 type"))).toBe(true);
    });

    it("dominant unacceptable noise source → warning insight", () => {
      const monitoring = repeat(5, () =>
        makeMonitoring({
          acceptable_level: false,
          source_type: "equipment",
          action_taken: false,
        }),
      );
      const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("equipment") && i.text.includes("100%"))).toBe(true);
    });
  });

  describe("positive insights", () => {
    it("outstanding rating → positive insight", () => {
      const monitoring = repeat(5, (i) =>
        makeMonitoring({
          acceptable_level: true,
          source_identified: true,
          location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
        }),
      );
      const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
      const sensory = repeat(3, (i) =>
        makeSensory({ child_id: `child_${i + 1}`, adaptation_in_place: true, child_feedback_positive: true, reviewed_with_child: true, linked_to_care_plan: true }),
      );
      const insulation = repeat(5, () => makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }));
      const comfort = repeat(3, (i) =>
        makeComfort({ child_id: `child_${i + 1}`, comfort_level: "very_comfortable", feels_heard_about_noise: true, staff_responsive_to_concerns: true, overall_satisfaction: 5 }),
      );
      const r = computeNoiseSoundManagement(baseInput({
        total_children: 3,
        noise_monitoring_records: monitoring,
        quiet_hours_records: quietHours,
        sensory_environment_records: sensory,
        sound_insulation_records: insulation,
        child_comfort_records: comfort,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("quiet hours >=95 + zero disruption >=80 → positive insight", () => {
      const quietHours = repeat(20, () =>
        makeQuietHours({ compliant: true, disruptions_count: 0 }),
      );
      const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("quiet hours compliance"))).toBe(true);
    });

    it("comfortable >=90 + feelsHeard >=90 → positive insight", () => {
      const comfort = repeat(10, () =>
        makeComfort({ comfort_level: "very_comfortable", feels_heard_about_noise: true }),
      );
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("comfortable"))).toBe(true);
    });

    it("sleepDisruptionRate === 0 → positive insight", () => {
      const comfort = repeat(5, () =>
        makeComfort({ sleep_disrupted_by_noise: false }),
      );
      const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No children report noise-related sleep disruption"))).toBe(true);
    });

    it("adaptation >=90 + positive feedback >=90 → positive insight", () => {
      const sensory = repeat(10, () =>
        makeSensory({ adaptation_in_place: true, child_feedback_positive: true }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("sensory adaptations in place") && i.text.includes("positive child feedback"))).toBe(true);
    });

    it("meetsStandard >=90 + good condition >=90 → positive insight", () => {
      const insulation = repeat(10, () =>
        makeInsulation({ meets_standard: true, condition: "excellent" }),
      );
      const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("sound insulation"))).toBe(true);
    });

    it("staffAwarenessRate >=90 → positive insight", () => {
      const monitoring = repeat(10, () =>
        makeMonitoring({ source_identified: true, acceptable_level: true }),
      );
      const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("Staff awareness"))).toBe(true);
    });

    it("100% comfort survey coverage → positive insight", () => {
      const comfort = repeat(3, (i) =>
        makeComfort({ child_id: `child_${i + 1}` }),
      );
      const r = computeNoiseSoundManagement(baseInput({ total_children: 3, child_comfort_records: comfort }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has been surveyed"))).toBe(true);
    });
  });
});

// ── 16. HEADLINES ──────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    const monitoring = repeat(5, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
      }),
    );
    const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
    const sensory = repeat(3, (i) =>
      makeSensory({ child_id: `child_${i + 1}`, adaptation_in_place: true, child_feedback_positive: true, reviewed_with_child: true, linked_to_care_plan: true }),
    );
    const insulation = repeat(5, () => makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }));
    const comfort = repeat(3, (i) =>
      makeComfort({ child_id: `child_${i + 1}`, comfort_level: "very_comfortable", feels_heard_about_noise: true, staff_responsive_to_concerns: true, overall_satisfaction: 5 }),
    );
    const r = computeNoiseSoundManagement(baseInput({
      total_children: 3,
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sensory_environment_records: sensory,
      sound_insulation_records: insulation,
      child_comfort_records: comfort,
    }));
    expect(r.headline).toContain("Outstanding noise and sound management");
  });

  it("good headline contains strength and concern counts", () => {
    const monitoring = repeat(5, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
      }),
    );
    const quietHours = repeat(20, () => makeQuietHours({ compliant: true }));
    const insulation = repeat(5, () => makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }));
    const r = computeNoiseSoundManagement(baseInput({
      noise_monitoring_records: monitoring,
      quiet_hours_records: quietHours,
      sound_insulation_records: insulation,
    }));
    expect(r.noise_rating).toBe("good");
    expect(r.headline).toContain("Good noise and sound management");
    // Should mention strengths count
    expect(r.headline).toMatch(/\d+ strength/);
  });

  it("adequate headline mentions concern count", () => {
    const r = computeNoiseSoundManagement(
      baseInput({ noise_monitoring_records: [makeMonitoring()] }),
    );
    expect(r.noise_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate noise and sound management");
    expect(r.headline).toMatch(/\d+ concern/);
  });

  it("inadequate headline mentions significant concerns", () => {
    const quietHours = repeat(10, (i) =>
      makeQuietHours({
        compliant: i < 3,
        disruptions_count: i >= 3 ? 1 : 0,
        disruption_type: i >= 3 ? "child_disturbance" : "none",
        duration_of_disruption_minutes: i >= 3 ? 10 : 0,
        children_affected_count: i >= 3 ? 1 : 0,
        staff_responded_promptly: false,
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: "very_uncomfortable",
        feels_heard_about_noise: false,
        staff_responsive_to_concerns: false,
        overall_satisfaction: 1,
      }),
    );
    const r = computeNoiseSoundManagement(
      baseInput({ total_children: 3, quiet_hours_records: quietHours, child_comfort_records: comfort }),
    );
    expect(r.noise_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("significant concern");
  });
});

// ── 17. EDGE CASES ─────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single record in each category", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 1,
        noise_monitoring_records: [makeMonitoring()],
        quiet_hours_records: [makeQuietHours()],
        sensory_environment_records: [makeSensory()],
        sound_insulation_records: [makeInsulation()],
        child_comfort_records: [makeComfort({ child_id: "child_1" })],
      }),
    );
    expect(r.total_monitoring_records).toBe(1);
    expect(r.total_quiet_hours_records).toBe(1);
    expect(r.total_sensory_environment_records).toBe(1);
    expect(r.total_insulation_records).toBe(1);
    expect(r.total_comfort_records).toBe(1);
    expect(r.noise_rating).not.toBe("insufficient_data");
  });

  it("score is clamped at 0 (cannot go negative)", () => {
    // Theoretically cannot go below 0 because clamp(v, 0, 100)
    // base=52, max penalties = -6-5-4-3 = -18 → 34, still positive
    // We'd need bonuses=0 + all penalties to go to 34, but can't go negative
    // Just verify clamp works conceptually
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        quiet_hours_records: repeat(10, (i) =>
          makeQuietHours({
            compliant: i < 3,
            disruptions_count: i >= 3 ? 1 : 0,
            disruption_type: i >= 3 ? "child_disturbance" : "none",
            duration_of_disruption_minutes: i >= 3 ? 10 : 0,
            children_affected_count: i >= 3 ? 1 : 0,
          }),
        ),
        child_comfort_records: repeat(5, (i) =>
          makeComfort({
            child_id: `child_${(i % 3) + 1}`,
            comfort_level: "very_uncomfortable",
            feels_heard_about_noise: false,
            staff_responsive_to_concerns: false,
            overall_satisfaction: 1,
            sleep_disrupted_by_noise: true,
          }),
        ),
        sound_insulation_records: repeat(5, () =>
          makeInsulation({
            condition: "failed",
            meets_standard: false,
            impact_on_children: "significant",
          }),
        ),
      }),
    );
    expect(r.noise_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped at 100", () => {
    // base=52 + max bonuses=28 = 80, so can't exceed 100 naturally,
    // but let's verify it's at most 100
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        noise_monitoring_records: repeat(5, (i) =>
          makeMonitoring({
            acceptable_level: true,
            source_identified: true,
            location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
          }),
        ),
        quiet_hours_records: repeat(20, () => makeQuietHours({ compliant: true })),
        sensory_environment_records: repeat(3, (i) =>
          makeSensory({ child_id: `child_${i + 1}`, adaptation_in_place: true, child_feedback_positive: true, reviewed_with_child: true, linked_to_care_plan: true }),
        ),
        sound_insulation_records: repeat(5, () =>
          makeInsulation({ meets_standard: true, condition: "excellent", impact_on_children: "none" }),
        ),
        child_comfort_records: repeat(3, (i) =>
          makeComfort({ child_id: `child_${i + 1}`, comfort_level: "very_comfortable", feels_heard_about_noise: true, staff_responsive_to_concerns: true, overall_satisfaction: 5 }),
        ),
      }),
    );
    expect(r.noise_score).toBeLessThanOrEqual(100);
  });

  it("only monitoring records, rest empty", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        noise_monitoring_records: [makeMonitoring()],
      }),
    );
    expect(r.noise_rating).toBe("adequate"); // base 52
    expect(r.total_monitoring_records).toBe(1);
    expect(r.total_quiet_hours_records).toBe(0);
  });

  it("only quiet hours records, rest empty", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        quiet_hours_records: [makeQuietHours()],
      }),
    );
    expect(r.noise_rating).toBe("adequate");
    expect(r.total_quiet_hours_records).toBe(1);
  });

  it("only sensory records, rest empty", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        sensory_environment_records: [makeSensory()],
      }),
    );
    expect(r.total_sensory_environment_records).toBe(1);
    expect(r.noise_rating).toBe("adequate");
  });

  it("only insulation records, rest empty", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        sound_insulation_records: [makeInsulation()],
      }),
    );
    expect(r.total_insulation_records).toBe(1);
    expect(r.noise_rating).toBe("adequate");
  });

  it("only comfort records, rest empty", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        child_comfort_records: [makeComfort()],
      }),
    );
    expect(r.total_comfort_records).toBe(1);
  });

  it("all children neutral — no strengths for comfortable or uncomfortable", () => {
    const comfort = repeat(5, () =>
      makeComfort({ comfort_level: "neutral" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ child_comfort_records: comfort }));
    expect(r.strengths.every((s) => !s.includes("comfortable or very comfortable"))).toBe(true);
    expect(r.concerns.every((c) => !c.includes("uncomfortable"))).toBe(true);
  });

  it("total_children = 0 but records exist — no insufficient_data", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 0,
        noise_monitoring_records: [makeMonitoring()],
      }),
    );
    expect(r.noise_rating).not.toBe("insufficient_data");
  });

  it("large dataset (100 records each) does not crash", () => {
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 10,
        noise_monitoring_records: repeat(100, () => makeMonitoring()),
        quiet_hours_records: repeat(100, () => makeQuietHours()),
        sensory_environment_records: repeat(100, (i) => makeSensory({ child_id: `child_${(i % 10) + 1}` })),
        sound_insulation_records: repeat(100, () => makeInsulation()),
        child_comfort_records: repeat(100, (i) => makeComfort({ child_id: `child_${(i % 10) + 1}` })),
      }),
    );
    expect(r.noise_rating).toBeDefined();
    expect(r.noise_score).toBeGreaterThanOrEqual(0);
    expect(r.noise_score).toBeLessThanOrEqual(100);
  });

  it("meterMonitoringRate threshold: exactly 3 records does NOT trigger planned recommendation", () => {
    const monitoring = repeat(3, () =>
      makeMonitoring({ monitoring_method: "observation" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.every((rec) => !rec.recommendation.includes("decibel meter"))).toBe(true);
  });

  it("meterMonitoringRate threshold: 4 records DOES trigger planned recommendation", () => {
    const monitoring = repeat(4, () =>
      makeMonitoring({ monitoring_method: "observation" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("decibel meter"))).toBe(true);
  });

  it("nightMonitoringRate threshold: exactly 3 records does NOT trigger recommendation", () => {
    const monitoring = repeat(3, () =>
      makeMonitoring({ time_of_day: "morning" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.recommendations.every((rec) => !rec.recommendation.includes("night-time noise"))).toBe(true);
  });

  it("unacceptable noise source insight needs >3 records", () => {
    const monitoring = repeat(3, () =>
      makeMonitoring({ acceptable_level: false, source_type: "equipment" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ noise_monitoring_records: monitoring }));
    expect(r.insights.every((i) => !i.text.includes("dominant noise source"))).toBe(true);
  });

  it("adaptation type diversity insight needs > 3 records", () => {
    const sensory = repeat(3, () =>
      makeSensory({ adaptation_type: "quiet_space" }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.insights.every((i) => !i.text.includes("limited to only"))).toBe(true);
  });

  it("mixed comfort levels: some comfortable, some very_uncomfortable", () => {
    const comfort = [
      makeComfort({ child_id: "child_1", comfort_level: "very_comfortable" }),
      makeComfort({ child_id: "child_2", comfort_level: "very_uncomfortable" }),
    ];
    const r = computeNoiseSoundManagement(baseInput({ total_children: 2, child_comfort_records: comfort }));
    // 50% comfortable, 50% uncomfortable
    expect(r.noise_score).toBeDefined();
  });

  it("quiet hours: no disruptions → staffPromptResponseRate edge case (pct 0/0 = 0)", () => {
    const quietHours = repeat(5, () =>
      makeQuietHours({ compliant: true, disruptions_count: 0 }),
    );
    const r = computeNoiseSoundManagement(baseInput({ quiet_hours_records: quietHours }));
    // staffPromptResponseRate = pct(0, 0) = 0 → but no concern fires because disruptedQuietHours.length = 0
    expect(r.concerns.every((c) => !c.includes("Staff responded promptly"))).toBe(true);
  });

  it("sensory: adaptationUsageRate when no adaptations in place (pct 0/0 = 0)", () => {
    const sensory = repeat(5, () =>
      makeSensory({ adaptation_in_place: false }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sensory_environment_records: sensory }));
    expect(r.noise_rating).toBeDefined(); // no crash
  });

  it("insulation: no maintenance needed → maintenanceScheduledRate = 0 (pct 0/0)", () => {
    const insulation = repeat(5, () =>
      makeInsulation({ maintenance_needed: false }),
    );
    const r = computeNoiseSoundManagement(baseInput({ sound_insulation_records: insulation }));
    // No crash, no maintenance recommendation
    expect(r.recommendations.every((rec) => !rec.recommendation.includes("Schedule all outstanding"))).toBe(true);
  });
});

// ── 18. MAX BONUSES CALCULATION ────────────────────────────────────────

describe("max bonuses calculation", () => {
  it("base=52, max bonuses = 4+5+4+3+4+3+3+2 = 28, max score = 80", () => {
    const monitoring = repeat(5, (i) =>
      makeMonitoring({
        acceptable_level: true,
        source_identified: true,
        location: (["bedroom", "communal_area", "kitchen", "bathroom", "garden"] as const)[i],
      }),
    );
    const quietHours = repeat(20, () =>
      makeQuietHours({ compliant: true, child_feedback_obtained: true }),
    );
    const sensory = repeat(3, (i) =>
      makeSensory({
        child_id: `child_${i + 1}`,
        adaptation_in_place: true,
        child_feedback_positive: true,
        reviewed_with_child: true,
        linked_to_care_plan: true,
      }),
    );
    const insulation = repeat(5, () =>
      makeInsulation({
        meets_standard: true,
        condition: "excellent",
        impact_on_children: "none",
      }),
    );
    const comfort = repeat(3, (i) =>
      makeComfort({
        child_id: `child_${i + 1}`,
        comfort_level: "very_comfortable",
        feels_heard_about_noise: true,
        staff_responsive_to_concerns: true,
        overall_satisfaction: 5,
        sleep_disrupted_by_noise: false,
      }),
    );
    const r = computeNoiseSoundManagement(
      baseInput({
        total_children: 3,
        noise_monitoring_records: monitoring,
        quiet_hours_records: quietHours,
        sensory_environment_records: sensory,
        sound_insulation_records: insulation,
        child_comfort_records: comfort,
      }),
    );
    expect(r.noise_score).toBe(80);
  });
});
