import { describe, it, expect } from "vitest";
import { computeHomePlacementJourney, type HomePlacementJourneyInput, type PreAdmissionChecklistInput, type WarmWelcomePackInput, type WelcomeTourInput, type ReturnInterviewInput, type PlacementObjectiveInput, type PlacementAnniversaryInput } from "../home-placement-journey-intelligence-engine";

const TODAY = "2026-05-27";
function daysAgo(n: number): string { const d = new Date("2026-05-27"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function futureDate(n: number): string { const d = new Date("2026-05-27"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function makePreAdmission(ov: Partial<PreAdmissionChecklistInput> = {}): PreAdmissionChecklistInput {
  return { id: `pa_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", completed_date: daysAgo(30), risk_assessment_included: true, all_sections_complete: true, placing_authority_consulted: true, child_visited_home: true, ...ov };
}
function makeWelcomePack(ov: Partial<WarmWelcomePackInput> = {}): WarmWelcomePackInput {
  return { id: `wp_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", provided_date: daysAgo(25), personalised: true, child_friendly: true, photos_included: true, ...ov };
}
function makeWelcomeTour(ov: Partial<WelcomeTourInput> = {}): WelcomeTourInput {
  return { id: `wt_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", tour_date: daysAgo(25), completed: true, child_feedback_captured: true, buddy_assigned: true, ...ov };
}
function makeReturnInterview(ov: Partial<ReturnInterviewInput> = {}): ReturnInterviewInput {
  return { id: `ri_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", date: daysAgo(10), conducted_within_24h: true, child_views_recorded: true, actions_identified: 3, actions_completed: 3, ...ov };
}
function makeObjective(ov: Partial<PlacementObjectiveInput> = {}): PlacementObjectiveInput {
  return { id: `obj_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", set_date: daysAgo(60), progress_status: "on_track", review_date: futureDate(30), child_involved: true, ...ov };
}
function makeAnniversary(ov: Partial<PlacementAnniversaryInput> = {}): PlacementAnniversaryInput {
  return { id: `ann_${Math.random().toString(36).slice(2, 8)}`, child_id: "c1", anniversary_date: daysAgo(10), celebrated: true, child_voice_captured: true, memory_box_updated: true, ...ov };
}

// baseInput → 80 outstanding
// 52 + 5(mod1) + 4(mod2) + 3(mod3) + 4(mod4) + 3(mod5) + 3(mod6) + 3(mod7) + 3(mod8) = 80
function baseInput(ov: Partial<HomePlacementJourneyInput> = {}): HomePlacementJourneyInput {
  return {
    today: TODAY,
    pre_admission_checklists: Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, child_id: `c${i + 1}` })),
    warm_welcome_packs: Array.from({ length: 5 }, (_, i) => makeWelcomePack({ id: `wp${i}`, child_id: `c${i + 1}` })),
    welcome_tours: Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, child_id: `c${i + 1}` })),
    return_interviews: Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, child_id: `c${i + 1}` })),
    placement_objectives: Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, child_id: `c${i + 1}` })),
    placement_anniversaries: Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, child_id: `c${i + 1}` })),
    total_children: 5,
    ...ov,
  };
}

describe("computeHomePlacementJourney", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data when no data", () => {
      const r = computeHomePlacementJourney({ today: TODAY, pre_admission_checklists: [], warm_welcome_packs: [], welcome_tours: [], return_interviews: [], placement_objectives: [], placement_anniversaries: [], total_children: 0 });
      expect(r.placement_journey_rating).toBe("insufficient_data");
      expect(r.placement_journey_score).toBe(0);
    });
    it("returns empty narrative", () => {
      const r = computeHomePlacementJourney({ today: TODAY, pre_admission_checklists: [], warm_welcome_packs: [], welcome_tours: [], return_interviews: [], placement_objectives: [], placement_anniversaries: [], total_children: 0 });
      expect(r.strengths).toEqual([]);
    });
    it("NOT insufficient_data with children", () => {
      const r = computeHomePlacementJourney({ today: TODAY, pre_admission_checklists: [], warm_welcome_packs: [], welcome_tours: [], return_interviews: [], placement_objectives: [], placement_anniversaries: [], total_children: 3 });
      expect(r.placement_journey_rating).not.toBe("insufficient_data");
    });
  });

  describe("base score and outstanding", () => {
    it("baseInput scores 80 — outstanding", () => {
      const r = computeHomePlacementJourney(baseInput());
      expect(r.placement_journey_score).toBe(80);
      expect(r.placement_journey_rating).toBe("outstanding");
    });
    it("headline reflects outstanding", () => {
      const r = computeHomePlacementJourney(baseInput());
      expect(r.headline).toContain("outstanding");
    });
  });

  describe("rating thresholds", () => {
    it("score >= 80 is outstanding", () => {
      const r = computeHomePlacementJourney(baseInput());
      expect(r.placement_journey_rating).toBe("outstanding");
    });

    it("score 65-79 is good", () => {
      // Remove pre-admission (mod1: -2) and welcome packs (mod2: -2) → loses ~7 pts
      // mod7 voice still has tours, interviews, objectives, anniversaries → still +3
      // mod8 doc loses pre-admission source but still has return interviews → still +3
      // 52 -2 -2 +3 +4 +3 +3 +3 +3 = 67
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: [], warm_welcome_packs: [] }));
      expect(r.placement_journey_score).toBeGreaterThanOrEqual(65);
      expect(r.placement_journey_score).toBeLessThan(80);
      expect(r.placement_journey_rating).toBe("good");
    });

    it("score 45-64 is adequate", () => {
      // Remove pre-admission, welcome packs, tours, objectives → keep only return interviews + anniversaries
      // 52 -2(mod1) -2(mod2) -1(mod3) +4(mod4) -1(mod5) +3(mod6) +2(mod7: ri+ann avg=100→+3, wait voices=[riViews100, annVoice100]→avg=100→+3) +3(mod8: riActComp=100→+3)
      // Hmm that's 52-2-2-1+4-1+3+3+3 = 59
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: [], warm_welcome_packs: [], welcome_tours: [], placement_objectives: [] }));
      expect(r.placement_journey_score).toBeGreaterThanOrEqual(45);
      expect(r.placement_journey_score).toBeLessThan(65);
      expect(r.placement_journey_rating).toBe("adequate");
    });

    it("score < 45 is inadequate", () => {
      // All degraded
      const r = computeHomePlacementJourney({
        today: TODAY,
        pre_admission_checklists: Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, all_sections_complete: false, risk_assessment_included: false, child_visited_home: false })),
        warm_welcome_packs: Array.from({ length: 2 }, (_, i) => makeWelcomePack({ id: `wp${i}`, child_id: `c${i + 1}`, personalised: false })),
        welcome_tours: Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, completed: false, child_feedback_captured: false, buddy_assigned: false })),
        return_interviews: Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, conducted_within_24h: false, child_views_recorded: false, actions_identified: 5, actions_completed: 0 })),
        placement_objectives: Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, progress_status: "behind", review_date: daysAgo(30), child_involved: false })),
        placement_anniversaries: Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, celebrated: false, child_voice_captured: false, memory_box_updated: false })),
        total_children: 5,
      });
      expect(r.placement_journey_score).toBeLessThan(45);
      expect(r.placement_journey_rating).toBe("inadequate");
    });
  });

  describe("Mod 1: Pre-admission", () => {
    it("penalises incomplete checklists", () => {
      const pacs = Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, all_sections_complete: false }));
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: pacs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises missing risk assessments", () => {
      const pacs = Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, risk_assessment_included: false }));
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: pacs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises no checklists with children", () => {
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: [] }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 2: Welcome packs", () => {
    it("penalises low coverage", () => {
      const packs = [makeWelcomePack({ id: "wp1", child_id: "c1" })];
      const r = computeHomePlacementJourney(baseInput({ warm_welcome_packs: packs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises non-personalised packs", () => {
      const packs = Array.from({ length: 5 }, (_, i) => makeWelcomePack({ id: `wp${i}`, child_id: `c${i + 1}`, personalised: false }));
      const r = computeHomePlacementJourney(baseInput({ warm_welcome_packs: packs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 3: Welcome tours", () => {
    it("penalises incomplete tours", () => {
      const tours = Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, completed: false }));
      const r = computeHomePlacementJourney(baseInput({ welcome_tours: tours }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises no feedback captured", () => {
      const tours = Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, child_feedback_captured: false }));
      const r = computeHomePlacementJourney(baseInput({ welcome_tours: tours }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 4: Return interviews", () => {
    it("penalises late interviews", () => {
      const ris = Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, conducted_within_24h: false }));
      const r = computeHomePlacementJourney(baseInput({ return_interviews: ris }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises no child views", () => {
      const ris = Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, child_views_recorded: false }));
      const r = computeHomePlacementJourney(baseInput({ return_interviews: ris }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 5: Objectives", () => {
    it("penalises objectives behind", () => {
      const objs = Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, progress_status: "behind" }));
      const r = computeHomePlacementJourney(baseInput({ placement_objectives: objs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises overdue reviews", () => {
      const objs = Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, review_date: daysAgo(10) }));
      const r = computeHomePlacementJourney(baseInput({ placement_objectives: objs }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 6: Anniversaries", () => {
    it("penalises uncelebrated", () => {
      const anns = Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, celebrated: false }));
      const r = computeHomePlacementJourney(baseInput({ placement_anniversaries: anns }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
    it("penalises no child voice", () => {
      const anns = Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, child_voice_captured: false }));
      const r = computeHomePlacementJourney(baseInput({ placement_anniversaries: anns }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Mod 7: Child voice", () => {
    it("penalises missing voice across all domains", () => {
      const r = computeHomePlacementJourney(baseInput({
        welcome_tours: Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, child_feedback_captured: false })),
        return_interviews: Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, child_views_recorded: false })),
        placement_objectives: Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, child_involved: false })),
        placement_anniversaries: Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, child_voice_captured: false })),
      }));
      expect(r.placement_journey_score).toBeLessThan(80);
    });
  });

  describe("Summary computations", () => {
    it("computes pre-admission complete rate", () => {
      const pacs = [makePreAdmission({ id: "pa1", all_sections_complete: true }), makePreAdmission({ id: "pa2", all_sections_complete: false })];
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: pacs }));
      expect(r.pre_admission.all_complete_rate).toBe(50);
    });
    it("computes welcome pack coverage", () => {
      const packs = [makeWelcomePack({ id: "wp1", child_id: "c1" }), makeWelcomePack({ id: "wp2", child_id: "c2" }), makeWelcomePack({ id: "wp3", child_id: "c3" })];
      const r = computeHomePlacementJourney(baseInput({ warm_welcome_packs: packs }));
      expect(r.welcome_packs.child_coverage).toBe(60);
    });
    it("computes return interview action completion", () => {
      const ris = [makeReturnInterview({ id: "ri1", actions_identified: 10, actions_completed: 7 }), makeReturnInterview({ id: "ri2", actions_identified: 10, actions_completed: 3 })];
      const r = computeHomePlacementJourney(baseInput({ return_interviews: ris }));
      expect(r.return_interviews.action_completion_rate).toBe(50);
    });
    it("computes objective overdue reviews", () => {
      const objs = [makeObjective({ id: "obj1", review_date: daysAgo(5) }), makeObjective({ id: "obj2", review_date: futureDate(10) })];
      const r = computeHomePlacementJourney(baseInput({ placement_objectives: objs }));
      expect(r.objectives.overdue_reviews).toBe(1);
    });
    it("computes anniversary celebrated rate", () => {
      const anns = [makeAnniversary({ id: "ann1", celebrated: true }), makeAnniversary({ id: "ann2", celebrated: false }), makeAnniversary({ id: "ann3", celebrated: true })];
      const r = computeHomePlacementJourney(baseInput({ placement_anniversaries: anns }));
      expect(r.anniversaries.celebrated_rate).toBe(67);
    });
  });

  describe("Narrative output", () => {
    it("generates pre-admission strength", () => {
      const r = computeHomePlacementJourney(baseInput());
      expect(r.strengths.some(s => s.includes("pre-admission"))).toBe(true);
    });
    it("generates concern for no checklists", () => {
      const r = computeHomePlacementJourney(baseInput({ pre_admission_checklists: [] }));
      expect(r.concerns.some(c => c.includes("pre-admission"))).toBe(true);
    });
    it("generates outstanding insight", () => {
      const r = computeHomePlacementJourney(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });
    it("generates inadequate insight", () => {
      const r = computeHomePlacementJourney({
        today: TODAY,
        pre_admission_checklists: Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, all_sections_complete: false, risk_assessment_included: false, child_visited_home: false })),
        warm_welcome_packs: Array.from({ length: 2 }, (_, i) => makeWelcomePack({ id: `wp${i}`, child_id: `c${i + 1}`, personalised: false })),
        welcome_tours: Array.from({ length: 5 }, (_, i) => makeWelcomeTour({ id: `wt${i}`, completed: false, child_feedback_captured: false, buddy_assigned: false })),
        return_interviews: Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, conducted_within_24h: false, child_views_recorded: false, actions_identified: 5, actions_completed: 0 })),
        placement_objectives: Array.from({ length: 5 }, (_, i) => makeObjective({ id: `obj${i}`, progress_status: "behind", review_date: daysAgo(30), child_involved: false })),
        placement_anniversaries: Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, celebrated: false, child_voice_captured: false, memory_box_updated: false })),
        total_children: 5,
      });
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("score clamped 0-100", () => {
      const r = computeHomePlacementJourney({
        today: TODAY,
        pre_admission_checklists: Array.from({ length: 5 }, (_, i) => makePreAdmission({ id: `pa${i}`, all_sections_complete: false, risk_assessment_included: false, child_visited_home: false })),
        warm_welcome_packs: [], welcome_tours: [],
        return_interviews: Array.from({ length: 5 }, (_, i) => makeReturnInterview({ id: `ri${i}`, conducted_within_24h: false, child_views_recorded: false, actions_identified: 5, actions_completed: 0 })),
        placement_objectives: Array.from({ length: 10 }, (_, i) => makeObjective({ id: `obj${i}`, progress_status: "behind", review_date: daysAgo(30), child_involved: false })),
        placement_anniversaries: Array.from({ length: 5 }, (_, i) => makeAnniversary({ id: `ann${i}`, celebrated: false, child_voice_captured: false, memory_box_updated: false })),
        total_children: 5,
      });
      expect(r.placement_journey_score).toBeGreaterThanOrEqual(0);
      expect(r.placement_journey_score).toBeLessThanOrEqual(100);
    });
    it("all_complete_rate is unmeasured for a zero denominator", () => {
      const r = computeHomePlacementJourney({ today: TODAY, pre_admission_checklists: [], warm_welcome_packs: [], welcome_tours: [], return_interviews: [], placement_objectives: [], placement_anniversaries: [], total_children: 0 });
      expect(r.pre_admission.all_complete_rate).toBeNull();
    });
  });
});
