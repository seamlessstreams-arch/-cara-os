import { describe, it, expect } from "vitest";
import {
  suggestFromAnalysis,
  readReflection,
  ADULT_REFLECTION_QUESTIONS,
  type AdultRegulationReflection,
} from "../regulation-profile-engine";
import type { EmotionalSafetyAnalysis } from "../emotional-safety-engine";

// The profile's contract (§5.7):
//   - CARA suggests only fields the analysis can EVIDENCE; it never invents a
//     baseline or the child's own words;
//   - every suggestion carries its evidence (whyShown);
//   - the adult reflection is a support/learning mirror, never a staff score.

function analysis(over: Partial<EmotionalSafetyAnalysis> = {}): EmotionalSafetyAnalysis {
  return {
    childId: "yp_test",
    childName: "Test",
    generatedAt: "2026-07-16T00:00:00Z",
    status: "watch",
    statusReason: "",
    triggers: [],
    whatHelps: [],
    escalation: {
      concernCount: 0, highIntensityCount: 0, incidentCount: 0, recent30d: 0, prior30d: 0,
      trend: "steady", byTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 }, peakTime: null,
    },
    recovery: { recoveryCount: 0, moodImproved: 0, moodMeasured: 0 },
    insights: [],
    ...over,
  };
}

describe("suggestFromAnalysis — evidence-bounded drafts", () => {
  it("suggests escalation signs from recorded triggers, with evidence", () => {
    const s = suggestFromAnalysis(analysis({
      triggers: [
        { label: "unexpected change", count: 4, fromPace: true },
        { label: "loud communal areas", count: 2, fromPace: false },
      ],
    }));
    const d = s.find((x) => x.field === "escalation_signs");
    expect(d).toBeTruthy();
    expect(d!.suggestion).toContain("unexpected change");
    expect(d!.whyShown).toMatch(/6 recorded antecedent/i);
    expect(d!.whyShown).toMatch(/PACE profile/i);
  });

  it("suggests helpful approaches only from strategies that turned escalation around", () => {
    const s = suggestFromAnalysis(analysis({
      whatHelps: [{ label: "quiet time with key worker", count: 3, fromPace: false }],
    }));
    const d = s.find((x) => x.field === "helpful_approaches");
    expect(d!.whyShown).toMatch(/never from routine good days/i);
  });

  it("suggests environment needs from the peak escalation window", () => {
    const s = suggestFromAnalysis(analysis({
      escalation: { ...analysis().escalation, peakTime: "evening" },
    }));
    const d = s.find((x) => x.field === "environment_needs");
    expect(d!.suggestion).toContain("evening");
  });

  it("suggests NOTHING for baseline or child's own words — those cannot be evidenced from incidents", () => {
    const s = suggestFromAnalysis(analysis({
      triggers: [{ label: "x", count: 1, fromPace: false }],
      whatHelps: [{ label: "y", count: 1, fromPace: false }],
      escalation: { ...analysis().escalation, peakTime: "morning" },
    }));
    const fields = s.map((x) => x.field);
    expect(fields).not.toContain("baseline");
    expect(fields).not.toContain("child_own_words");
  });

  it("returns no suggestions when the analysis has nothing to stand on", () => {
    expect(suggestFromAnalysis(analysis())).toHaveLength(0);
  });
});

describe("readReflection — a mirror, not a score", () => {
  function reflection(over: Partial<AdultRegulationReflection> = {}): AdultRegulationReflection {
    return {
      id: "arr_1", incident_id: "inc_1", child_id: "yp_test", staff_id: "staff_a",
      adult_calm_enough: "yes",
      adult_behaviour_effect: "reduced_pressure",
      language_proportionate: "yes",
      processing_time_given: "yes",
      sensory_needs_considered: "yes",
      co_regulation_attempted: "yes",
      what_worked: "", what_i_would_change: "", support_i_need: "",
      created_at: "2026-07-16T00:00:00Z", created_by: "staff_a",
      ...over,
    };
  }

  it("affirms calm, co-regulating practice", () => {
    const r = readReflection(reflection());
    expect(r.tone).toBe("affirming");
    expect(r.pressureIndicators).toBe(0);
    expect(r.summary).toMatch(/practice to keep/i);
  });

  it("reads a couple of honest wobbles as ordinary reflection", () => {
    const r = readReflection(reflection({ adult_calm_enough: "partly", processing_time_given: "no" }));
    expect(r.tone).toBe("reflective");
    expect(r.pressureIndicators).toBe(2);
  });

  it("frames many pressure moments as a SUPPORT signal, never a performance concern", () => {
    const r = readReflection(reflection({
      adult_calm_enough: "no",
      adult_behaviour_effect: "increased_pressure",
      language_proportionate: "no",
      processing_time_given: "no",
      sensory_needs_considered: "no",
      co_regulation_attempted: "no",
    }));
    expect(r.tone).toBe("support");
    expect(r.summary).toMatch(/not a performance concern/i);
  });

  it("counts answered questions, treating 'unsure' as unanswered", () => {
    const r = readReflection(reflection({ adult_calm_enough: "unsure", language_proportionate: "unsure" }));
    expect(r.answered).toBe(4);
  });

  it("exposes exactly the six practice questions", () => {
    expect(ADULT_REFLECTION_QUESTIONS).toHaveLength(6);
  });
});
