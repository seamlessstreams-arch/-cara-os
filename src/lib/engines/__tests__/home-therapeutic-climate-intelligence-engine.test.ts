// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME THERAPEUTIC CLIMATE INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeTherapeuticClimate,
  type HomeTherapeuticClimateInput,
  type BehaviourLogInput,
  type RestraintInput,
  type ClimateIncidentInput,
  type ClimateMissingInput,
} from "../home-therapeutic-climate-intelligence-engine";

const TODAY = "2026-05-26";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeBehaviour(overrides: Partial<BehaviourLogInput> = {}): BehaviourLogInput {
  return {
    id: "b1", child_id: "c1", date: "2026-05-10",
    direction: "positive", intensity: "low",
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "r1", child_id: "c1", date: "2026-05-10",
    duration_minutes: 5, de_escalation_count: 3,
    child_debriefed: true, staff_debriefed: true,
    injuries_count: 0,
    ...overrides,
  };
}

function makeIncident(overrides: Partial<ClimateIncidentInput> = {}): ClimateIncidentInput {
  return { id: "i1", child_id: "c1", date: "2026-05-10", severity: "low", ...overrides };
}

function makeMissing(overrides: Partial<ClimateMissingInput> = {}): ClimateMissingInput {
  return { id: "m1", child_id: "c1", date: "2026-05-10", ...overrides };
}

function baseInput(overrides: Partial<HomeTherapeuticClimateInput> = {}): HomeTherapeuticClimateInput {
  return {
    today: TODAY,
    behaviour_log: [],
    restraints: [],
    incidents: [],
    missing_episodes: [],
    total_children: 4,
    ...overrides,
  };
}

/**
 * Outstanding: all positive behaviour, zero restraints, zero incidents,
 * zero missing, 4 children.
 */
function outstandingBehaviour(): BehaviourLogInput[] {
  const entries: BehaviourLogInput[] = [];
  for (let c = 1; c <= 4; c++) {
    for (let i = 0; i < 5; i++) {
      entries.push(makeBehaviour({
        id: `b_c${c}_${i}`,
        child_id: `c${c}`,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        direction: i < 4 ? "positive" : "positive", // all positive
        intensity: "low",
      }));
    }
  }
  return entries; // 20 entries, 100% positive
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeHomeTherapeuticClimate", () => {

  // ─── Insufficient Data ──────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no events and no children", () => {
      const r = computeHomeTherapeuticClimate(baseInput({ total_children: 0 }));
      expect(r.climate_rating).toBe("insufficient_data");
      expect(r.climate_score).toBe(0);
    });

    it("returns empty profiles on insufficient data", () => {
      const r = computeHomeTherapeuticClimate(baseInput({ total_children: 0 }));
      expect(r.behaviour_profile.total_entries).toBe(0);
      expect(r.restraint_profile.total_restraints).toBe(0);
      expect(r.safety_profile.total_incidents).toBe(0);
    });

    it("returns concern, recommendation and critical insight", () => {
      const r = computeHomeTherapeuticClimate(baseInput({ total_children: 0 }));
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ─── Rating Classifications ─────────────────────────────────

  describe("rating classifications", () => {
    it("rates outstanding with calm home — score 80", () => {
      // Score: 52 + positive(100%→+5) + restraints(0→+4) + debrief(0 restraints→+3)
      //        + incidents(0→+4) + highSev(0→+3) + missing(0→+3)
      //        + calmRate(100%→+3) + injuries(0→+3) = 52+28 = 80
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.climate_rating).toBe("outstanding");
      expect(r.climate_score).toBe(80);
    });

    it("rates good with minor concerns — score ~70", () => {
      // 15 positive + 5 concerning behaviour = 75% positive → +5
      // 1 restraint (rate 0.25) → +2, debrief 100% → +3
      // 1 incident (low) rate 0.25 → +2, 0 high sev → +3
      // 0 missing → +3, calm rate: 3/4=75% → +3
      // 0 injuries → +3
      // Total: 52+5+2+3+2+3+3+3+3 = 76 — that's too high actually
      // Let me adjust: lower positive ratio
      const behaviour: BehaviourLogInput[] = [];
      for (let i = 0; i < 10; i++) {
        behaviour.push(makeBehaviour({ id: `b${i}`, direction: i < 6 ? "positive" : "concerning", child_id: `c${i % 4 + 1}`, date: `2026-05-${10+i}` }));
      }
      // 60% positive → ≥50 → +3
      // 1 restraint, rate 0.25 → +2
      // debrief 100%/100% → +3
      // 2 incidents, rate 0.5 → +2
      // 1 high severity → +1
      // 1 missing → +1
      // calm: c1 has concerning + restraint + incident + missing = not calm
      //       c2 has concerning + incident → not calm
      //       c3 has concerning → not calm
      //       c4 = no events (only positive behaviour doesn't count)
      // Wait, concerning behaviour counts. Let me re-check.
      // Let me simplify: 4 children, only c1 has events
      const restraints = [makeRestraint({ child_id: "c1" })];
      const incidents = [
        makeIncident({ id: "i1", child_id: "c1" }),
        makeIncident({ id: "i2", child_id: "c1", severity: "high" }),
      ];
      const missing_episodes = [makeMissing({ child_id: "c1" })];
      // Concerning behaviour: 4 entries from c2,c3,c4 (indexes 6,7,8,9 → c3,c4,c1,c2)
      // Actually child_id is `c${i%4+1}`: i=6→c3, i=7→c4, i=8→c1, i=9→c2
      // So concerning for c1(i=8), c2(i=9), c3(i=6), c4(i=7) — all have concerning
      // Only positive entries: c1,c2,c3,c4,c1,c2 (i=0..5)
      // childEventCounts: c1 has concerning(1)+restraint(1)+incident(2)+missing(1)=5
      //                    c2 has concerning(1)=1
      //                    c3 has concerning(1)=1
      //                    c4 has concerning(1)=1
      // children with no events: 0, calmRate: 0/4=0% → <25 → -2
      // That's bad. Let me just aim for a score that's "good".
      // Let me use a simpler setup:
      const r = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: behaviour,
        restraints,
        incidents,
        missing_episodes,
      }));
      // 60% positive → +3, 1 restraint 0.25→+2, debrief 100%→+3,
      // 2 incidents rate 0.5→+2, 1 high sev→+1, 1 missing→+1,
      // calmRate 0%→-2, 0 injuries→+3
      // Total: 52+3+2+3+2+1+1-2+3 = 65
      expect(r.climate_rating).toBe("good");
      expect(r.climate_score).toBe(65);
    });

    it("rates adequate with mixed concerns — score ~50", () => {
      // Low positive ratio, some restraints with debrief gaps
      const behaviour = [
        makeBehaviour({ id: "b1", direction: "positive" }),
        makeBehaviour({ id: "b2", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b3", direction: "concerning", intensity: "medium" }),
      ];
      // 33% positive → ≥30 → +0
      const restraints = [
        makeRestraint({ id: "r1", child_debriefed: false, staff_debriefed: false }),
        makeRestraint({ id: "r2", child_debriefed: true, staff_debriefed: true }),
      ];
      // 2 restraints, rate 0.5 → +2
      // debrief: 50% child → <70 → -2
      const incidents = [
        makeIncident({ id: "i1" }),
        makeIncident({ id: "i2" }),
        makeIncident({ id: "i3", severity: "high" }),
      ];
      // 3 incidents, rate 0.75 → ≤1.0 → +2
      // 1 high → +1
      const missing_episodes = [makeMissing(), makeMissing({ id: "m2" })];
      // 2 missing → ≤3 → +0
      // All events on c1 → calm rate 75% → +3
      // 0 injuries → +3
      // Total: 52+0+2-2+2+1+0+3+3 = 61 — hmm that's still good
      // Need to increase negatives. Let me add more children affected.
      const behaviour2 = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b3", child_id: "c2", direction: "concerning" }),
        makeBehaviour({ id: "b4", child_id: "c3", direction: "concerning" }),
      ];
      // 25% positive → <30 → -4
      const restraints2 = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: false, staff_debriefed: false }),
        makeRestraint({ id: "r2", child_id: "c2", child_debriefed: false, staff_debriefed: false }),
      ];
      // 2 restraints, 0.5 per child → +2
      // debrief 0% → -2
      const incidents2 = [
        makeIncident({ id: "i1", child_id: "c1" }),
        makeIncident({ id: "i2", child_id: "c2" }),
        makeIncident({ id: "i3", child_id: "c3", severity: "high" }),
      ];
      // 3 incidents, 0.75 → +2
      // 1 high → +1
      const missing2 = [makeMissing({ child_id: "c1" }), makeMissing({ id: "m2", child_id: "c2" })];
      // 2 missing → +0
      // Events: c1(concerned+restraint+incident+missing), c2(concerned+restraint+incident+missing), c3(concerned+incident)
      // Children no events: c4 only → calmRate 25% → ≥25 → +0
      // 0 injuries → +3
      // Total: 52-4+2-2+2+1+0+0+3 = 54
      const r = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: behaviour2,
        restraints: restraints2,
        incidents: incidents2,
        missing_episodes: missing2,
      }));
      expect(r.climate_rating).toBe("adequate");
      expect(r.climate_score).toBe(54);
    });

    it("rates inadequate with poor climate — score ~32", () => {
      // All concerning behaviour, multiple restraints with injuries, no debriefs
      const behaviour = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b2", child_id: "c2", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b3", child_id: "c3", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b4", child_id: "c4", direction: "concerning", intensity: "high" }),
      ];
      // 0% positive → -4
      const restraints = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: false, staff_debriefed: false, injuries_count: 1 }),
        makeRestraint({ id: "r2", child_id: "c2", child_debriefed: false, staff_debriefed: false, injuries_count: 1 }),
        makeRestraint({ id: "r3", child_id: "c3", child_debriefed: false, staff_debriefed: false }),
        makeRestraint({ id: "r4", child_id: "c4", child_debriefed: false, staff_debriefed: false }),
        makeRestraint({ id: "r5", child_id: "c1", child_debriefed: false, staff_debriefed: false }),
      ];
      // 5 restraints, 1.25 per child → >1.0 → -3
      // debrief 0% → -2
      const incidents = [
        makeIncident({ id: "i1", child_id: "c1", severity: "high" }),
        makeIncident({ id: "i2", child_id: "c2", severity: "high" }),
        makeIncident({ id: "i3", child_id: "c3", severity: "critical" }),
      ];
      // 3 incidents, 0.75 rate → +2
      // 3 high/crit → -2
      const missing_episodes = [
        makeMissing({ id: "m1", child_id: "c1" }),
        makeMissing({ id: "m2", child_id: "c2" }),
        makeMissing({ id: "m3", child_id: "c3" }),
        makeMissing({ id: "m4", child_id: "c4" }),
      ];
      // 4 missing → >3 → -2
      // calm rate: 0% → -2
      // injuries: 2 → -2
      // Total: 52-4-3-2+2-2-2-2-2 = 37
      // Hmm, 37. I need it below 45. Let me adjust incidents.
      // With 3 incidents at rate 0.75 → +2. If I push to >2.0 rate:
      // 9 incidents, rate 2.25 → -3
      const incidents2 = Array.from({ length: 9 }, (_, i) =>
        makeIncident({ id: `i${i}`, child_id: `c${(i % 4) + 1}`, severity: i < 3 ? "high" : "low" }),
      );
      // 9 incidents, rate 2.25 → -3
      // 3 high → -2
      // Total: 52-4-3-2-3-2-2-2-2 = 32
      const r = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: behaviour,
        restraints,
        incidents: incidents2,
        missing_episodes,
      }));
      expect(r.climate_rating).toBe("inadequate");
      expect(r.climate_score).toBe(32);
    });
  });

  // ─── Behaviour Climate Profile ──────────────────────────────

  describe("behaviour climate profile", () => {
    it("counts positive and concerning entries", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", direction: "positive" }),
        makeBehaviour({ id: "b2", direction: "positive" }),
        makeBehaviour({ id: "b3", direction: "concerning" }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.behaviour_profile.positive_count).toBe(2);
      expect(r.behaviour_profile.concerning_count).toBe(1);
      expect(r.behaviour_profile.positive_ratio).toBe(67);
    });

    it("counts high intensity entries", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", intensity: "high" }),
        makeBehaviour({ id: "b2", intensity: "low" }),
        makeBehaviour({ id: "b3", intensity: "high" }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.behaviour_profile.high_intensity_count).toBe(2);
    });

    it("filters to lookback window", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", date: "2026-05-10" }), // within 90d
        makeBehaviour({ id: "b2", date: "2026-01-01" }), // outside 90d
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.behaviour_profile.total_entries).toBe(1);
    });
  });

  // ─── Restraint Climate Profile ──────────────────────────────

  describe("restraint climate profile", () => {
    it("calculates restraint rate per child", () => {
      const restraints = [
        makeRestraint({ id: "r1" }),
        makeRestraint({ id: "r2" }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints, total_children: 4 }));
      expect(r.restraint_profile.restraint_rate_per_child).toBe(0.5);
    });

    it("calculates debrief rates", () => {
      const restraints = [
        makeRestraint({ id: "r1", child_debriefed: true, staff_debriefed: true }),
        makeRestraint({ id: "r2", child_debriefed: true, staff_debriefed: false }),
        makeRestraint({ id: "r3", child_debriefed: false, staff_debriefed: false }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.restraint_profile.child_debrief_rate).toBe(67); // 2/3
      expect(r.restraint_profile.staff_debrief_rate).toBe(33); // 1/3
    });

    it("counts injuries and restrained children", () => {
      const restraints = [
        makeRestraint({ id: "r1", child_id: "c1", injuries_count: 1 }),
        makeRestraint({ id: "r2", child_id: "c1", injuries_count: 0 }),
        makeRestraint({ id: "r3", child_id: "c2", injuries_count: 1 }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.restraint_profile.injuries_count).toBe(2);
      expect(r.restraint_profile.children_restrained).toBe(2);
    });
  });

  // ─── Safety Climate Profile ─────────────────────────────────

  describe("safety climate profile", () => {
    it("counts incidents and missing episodes", () => {
      const incidents = [makeIncident({ id: "i1" }), makeIncident({ id: "i2", severity: "high" })];
      const missing_episodes = [makeMissing()];
      const r = computeHomeTherapeuticClimate(baseInput({ incidents, missing_episodes }));
      expect(r.safety_profile.total_incidents).toBe(2);
      expect(r.safety_profile.high_severity_count).toBe(1);
      expect(r.safety_profile.missing_episodes).toBe(1);
    });

    it("calculates combined event rate", () => {
      const incidents = [makeIncident({ id: "i1" }), makeIncident({ id: "i2" })];
      const missing_episodes = [makeMissing()];
      const r = computeHomeTherapeuticClimate(baseInput({ incidents, missing_episodes, total_children: 4 }));
      // (2 + 1) / 4 = 0.75 → 0.8
      expect(r.safety_profile.combined_event_rate).toBe(0.8);
    });
  });

  // ─── Pattern Profile ────────────────────────────────────────

  describe("pattern profile", () => {
    it("counts children with 3+ concerning events", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning" }),
      ];
      const incidents = [makeIncident({ child_id: "c1" })]; // c1 now has 3 events
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour, incidents }));
      expect(r.pattern_profile.most_active_children).toBe(1);
    });

    it("calculates calm rate", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning" }),
      ];
      // c1 has event, c2-c4 have no events → 3/4 = 75%
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.pattern_profile.children_with_no_events).toBe(3);
      expect(r.pattern_profile.calm_rate).toBe(75);
    });
  });

  // ─── Scoring Modifiers ──────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: 70%+ positive gives +5", () => {
      const high = Array.from({ length: 10 }, (_, i) =>
        makeBehaviour({ id: `b${i}`, direction: i < 8 ? "positive" : "concerning" }),
      ); // 80%
      const low = Array.from({ length: 10 }, (_, i) =>
        makeBehaviour({ id: `b${i}`, direction: i < 2 ? "positive" : "concerning" }),
      ); // 20%
      const rH = computeHomeTherapeuticClimate(baseInput({ behaviour_log: high }));
      const rL = computeHomeTherapeuticClimate(baseInput({ behaviour_log: low }));
      // 80% → +5, 20% → <30 → -4 → diff 9
      expect(rH.climate_score! - rL.climate_score!).toBe(9);
    });

    it("modifier 2: 0 restraints gives +4", () => {
      const none = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: [makeBehaviour()],
      }));
      const some = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: [makeBehaviour()],
        restraints: [makeRestraint(), makeRestraint({ id: "r2" }), makeRestraint({ id: "r3" }), makeRestraint({ id: "r4" }), makeRestraint({ id: "r5" })],
      }));
      // 0 restraints: +4, 5 restraints (1.25/child) >1.0: -3 → diff 7
      // But debrief also changes: 0 restraints → +3, 5 restraints 100% → +3 → same
      // And injuries: 0 → +3, 0 injuries → +3 → same
      // And calm rate changes: some → c1 has restraints so 3/4=75% → +3
      // No restraints → c1 has no events (only positive beh) → 4/4=100% → wait,
      // c1 has positive behaviour but that doesn't count as event
      // Actually calm rate counts concerning behaviour, not positive. Let me recalculate.
      // none: 1 positive behaviour on c1 → no concerning events for any child → calm rate 100% → +3
      // some: c1 has 5 restraints → only c1 has events → calm rate 75% → +3
      // So calm rate is same. Diff = (4+3) - (-3+3) = 7-0 = 7
      // Wait, no: none total: +4 (restraints) + +3 (debrief) + +3 (injuries) = extra +10
      // some: -3 (restraints) + +3 (debrief) + +3 (injuries) = extra +3
      // restraint-related diff = 7
      expect(none.climate_score! - some.climate_score!).toBe(7);
    });

    it("modifier 5: 0 high severity gives +3", () => {
      const noHigh = [makeIncident({ severity: "low" })];
      const withHigh = [
        makeIncident({ id: "i1", severity: "high" }),
        makeIncident({ id: "i2", severity: "critical" }),
      ];
      const rN = computeHomeTherapeuticClimate(baseInput({ incidents: noHigh }));
      const rH = computeHomeTherapeuticClimate(baseInput({ incidents: withHigh }));
      // 1 low incident: rate 0.25 → +2, 0 high → +3
      // 2 high incidents: rate 0.5 → +2, 2 high → -2
      // incident rate same (+2). highSev: +3 vs -2 = diff 5
      expect(rN.climate_score! - rH.climate_score!).toBe(5);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────

  describe("strengths", () => {
    it("includes positive ratio strength when ≥70%", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.strengths.some(s => s.includes("positive"))).toBe(true);
    });

    it("includes zero restraints strength", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.strengths.some(s => s.includes("restraint"))).toBe(true);
    });

    it("includes calm rate strength when ≥75%", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.strengths.some(s => s.includes("calm") || s.includes("no concerning"))).toBe(true);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low positive ratio as a concern", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", direction: "concerning" }),
        makeBehaviour({ id: "b2", direction: "concerning" }),
        makeBehaviour({ id: "b3", direction: "concerning" }),
        makeBehaviour({ id: "b4", direction: "positive" }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.concerns.some(c => c.includes("positive"))).toBe(true);
    });

    it("flags low debrief rate as a concern", () => {
      const restraints = [
        makeRestraint({ id: "r1", child_debriefed: false }),
        makeRestraint({ id: "r2", child_debriefed: false }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.concerns.some(c => c.includes("debrief"))).toBe(true);
    });

    it("flags injuries as a concern", () => {
      const restraints = [
        makeRestraint({ injuries_count: 1 }),
        makeRestraint({ id: "r2", injuries_count: 1 }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.concerns.some(c => c.includes("injur"))).toBe(true);
    });
  });

  // ─── Recommendations ────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends debrief improvement", () => {
      const restraints = [makeRestraint({ child_debriefed: false })];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("debrief"))).toBe(true);
      expect(r.recommendations.some(rec => rec.regulatory_ref === "Reg 20")).toBe(true);
    });

    it("recommends injury review", () => {
      const restraints = [makeRestraint({ injuries_count: 1 })];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("injur"))).toBe(true);
    });

    it("recommends therapeutic review for concentrated patterns", () => {
      const behaviour = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning" }),
      ];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("pattern") || rec.recommendation.includes("concentrated"))).toBe(true);
    });
  });

  // ─── Insights ───────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for outstanding", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for restraint injuries", () => {
      const restraints = [makeRestraint({ injuries_count: 1 })];
      const r = computeHomeTherapeuticClimate(baseInput({ restraints }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("injur"))).toBe(true);
    });

    it("generates positive insight for high positive ratio", () => {
      const behaviour = Array.from({ length: 10 }, (_, i) =>
        makeBehaviour({ id: `b${i}`, direction: i < 8 ? "positive" : "concerning" }),
      );
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("positive"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline includes metrics", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.headline).toContain("Outstanding");
    });

    it("inadequate headline reflects urgency", () => {
      const behaviour = Array.from({ length: 4 }, (_, i) =>
        makeBehaviour({ id: `b${i}`, child_id: `c${i+1}`, direction: "concerning", intensity: "high" }),
      );
      const restraints = Array.from({ length: 5 }, (_, i) =>
        makeRestraint({ id: `r${i}`, child_id: `c${(i%4)+1}`, child_debriefed: false, staff_debriefed: false, injuries_count: i < 2 ? 1 : 0 }),
      );
      const incidents = Array.from({ length: 9 }, (_, i) =>
        makeIncident({ id: `i${i}`, child_id: `c${(i%4)+1}`, severity: i < 3 ? "high" : "low" }),
      );
      const missing_episodes = Array.from({ length: 4 }, (_, i) =>
        makeMissing({ id: `m${i}`, child_id: `c${i+1}` }),
      );
      const r = computeHomeTherapeuticClimate(baseInput({
        behaviour_log: behaviour, restraints, incidents, missing_episodes,
      }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeHomeTherapeuticClimate(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No therapeutic climate data");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────

  describe("edge cases", () => {
    it("respects custom lookback_days", () => {
      const behaviour = [makeBehaviour({ date: "2026-04-01" })]; // 55 days ago
      const r30 = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour, lookback_days: 30 }));
      const r90 = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r30.behaviour_profile.total_entries).toBe(0);
      expect(r90.behaviour_profile.total_entries).toBe(1);
    });

    it("score stays within 0-100", () => {
      const behaviour = outstandingBehaviour();
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      expect(r.climate_score).toBeGreaterThanOrEqual(0);
      expect(r.climate_score).toBeLessThanOrEqual(100);
    });

    it("handles children > 0 with no events as calm", () => {
      // Only positive behaviour — doesn't count as event
      const behaviour = [makeBehaviour({ direction: "positive" })];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour }));
      // All 4 children have no concerning events
      expect(r.pattern_profile.calm_rate).toBe(100);
    });

    it("handles data with children=0 but events present", () => {
      const behaviour = [makeBehaviour()];
      const r = computeHomeTherapeuticClimate(baseInput({ behaviour_log: behaviour, total_children: 0 }));
      expect(r.climate_score).toBeGreaterThan(0);
    });
  });
});
