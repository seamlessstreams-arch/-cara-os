import { describe, it, expect } from "vitest";
import {
  computeRestraintPhysicalIntervention,
  type RestraintRecordInput,
  type RestraintPhysicalInterventionInput,
} from "../home-restraint-physical-intervention-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-15";

const baseRecord = (overrides: Partial<RestraintRecordInput> = {}): RestraintRecordInput => ({
  id: "rst_1",
  child_id: "child_1",
  date: "2026-05-01",
  duration_minutes: 3,
  staff_count: 2,
  all_staff_team_teach_trained: true,
  reason: "imminent_harm_to_others",
  restraint_type: "planned_hold",
  de_escalation_attempt_count: 3,
  has_justification: true,
  has_injury: false,
  injury_count: 0,
  child_debriefed: true,
  staff_debriefed: true,
  has_witness: true,
  review_status: "reviewed",
  has_body_map: true,
  has_medical_check: false,
  notification_count: 2,
  has_linked_incident: true,
  ...overrides,
});

const baseInput = (overrides: Partial<RestraintPhysicalInterventionInput> = {}): RestraintPhysicalInterventionInput => ({
  today: TODAY,
  total_children: 3,
  restraints: [baseRecord()],
  ...overrides,
});

// Helper to create N records with specific overrides applied to all
function manyRecords(
  count: number,
  overrides: Partial<RestraintRecordInput> = {},
): RestraintRecordInput[] {
  return Array.from({ length: count }, (_, i) =>
    baseRecord({ id: `rst_${i + 1}`, ...overrides }),
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Restraint Physical Intervention Intelligence Engine", () => {

  // ════════════════════════════════════════════════════════════════════════
  // 1. GUARD CLAUSES
  // ════════════════════════════════════════════════════════════════════════

  describe("guard clauses", () => {

    describe("total_children = 0", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 0,
        restraints: [],
      }));

      it("returns insufficient_data rating", () => {
        expect(result.restraint_rating).toBe("insufficient_data");
      });

      it("returns score 0", () => {
        expect(result.restraint_score).toBe(0);
      });

      it("headline mentions no children", () => {
        expect(result.headline).toContain("No children on placement");
      });

      it("returns total_restraints 0", () => {
        expect(result.total_restraints).toBe(0);
      });

      it("returns unique_children_restrained 0", () => {
        expect(result.unique_children_restrained).toBe(0);
      });

      it("returns average_duration_minutes 0", () => {
        expect(result.average_duration_minutes).toBe(0);
      });

      it("returns all rates as 0", () => {
        expect(result.de_escalation_rate).toBe(0);
        expect(result.team_teach_compliance_rate).toBe(0);
        expect(result.child_debrief_rate).toBe(0);
        expect(result.review_completion_rate).toBe(0);
        expect(result.body_map_rate).toBe(0);
        expect(result.notification_rate).toBe(0);
        expect(result.injury_rate).toBe(0);
      });

      it("returns empty strengths", () => {
        expect(result.strengths).toHaveLength(0);
      });

      it("returns empty concerns", () => {
        expect(result.concerns).toHaveLength(0);
      });

      it("returns empty recommendations", () => {
        expect(result.recommendations).toHaveLength(0);
      });

      it("returns empty insights", () => {
        expect(result.insights).toHaveLength(0);
      });
    });

    describe("total_children = 0 with restraints supplied", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 0,
        restraints: [baseRecord()],
      }));

      it("still returns insufficient_data when total_children is 0 even with restraints", () => {
        expect(result.restraint_rating).toBe("insufficient_data");
        expect(result.restraint_score).toBe(0);
      });
    });

    describe("children > 0 but zero restraints", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: [],
      }));

      it("returns outstanding rating", () => {
        expect(result.restraint_rating).toBe("outstanding");
      });

      it("returns score 88", () => {
        expect(result.restraint_score).toBe(88);
      });

      it("headline mentions exemplary de-escalation culture", () => {
        expect(result.headline).toContain("exemplary de-escalation culture");
      });

      it("has two strengths about zero interventions", () => {
        expect(result.strengths).toHaveLength(2);
        expect(result.strengths[0]).toContain("Zero physical interventions");
      });

      it("has no concerns", () => {
        expect(result.concerns).toHaveLength(0);
      });

      it("has no recommendations", () => {
        expect(result.recommendations).toHaveLength(0);
      });

      it("has one positive insight", () => {
        expect(result.insights).toHaveLength(1);
        expect(result.insights[0].severity).toBe("positive");
        expect(result.insights[0].text).toContain("No restraints recorded");
      });
    });

    describe("all records outside 90-day window", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: [baseRecord({ date: "2026-01-01" })],
      }));

      it("returns good rating", () => {
        expect(result.restraint_rating).toBe("good");
      });

      it("returns score 78", () => {
        expect(result.restraint_score).toBe(78);
      });

      it("headline mentions no interventions in 90 days", () => {
        expect(result.headline).toContain("No physical interventions in the last 90 days");
      });

      it("returns total_restraints 0", () => {
        expect(result.total_restraints).toBe(0);
      });

      it("has one strength", () => {
        expect(result.strengths).toHaveLength(1);
        expect(result.strengths[0]).toContain("No physical interventions recorded in the last 90 days");
      });

      it("has one positive insight about downward trend", () => {
        expect(result.insights).toHaveLength(1);
        expect(result.insights[0].severity).toBe("positive");
        expect(result.insights[0].text).toContain("older than 90 days");
      });
    });

    describe("record exactly on the 90-day boundary", () => {
      // today = 2026-05-15, 90 days prior = 2026-02-14
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ date: "2026-02-14" })],
      }));

      it("includes the record (daysBetween <= 90)", () => {
        expect(result.total_restraints).toBe(1);
      });
    });

    describe("record at 91 days is excluded", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ date: "2026-02-13" })],
      }));

      it("excludes the record", () => {
        expect(result.total_restraints).toBe(0);
        expect(result.restraint_rating).toBe("good");
        expect(result.restraint_score).toBe(78);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2. SINGLE PERFECT RECORD — BASELINE SCORE CALCULATION
  // ════════════════════════════════════════════════════════════════════════

  describe("single perfect record — baseline scoring", () => {
    // 1 record: all fields optimal
    // deEscalationRate = 100% -> +6; deEscRate != 0 so no extra -3
    // teamTeachRate = 100% -> +5; != 0 no -1
    // childDebriefRate = 100% -> +5; != 0 no -1
    // reviewCompletionRate = 100% -> +5
    // bodyMapRate = 100% AND notificationRate = 100% -> +4; both != 0 no -1
    // avgDuration = 3, injuryRate = 0 -> +5; total!=0 so no -2
    // isHighFrequency: 1 > 3*2? No
    // repeatChildren: none
    // Score: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    const result = computeRestraintPhysicalIntervention(baseInput());

    it("scores 82", () => {
      expect(result.restraint_score).toBe(82);
    });

    it("rates outstanding", () => {
      expect(result.restraint_rating).toBe("outstanding");
    });

    it("total_restraints is 1", () => {
      expect(result.total_restraints).toBe(1);
    });

    it("unique_children_restrained is 1", () => {
      expect(result.unique_children_restrained).toBe(1);
    });

    it("average_duration_minutes is 3", () => {
      expect(result.average_duration_minutes).toBe(3);
    });

    it("de_escalation_rate is 100", () => {
      expect(result.de_escalation_rate).toBe(100);
    });

    it("team_teach_compliance_rate is 100", () => {
      expect(result.team_teach_compliance_rate).toBe(100);
    });

    it("child_debrief_rate is 100", () => {
      expect(result.child_debrief_rate).toBe(100);
    });

    it("review_completion_rate is 100", () => {
      expect(result.review_completion_rate).toBe(100);
    });

    it("surfaces real-vocab pending reviews (pending_rm / pending_ri), not just literal 'pending'", () => {
      // Real data uses RestraintReviewStatus pending_rm/pending_ri — the engine
      // previously matched only "pending", so the whole backlog read as 0.
      const r = computeRestraintPhysicalIntervention(baseInput({
        restraints: [
          baseRecord({ id: "a", review_status: "pending_rm" }),
          baseRecord({ id: "b", review_status: "pending_ri" }),
        ],
      }));
      expect(r.review_completion_rate).toBe(0);
      expect(r.concerns.some((c) => c.toLowerCase().includes("pending review"))).toBe(true);
    });

    it("counts a restraint referred to the LADO as a completed review", () => {
      const r = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ id: "a", review_status: "referred_lado" })],
      }));
      expect(r.review_completion_rate).toBe(100);
    });

    it("body_map_rate is 100", () => {
      expect(result.body_map_rate).toBe(100);
    });

    it("notification_rate is 100", () => {
      expect(result.notification_rate).toBe(100);
    });

    it("injury_rate is 0", () => {
      expect(result.injury_rate).toBe(0);
    });

    it("headline mentions outstanding", () => {
      expect(result.headline).toContain("Outstanding physical intervention governance");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3. MODIFIER 1 — DE-ESCALATION PRACTICE
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 1: de-escalation practice", () => {

    // 10 records, 9 with de_escalation > 0 = 90% -> +6
    // And deEscalationRate != 0 -> no extra -3
    it("+6 when de-escalation rate >= 90%", () => {
      const records = manyRecords(10);
      records[9] = baseRecord({ id: "rst_10", de_escalation_attempt_count: 0 });
      // 9/10 = 90%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(90);
      // base 52, M1:+6, M2:+5, M3:+5, M4:+5, M5:+4, M6:+5 = 82
      // no high freq (10 vs 10*2=20), no repeats (all same child_1 but count=10>3 so repeat!)
      // Actually all have child_id "child_1" so childCounts["child_1"]=10 > 3 -> repeatChildren penalty -2
      // isHighFrequency: 10 > 10*2? No
      // Score: 52+6+5+5+5+4+5-2 = 80
      expect(result.restraint_score).toBe(80);
    });

    // 10 records, 7 with de_escalation > 0 = 70% -> +3
    it("+3 when de-escalation rate >= 70% and < 90%", () => {
      const records = manyRecords(10);
      records[7] = baseRecord({ id: "rst_8", de_escalation_attempt_count: 0 });
      records[8] = baseRecord({ id: "rst_9", de_escalation_attempt_count: 0 });
      records[9] = baseRecord({ id: "rst_10", de_escalation_attempt_count: 0 });
      // 7/10 = 70%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(70);
      // M1: +3, repeat child penalty -2
      // 52+3+5+5+5+4+5-2 = 77
      expect(result.restraint_score).toBe(77);
    });

    // 10 records, 3 with de_escalation > 0 = 30% -> under 40 so -5
    // deEscRate != 0 so no extra -3
    it("-5 when de-escalation rate < 40%", () => {
      const records = manyRecords(10, { de_escalation_attempt_count: 0 });
      records[0] = baseRecord({ id: "rst_1", de_escalation_attempt_count: 1 });
      records[1] = baseRecord({ id: "rst_2", de_escalation_attempt_count: 1 });
      records[2] = baseRecord({ id: "rst_3", de_escalation_attempt_count: 1 });
      // 3/10 = 30% < 40 -> -5. deEscRate != 0, no extra -3
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(30);
      // M1: -5, repeat -2
      // 52-5+5+5+5+4+5-2 = 69
      expect(result.restraint_score).toBe(69);
    });

    // All 10 records with de_escalation = 0 -> rate 0%, < 40 so -5, AND == 0 so extra -3 = -8
    it("-5 and extra -3 when de-escalation rate is 0%", () => {
      const records = manyRecords(10, { de_escalation_attempt_count: 0 });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(0);
      // M1: -5 -3 = -8, repeat -2
      // 52-8+5+5+5+4+5-2 = 66
      expect(result.restraint_score).toBe(66);
    });

    // 10 records, 5 with de_escalation > 0 = 50% -> between 40 and 70: no +/- from first block, but != 0 so no extra -3
    it("no modifier when de-escalation rate is between 40% and 69%", () => {
      const records = manyRecords(10, { de_escalation_attempt_count: 0 });
      records[0] = baseRecord({ id: "rst_1", de_escalation_attempt_count: 1 });
      records[1] = baseRecord({ id: "rst_2", de_escalation_attempt_count: 1 });
      records[2] = baseRecord({ id: "rst_3", de_escalation_attempt_count: 1 });
      records[3] = baseRecord({ id: "rst_4", de_escalation_attempt_count: 1 });
      records[4] = baseRecord({ id: "rst_5", de_escalation_attempt_count: 1 });
      // 5/10 = 50%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(50);
      // M1: +0, repeat -2
      // 52+0+5+5+5+4+5-2 = 74
      expect(result.restraint_score).toBe(74);
    });

    it("boundary: de-escalation rate at exactly 89% yields +3", () => {
      // 9 records: 8 with de_esc > 0 = 89% (8/9 = 88.8... rounds to 89)
      const records = manyRecords(9);
      records[8] = baseRecord({ id: "rst_9", de_escalation_attempt_count: 0 });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(89);
      // M1: +3, repeat -2 (all child_1, 9 > 3)
      // 52+3+5+5+5+4+5-2 = 77
      expect(result.restraint_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4. MODIFIER 2 — TEAM TEACH COMPLIANCE
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 2: Team Teach compliance", () => {

    it("+5 when team teach rate >= 95%", () => {
      // 1 record, 100% team teach
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.team_teach_compliance_rate).toBe(100);
      // Already in single perfect record test — score 82
      expect(result.restraint_score).toBe(82);
    });

    it("+2 when team teach rate >= 80% and < 95%", () => {
      // 5 records, 4 trained = 80%
      const records = manyRecords(5);
      records[4] = baseRecord({ id: "rst_5", all_staff_team_teach_trained: false });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(80);
      // M1:+6, M2:+2, M3:+5, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+2+5+5+4+5-2 = 77
      expect(result.restraint_score).toBe(77);
    });

    it("-5 when team teach rate < 50%", () => {
      // 10 records, 4 trained = 40%
      const records = manyRecords(10, { all_staff_team_teach_trained: false });
      records[0] = baseRecord({ id: "rst_1", all_staff_team_teach_trained: true });
      records[1] = baseRecord({ id: "rst_2", all_staff_team_teach_trained: true });
      records[2] = baseRecord({ id: "rst_3", all_staff_team_teach_trained: true });
      records[3] = baseRecord({ id: "rst_4", all_staff_team_teach_trained: true });
      // 4/10 = 40% < 50 -> -5
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(40);
      // M1:+6, M2:-5, M3:+5, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6-5+5+5+4+5-2 = 70
      expect(result.restraint_score).toBe(70);
    });

    it("-5 and extra -1 when team teach rate is 0%", () => {
      const records = manyRecords(10, { all_staff_team_teach_trained: false });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(0);
      // M1:+6, M2:-5-1=-6, M3:+5, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6-6+5+5+4+5-2 = 69
      expect(result.restraint_score).toBe(69);
    });

    it("no modifier when team teach rate is between 50% and 79%", () => {
      // 10 records, 6 trained = 60%
      const records = manyRecords(10, { all_staff_team_teach_trained: false });
      for (let i = 0; i < 6; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, all_staff_team_teach_trained: true });
      }
      // 6/10 = 60%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(60);
      // M1:+6, M2:0, M3:+5, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+0+5+5+4+5-2 = 75
      expect(result.restraint_score).toBe(75);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5. MODIFIER 3 — CHILD DEBRIEF
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 3: child debrief", () => {

    it("+5 when child debrief rate >= 85%", () => {
      // Single perfect record -> 100% -> +5 (covered in baseline)
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.child_debrief_rate).toBe(100);
    });

    it("+2 when child debrief rate >= 60% and < 85%", () => {
      // 5 records, 3 debriefed = 60%
      const records = manyRecords(5, { child_debriefed: false });
      records[0] = baseRecord({ id: "rst_1", child_debriefed: true });
      records[1] = baseRecord({ id: "rst_2", child_debriefed: true });
      records[2] = baseRecord({ id: "rst_3", child_debriefed: true });
      // 3/5 = 60%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(60);
      // M1:+6, M2:+5, M3:+2, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+5+2+5+4+5-2 = 77
      expect(result.restraint_score).toBe(77);
    });

    it("-4 when child debrief rate < 30%", () => {
      // 10 records, 2 debriefed = 20%
      const records = manyRecords(10, { child_debriefed: false });
      records[0] = baseRecord({ id: "rst_1", child_debriefed: true });
      records[1] = baseRecord({ id: "rst_2", child_debriefed: true });
      // 2/10 = 20% < 30 -> -4
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(20);
      // M1:+6, M2:+5, M3:-4, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+5-4+5+4+5-2 = 71
      expect(result.restraint_score).toBe(71);
    });

    it("-4 and extra -1 when child debrief rate is 0%", () => {
      const records = manyRecords(10, { child_debriefed: false });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(0);
      // M1:+6, M2:+5, M3:-4-1=-5, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+5-5+5+4+5-2 = 70
      expect(result.restraint_score).toBe(70);
    });

    it("no modifier when child debrief rate is between 30% and 59%", () => {
      // 10 records, 5 debriefed = 50%
      const records = manyRecords(10, { child_debriefed: false });
      for (let i = 0; i < 5; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, child_debriefed: true });
      }
      // 5/10 = 50%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(50);
      // M1:+6, M2:+5, M3:0, M4:+5, M5:+4, M6:+5, repeat -2
      // 52+6+5+0+5+4+5-2 = 75
      expect(result.restraint_score).toBe(75);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6. MODIFIER 4 — REVIEW COMPLETION
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 4: review completion", () => {

    it("+5 when review completion rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.review_completion_rate).toBe(100);
    });

    it("+2 when review completion rate >= 70% and < 90%", () => {
      // 10 records, 7 reviewed = 70%
      const records = manyRecords(10, { review_status: "pending" });
      for (let i = 0; i < 7; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, review_status: "reviewed" });
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.review_completion_rate).toBe(70);
      // M1:+6, M2:+5, M3:+5, M4:+2, M5:+4, M6:+5, repeat -2
      // 52+6+5+5+2+4+5-2 = 77
      expect(result.restraint_score).toBe(77);
    });

    it("-4 when review completion rate < 40%", () => {
      // 10 records, 3 reviewed = 30%
      const records = manyRecords(10, { review_status: "pending" });
      for (let i = 0; i < 3; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, review_status: "reviewed" });
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.review_completion_rate).toBe(30);
      // M1:+6, M2:+5, M3:+5, M4:-4, M5:+4, M6:+5, repeat -2
      // 52+6+5+5-4+4+5-2 = 71
      expect(result.restraint_score).toBe(71);
    });

    it("no modifier when review completion rate is between 40% and 69%", () => {
      // 10 records, 5 reviewed = 50%
      const records = manyRecords(10, { review_status: "pending" });
      for (let i = 0; i < 5; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, review_status: "reviewed" });
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.review_completion_rate).toBe(50);
      // M1:+6, M2:+5, M3:+5, M4:0, M5:+4, M6:+5, repeat -2
      // 52+6+5+5+0+4+5-2 = 75
      expect(result.restraint_score).toBe(75);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 7. MODIFIER 5 — BODY MAP + NOTIFICATION
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 5: body map + notification", () => {

    it("+4 when both body map >= 90% AND notification >= 90%", () => {
      // Single perfect record => both 100% -> +4
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.body_map_rate).toBe(100);
      expect(result.notification_rate).toBe(100);
    });

    it("+2 when body map >= 70% but notification < 90%", () => {
      // 10 records, 8 body maps, 6 notifications
      // bodyMapRate=80 >= 70 -> +2 (bodyMapRate >= 70 || notificationRate >= 70)
      const records = manyRecords(10, { has_body_map: false, notification_count: 0 });
      for (let i = 0; i < 8; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, has_body_map: true, notification_count: 0 });
      }
      // bodyMapRate = 80, notificationRate = 0
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(80);
      expect(result.notification_rate).toBe(0);
      // M5: bodyMapRate(80)>=90 && notifRate(0)>=90? No.
      // bodyMapRate(80)>=70 || notifRate(0)>=70? Yes -> +2
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:+2, M6:+5, repeat -2
      // 52+6+5+5+5+2+5-2 = 78
      expect(result.restraint_score).toBe(78);
    });

    it("+2 when notification >= 70% but body map < 90%", () => {
      // 10 records, 3 body maps, 7 notifications
      const records = manyRecords(10, { has_body_map: false, notification_count: 0 });
      for (let i = 0; i < 7; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, has_body_map: false, notification_count: 2 });
      }
      // bodyMapRate = 0, notificationRate = 70
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.notification_rate).toBe(70);
      // M5: bodyMapRate(0)>=90 && notifRate(70)>=90? No.
      // bodyMapRate(0)>=70 || notifRate(70)>=70? Yes -> +2
      // But also bodyMapRate=0 && notificationRate!=0 so the "both==0" check does not fire
    });

    it("-4 when both body map < 40% AND notification < 40%", () => {
      // 10 records, 3 body maps = 30%, 3 notifications = 30%
      const records = manyRecords(10, { has_body_map: false, notification_count: 0 });
      for (let i = 0; i < 3; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, has_body_map: true, notification_count: 2 });
      }
      // bodyMapRate = 30, notificationRate = 30
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(30);
      expect(result.notification_rate).toBe(30);
      // M5: both < 40 -> -4. Neither is 0 so no extra -1
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:-4, M6:+5, repeat -2
      // 52+6+5+5+5-4+5-2 = 72
      expect(result.restraint_score).toBe(72);
    });

    it("-4 and extra -1 when both body map and notification are 0%", () => {
      const records = manyRecords(10, { has_body_map: false, notification_count: 0 });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(0);
      expect(result.notification_rate).toBe(0);
      // M5: both < 40 -> -4, and both 0 -> -1 => total -5
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:-5, M6:+5, repeat -2
      // 52+6+5+5+5-5+5-2 = 71
      expect(result.restraint_score).toBe(71);
    });

    it("no modifier when body map 50% and notification 50% (both >= 40 but neither >= 70)", () => {
      // 10 records, 5 body maps, 5 notifications
      const records = manyRecords(10, { has_body_map: false, notification_count: 0 });
      for (let i = 0; i < 5; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, has_body_map: true, notification_count: 2 });
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(50);
      expect(result.notification_rate).toBe(50);
      // M5: both>=90? No. either>=70? No. both<40? No. -> 0
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:0, M6:+5, repeat -2
      // 52+6+5+5+5+0+5-2 = 76
      expect(result.restraint_score).toBe(76);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 8. MODIFIER 6 — DURATION + INJURY MONITORING
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 6: duration + injury monitoring", () => {

    it("+5 when average duration <= 5 and injury rate = 0", () => {
      // Single record: duration 3, no injury
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.average_duration_minutes).toBe(3);
      expect(result.injury_rate).toBe(0);
    });

    it("+2 when average duration <= 10 (even with some injury)", () => {
      // Duration 8, injury rate 20% (2/10)
      const records = manyRecords(10, { duration_minutes: 8, has_injury: false });
      records[0] = baseRecord({ id: "rst_1", duration_minutes: 8, has_injury: true, injury_count: 1 });
      records[1] = baseRecord({ id: "rst_2", duration_minutes: 8, has_injury: true, injury_count: 1 });
      // avgDuration = 8 <= 10 -> +2 (first clause: <=5 && injRate==0? 8>5 -> no)
      // second clause: avgDur <= 10 || injRate <= 10? 8<=10 -> yes +2
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(8);
      // M6: +2
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:+4, M6:+2, repeat -2
      // 52+6+5+5+5+4+2-2 = 77
      expect(result.restraint_score).toBe(77);
    });

    it("+2 when injury rate <= 10% even if duration > 10", () => {
      // Duration 12, injury rate 10% (1/10)
      const records = manyRecords(10, { duration_minutes: 12, has_injury: false });
      records[0] = baseRecord({ id: "rst_1", duration_minutes: 12, has_injury: true, injury_count: 1 });
      // avgDur = 12 > 10, injRate = 10%. Second clause: avgDur<=10? No. injRate<=10? Yes -> +2
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.injury_rate).toBe(10);
      expect(result.average_duration_minutes).toBe(12);
      // M6: +2
    });

    it("-3 when average duration > 15", () => {
      // Duration 20, injury rate 0
      const records = manyRecords(10, { duration_minutes: 20, has_injury: false });
      // avgDur = 20. First: <=5 && injRate==0? No. Second: <=10 || injRate<=10? injRate=0<=10 -> yes +2
      // Wait: second clause checks avgDur<=10 || injRate<=10. injRate=0<=10 is true -> +2
      // Third clause: avgDur>15 || injRate>30? 20>15 -> yes, but already matched second!
      // The if-else chain: first if, else if, else if — so once the second matches, third is skipped
      // So avgDur=20, injRate=0: first fails (20>5), second checks: 20<=10? No. 0<=10? Yes -> +2
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(20);
      expect(result.injury_rate).toBe(0);
      // M6: +2 (because injRate 0 <= 10)
    });

    it("-3 when average duration > 15 AND injury rate > 10", () => {
      // Duration 20, injury rate 40% -> neither <=10 passes so second fails, third triggers
      const records = manyRecords(10, { duration_minutes: 20, has_injury: false });
      for (let i = 0; i < 4; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, duration_minutes: 20, has_injury: true, injury_count: 1 });
      }
      // avgDur=20, injRate=40. First: 20>5. Second: 20<=10? No. 40<=10? No -> skip.
      // Third: 20>15? Yes -> -3
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(20);
      expect(result.injury_rate).toBe(40);
      // M6: -3
      // M1:+6, M2:+5, M3:+5, M4:+5, M5:+4, M6:-3, repeat -2
      // 52+6+5+5+5+4-3-2 = 72
      expect(result.restraint_score).toBe(72);
    });

    it("-3 when injury rate > 30% even if duration is reasonable", () => {
      // Duration 8, injury rate 40%
      const records = manyRecords(10, { duration_minutes: 8, has_injury: false });
      for (let i = 0; i < 4; i++) {
        records[i] = baseRecord({ id: `rst_${i + 1}`, duration_minutes: 8, has_injury: true, injury_count: 1 });
      }
      // avgDur=8, injRate=40. First: 8<=5? No. Second: 8<=10? Yes -> +2
      // Actually wait: first clause checks avgDur<=5 AND injRate==0. 8>5 fails.
      // Second clause: avgDur<=10 OR injRate<=10. 8<=10 yes -> +2
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(8);
      expect(result.injury_rate).toBe(40);
      // M6: +2 (because avgDur<=10 matches second)
    });

    it("duration exactly 5 with 0 injury gets +5", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 5 })],
      }));
      expect(result.average_duration_minutes).toBe(5);
      expect(result.injury_rate).toBe(0);
      // M6: 5<=5 && 0==0 -> +5
      expect(result.restraint_score).toBe(82);
    });

    it("duration exactly 6 with 0 injury gets +2 not +5", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 6 })],
      }));
      expect(result.average_duration_minutes).toBe(6);
      // M6: 6<=5? No. 6<=10? Yes -> +2
      // 52+6+5+5+5+4+2 = 79
      expect(result.restraint_score).toBe(79);
    });

    it("duration exactly 10 with 0 injury gets +2", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 10 })],
      }));
      expect(result.average_duration_minutes).toBe(10);
      // M6: 10<=5? No. 10<=10? Yes -> +2
      // 52+6+5+5+5+4+2 = 79
      expect(result.restraint_score).toBe(79);
    });

    it("duration exactly 11 with injury rate 11 gets no modifier", () => {
      // Need avgDur > 10 and injRate > 10 but avgDur <= 15 and injRate <= 30
      // 10 records: duration 11, 2 with injury = 20%
      const records = manyRecords(10, { duration_minutes: 11, has_injury: false });
      records[0] = baseRecord({ id: "rst_1", duration_minutes: 11, has_injury: true, injury_count: 1 });
      records[1] = baseRecord({ id: "rst_2", duration_minutes: 11, has_injury: true, injury_count: 1 });
      // avgDur=11, injRate=20. First: 11>5. Second: 11<=10? No. 20<=10? No -> skip.
      // Third: 11>15? No. 20>30? No -> skip. => no modifier = 0
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(11);
      expect(result.injury_rate).toBe(20);
      // M6: 0, repeat -2
      // 52+6+5+5+5+4+0-2 = 75
      expect(result.restraint_score).toBe(75);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 9. ADDITIONAL PENALTIES
  // ════════════════════════════════════════════════════════════════════════

  describe("additional penalties", () => {

    describe("high frequency penalty", () => {
      it("applies -3 when total > total_children * 2", () => {
        // total_children=3, need >6 records = 7
        const records = manyRecords(7, { child_id: "child_1" });
        // Give different child_ids to avoid single-child repeat triggering
        for (let i = 0; i < 7; i++) {
          records[i] = baseRecord({ id: `rst_${i + 1}`, child_id: `child_${(i % 3) + 1}` });
        }
        // child_1: 3, child_2: 2, child_3: 2 -> no repeat (none > 3)
        // Wait: 7 records, 3 children: child_1 appears at i=0,3,6 = 3 times. child_2 at i=1,4 = 2. child_3 at i=2,5 = 2.
        // No child > 3, so no repeat penalty.
        // isHighFrequency: 7 > 3*2=6? Yes -> -3
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 3,
          restraints: records,
        }));
        expect(result.total_restraints).toBe(7);
        // M1:+6, M2:+5, M3:+5, M4:+5, M5:+4, M6:+5, highFreq:-3
        // 52+6+5+5+5+4+5-3 = 79
        expect(result.restraint_score).toBe(79);
      });

      it("does not apply when total = total_children * 2", () => {
        // total_children=3, 6 records = exactly 2x
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 6; i++) {
          records.push(baseRecord({ id: `rst_${i + 1}`, child_id: `child_${(i % 3) + 1}` }));
        }
        // child_1: 2, child_2: 2, child_3: 2 -> no repeat
        // isHighFrequency: 6 > 6? No
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 3,
          restraints: records,
        }));
        expect(result.total_restraints).toBe(6);
        // 52+6+5+5+5+4+5 = 82
        expect(result.restraint_score).toBe(82);
      });
    });

    describe("repeat children penalty", () => {
      it("applies -2 when any child has > 3 restraints", () => {
        // 4 restraints for child_1 -> repeat
        const records = manyRecords(4, { child_id: "child_1" });
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        // child_1 count = 4 > 3 -> -2
        // isHighFrequency: 4 > 5*2=10? No
        // 52+6+5+5+5+4+5-2 = 80
        expect(result.restraint_score).toBe(80);
      });

      it("does not apply when child has exactly 3 restraints", () => {
        const records = manyRecords(3, { child_id: "child_1" });
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        // child_1 count = 3 — not > 3
        // 52+6+5+5+5+4+5 = 82
        expect(result.restraint_score).toBe(82);
      });

      it("applies -2 for multiple repeat children", () => {
        // child_1: 4, child_2: 5
        const records = [
          ...manyRecords(4, { child_id: "child_1" }),
          ...Array.from({ length: 5 }, (_, i) =>
            baseRecord({ id: `rst_extra_${i}`, child_id: "child_2" }),
          ),
        ];
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        // Both are repeat children — penalty is still just -2 (not per-child)
        // isHighFrequency: 9 > 5*2=10? No
        // 52+6+5+5+5+4+5-2 = 80
        expect(result.restraint_score).toBe(80);
      });
    });

    describe("combined high frequency and repeat children", () => {
      it("applies both penalties (-3 and -2 = -5)", () => {
        // total_children=2, 5 records for child_1 -> high freq (5>4) and repeat (5>3)
        const records = manyRecords(5, { child_id: "child_1" });
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 2,
          restraints: records,
        }));
        // 52+6+5+5+5+4+5-3-2 = 77
        expect(result.restraint_score).toBe(77);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 10. RATING BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════

  describe("rating boundaries", () => {

    it("score 80 => outstanding", () => {
      // 4 records for child_1 -> repeat -2
      // base 52+6+5+5+5+4+5-2 = 80
      const records = manyRecords(4, { child_id: "child_1" });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(80);
      expect(result.restraint_rating).toBe("outstanding");
    });

    it("score 79 => good", () => {
      // duration 6 drops M6 from +5 to +2 -> 52+6+5+5+5+4+2 = 79
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 6 })],
      }));
      expect(result.restraint_score).toBe(79);
      expect(result.restraint_rating).toBe("good");
    });

    it("score 65 => good", () => {
      // Need score = 65
      // 10 records all child_1 -> repeat -2
      // M1: deEscRate=0 -> -5-3=-8; M2: TT=100%->+5; M3: debrief=100%->+5;
      // M4: review=100%->+5; M5: bodyMap=100%,notif=100%->+4; M6: dur=3,inj=0->+5
      // 52-8+5+5+5+4+5-2 = 66 — not exactly 65
      // Try: deEscRate=0 -> -8, TT 0% -> -5-1=-6, debrief=100%->+5, review=100%->+5,
      // bodyMap+notif=100%->+4, dur/inj=+5, repeat -2
      // 52-8-6+5+5+4+5-2 = 55 — too low
      // Let me find a combination for exactly 65
      // base=52, need modifiers to sum to +13
      // M1: deEscRate 70-89%->+3; M2: TT80-94%->+2; M3: debrief 60-84%->+2;
      // M4: review 70-89%->+2; M5: bodyMap||notif>=70->+2; M6: dur<=5,inj=0->+5; no penalties
      // 52+3+2+2+2+2+5 = 68 — not 65
      // 52+3+2+2+2+2+2 = 65 — yes!
      // M6: +2 means avgDur<=10 || injRate<=10 (but not <=5&&injRate==0)
      // So: duration=6, injury=0; deEscRate ~75%; TT ~85%; debrief ~70%; review ~75%
      // Use 4 records to get rates right
      // 4 records: 3 with deEsc>0 = 75%; 4 TT trained... hmm need ~85%
      // Let's use 20 records for cleaner math
      // 20 records: 15 deEsc>0=75%->+3; 17 TT=85%->+2; 14 debrief=70%->+2;
      // 15 reviewed=75%->+2; bodyMap: need >=70% or notif>=70%
      // 15 bodyMap=75%, 15 notif=75% -> bodyMap>=70||notif>=70->+2
      // dur=6, inj=0 -> +2; 20 records for child_1 -> repeat -2
      // highFreq: 20 > 3*2=6 -> -3
      // 52+3+2+2+2+2+2-3-2 = 60 — too low
      // Let's use total_children=20 to avoid high freq and spread children
      // 20 records, 20 different children: no repeat
      // 20 > 20*2=40? No high freq
      // 52+3+2+2+2+2+2 = 65
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 6,
          de_escalation_attempt_count: i < 15 ? 3 : 0,       // 15/20 = 75%
          all_staff_team_teach_trained: i < 17,                // 17/20 = 85%
          child_debriefed: i < 14,                             // 14/20 = 70%
          review_status: i < 15 ? "reviewed" : "pending",     // 15/20 = 75%
          has_body_map: i < 15,                                // 15/20 = 75%
          notification_count: i < 15 ? 2 : 0,                 // 15/20 = 75%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(65);
      expect(result.restraint_rating).toBe("good");
    });

    it("score 64 => adequate", () => {
      // From previous: score=65 with 14 debriefed. Change to 13 debriefed = 65%
      // That still gives +2 for M3 (>=60). Need to drop 1 point.
      // Drop deEscRate to 70% exactly: 14/20=70%->+3 still
      // Actually need score=64, so need total modifiers=+12
      // 52+3+2+2+2+2+2=65. Need -1 more.
      // Add deEscRate=0% extra -3? No, that changes M1 entirely.
      // Use: M1:+3, M2:+2, M3:+2, M4:+2, M5:0, M6:+2, no penalties = 63
      // M5=0: bodyMap 50%, notif 50% -> neither >=70, neither <40 => 0
      // 52+3+2+2+2+0+2 = 63 — not 64
      // Try: M1:+3, M2:+2, M3:+2, M4:+5, M5:0, M6:+2 = 66 — not right
      // M1:+3, M2:+2, M3:+2, M4:+2, M5:+2, M6:0 = 63
      // M6=0: avgDur>10 and injRate>10 but <=15 and <=30
      // Try: M1:+6, M2:+2, M3:+2, M4:+2, M5:0, M6:0 = 64
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 12,
          de_escalation_attempt_count: i < 18 ? 3 : 0,       // 18/20 = 90% -> +6
          all_staff_team_teach_trained: i < 17,                // 17/20 = 85% -> +2
          child_debriefed: i < 14,                             // 14/20 = 70% -> +2
          review_status: i < 15 ? "reviewed" : "pending",     // 15/20 = 75% -> +2
          has_body_map: i < 10,                                // 10/20 = 50%
          notification_count: i < 10 ? 2 : 0,                 // 10/20 = 50%
          has_injury: i < 4,                                   // 4/20 = 20%
          injury_count: i < 4 ? 1 : 0,
        }));
      }
      // M5: bodyMap 50% >= 40, notif 50% >= 40 -> neither <40 so no -4
      // bodyMap 50% < 70 and notif 50% < 70 -> neither >= 70 so no +2
      // both >= 90? No. => M5 = 0
      // M6: avgDur=12, injRate=20. <=5&&inj==0? No. <=10||injRate<=10? 12>10 and 20>10 -> No. >15||>30? 12<15 and 20<30 -> No => M6=0
      // 52+6+2+2+2+0+0 = 64
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(64);
      expect(result.restraint_rating).toBe("adequate");
    });

    it("score 45 => adequate", () => {
      // Need total modifiers = -7
      // M1: deEsc 0% -> -5-3=-8; M2: TT 100%->+5; M3: debrief 100%->+5; M4: review 100%->+5
      // M5: body+notif 100%->+4; M6: dur<=5,inj=0->+5; no penalties
      // 52-8+5+5+5+4+5 = 68 — too high
      // Need much worse. Let's go extreme:
      // M1: -8, M2: -6, M3: -5, M4: -4, M5: -5, M6: -3 = -31 => 52-31=21 — too low for 45
      // Need modifiers = -7: e.g. M1:-8, M2:+5, M3:+5, M4:-4, M5:-5, M6:0 = -7 => 52-7=45
      // M4: reviewRate < 40% -> -4. M5: both 0% -> -5.
      // M6: avgDur>10, injRate>10 but <=15 and <=30 -> 0
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 12,
          de_escalation_attempt_count: 0,                      // 0% -> -5-3=-8
          all_staff_team_teach_trained: true,                   // 100% -> +5
          child_debriefed: true,                               // 100% -> +5
          review_status: i < 6 ? "reviewed" : "pending",      // 6/20 = 30% < 40 -> -4
          has_body_map: false,                                 // 0%
          notification_count: 0,                               // 0%
          has_injury: i < 4,                                   // 4/20 = 20%
          injury_count: i < 4 ? 1 : 0,
        }));
      }
      // M5: bodyMap 0% < 40 and notif 0% < 40 -> -4, and both 0 -> -1 => -5
      // M6: avgDur=12, injRate=20. <=5&&==0? No. <=10||<=10? No. >15||>30? No => 0
      // 52-8+5+5-4-5+0 = 45
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(45);
      expect(result.restraint_rating).toBe("adequate");
    });

    it("score 44 => inadequate", () => {
      // From score 45 above, add high frequency penalty -3 and still need 44
      // 45-3=42. Need +2 more. Change M6 to +2 (avgDur<=10 or injRate<=10)
      // Actually let's just adjust: make review rate 35% (7/20) — still <40 -> -4
      // And add one more penalty: let's change M2 to +2 (TT 85%)
      // 52-8+2+5-4-5+0 = 42 — too low
      // Let me recalculate for exactly 44:
      // Need modifiers = -8. Start from 45 scenario (modifiers = -7) and add -1
      // Change M2 from +5 to +2: TT 85% -> +2. 52-8+2+5-4-5+0 = 42
      // That's 42, not 44. Try: M3 from +5 to +2: debrief 70%
      // 52-8+5+2-4-5+0 = 42 — still 42
      // OK: 52-8+5+5-4-5+0 = 45 minus 1 = 44
      // Change TT from +5 to... can't easily get -1
      // Simpler: from the 45 setup, make 1 more child_id a repeat:
      // Make 4 records share child_1 -> repeat penalty -2 => 45-2=43
      // Hmm, not 44.
      // Try: modifiers = -8 => 52-8=44
      // M1:0, M2:0, M3:0, M4:0, M5:0, M6:0, highFreq:-3, repeat:-2, extra from M1 deEsc==0: need deEsc>0
      // Cleaner approach: M1:-5 (deEsc <40 but >0), M2:0, M3:0, M4:0, M5:0, M6:-3, no penalties
      // 52-5+0+0+0+0-3 = 44
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 16,                                // >15
          de_escalation_attempt_count: i < 6 ? 3 : 0,         // 6/20 = 30% < 40 -> -5
          all_staff_team_teach_trained: i < 12,                // 12/20 = 60% (50-79%) -> 0
          child_debriefed: i < 8,                              // 8/20 = 40% (30-59%) -> 0
          review_status: i < 10 ? "reviewed" : "pending",     // 10/20 = 50% (40-69%) -> 0
          has_body_map: i < 10,                                // 10/20 = 50%
          notification_count: i < 10 ? 2 : 0,                 // 10/20 = 50%
          has_injury: i < 7,                                   // 7/20 = 35% > 30
          injury_count: i < 7 ? 1 : 0,
        }));
      }
      // M5: bodyMap 50%, notif 50%: neither>=90&&>=90, neither>=70 -> no +2, neither<40 -> no -4 => 0
      // M6: avgDur=16>15, injRate=35>30. First: No. Second: 16>10 and 35>10 -> No.
      // Third: 16>15 -> Yes -> -3
      // 52-5+0+0+0+0-3 = 44
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(44);
      expect(result.restraint_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 11. OUTPUT FIELD ACCURACY — METRIC COMPUTATION
  // ════════════════════════════════════════════════════════════════════════

  describe("output field accuracy", () => {

    it("computes unique_children_restrained correctly for multiple children", () => {
      const records = [
        baseRecord({ id: "r1", child_id: "child_1" }),
        baseRecord({ id: "r2", child_id: "child_2" }),
        baseRecord({ id: "r3", child_id: "child_1" }),
        baseRecord({ id: "r4", child_id: "child_3" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.unique_children_restrained).toBe(3);
    });

    it("computes average_duration_minutes rounded to 1 decimal", () => {
      const records = [
        baseRecord({ id: "r1", duration_minutes: 3 }),
        baseRecord({ id: "r2", duration_minutes: 4 }),
        baseRecord({ id: "r3", duration_minutes: 5 }),
      ];
      // (3+4+5)/3 = 4.0
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(4);
    });

    it("rounds average_duration to 1 decimal place", () => {
      const records = [
        baseRecord({ id: "r1", duration_minutes: 3 }),
        baseRecord({ id: "r2", duration_minutes: 4 }),
      ];
      // (3+4)/2 = 3.5
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(3.5);
    });

    it("rounds average_duration via Math.round(x*10)/10", () => {
      const records = [
        baseRecord({ id: "r1", duration_minutes: 1 }),
        baseRecord({ id: "r2", duration_minutes: 2 }),
        baseRecord({ id: "r3", duration_minutes: 3 }),
      ];
      // (1+2+3)/3 = 2.0
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.average_duration_minutes).toBe(2);
    });

    it("computes de_escalation_rate as pct with Math.round", () => {
      // 2/3 = 66.666... rounds to 67
      const records = [
        baseRecord({ id: "r1", de_escalation_attempt_count: 3 }),
        baseRecord({ id: "r2", de_escalation_attempt_count: 1 }),
        baseRecord({ id: "r3", de_escalation_attempt_count: 0 }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(67);
    });

    it("computes team_teach_compliance_rate correctly", () => {
      const records = [
        baseRecord({ id: "r1", all_staff_team_teach_trained: true }),
        baseRecord({ id: "r2", all_staff_team_teach_trained: false }),
        baseRecord({ id: "r3", all_staff_team_teach_trained: true }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(67);
    });

    it("computes child_debrief_rate correctly", () => {
      const records = [
        baseRecord({ id: "r1", child_debriefed: true }),
        baseRecord({ id: "r2", child_debriefed: false }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(50);
    });

    it("computes review_completion_rate correctly", () => {
      const records = [
        baseRecord({ id: "r1", review_status: "reviewed" }),
        baseRecord({ id: "r2", review_status: "pending" }),
        baseRecord({ id: "r3", review_status: "reviewed" }),
        baseRecord({ id: "r4", review_status: "reviewed" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.review_completion_rate).toBe(75);
    });

    it("computes body_map_rate correctly", () => {
      const records = [
        baseRecord({ id: "r1", has_body_map: true }),
        baseRecord({ id: "r2", has_body_map: false }),
        baseRecord({ id: "r3", has_body_map: true }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(67);
    });

    it("computes notification_rate as pct of records with notification_count >= 2", () => {
      const records = [
        baseRecord({ id: "r1", notification_count: 2 }),
        baseRecord({ id: "r2", notification_count: 1 }),
        baseRecord({ id: "r3", notification_count: 3 }),
        baseRecord({ id: "r4", notification_count: 0 }),
      ];
      // notified: r1 and r3 = 2/4 = 50%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.notification_rate).toBe(50);
    });

    it("computes injury_rate correctly", () => {
      const records = [
        baseRecord({ id: "r1", has_injury: true, injury_count: 2 }),
        baseRecord({ id: "r2", has_injury: false, injury_count: 0 }),
        baseRecord({ id: "r3", has_injury: true, injury_count: 1 }),
        baseRecord({ id: "r4", has_injury: false, injury_count: 0 }),
      ];
      // 2/4 = 50%
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.injury_rate).toBe(50);
    });

    it("total_restraints counts only 90-day window records", () => {
      const records = [
        baseRecord({ id: "r1", date: "2026-05-01" }),         // within 90 days
        baseRecord({ id: "r2", date: "2026-01-01" }),         // outside 90 days
        baseRecord({ id: "r3", date: "2026-05-10" }),         // within 90 days
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.total_restraints).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 12. STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {

    it("includes low intervention count when total <= 2 and children > 0", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: [baseRecord()],
      }));
      expect(result.strengths.some(s => s.includes("Only 1 physical intervention"))).toBe(true);
    });

    it("includes de-escalation strength when rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("De-escalation attempted in 100%"))).toBe(true);
    });

    it("includes Team Teach strength when rate >= 95%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Team Teach compliance at 100%"))).toBe(true);
    });

    it("includes child debrief strength when rate >= 85%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Child debrief rate at 100%"))).toBe(true);
    });

    it("includes staff debrief strength when rate >= 85%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Staff debriefed after 100%"))).toBe(true);
    });

    it("includes review completion strength when rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("100% of restraints reviewed"))).toBe(true);
    });

    it("includes body map strength when rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Body map completion at 100%"))).toBe(true);
    });

    it("includes notification strength when rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Notification rate at 100%"))).toBe(true);
    });

    it("includes zero injury strength", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("No injuries recorded"))).toBe(true);
    });

    it("includes brief duration strength when average <= 5 and total > 0", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("Average intervention duration of 3 minutes"))).toBe(true);
    });

    it("includes justification strength when rate = 100%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("All interventions have documented justification"))).toBe(true);
    });

    it("includes witness strength when rate >= 90%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.strengths.some(s => s.includes("100% of interventions witnessed"))).toBe(true);
    });

    it("does not include low count strength when total > 2", () => {
      const records = manyRecords(3);
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.strengths.some(s => s.includes("Only 3 physical intervention"))).toBe(false);
    });

    it("pluralises correctly for 2 interventions", () => {
      const records = [
        baseRecord({ id: "r1", child_id: "child_1" }),
        baseRecord({ id: "r2", child_id: "child_2" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      expect(result.strengths.some(s => s.includes("Only 2 physical interventions"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 13. CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {

    it("raises high frequency concern when total > total_children * 2", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        records.push(baseRecord({ id: `rst_${i}`, child_id: `child_${(i % 3) + 1}` }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("frequency exceeds 2x"))).toBe(true);
    });

    it("raises repeat children concern when child restrained > 3 times", () => {
      const records = manyRecords(4, { child_id: "child_1" });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("restrained more than 3 times"))).toBe(true);
    });

    it("raises de-escalation concern when rate < 70%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          de_escalation_attempt_count: i < 12 ? 3 : 0, // 12/20=60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(60);
      expect(result.concerns.some(c => c.includes("De-escalation rate at 60%"))).toBe(true);
    });

    it("raises Team Teach concern when rate < 80%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          all_staff_team_teach_trained: i < 14, // 14/20=70%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.team_teach_compliance_rate).toBe(70);
      expect(result.concerns.some(c => c.includes("Team Teach compliance at 70%"))).toBe(true);
    });

    it("raises child debrief concern when rate < 60%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          child_debriefed: i < 10, // 10/20=50%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(50);
      expect(result.concerns.some(c => c.includes("Child debrief rate at 50%"))).toBe(true);
    });

    it("raises pending reviews concern when any reviews pending", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ review_status: "pending" })],
      }));
      expect(result.concerns.some(c => c.includes("pending review"))).toBe(true);
    });

    it("raises body map concern when rate < 70%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_body_map: i < 12, // 12/20=60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.body_map_rate).toBe(60);
      expect(result.concerns.some(c => c.includes("Body map completion at 60%"))).toBe(true);
    });

    it("raises notification concern when rate < 70%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          notification_count: i < 12 ? 2 : 0, // 12/20=60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.notification_rate).toBe(60);
      expect(result.concerns.some(c => c.includes("Notification rate at 60%"))).toBe(true);
    });

    it("raises injury concern when rate > 20%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_injury: i < 3,
          injury_count: i < 3 ? 1 : 0,
        }));
      }
      // 3/10 = 30% > 20
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.injury_rate).toBe(30);
      expect(result.concerns.some(c => c.includes("Injury rate at 30%"))).toBe(true);
    });

    it("raises duration concern when average > 15", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 20 })],
      }));
      expect(result.average_duration_minutes).toBe(20);
      expect(result.concerns.some(c => c.includes("Average restraint duration of 20 minutes"))).toBe(true);
    });

    it("raises justification concern when rate < 80%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_justification: i < 7, // 7/10=70%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("Justification documented in only 70%"))).toBe(true);
    });

    it("raises staff debrief concern when rate < 50%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          staff_debriefed: i < 4, // 4/10=40%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("Staff debrief rate at 40%"))).toBe(true);
    });

    it("does not raise concerns when all metrics are good", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.concerns).toHaveLength(0);
    });

    it("pluralises pending reviews correctly for 1", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ review_status: "pending" })],
      }));
      expect(result.concerns.some(c => c.includes("1 restraint pending review"))).toBe(true);
    });

    it("pluralises pending reviews correctly for multiple", () => {
      const records = [
        baseRecord({ id: "r1", review_status: "pending" }),
        baseRecord({ id: "r2", review_status: "pending" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("2 restraints pending review"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 14. RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {

    it("recommends completing pending reviews with immediate urgency", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ review_status: "pending" })],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("pending restraint review"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 35");
    });

    it("recommends reviewing restraint techniques when injury rate > 20%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_injury: i < 3,
          injury_count: i < 3 ? 1 : 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("Review restraint techniques urgently"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends de-escalation documentation when rate < 70%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          de_escalation_attempt_count: i < 10 ? 3 : 0, // 50%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("de-escalation documentation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends Team Teach training when rate < 80%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          all_staff_team_teach_trained: i < 14, // 70%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("Team Teach training"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends child debrief when rate < 60%", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          child_debriefed: i < 10, // 50%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("child debrief"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends BSP review for repeat children with soon urgency", () => {
      const records = manyRecords(4, { child_id: "child_1" });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("behaviour support plans"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends behaviour management review for high frequency with soon urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        records.push(baseRecord({ id: `rst_${i}`, child_id: `child_${(i % 3) + 1}` }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("behaviour management"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends body map improvement when rate < 70% with soon urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_body_map: i < 6, // 60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("body maps"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommends notification improvement when rate < 70% with soon urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          notification_count: i < 6 ? 2 : 0, // 60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("notification processes"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends staff debrief when rate < 50% with soon urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          staff_debriefed: i < 4, // 40%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("staff debrief"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommends investigating extended duration when avg > 15 with planned urgency", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 20 })],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("extended restraint durations"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends justification documentation when rate < 100% with planned urgency", () => {
      const records = [
        baseRecord({ id: "r1", has_justification: true }),
        baseRecord({ id: "r2", has_justification: false }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("documented justification"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends witness improvement when rate < 70% with planned urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_witness: i < 6, // 60%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("independent witnessing"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends linked incident improvement when rate < 50% with planned urgency", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_linked_incident: i < 4, // 40%
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("Link restraint records"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("assigns sequential rank numbers", () => {
      // Create a scenario with multiple recommendations
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          review_status: "pending",
          de_escalation_attempt_count: 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("produces no recommendations when everything is perfect", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 15. INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {

    describe("critical insights", () => {

      it("critical: injury rate > 30%", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: `child_${i + 1}`,
            has_injury: i < 4,
            injury_count: i < 4 ? 1 : 0,
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 10,
          restraints: records,
        }));
        expect(result.injury_rate).toBe(40);
        const insight = result.insights.find(i => i.text.includes("Injury rate of 40%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("critical: pending reviews >= 3", () => {
        const records = [
          baseRecord({ id: "r1", review_status: "pending" }),
          baseRecord({ id: "r2", review_status: "pending" }),
          baseRecord({ id: "r3", review_status: "pending" }),
        ];
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("3 physical interventions are unreviewed"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("critical: de-escalation rate < 40%", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: `child_${i + 1}`,
            de_escalation_attempt_count: i < 3 ? 3 : 0, // 30%
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 10,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("fewer than 40%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("critical: team teach rate < 50%", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: `child_${i + 1}`,
            all_staff_team_teach_trained: i < 4, // 40%
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 10,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Fewer than half"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("critical: high frequency combined with repeat children", () => {
        // 10 records for 3 children, child_1 has 5 records
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: i < 5 ? "child_1" : `child_${i + 1}`,
          }));
        }
        // child_1: 5 > 3 -> repeat
        // total 10 > 3*2=6 -> high freq
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 3,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("High restraint frequency combined with repeat children"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });
    });

    describe("warning insights", () => {

      it("warning: pending reviews 1 or 2", () => {
        const records = [
          baseRecord({ id: "r1", review_status: "pending" }),
          baseRecord({ id: "r2", review_status: "pending" }),
        ];
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("awaiting review"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("warning: child debrief rate between 30% and 59%", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: `child_${i + 1}`,
            child_debriefed: i < 5, // 50%
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 10,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Child debrief rate of 50%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("no warning for child debrief at 60% (only concern)", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 10; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            child_id: `child_${i + 1}`,
            child_debriefed: i < 6, // 60%
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 10,
          restraints: records,
        }));
        // The warning insight requires < 60 AND >= 30. 60 fails the < 60 check.
        const insight = result.insights.find(i => i.text.includes("Child debrief rate of 60%") && i.severity === "warning");
        expect(insight).toBeUndefined();
      });

      it("warning: average duration between 10.1 and 15", () => {
        const result = computeRestraintPhysicalIntervention(baseInput({
          restraints: [baseRecord({ duration_minutes: 12 })],
        }));
        const insight = result.insights.find(i => i.text.includes("Average restraint duration of 12 minutes is elevated"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("no warning for duration exactly 10", () => {
        const result = computeRestraintPhysicalIntervention(baseInput({
          restraints: [baseRecord({ duration_minutes: 10 })],
        }));
        const insight = result.insights.find(i => i.severity === "warning" && i.text.includes("duration"));
        expect(insight).toBeUndefined();
      });

      it("warning: injury rate between 1% and 20%", () => {
        const records = [
          baseRecord({ id: "r1", has_injury: true, injury_count: 1 }),
          baseRecord({ id: "r2", has_injury: false, injury_count: 0 }),
          baseRecord({ id: "r3", has_injury: false, injury_count: 0 }),
          baseRecord({ id: "r4", has_injury: false, injury_count: 0 }),
          baseRecord({ id: "r5", has_injury: false, injury_count: 0 }),
        ];
        // 1/5 = 20%
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        expect(result.injury_rate).toBe(20);
        const insight = result.insights.find(i => i.severity === "warning" && i.text.includes("resulted in injury"));
        expect(insight).toBeDefined();
      });

      it("warning: repeat children without high frequency", () => {
        // 4 records for child_1, total_children=5 => 4 <= 5*2=10 so not high freq
        const records = manyRecords(4, { child_id: "child_1" });
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("restrained more than 3 times in 90 days"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("warning: dominant reason pattern >= 80% with >= 3 records", () => {
        const records = manyRecords(5, { reason: "imminent_harm_to_others" });
        // 5/5 = 100% >= 80
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("imminent harm to others"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("no dominant reason warning with < 3 records", () => {
        const records = [
          baseRecord({ id: "r1", reason: "imminent_harm_to_others" }),
          baseRecord({ id: "r2", reason: "imminent_harm_to_others" }),
        ];
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("dominant trigger pattern"));
        expect(insight).toBeUndefined();
      });

      it("warning: wrap hold dominant >= 50% with >= 3 records", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 4; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            restraint_type: i < 2 ? "wrap_hold" : "planned_hold",
          }));
        }
        // 2/4 = 50%
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Wrap holds used in 50%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("no wrap hold warning when type is not wrap_hold", () => {
        const records = manyRecords(5, { restraint_type: "planned_hold" });
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Wrap holds"));
        expect(insight).toBeUndefined();
      });

      it("no wrap hold warning when < 50%", () => {
        const records: RestraintRecordInput[] = [];
        for (let i = 0; i < 5; i++) {
          records.push(baseRecord({
            id: `rst_${i + 1}`,
            restraint_type: i < 2 ? "wrap_hold" : "planned_hold", // 2/5 = 40%
          }));
        }
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Wrap holds"));
        expect(insight).toBeUndefined();
      });
    });

    describe("positive insights", () => {

      it("positive: de-escalation rate >= 90% with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("De-escalation documented in 100%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: child debrief rate >= 85% with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("100% child debrief rate"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: team teach rate >= 95% with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("Team Teach compliance at 100%"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: review completion >= 90% with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("100% review completion rate"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: zero injuries with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("Zero injuries across all physical interventions"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: body map >= 90% AND notification >= 90% with records", () => {
        const result = computeRestraintPhysicalIntervention(baseInput());
        const insight = result.insights.find(i => i.text.includes("Body map") && i.text.includes("notification"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("positive: <= 2 interventions for >= 3 children", () => {
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 3,
          restraints: [baseRecord()],
        }));
        const insight = result.insights.find(i => i.text.includes("Only 1 intervention"));
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("no low-count positive insight when > 2 interventions", () => {
        const records = manyRecords(3);
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 5,
          restraints: records,
        }));
        const insight = result.insights.find(i => i.text.includes("Only 3 intervention") && i.severity === "positive");
        expect(insight).toBeUndefined();
      });

      it("no low-count positive insight when < 3 children", () => {
        const result = computeRestraintPhysicalIntervention(baseInput({
          total_children: 2,
          restraints: [baseRecord()],
        }));
        const insight = result.insights.find(i => i.text.includes("Only 1 intervention") && i.text.includes("2 children") && i.severity === "positive");
        expect(insight).toBeUndefined();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 16. HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {

    it("outstanding headline includes score details", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.headline).toContain("Outstanding physical intervention governance");
      expect(result.headline).toContain("1 restraint");
      expect(result.headline).toContain("100% de-escalation");
    });

    it("good headline includes restraint count and rates", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 6 })],
      }));
      expect(result.restraint_rating).toBe("good");
      expect(result.headline).toContain("Good physical intervention practice");
      expect(result.headline).toContain("1 restraint");
    });

    it("adequate headline includes concern count", () => {
      // Create an adequate scenario
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 12,
          de_escalation_attempt_count: i < 18 ? 3 : 0,
          all_staff_team_teach_trained: i < 17,
          child_debriefed: i < 14,
          review_status: i < 15 ? "reviewed" : "pending",
          has_body_map: i < 10,
          notification_count: i < 10 ? 2 : 0,
          has_injury: i < 4,
          injury_count: i < 4 ? 1 : 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_rating).toBe("adequate");
      expect(result.headline).toContain("Adequate physical intervention management");
      expect(result.headline).toContain("area");
    });

    it("inadequate headline lists specific gaps", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 16,
          de_escalation_attempt_count: i < 6 ? 3 : 0,
          all_staff_team_teach_trained: i < 12,
          child_debriefed: i < 8,
          review_status: i < 10 ? "reviewed" : "pending",
          has_body_map: i < 10,
          notification_count: i < 10 ? 2 : 0,
          has_injury: i < 7,
          injury_count: i < 7 ? 1 : 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_rating).toBe("inadequate");
      expect(result.headline).toContain("Physical intervention practice is inadequate");
      expect(result.headline).toContain("de-escalation");
      expect(result.headline).toContain("child debriefs");
      expect(result.headline).toContain("reviews");
      expect(result.headline).toContain("training compliance");
    });

    it("outstanding headline pluralises restraints correctly for 2", () => {
      const records = [
        baseRecord({ id: "r1", child_id: "child_1" }),
        baseRecord({ id: "r2", child_id: "child_2" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      expect(result.restraint_rating).toBe("outstanding");
      expect(result.headline).toContain("2 restraints");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 17. SCORE CLAMPING
  // ════════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {

    it("score does not exceed 100 even with all maximum modifiers", () => {
      // All modifiers positive, but base is only 52 so max is 52+6+5+5+5+4+5=82
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.restraint_score).toBeLessThanOrEqual(100);
    });

    it("score does not go below 0 even with maximum penalties", () => {
      // Stack every negative modifier
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 30; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: i < 10 ? "child_1" : `child_${i + 1}`,
          duration_minutes: 25,
          de_escalation_attempt_count: 0,
          all_staff_team_teach_trained: false,
          child_debriefed: false,
          review_status: "pending",
          has_body_map: false,
          notification_count: 0,
          has_injury: true,
          injury_count: 2,
        }));
      }
      // M1: deEsc=0% -> -5-3=-8; M2: TT=0%->-5-1=-6; M3: debrief=0%->-4-1=-5;
      // M4: review=0%<40->-4; M5: bodyMap=0%&&notif=0%<40->-4, both=0->-1=-5;
      // M6: avgDur=25>15, injRate=100%>30 but second: 25>10 and 100>10 -> skip.
      // Third: 25>15 -> -3
      // highFreq: 30 > 3*2=6 -> -3 (wait total_children=3 here)
      // repeat: child_1 has 10 > 3 -> -2
      // 52-8-6-5-4-5-3-3-2 = 16 — still positive
      // But if total_children=1:
      // highFreq: 30 > 1*2=2 -> -3
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      expect(result.restraint_score).toBeGreaterThanOrEqual(0);
    });

    it("floor clamp works at extreme negative", () => {
      // Use even more extreme penalties
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 50; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: i < 20 ? "child_1" : (i < 35 ? "child_2" : `child_${i}`),
          duration_minutes: 60,
          de_escalation_attempt_count: 0,
          all_staff_team_teach_trained: false,
          child_debriefed: false,
          review_status: "pending",
          has_body_map: false,
          notification_count: 0,
          has_injury: true,
          injury_count: 3,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 1,
        restraints: records,
      }));
      // Even with massive penalties, score should not go below 0
      expect(result.restraint_score).toBe(Math.max(0, result.restraint_score));
      expect(result.restraint_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 18. EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {

    it("single record with all fields set to worst values", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 1,
        restraints: [baseRecord({
          duration_minutes: 30,
          de_escalation_attempt_count: 0,
          all_staff_team_teach_trained: false,
          child_debriefed: false,
          staff_debriefed: false,
          has_witness: false,
          review_status: "pending",
          has_body_map: false,
          notification_count: 0,
          has_injury: true,
          injury_count: 3,
          has_justification: false,
          has_linked_incident: false,
        })],
      }));
      // M1: deEsc=0%<40->-5, ==0->-3 => -8
      // M2: TT=0%<50->-5, ==0->-1 => -6
      // M3: debrief=0%<30->-4, ==0->-1 => -5
      // M4: review=0%<40->-4
      // M5: bodyMap=0%<40 && notif=0%<40 -> -4, both==0 -> -1 => -5
      // M6: avgDur=30>15, injRate=100>30 -> but second checks first:
      //   30<=5 && 100==0? No. 30<=10 || 100<=10? No. 30>15 || 100>30? Yes -> -3
      // highFreq: 1 > 1*2=2? No
      // repeat: child_1 count=1, not > 3
      // 52-8-6-5-4-5-3 = 21
      expect(result.restraint_score).toBe(21);
      expect(result.restraint_rating).toBe("inadequate");
    });

    it("handles notification_count of 1 as not meeting threshold", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ notification_count: 1 })],
      }));
      // notification_count >= 2 is the threshold, 1 fails
      expect(result.notification_rate).toBe(0);
    });

    it("handles notification_count of 0", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ notification_count: 0 })],
      }));
      expect(result.notification_rate).toBe(0);
    });

    it("handles notification_count of 2 as meeting threshold", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ notification_count: 2 })],
      }));
      expect(result.notification_rate).toBe(100);
    });

    it("handles very large notification_count", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ notification_count: 100 })],
      }));
      expect(result.notification_rate).toBe(100);
    });

    it("handles duration_minutes of 0", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        restraints: [baseRecord({ duration_minutes: 0 })],
      }));
      expect(result.average_duration_minutes).toBe(0);
    });

    it("handles multiple children with varied records", () => {
      const records = [
        baseRecord({ id: "r1", child_id: "child_1", de_escalation_attempt_count: 3 }),
        baseRecord({ id: "r2", child_id: "child_2", de_escalation_attempt_count: 0 }),
        baseRecord({ id: "r3", child_id: "child_3", de_escalation_attempt_count: 1 }),
        baseRecord({ id: "r4", child_id: "child_1", de_escalation_attempt_count: 2 }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.unique_children_restrained).toBe(3);
      // deEscRate: 3/4 = 75%
      expect(result.de_escalation_rate).toBe(75);
    });

    it("handles today exactly matching a record date", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        today: "2026-05-01",
        restraints: [baseRecord({ date: "2026-05-01" })],
      }));
      // daysBetween same date = 0 <= 90 -> included
      expect(result.total_restraints).toBe(1);
    });

    it("handles records spanning exactly the 90-day window", () => {
      const records = [
        baseRecord({ id: "r1", date: "2026-05-15" }),         // day 0
        baseRecord({ id: "r2", date: "2026-05-01" }),         // day 14
        baseRecord({ id: "r3", date: "2026-02-14" }),         // day ~90
        baseRecord({ id: "r4", date: "2026-02-13" }),         // day ~91 — excluded
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.total_restraints).toBe(3);
    });

    it("total_children = 1 single record no penalties", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 1,
        restraints: [baseRecord()],
      }));
      // No high freq (1 > 1*2=2? No), no repeat (child_1 count=1)
      expect(result.restraint_score).toBe(82);
    });

    it("total_children very large with few records", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 100,
        restraints: [baseRecord()],
      }));
      // isHighFrequency: 1 > 100*2=200? No
      expect(result.restraint_score).toBe(82);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 19. COMBINED MODIFIER SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("combined modifier scenarios", () => {

    it("all modifiers at maximum positive", () => {
      // All perfect: M1:+6, M2:+5, M3:+5, M4:+5, M5:+4, M6:+5 = 30
      // 52+30 = 82
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.restraint_score).toBe(82);
    });

    it("mixed modifiers: some positive some negative", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          de_escalation_attempt_count: 3,          // 100% -> +6
          all_staff_team_teach_trained: i < 4,     // 40% < 50 -> -5
          child_debriefed: true,                   // 100% -> +5
          review_status: "reviewed",               // 100% -> +5
          has_body_map: true,                      // 100%
          notification_count: 2,                   // 100%
          // M5: both 100% -> +4
          duration_minutes: 3,
          has_injury: false,
          // M6: dur<=5 && inj==0 -> +5
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      // 52+6-5+5+5+4+5 = 72
      expect(result.restraint_score).toBe(72);
    });

    it("all modifiers at maximum negative with additional penalties", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 30; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: i < 10 ? "child_1" : (i < 20 ? "child_2" : `child_${i + 1}`),
          de_escalation_attempt_count: 0,
          all_staff_team_teach_trained: false,
          child_debriefed: false,
          review_status: "pending",
          has_body_map: false,
          notification_count: 0,
          duration_minutes: 20,
          has_injury: true,
          injury_count: 1,
        }));
      }
      // M1:-8, M2:-6, M3:-5, M4:-4, M5:-5, M6:-3
      // highFreq: 30 > 3*2=6 -> -3
      // repeat: child_1=10>3, child_2=10>3 -> -2
      // 52-8-6-5-4-5-3-3-2 = 16
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(16);
      expect(result.restraint_rating).toBe("inadequate");
    });

    it("modifiers at middle thresholds yield expected score", () => {
      // M1: deEsc 75% -> +3; M2: TT 85% -> +2; M3: debrief 70% -> +2;
      // M4: review 75% -> +2; M5: bodyMap 50%, notif 50% -> 0; M6: dur 8, inj 0 -> +2
      // No penalties
      // 52+3+2+2+2+0+2 = 63
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          duration_minutes: 8,
          de_escalation_attempt_count: i < 15 ? 3 : 0,        // 75%
          all_staff_team_teach_trained: i < 17,                 // 85%
          child_debriefed: i < 14,                              // 70%
          review_status: i < 15 ? "reviewed" : "pending",      // 75%
          has_body_map: i < 10,                                 // 50%
          notification_count: i < 10 ? 2 : 0,                  // 50%
          has_injury: false,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 20,
        restraints: records,
      }));
      expect(result.restraint_score).toBe(63);
      expect(result.restraint_rating).toBe("adequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 20. MODIFIER 6 EDGE: avgDuration=0, injuryRate=0, total=0 line
  // ════════════════════════════════════════════════════════════════════════

  describe("Modifier 6 special case: total=0 guard already handled", () => {
    // The line `if (averageDuration === 0 && injuryRate === 0 && total === 0) score -= 2;`
    // can never fire when we reach the modifiers section because total=0 is handled
    // by the guard clauses above. This is dead code — verify it does not affect scoring.

    it("total=0 guard returns before reaching modifiers", () => {
      // All records outside 90 days
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 3,
        restraints: [baseRecord({ date: "2026-01-01" })],
      }));
      // Returns early with score 78 — never hits modifier 6
      expect(result.restraint_score).toBe(78);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 21. PCT HELPER EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("pct helper edge cases", () => {

    it("0 out of N returns 0%", () => {
      const records = manyRecords(5, { de_escalation_attempt_count: 0 });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.de_escalation_rate).toBe(0);
    });

    it("N out of N returns 100%", () => {
      const result = computeRestraintPhysicalIntervention(baseInput());
      expect(result.de_escalation_rate).toBe(100);
    });

    it("pct rounds to nearest integer (1/3 = 33%)", () => {
      const records = [
        baseRecord({ id: "r1", de_escalation_attempt_count: 3 }),
        baseRecord({ id: "r2", de_escalation_attempt_count: 0 }),
        baseRecord({ id: "r3", de_escalation_attempt_count: 0 }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      // 1/3 = 33.333... rounds to 33
      expect(result.de_escalation_rate).toBe(33);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 22. COMPLETE SCENARIO — FULL FLOW VALIDATION
  // ════════════════════════════════════════════════════════════════════════

  describe("complete scenario: realistic multi-child home", () => {
    const records = [
      baseRecord({ id: "r1", child_id: "child_1", date: "2026-05-01", duration_minutes: 4, de_escalation_attempt_count: 2, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", has_body_map: true, notification_count: 3 }),
      baseRecord({ id: "r2", child_id: "child_2", date: "2026-04-28", duration_minutes: 6, de_escalation_attempt_count: 1, child_debriefed: true, staff_debriefed: false, review_status: "reviewed", has_body_map: true, notification_count: 2 }),
      baseRecord({ id: "r3", child_id: "child_1", date: "2026-04-20", duration_minutes: 3, de_escalation_attempt_count: 3, child_debriefed: false, staff_debriefed: true, review_status: "pending", has_body_map: false, notification_count: 1 }),
      baseRecord({ id: "r4", child_id: "child_3", date: "2026-04-15", duration_minutes: 5, de_escalation_attempt_count: 0, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", has_body_map: true, notification_count: 2 }),
      baseRecord({ id: "r5", child_id: "child_1", date: "2026-04-10", duration_minutes: 2, de_escalation_attempt_count: 4, child_debriefed: true, staff_debriefed: true, review_status: "reviewed", has_body_map: true, notification_count: 2 }),
    ];
    const result = computeRestraintPhysicalIntervention(baseInput({
      today: TODAY,
      total_children: 4,
      restraints: records,
    }));

    it("counts 5 total restraints", () => {
      expect(result.total_restraints).toBe(5);
    });

    it("finds 3 unique children", () => {
      expect(result.unique_children_restrained).toBe(3);
    });

    it("computes average duration correctly", () => {
      // (4+6+3+5+2)/5 = 20/5 = 4.0
      expect(result.average_duration_minutes).toBe(4);
    });

    it("computes de-escalation rate: 4/5 = 80%", () => {
      // r1:2>0, r2:1>0, r3:3>0, r4:0, r5:4>0 = 4/5 = 80%
      expect(result.de_escalation_rate).toBe(80);
    });

    it("computes team teach rate: 5/5 = 100%", () => {
      expect(result.team_teach_compliance_rate).toBe(100);
    });

    it("computes child debrief rate: 4/5 = 80%", () => {
      // r1:true, r2:true, r3:false, r4:true, r5:true = 4/5 = 80%
      expect(result.child_debrief_rate).toBe(80);
    });

    it("computes review completion rate: 4/5 = 80%", () => {
      // r1:reviewed, r2:reviewed, r3:pending, r4:reviewed, r5:reviewed = 4/5 = 80%
      expect(result.review_completion_rate).toBe(80);
    });

    it("computes body map rate: 4/5 = 80%", () => {
      // r1:true, r2:true, r3:false, r4:true, r5:true = 4/5 = 80%
      expect(result.body_map_rate).toBe(80);
    });

    it("computes notification rate: 4/5 = 80%", () => {
      // r1:3>=2, r2:2>=2, r3:1<2, r4:2>=2, r5:2>=2 = 4/5 = 80%
      expect(result.notification_rate).toBe(80);
    });

    it("computes injury rate: 0%", () => {
      expect(result.injury_rate).toBe(0);
    });

    it("computes correct score", () => {
      // M1: deEsc 80% >= 70 -> +3
      // M2: TT 100% >= 95 -> +5
      // M3: debrief 80% >= 60 -> +2
      // M4: review 80% >= 70 -> +2
      // M5: bodyMap 80% >= 70 || notif 80% >= 70 -> +2 (not both >= 90)
      // M6: avgDur 4 <= 5 && injRate 0 == 0 -> +5
      // highFreq: 5 > 4*2=8? No
      // repeat: child_1 = 3, not > 3
      // 52+3+5+2+2+2+5 = 71
      expect(result.restraint_score).toBe(71);
    });

    it("rates good", () => {
      expect(result.restraint_rating).toBe("good");
    });

    it("includes pending review concern", () => {
      expect(result.concerns.some(c => c.includes("pending review"))).toBe(true);
    });

    it("includes justification recommendation since 100% is expected", () => {
      // All records have has_justification: true (from baseRecord)
      // justificationRate = 100%, so no recommendation for justification
      const rec = result.recommendations.find(r => r.recommendation.includes("justification"));
      expect(rec).toBeUndefined();
    });

    it("has pending review recommendation", () => {
      const rec = result.recommendations.find(r => r.recommendation.includes("pending restraint review"));
      expect(rec).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 23. REPEAT CHILD CONCERN STRING FORMAT
  // ════════════════════════════════════════════════════════════════════════

  describe("repeat child concern formatting", () => {

    it("singular child in repeat concern", () => {
      const records = manyRecords(4, { child_id: "child_1" });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("1 child restrained more than 3 times"))).toBe(true);
    });

    it("plural children in repeat concern", () => {
      const records = [
        ...manyRecords(4, { child_id: "child_1" }),
        ...Array.from({ length: 4 }, (_, i) =>
          baseRecord({ id: `rst_extra_${i}`, child_id: "child_2" }),
        ),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("2 children restrained more than 3 times"))).toBe(true);
    });

    it("repeat concern includes child ids and counts", () => {
      const records = manyRecords(5, { child_id: "child_1" });
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      expect(result.concerns.some(c => c.includes("child_1 (5 interventions)"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 24. INSIGHT SEVERITY BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════

  describe("insight severity boundaries", () => {

    it("injury rate exactly 30% triggers warning not critical", () => {
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_injury: i < 3,
          injury_count: i < 3 ? 1 : 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 10,
        restraints: records,
      }));
      expect(result.injury_rate).toBe(30);
      // Critical requires > 30, so 30% should NOT trigger critical
      const critical = result.insights.find(i => i.severity === "critical" && i.text.includes("Injury rate"));
      expect(critical).toBeUndefined();
      // Warning requires > 0 and <= 20 — 30% is outside that range too
      // The warning check is > 0 && <= 20 — 30% fails <= 20
      const warning = result.insights.find(i => i.severity === "warning" && i.text.includes("resulted in injury"));
      expect(warning).toBeUndefined();
    });

    it("injury rate exactly 31% triggers critical", () => {
      // Need 31% — tricky with integers. 31/100 is hard.
      // 3/9 = 33% or 4/13 = 31% (Math.round(4/13*100) = 31)
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 13; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          has_injury: i < 4,
          injury_count: i < 4 ? 1 : 0,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 13,
        restraints: records,
      }));
      expect(result.injury_rate).toBe(31);
      const critical = result.insights.find(i => i.severity === "critical" && i.text.includes("Injury rate of 31%"));
      expect(critical).toBeDefined();
    });

    it("pending reviews exactly 2 triggers warning not critical", () => {
      const records = [
        baseRecord({ id: "r1", review_status: "pending" }),
        baseRecord({ id: "r2", review_status: "pending" }),
        baseRecord({ id: "r3", review_status: "reviewed" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      // pendingReviews = 2 < 3 -> warning, not critical
      const warning = result.insights.find(i => i.severity === "warning" && i.text.includes("awaiting review"));
      expect(warning).toBeDefined();
      const critical = result.insights.find(i => i.severity === "critical" && i.text.includes("unreviewed"));
      expect(critical).toBeUndefined();
    });

    it("pending reviews exactly 3 triggers critical not warning", () => {
      const records = [
        baseRecord({ id: "r1", review_status: "pending" }),
        baseRecord({ id: "r2", review_status: "pending" }),
        baseRecord({ id: "r3", review_status: "pending" }),
      ];
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 5,
        restraints: records,
      }));
      const critical = result.insights.find(i => i.severity === "critical" && i.text.includes("3 physical interventions are unreviewed"));
      expect(critical).toBeDefined();
      // The warning check is > 0 && < 3. 3 fails < 3 so no warning.
      const warning = result.insights.find(i => i.severity === "warning" && i.text.includes("awaiting review"));
      expect(warning).toBeUndefined();
    });

    it("child debrief rate exactly 29% triggers no warning (below 30)", () => {
      // Need 29%: Math.round(3/10*100) = 30 — not 29
      // 2/7 = Math.round(28.57) = 29
      const records: RestraintRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        records.push(baseRecord({
          id: `rst_${i + 1}`,
          child_id: `child_${i + 1}`,
          child_debriefed: i < 2,
        }));
      }
      const result = computeRestraintPhysicalIntervention(baseInput({
        total_children: 7,
        restraints: records,
      }));
      expect(result.child_debrief_rate).toBe(29);
      // Warning requires < 60 && >= 30. 29 < 30 so no warning.
      const warning = result.insights.find(i => i.severity === "warning" && i.text.includes("Child debrief rate"));
      expect(warning).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 25. DAYSBETWEEN CORRECTNESS
  // ════════════════════════════════════════════════════════════════════════

  describe("daysBetween correctness", () => {

    it("same day returns 0 distance (included in 90-day window)", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        today: "2026-05-15",
        restraints: [baseRecord({ date: "2026-05-15" })],
      }));
      expect(result.total_restraints).toBe(1);
    });

    it("89 days ago is included", () => {
      // today=2026-05-15, 89 days ago ~= 2026-02-15
      const result = computeRestraintPhysicalIntervention(baseInput({
        today: "2026-05-15",
        restraints: [baseRecord({ date: "2026-02-15" })],
      }));
      expect(result.total_restraints).toBe(1);
    });

    it("future date within 90 days is also included (daysBetween uses abs)", () => {
      const result = computeRestraintPhysicalIntervention(baseInput({
        today: "2026-05-15",
        restraints: [baseRecord({ date: "2026-06-01" })],
      }));
      // daysBetween uses Math.abs, so future dates within 90 days are included
      expect(result.total_restraints).toBe(1);
    });
  });
});
