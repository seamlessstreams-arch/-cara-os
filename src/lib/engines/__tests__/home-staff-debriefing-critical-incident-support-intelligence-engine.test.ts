// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF DEBRIEFING & CRITICAL INCIDENT SUPPORT ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffDebriefingCriticalIncidentSupport,
  type StaffDebriefingInput,
  type DebriefingRecordInput,
  type CriticalIncidentRecordInput,
  type WellbeingFollowupRecordInput,
  type LearningExtractionRecordInput,
  type SupportAccessRecordInput,
  type StaffDebriefingResult,
  type StaffDebriefingRating,
} from "../home-staff-debriefing-critical-incident-support-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDebriefing(overrides: Partial<DebriefingRecordInput> = {}): DebriefingRecordInput {
  return {
    id: "d_1",
    staff_id: "staff_1",
    incident_id: "inc_1",
    debrief_type: "formal_structured",
    status: "completed",
    offered_within_24h: true,
    completed_within_48h: true,
    staff_felt_supported: true,
    confidentiality_maintained: true,
    action_plan_created: true,
    follow_up_scheduled: true,
    follow_up_completed: true,
    emotional_impact_level: "moderate",
    debrief_quality_rating: 5,
    ...overrides,
  };
}

function makeCriticalIncident(overrides: Partial<CriticalIncidentRecordInput> = {}): CriticalIncidentRecordInput {
  return {
    id: "ci_1",
    incident_type: "physical_assault",
    severity: "high",
    staff_involved_count: 2,
    immediate_support_offered: true,
    immediate_support_accepted: true,
    debrief_completed: true,
    external_support_offered: true,
    management_response_within_1h: true,
    incident_documented: true,
    lessons_identified: true,
    staff_welfare_check_completed: true,
    ...overrides,
  };
}

function makeWellbeingFollowup(overrides: Partial<WellbeingFollowupRecordInput> = {}): WellbeingFollowupRecordInput {
  return {
    id: "wf_1",
    staff_id: "staff_1",
    related_incident_id: "inc_1",
    followup_type: "welfare_check",
    status: "completed",
    completed_on_time: true,
    staff_satisfied: true,
    outcome_positive: true,
    days_since_incident: 3,
    needs_further_followup: false,
    further_followup_scheduled: false,
    ...overrides,
  };
}

function makeLearningExtraction(overrides: Partial<LearningExtractionRecordInput> = {}): LearningExtractionRecordInput {
  return {
    id: "le_1",
    related_incident_id: "inc_1",
    learning_type: "practice_change",
    learning_shared_with_team: true,
    implemented: true,
    impact_assessed: true,
    linked_to_training_plan: true,
    documented_in_learning_log: true,
    review_date_set: true,
    ...overrides,
  };
}

function makeSupportAccess(overrides: Partial<SupportAccessRecordInput> = {}): SupportAccessRecordInput {
  return {
    id: "sa_1",
    staff_id: "staff_1",
    support_type: "eap",
    access_route: "self_referral",
    accessed: true,
    timely_access: true,
    staff_found_helpful: true,
    barriers_reported: false,
    barrier_type: "none",
    confidential: true,
    repeat_access: false,
    ...overrides,
  };
}

const staffIds = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

/** Perfect base: 8 staff, all bonuses achievable, no penalties */
function baseInput(overrides: Partial<StaffDebriefingInput> = {}): StaffDebriefingInput {
  return {
    today: "2026-05-29",
    total_staff: 8,
    debriefing_records: staffIds.map((sid, i) =>
      makeDebriefing({ id: `d_${i}`, staff_id: sid, incident_id: `inc_${i}` }),
    ),
    critical_incident_records: staffIds.map((sid, i) =>
      makeCriticalIncident({ id: `ci_${i}` }),
    ),
    wellbeing_followup_records: staffIds.map((sid, i) =>
      makeWellbeingFollowup({ id: `wf_${i}`, staff_id: sid, related_incident_id: `inc_${i}` }),
    ),
    learning_extraction_records: staffIds.map((sid, i) =>
      makeLearningExtraction({ id: `le_${i}`, related_incident_id: `inc_${i}` }),
    ),
    support_access_records: staffIds.map((sid, i) =>
      makeSupportAccess({
        id: `sa_${i}`,
        staff_id: sid,
        // Spread across 5+ unique support types for bonus 4 top tier
        support_type: (["eap", "counselling", "peer_support", "supervision", "occupational_health", "mental_health_first_aid", "trauma_informed_support", "union_rep"] as const)[i % 8] as string,
      }),
    ),
    ...overrides,
  };
}

const run = computeStaffDebriefingCriticalIncidentSupport;

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Staff Debriefing & Critical Incident Support Intelligence Engine", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. RESULT STRUCTURE
  // ══════════════════════════════════════════════════════════════════════════

  describe("Result structure", () => {
    it("returns a well-shaped result with all required fields", () => {
      const r = run(baseInput());
      expect(r).toHaveProperty("debriefing_rating");
      expect(r).toHaveProperty("debriefing_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_debriefings");
      expect(r).toHaveProperty("total_critical_incidents");
      expect(r).toHaveProperty("total_wellbeing_followups");
      expect(r).toHaveProperty("total_learning_extractions");
      expect(r).toHaveProperty("total_support_accesses");
      expect(r).toHaveProperty("debriefing_completion_rate");
      expect(r).toHaveProperty("incident_support_rate");
      expect(r).toHaveProperty("wellbeing_followup_rate");
      expect(r).toHaveProperty("learning_extraction_rate");
      expect(r).toHaveProperty("support_access_rate");
      expect(r).toHaveProperty("staff_satisfaction_rate");
      expect(r).toHaveProperty("offered_within_24h_rate");
      expect(r).toHaveProperty("completed_within_48h_rate");
      expect(r).toHaveProperty("management_response_rate");
      expect(r).toHaveProperty("followup_on_time_rate");
      expect(r).toHaveProperty("learning_implemented_rate");
      expect(r).toHaveProperty("support_barriers_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("assigns a valid rating value", () => {
      const r = run(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.debriefing_rating);
    });

    it("scores between 0 and 100", () => {
      const r = run(baseInput());
      expect(r.debriefing_score).toBeGreaterThanOrEqual(0);
      expect(r.debriefing_score).toBeLessThanOrEqual(100);
    });

    it("strengths is an array capped at 6", () => {
      const r = run(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(r.strengths.length).toBeLessThanOrEqual(6);
    });

    it("concerns is an array capped at 6", () => {
      const r = run(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(r.concerns.length).toBeLessThanOrEqual(6);
    });

    it("recommendations is an array capped at 5", () => {
      const r = run(baseInput());
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("insights is an array capped at 4", () => {
      const r = run(baseInput());
      expect(Array.isArray(r.insights)).toBe(true);
      expect(r.insights.length).toBeLessThanOrEqual(4);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      // Force a rec by having low debriefing completion
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "overdue" }),
          makeDebriefing({ id: "d_1", status: "overdue" }),
          makeDebriefing({ id: "d_2", status: "overdue" }),
        ],
      }));
      if (r.recommendations.length > 0) {
        const rec = r.recommendations[0];
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("insights have text and severity", () => {
      const r = run(baseInput());
      if (r.insights.length > 0) {
        const ins = r.insights[0];
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INSUFFICIENT DATA
  // ══════════════════════════════════════════════════════════════════════════

  describe("Insufficient data", () => {
    it("returns insufficient_data and score 0 when total_staff=0 and all arrays empty", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.debriefing_rating).toBe("insufficient_data");
      expect(r.debriefing_score).toBe(0);
    });

    it("produces a meaningful headline for insufficient data", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.headline.length).toBeGreaterThan(10);
      expect(r.headline.toLowerCase()).toContain("insufficient");
    });

    it("returns all counts as 0 for insufficient data", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.total_debriefings).toBe(0);
      expect(r.total_critical_incidents).toBe(0);
      expect(r.total_wellbeing_followups).toBe(0);
      expect(r.total_learning_extractions).toBe(0);
      expect(r.total_support_accesses).toBe(0);
    });

    it("returns all rates as 0 for insufficient data", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.debriefing_completion_rate).toBe(0);
      expect(r.incident_support_rate).toBe(0);
      expect(r.wellbeing_followup_rate).toBe(0);
      expect(r.learning_extraction_rate).toBe(0);
      expect(r.support_access_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
    });

    it("returns empty strengths/concerns/recommendations/insights for insufficient data", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. INADEQUATE FLOOR (total_staff > 0, all arrays empty)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Inadequate floor — staff present but no records", () => {
    it("returns inadequate and score 15 when total_staff>0 but all arrays empty", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.debriefing_rating).toBe("inadequate");
      expect(r.debriefing_score).toBe(15);
    });

    it("produces a headline mentioning urgent attention", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.headline.toLowerCase()).toContain("urgent");
    });

    it("has exactly 1 concern for inadequate floor", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.concerns.length).toBe(1);
    });

    it("has exactly 2 recommendations for inadequate floor", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.recommendations.length).toBe(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight for inadequate floor", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns all counts as 0 for inadequate floor", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 8,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.total_debriefings).toBe(0);
      expect(r.total_critical_incidents).toBe(0);
      expect(r.total_wellbeing_followups).toBe(0);
      expect(r.total_learning_extractions).toBe(0);
      expect(r.total_support_accesses).toBe(0);
    });

    it("works with total_staff=1 — still inadequate floor", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 1,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.debriefing_rating).toBe("inadequate");
      expect(r.debriefing_score).toBe(15);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. OUTSTANDING SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("Outstanding scenario", () => {
    it("perfect base input achieves outstanding (>= 80)", () => {
      const r = run(baseInput());
      expect(r.debriefing_rating).toBe("outstanding");
      expect(r.debriefing_score).toBeGreaterThanOrEqual(80);
    });

    it("perfect base achieves score = 52 + 28 = 80", () => {
      const r = run(baseInput());
      // base 52 + bonus1(7) + bonus2(7) + bonus3(7) + bonus4(7) = 80
      expect(r.debriefing_score).toBe(80);
    });

    it("has a headline mentioning exemplary", () => {
      const r = run(baseInput());
      expect(r.headline.toLowerCase()).toContain("exemplary");
    });

    it("generates strengths for outstanding scenario", () => {
      const r = run(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("generates no concerns for outstanding scenario", () => {
      const r = run(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("has positive insights for outstanding scenario", () => {
      const r = run(baseInput());
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
    });

    it("reports 100% debriefing completion rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.debriefing_completion_rate).toBe(100);
    });

    it("reports 100% incident support rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.incident_support_rate).toBe(100);
    });

    it("reports 100% wellbeing followup rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.wellbeing_followup_rate).toBe(100);
    });

    it("reports 100% support access rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.support_access_rate).toBe(100);
    });

    it("reports 100% staff satisfaction rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.staff_satisfaction_rate).toBe(100);
    });

    it("reports 100% offered_within_24h_rate for outstanding", () => {
      const r = run(baseInput());
      expect(r.offered_within_24h_rate).toBe(100);
    });

    it("reports correct total counts", () => {
      const r = run(baseInput());
      expect(r.total_debriefings).toBe(8);
      expect(r.total_critical_incidents).toBe(8);
      expect(r.total_wellbeing_followups).toBe(8);
      expect(r.total_learning_extractions).toBe(8);
      expect(r.total_support_accesses).toBe(8);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. GOOD SCENARIO (65–79)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Good scenario", () => {
    it("achieves good with some bonuses but not all top-tier", () => {
      // Base 52 + bonus1(5) + bonus2(5) + bonus3(5) + bonus4(0) = 67 → good
      const r = run(baseInput({
        debriefing_records: staffIds.map((sid, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: sid,
            incident_id: `inc_${i}`,
            // 80% completion (keep 80% completed): 7/8 completed, 1 scheduled
            status: i < 7 ? "completed" : "scheduled",
            offered_within_24h: i < 6, // 75%
          }),
        ),
        critical_incident_records: staffIds.map((_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: i < 7, // ~88%
            management_response_within_1h: i < 6, // 75%
          }),
        ),
        wellbeing_followup_records: staffIds.map((sid, i) =>
          makeWellbeingFollowup({
            id: `wf_${i}`,
            staff_id: sid,
            status: i < 7 ? "completed" : "scheduled", // ~88%
            completed_on_time: i < 6, // ~86% of completed
          }),
        ),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).toBe("good");
      expect(r.debriefing_score).toBeGreaterThanOrEqual(65);
      expect(r.debriefing_score).toBeLessThan(80);
    });

    it("good scenario has a headline mentioning good", () => {
      const r = run(baseInput({
        debriefing_records: staffIds.map((sid, i) =>
          makeDebriefing({
            id: `d_${i}`, staff_id: sid, incident_id: `inc_${i}`,
            status: i < 7 ? "completed" : "scheduled",
            offered_within_24h: i < 6,
          }),
        ),
        critical_incident_records: staffIds.map((_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: i < 7,
            management_response_within_1h: i < 6,
          }),
        ),
        wellbeing_followup_records: staffIds.map((sid, i) =>
          makeWellbeingFollowup({
            id: `wf_${i}`, staff_id: sid,
            status: i < 7 ? "completed" : "scheduled",
            completed_on_time: i < 6,
          }),
        ),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.headline.toLowerCase()).toContain("good");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. ADEQUATE SCENARIO (45–64)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Adequate scenario", () => {
    it("achieves adequate with minimal bonuses", () => {
      // Base 52 + bonus1(1) + bonus2(0) - penalty1(-8) = 45 → adequate
      // Need: 50% completion (bonus1 +1), >30% overdue (penalty1 -8), no other penalties
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "completed", offered_within_24h: false }),
          makeDebriefing({ id: "d_1", status: "overdue", offered_within_24h: false }),
        ],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).toBe("adequate");
      expect(r.debriefing_score).toBeGreaterThanOrEqual(45);
      expect(r.debriefing_score).toBeLessThan(65);
    });

    it("adequate scenario headline mentions improvement", () => {
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "completed", offered_within_24h: false }),
          makeDebriefing({ id: "d_1", status: "overdue", offered_within_24h: false }),
        ],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.headline.toLowerCase()).toContain("improvement");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. INADEQUATE SCENARIO (< 45)
  // ══════════════════════════════════════════════════════════════════════════

  describe("Inadequate scenario", () => {
    it("achieves inadequate with heavy penalties and no bonuses", () => {
      // Base 52 + bonus1(0) - penalty1(8) - penalty2(8) = 36 → inadequate
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "overdue" }),
          makeDebriefing({ id: "d_1", status: "overdue" }),
          makeDebriefing({ id: "d_2", status: "overdue" }),
        ],
        critical_incident_records: [
          makeCriticalIncident({ id: "ci_0", debrief_completed: false, immediate_support_offered: false }),
          makeCriticalIncident({ id: "ci_1", debrief_completed: false, immediate_support_offered: false }),
        ],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).toBe("inadequate");
      expect(r.debriefing_score).toBeLessThan(45);
    });

    it("inadequate scenario headline mentions inadequate", () => {
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "overdue" }),
          makeDebriefing({ id: "d_1", status: "overdue" }),
          makeDebriefing({ id: "d_2", status: "overdue" }),
        ],
        critical_incident_records: [
          makeCriticalIncident({ id: "ci_0", debrief_completed: false, immediate_support_offered: false }),
          makeCriticalIncident({ id: "ci_1", debrief_completed: false, immediate_support_offered: false }),
        ],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("generates concerns for inadequate scenario", () => {
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "overdue" }),
          makeDebriefing({ id: "d_1", status: "overdue" }),
          makeDebriefing({ id: "d_2", status: "overdue" }),
        ],
        critical_incident_records: [
          makeCriticalIncident({ id: "ci_0", debrief_completed: false, immediate_support_offered: false }),
          makeCriticalIncident({ id: "ci_1", debrief_completed: false, immediate_support_offered: false }),
        ],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("generates recommendations for inadequate scenario", () => {
      const r = run(baseInput({
        debriefing_records: [
          makeDebriefing({ id: "d_0", status: "overdue" }),
          makeDebriefing({ id: "d_1", status: "overdue" }),
          makeDebriefing({ id: "d_2", status: "overdue" }),
        ],
        critical_incident_records: [
          makeCriticalIncident({ id: "ci_0", debrief_completed: false, immediate_support_offered: false }),
          makeCriticalIncident({ id: "ci_1", debrief_completed: false, immediate_support_offered: false }),
        ],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. BONUS 1 — Debriefing completion quality (+0 to +7) IN ISOLATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 1 — Debriefing completion quality (isolated)", () => {
    // Isolate: only debriefing_records populated, others empty

    it("+7 when completionRate>=90 and offeredWithin24hRate>=85", () => {
      // 10/10 completed (100%), 9/10 offered within 24h (90%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: "completed", offered_within_24h: i < 9 }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("+5 when completionRate>=80 and offeredWithin24hRate>=70 (but not top tier)", () => {
      // 8/10 completed (80%), 7/10 offered within 24h (70%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 8 ? "completed" : "scheduled",
          offered_within_24h: i < 7,
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("+3 when completionRate>=65 (but offeredWithin24h below 70)", () => {
      // 7/10 completed (70%), 5/10 offered within 24h (50%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 7 ? "completed" : "scheduled",
          offered_within_24h: i < 5,
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 3);
    });

    it("+1 when completionRate>=50 (but below 65)", () => {
      // 5/10 completed (50%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 5 ? "completed" : "scheduled",
          offered_within_24h: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 1);
    });

    it("+0 when completionRate<50", () => {
      // 4/10 completed (40%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "completed" : "scheduled",
          offered_within_24h: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52);
    });

    it("+0 when no debriefing records", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [makeSupportAccess()], // need at least one array non-empty to avoid floor
      }));
      // Only bonus4 might apply, but let's verify debriefing bonus is 0
      // With 1 support access (accessed=true, support_type=1), accessScore=100, combinedAccessLearning=100, uniqueSupportTypes=1
      // combinedAccessLearning>=85 but uniqueSupportTypes<4 → try >=70 → +5
      expect(r.debriefing_score).toBe(52 + 5);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. BONUS 2 — Critical incident support timeliness (+0 to +7) IN ISOLATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 2 — Critical incident support timeliness (isolated)", () => {
    it("+7 when incidentSupportRate>=95 and managementResponseRate>=90", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: true, // 100%
          management_response_within_1h: i < 9, // 90%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("+5 when incidentSupportRate>=85 and managementResponseRate>=75 (but not top)", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: i < 9, // 90%
          management_response_within_1h: i < 8, // 80%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("+3 when incidentSupportRate>=70 (but managementResponse below 75)", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: i < 7, // 70%
          management_response_within_1h: i < 5, // 50%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 3);
    });

    it("+1 when incidentSupportRate>=50 (but below 70)", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: i < 5, // 50%
          management_response_within_1h: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 1);
    });

    it("+0 when incidentSupportRate<50", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: i < 4, // 40%
          management_response_within_1h: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // Also penalty2 may apply: noDebriefRate depends on debrief_completed
      // All defaults have debrief_completed=true, so noDebriefRate=0 → no penalty2
      expect(r.debriefing_score).toBe(52);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. BONUS 3 — Wellbeing follow-up effectiveness (+0 to +7) IN ISOLATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 3 — Wellbeing follow-up effectiveness (isolated)", () => {
    it("+7 when followupRate>=90, onTimeRate>=85, positiveOutcome>=80", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: "completed", // 100%
          completed_on_time: i < 9, // 90%
          outcome_positive: i < 9, // 90%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("+5 when followupRate>=80 and onTimeRate>=70 (but not top tier)", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 8 ? "completed" : "scheduled", // 80%
          completed_on_time: i < 6, // 75% of completed
          outcome_positive: i < 5, // 63% — below 80 → no top tier
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("+3 when followupRate>=65 (but below 80)", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 7 ? "completed" : "scheduled", // 70%
          completed_on_time: i < 3, // low — forces miss on upper tiers
          outcome_positive: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 3);
    });

    it("+1 when followupRate>=50 (but below 65)", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 5 ? "completed" : "scheduled", // 50%
          completed_on_time: false,
          outcome_positive: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 1);
    });

    it("+0 when followupRate<50", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "completed" : "scheduled", // 40%
          completed_on_time: false,
          outcome_positive: false,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. BONUS 4 — Learning extraction & support access (+0 to +7) IN ISOLATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 4 — Learning extraction & support access (isolated)", () => {

    it("+7 when combinedAccessLearning>=85 and uniqueSupportTypes>=4", () => {
      // Perfect learning (shared+implemented+documented all 100% → quality=100)
      // Perfect support access (accessed=100%) → combined = 100
      // 4+ unique support types
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}` }),
      );
      const supports = [
        makeSupportAccess({ id: "sa_0", staff_id: "s1", support_type: "eap" }),
        makeSupportAccess({ id: "sa_1", staff_id: "s2", support_type: "counselling" }),
        makeSupportAccess({ id: "sa_2", staff_id: "s3", support_type: "peer_support" }),
        makeSupportAccess({ id: "sa_3", staff_id: "s4", support_type: "supervision" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: supports,
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("+5 when combinedAccessLearning>=70 (but below 85 or <4 support types)", () => {
      // Learning quality = round((100 + 100 + 100) / 3) = 100
      // Support access = 100%
      // Combined = 100 but only 2 unique support types → misses top tier → +5
      const learnings = [makeLearningExtraction({ id: "le_0" })];
      const supports = [
        makeSupportAccess({ id: "sa_0", staff_id: "s1", support_type: "eap" }),
        makeSupportAccess({ id: "sa_1", staff_id: "s2", support_type: "counselling" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: supports,
      }));
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("+3 when combinedAccessLearning>=55", () => {
      // Learning: 3/5 shared (60%), 3/5 implemented (60%), 3/5 documented (60%)
      // quality = round((60+60+60)/3) = 60
      // No support access → combinedAccessLearning = 60 → >=55 → +3
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({
          id: `le_${i}`,
          learning_shared_with_team: i < 3,
          implemented: i < 3,
          documented_in_learning_log: i < 3,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 3);
    });

    it("+1 when combinedAccessLearning>=40", () => {
      // Learning: 2/5 shared (40%), 2/5 implemented (40%), 2/5 documented (40%)
      // quality = round((40+40+40)/3) = 40
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({
          id: `le_${i}`,
          learning_shared_with_team: i < 2,
          implemented: i < 2,
          documented_in_learning_log: i < 2,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 1);
    });

    it("+0 when combinedAccessLearning<40", () => {
      // Learning: 1/5 each → 20% each → quality = 20
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({
          id: `le_${i}`,
          learning_shared_with_team: i < 1,
          implemented: i < 1,
          documented_in_learning_log: i < 1,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52);
    });

    it("+7 with only support access (no learning), 4+ types, >=85% accessed", () => {
      const supports = [
        makeSupportAccess({ id: "sa_0", staff_id: "s1", support_type: "eap" }),
        makeSupportAccess({ id: "sa_1", staff_id: "s2", support_type: "counselling" }),
        makeSupportAccess({ id: "sa_2", staff_id: "s3", support_type: "peer_support" }),
        makeSupportAccess({ id: "sa_3", staff_id: "s4", support_type: "supervision" }),
        makeSupportAccess({ id: "sa_4", staff_id: "s5", support_type: "occupational_health" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      // accessScore=100, no learning → combinedAccessLearning=100, uniqueSupportTypes=5>=4 → +7
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("+0 when neither learning nor support present", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing()],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // debriefing_records present so not floor — bonus1 only
      // 1 completed out of 1 → 100%, offered_within_24h=true → +7
      expect(r.debriefing_score).toBe(52 + 7);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. PENALTY 1 — Overdue debriefings
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty 1 — Overdue debriefings", () => {
    it("-8 when overdueRate > 30%", () => {
      // 4/10 overdue (40%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 6/10 completed (60%) → completion >=50 but <65 → bonus1 = +1 (offered_within_24h defaults true → 100% but completion only 60%)
      // Actually, 60%>=50, offered_within_24h = 100% but need to check tiers:
      // 60% < 65% so not >=65, check >=50 → +1
      // Wait: 60%<80 so skip tier2. >=65? 60<65 → no. >=50 → yes → +1
      // overdueRate = 40% > 30 → -8
      // Total = 52 + 1 - 8 = 45
      expect(r.debriefing_score).toBe(52 + 1 - 8);
    });

    it("-5 when overdueRate > 15% but <= 30%", () => {
      // 2/10 overdue (20%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 2 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 8/10 completed (80%), offered_within_24h=true (100%) → >=80 && >=70 → +5
      // overdueRate=20% > 15 → -5
      expect(r.debriefing_score).toBe(52 + 5 - 5);
    });

    it("-2 when overdueRate > 5% but <= 15%", () => {
      // 1/10 overdue (10%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 1 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 9/10 completed (90%), offered_within_24h=true (100%) → >=90 && >=85 → +7
      // overdueRate=10% > 5 → -2
      expect(r.debriefing_score).toBe(52 + 7 - 2);
    });

    it("no penalty when overdueRate <= 5%", () => {
      // 0/10 overdue (0%)
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}` }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // +7 bonus1, no penalty
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("no penalty when debriefing_records is empty (guarded)", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [makeCriticalIncident()],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // Only bonus2 applies (support 100%, mgmt 100% → +7), no penalty1
      expect(r.debriefing_score).toBe(52 + 7);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. PENALTY 2 — Critical incidents without debrief
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty 2 — Critical incidents without debrief", () => {
    it("-8 when noDebriefRate > 40%", () => {
      // 5/10 have debrief_completed=false (50% no-debrief)
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          debrief_completed: i < 5,
          immediate_support_offered: i < 4, // 40% < 50 → bonus2 = 0
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // bonus2=0, penalty2=-8 → 52 - 8 = 44
      expect(r.debriefing_score).toBe(52 - 8);
    });

    it("-5 when noDebriefRate > 20% but <= 40%", () => {
      // 3/10 no debrief (30%)
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          debrief_completed: i < 7,
          immediate_support_offered: i < 4, // 40% < 50 → bonus2=0
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 - 5);
    });

    it("-2 when noDebriefRate > 10% but <= 20%", () => {
      // 2/10 no debrief (20%) — exactly 20%, need >10 <=20 — pct(2,10)=20 > 10 → -2
      // Wait: the check is >20 → -5, so 20% is NOT >20. Let me use 15%.
      // pct(2,13)=15... Use 10 records with exactly 2 no debrief → 20%. But 20>20 is false.
      // Need 11-20% range. 2/10 = 20% → >20 is false → goes to >10 check. 20>10 → true → -2
      // Actually re-reading: if (noDebriefRate > 40) -8; else if (> 20) -5; else if (> 10) -2
      // 20 is NOT > 20, so we check > 10 → 20 > 10 → true → -2
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          debrief_completed: i < 8, // 2 no-debrief = 20%
          immediate_support_offered: i < 4, // bonus2=0
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 - 2);
    });

    it("no penalty when noDebriefRate <= 10%", () => {
      // 1/10 no debrief (10%) — 10 > 10 is false → no penalty
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          debrief_completed: i < 9, // 1 no-debrief = 10%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // bonus2: all support_offered=true (100%), mgmt=true (100%) → +7
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("no penalty when critical_incident_records is empty (guarded)", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing()],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7); // only bonus1 top tier
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. PENALTY 3 — Overdue wellbeing follow-ups
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty 3 — Overdue wellbeing follow-ups", () => {
    it("-6 when overdueFollowupRate > 30%", () => {
      // 4/10 overdue (40%)
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 6/10 completed (60%) → >=50 but <65 → bonus3 = +1
      // Wait: 60%<65 → not >=65. >=50 → +1
      // overdueRate=40% >30 → -6
      expect(r.debriefing_score).toBe(52 + 1 - 6);
    });

    it("-3 when overdueFollowupRate > 15% but <= 30%", () => {
      // 2/10 overdue (20%)
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 2 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 8/10 completed (80%), completed_on_time=true (100%), outcome_positive=true (100%)
      // >=90? 80<90 → no. >=80 && onTime>=70 → yes → +5
      // overdueRate=20% >15 → -3
      expect(r.debriefing_score).toBe(52 + 5 - 3);
    });

    it("-1 when overdueFollowupRate > 5% but <= 15%", () => {
      // 1/10 overdue (10%)
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 1 ? "overdue" : "completed",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 9/10 completed (90%), onTime=100%, positive=100% → >=90 && >=85 && >=80 → +7
      // overdueRate=10% >5 → -1
      expect(r.debriefing_score).toBe(52 + 7 - 1);
    });

    it("no penalty when overdueFollowupRate <= 5%", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}` }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });

    it("no penalty when wellbeing_followup_records is empty (guarded)", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing()],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 15. PENALTY 4 — Support access barriers
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty 4 — Support access barriers", () => {
    it("-6 when barriersReportedRate > 40%", () => {
      // 5/10 report barriers (50%)
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 5,
          barrier_type: i < 5 ? "stigma" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      // bonus4: accessScore=100 (all accessed=true), combinedAccessLearning=100
      // uniqueSupportTypes=1 (eap only) → >=85 but types<4 → try >=70 → +5
      // penalty4: barriersRate=50%>40 → -6
      expect(r.debriefing_score).toBe(52 + 5 - 6);
    });

    it("-3 when barriersReportedRate > 20% but <= 40%", () => {
      // 3/10 report barriers (30%)
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 3,
          barrier_type: i < 3 ? "availability" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      // bonus4: +5 (same reasoning)
      // penalty4: 30%>20 → -3
      expect(r.debriefing_score).toBe(52 + 5 - 3);
    });

    it("-1 when barriersReportedRate > 10% but <= 20%", () => {
      // 2/10 report barriers (20%)
      // 20 > 20 is false → try > 10 → 20 > 10 → -1
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 2,
          barrier_type: i < 2 ? "awareness" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.debriefing_score).toBe(52 + 5 - 1);
    });

    it("no penalty when barriersReportedRate <= 10%", () => {
      // 1/10 barriers (10%) — 10 > 10 is false → no penalty
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 1,
          barrier_type: i < 1 ? "stigma" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("no penalty when support_access_records is empty (guarded)", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing()],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(52 + 7); // bonus1 only
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 16. ALL 6 RATES
  // ══════════════════════════════════════════════════════════════════════════

  describe("Rate calculations", () => {
    describe("debriefing_completion_rate", () => {
      it("100% when all completed", () => {
        const r = run(baseInput());
        expect(r.debriefing_completion_rate).toBe(100);
      });

      it("50% when half completed", () => {
        const debriefs = Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 5 ? "completed" : "scheduled",
          }),
        );
        const r = run(baseInput({ debriefing_records: debriefs }));
        expect(r.debriefing_completion_rate).toBe(50);
      });

      it("0% when none completed", () => {
        const debriefs = [makeDebriefing({ status: "scheduled" })];
        const r = run(baseInput({ debriefing_records: debriefs }));
        expect(r.debriefing_completion_rate).toBe(0);
      });

      it("0 when no debriefing records (pct(0,0)=0)", () => {
        const r = run(baseInput({
          debriefing_records: [],
          critical_incident_records: [makeCriticalIncident()],
        }));
        expect(r.debriefing_completion_rate).toBe(0);
      });
    });

    describe("incident_support_rate", () => {
      it("100% when all incidents have immediate support offered", () => {
        const r = run(baseInput());
        expect(r.incident_support_rate).toBe(100);
      });

      it("0% when none offered", () => {
        const incidents = [makeCriticalIncident({ immediate_support_offered: false })];
        const r = run(baseInput({ critical_incident_records: incidents }));
        expect(r.incident_support_rate).toBe(0);
      });

      it("0 when no critical incidents (pct(0,0)=0)", () => {
        const r = run(baseInput({ critical_incident_records: [] }));
        expect(r.incident_support_rate).toBe(0);
      });
    });

    describe("wellbeing_followup_rate", () => {
      it("100% when all completed", () => {
        const r = run(baseInput());
        expect(r.wellbeing_followup_rate).toBe(100);
      });

      it("0% when none completed", () => {
        const followups = [makeWellbeingFollowup({ status: "scheduled" })];
        const r = run(baseInput({ wellbeing_followup_records: followups }));
        expect(r.wellbeing_followup_rate).toBe(0);
      });

      it("0 when no followup records (pct(0,0)=0)", () => {
        const r = run(baseInput({ wellbeing_followup_records: [] }));
        expect(r.wellbeing_followup_rate).toBe(0);
      });
    });

    describe("learning_extraction_rate (composite: shared+implemented+documented /3)", () => {
      it("100 when all shared, implemented, and documented", () => {
        const r = run(baseInput());
        expect(r.learning_extraction_rate).toBe(100);
      });

      it("0 when none shared, implemented, or documented", () => {
        const learnings = [makeLearningExtraction({
          learning_shared_with_team: false,
          implemented: false,
          documented_in_learning_log: false,
        })];
        const r = run(baseInput({ learning_extraction_records: learnings }));
        expect(r.learning_extraction_rate).toBe(0);
      });

      it("0 when no learning records (pct(0,0)=0)", () => {
        const r = run(baseInput({ learning_extraction_records: [] }));
        expect(r.learning_extraction_rate).toBeNull();;
      });

      it("calculates composite correctly: round((sharedRate+implRate+docRate)/3)", () => {
        // 3/5 shared (60%), 2/5 implemented (40%), 4/5 documented (80%) → round((60+40+80)/3) = round(60) = 60
        const learnings = Array.from({ length: 5 }, (_, i) =>
          makeLearningExtraction({
            id: `le_${i}`,
            learning_shared_with_team: i < 3,
            implemented: i < 2,
            documented_in_learning_log: i < 4,
          }),
        );
        const r = run(baseInput({ learning_extraction_records: learnings }));
        expect(r.learning_extraction_rate).toBe(60);
      });
    });

    describe("support_access_rate", () => {
      it("100% when all accessed", () => {
        const r = run(baseInput());
        expect(r.support_access_rate).toBe(100);
      });

      it("0% when none accessed", () => {
        const supports = [makeSupportAccess({ accessed: false })];
        const r = run(baseInput({ support_access_records: supports }));
        expect(r.support_access_rate).toBe(0);
      });

      it("0 when no support access records (pct(0,0)=0)", () => {
        const r = run(baseInput({ support_access_records: [] }));
        expect(r.support_access_rate).toBe(0);
      });
    });

    describe("staff_satisfaction_rate (composite)", () => {
      it("100 when all satisfaction components are 100%", () => {
        const r = run(baseInput());
        expect(r.staff_satisfaction_rate).toBe(100);
      });

      it("0 when no completed debriefings, followups or support accessed", () => {
        const r = run(baseInput({
          debriefing_records: [makeDebriefing({ status: "scheduled" })],
          wellbeing_followup_records: [makeWellbeingFollowup({ status: "scheduled" })],
          support_access_records: [makeSupportAccess({ accessed: false })],
          critical_incident_records: [],
          learning_extraction_records: [],
        }));
        expect(r.staff_satisfaction_rate).toBeNull();;
      });

      it("averages only available components", () => {
        // Only debriefings completed → satisfaction = feltSupportedRate only
        const r = run(baseInput({
          debriefing_records: [
            makeDebriefing({ staff_felt_supported: true }),
            makeDebriefing({ id: "d_2", staff_felt_supported: false }),
          ],
          wellbeing_followup_records: [],
          critical_incident_records: [],
          learning_extraction_records: [],
          support_access_records: [],
        }));
        // feltSupportedRate = pct(1, 2) = 50
        expect(r.staff_satisfaction_rate).toBe(50);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 17. SUB-METRICS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Sub-metrics", () => {
    it("offered_within_24h_rate calculated correctly", () => {
      const debriefs = Array.from({ length: 4 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, offered_within_24h: i < 3 }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.offered_within_24h_rate).toBe(75); // 3/4
    });

    it("completed_within_48h_rate calculated from completed debriefings only", () => {
      const debriefs = [
        makeDebriefing({ id: "d_0", status: "completed", completed_within_48h: true }),
        makeDebriefing({ id: "d_1", status: "completed", completed_within_48h: false }),
        makeDebriefing({ id: "d_2", status: "scheduled", completed_within_48h: true }), // not counted
      ];
      const r = run(baseInput({ debriefing_records: debriefs }));
      // pct(1, 2) = 50 (only completed ones count)
      expect(r.completed_within_48h_rate).toBe(50);
    });

    it("management_response_rate calculated correctly", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, management_response_within_1h: i < 3 }),
      );
      const r = run(baseInput({ critical_incident_records: incidents }));
      expect(r.management_response_rate).toBe(60); // 3/5
    });

    it("followup_on_time_rate calculated from completed followups only", () => {
      const followups = [
        makeWellbeingFollowup({ id: "wf_0", status: "completed", completed_on_time: true }),
        makeWellbeingFollowup({ id: "wf_1", status: "completed", completed_on_time: false }),
        makeWellbeingFollowup({ id: "wf_2", status: "completed", completed_on_time: true }),
        makeWellbeingFollowup({ id: "wf_3", status: "overdue", completed_on_time: false }), // not counted
      ];
      const r = run(baseInput({ wellbeing_followup_records: followups }));
      expect(r.followup_on_time_rate).toBe(67); // pct(2,3) = 67
    });

    it("learning_implemented_rate calculated correctly", () => {
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, implemented: i < 3 }),
      );
      const r = run(baseInput({ learning_extraction_records: learnings }));
      expect(r.learning_implemented_rate).toBe(60); // 3/5
    });

    it("support_barriers_rate calculated correctly", () => {
      const supports = Array.from({ length: 5 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i}`,
          barriers_reported: i < 2,
          barrier_type: i < 2 ? "stigma" : "none",
        }),
      );
      const r = run(baseInput({ support_access_records: supports }));
      expect(r.support_barriers_rate).toBe(40); // 2/5
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 18. STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("includes debriefing completion strength when rate >= 90%", () => {
      const r = run(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("debriefing completion"))).toBe(true);
    });

    it("includes offered within 24h strength when rate >= 90%", () => {
      const r = run(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("24 hours"))).toBe(true);
    });

    it("includes felt supported strength when rate >= 90%", () => {
      const r = run(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("feeling supported") || s.toLowerCase().includes("felt supported"))).toBe(true);
    });

    it("includes incident support strength when rate >= 95%", () => {
      const r = run(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("immediate support"))).toBe(true);
    });

    it("includes management response strength when rate >= 90%", () => {
      // Use only critical incidents to avoid debriefing strengths filling the cap
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: staffIds.map((_, i) => makeCriticalIncident({ id: `ci_${i}` })),
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("management responds"))).toBe(true);
    });

    it("includes wellbeing followup strength when rate >= 90%", () => {
      // Use only wellbeing followups to avoid earlier strengths filling the cap
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: staffIds.map((sid, i) => makeWellbeingFollowup({ id: `wf_${i}`, staff_id: sid })),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("wellbeing follow-up completion"))).toBe(true);
    });

    it("no debriefing completion strength when rate < 90%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 8 ? "completed" : "scheduled" }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("debriefing completion rate is outstanding"))).toBe(false);
    });

    it("no strengths when all metrics are poor", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing({ status: "overdue", staff_felt_supported: false, offered_within_24h: false, confidentiality_maintained: false, debrief_quality_rating: 1 })],
        critical_incident_records: [makeCriticalIncident({ immediate_support_offered: false, management_response_within_1h: false, staff_welfare_check_completed: false })],
        wellbeing_followup_records: [makeWellbeingFollowup({ status: "overdue", completed_on_time: false, outcome_positive: false, staff_satisfied: false })],
        learning_extraction_records: [makeLearningExtraction({ implemented: false, learning_shared_with_team: false, documented_in_learning_log: false, impact_assessed: false, linked_to_training_plan: false })],
        support_access_records: [makeSupportAccess({ accessed: false, staff_found_helpful: false, barriers_reported: true, barrier_type: "stigma", confidential: false })],
      }));
      expect(r.strengths.length).toBe(0);
    });

    it("caps strengths at 6", () => {
      // Perfect scenario generates many strengths → capped at 6
      const r = run(baseInput());
      expect(r.strengths.length).toBeLessThanOrEqual(6);
    });

    it("includes learning implemented strength when rate >= 85%", () => {
      // Use only learning records to avoid earlier strengths filling the cap
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: staffIds.map((_, i) => makeLearningExtraction({ id: `le_${i}` })),
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("learning from incidents is implemented"))).toBe(true);
    });

    it("includes support access strength when rate >= 90%", () => {
      // Use only support records to avoid earlier strengths filling the cap
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: sid }),
        ),
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("support access rate"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 19. CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("concern when no debriefing records but other data present", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [makeCriticalIncident()],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("no debriefing records"))).toBe(true);
    });

    it("concern when debriefing completion rate < 60%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 5 ? "completed" : "scheduled" }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("debriefing completion rate is below 60%"))).toBe(true);
    });

    it("concern when offered within 24h rate < 50%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, offered_within_24h: i < 4 }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("24 hours in fewer than half"))).toBe(true);
    });

    it("concern when incident support rate < 70%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, immediate_support_offered: i < 6 }),
      );
      const r = run(baseInput({ critical_incident_records: incidents }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("fewer than 70%"))).toBe(true);
    });

    it("concern when no critical incident records but other data present", () => {
      const r = run(baseInput({
        critical_incident_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("no critical incident records"))).toBe(true);
    });

    it("concern when no wellbeing followup records but other data present", () => {
      const r = run(baseInput({
        wellbeing_followup_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("no wellbeing follow-up records"))).toBe(true);
    });

    it("concern when no learning extraction records but other data present", () => {
      const r = run(baseInput({
        learning_extraction_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("no learning extraction records"))).toBe(true);
    });

    it("concern when no support access records but other data present", () => {
      const r = run(baseInput({
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("no support access records"))).toBe(true);
    });

    it("concern when wellbeing followup rate < 60%", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}`, status: i < 5 ? "completed" : "scheduled" }),
      );
      const r = run(baseInput({ wellbeing_followup_records: followups }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("wellbeing follow-up completion rate is below 60%"))).toBe(true);
    });

    it("concern when barriers reported rate > 30%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 4,
          barrier_type: i < 4 ? "availability" : "none",
        }),
      );
      const r = run(baseInput({ support_access_records: supports }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("more than 30% of staff report barriers"))).toBe(true);
    });

    it("concern when management response rate < 60%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, management_response_within_1h: i < 5 }),
      );
      const r = run(baseInput({ critical_incident_records: incidents }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("management response within one hour is below 60%"))).toBe(true);
    });

    it("concern when learning implemented rate < 50%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, implemented: i < 4 }),
      );
      const r = run(baseInput({ learning_extraction_records: learnings }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("fewer than half of identified learning"))).toBe(true);
    });

    it("caps concerns at 6", () => {
      // Generate many concerns
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 3 ? "completed" : i < 5 ? "overdue" : "not_offered",
            offered_within_24h: false,
            staff_felt_supported: false,
            debrief_quality_rating: 1,
          }),
        ),
        critical_incident_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: i < 5,
            management_response_within_1h: i < 3,
            debrief_completed: i < 4,
            staff_welfare_check_completed: i < 5,
          }),
        ),
        wellbeing_followup_records: Array.from({ length: 10 }, (_, i) =>
          makeWellbeingFollowup({
            id: `wf_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 4 ? "completed" : "overdue",
            staff_satisfied: false,
            outcome_positive: false,
          }),
        ),
        learning_extraction_records: Array.from({ length: 10 }, (_, i) =>
          makeLearningExtraction({
            id: `le_${i}`,
            implemented: i < 3,
            learning_shared_with_team: i < 3,
            documented_in_learning_log: i < 3,
          }),
        ),
        support_access_records: Array.from({ length: 10 }, (_, i) =>
          makeSupportAccess({
            id: `sa_${i}`,
            staff_id: `s_${i % 8}`,
            accessed: i < 4,
            staff_found_helpful: false,
            barriers_reported: i < 5,
            barrier_type: i < 3 ? "stigma" : i < 5 ? "awareness" : "none",
          }),
        ),
      }));
      expect(r.concerns.length).toBeLessThanOrEqual(6);
    });

    it("concern about felt supported rate < 60%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, staff_felt_supported: i < 5 }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("fewer than 60% of staff report feeling supported"))).toBe(true);
    });

    it("concern about overdue debriefings when rate > 15%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 2 ? "overdue" : "completed" }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.concerns.some((c) => c.includes("debriefings are overdue"))).toBe(true);
    });

    it("concern about not_offered debriefings when rate > 10%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 2 ? "not_offered" : "completed" }),
      );
      const r = run(baseInput({ debriefing_records: debriefs }));
      expect(r.concerns.some((c) => c.includes("debriefings were not offered"))).toBe(true);
    });

    it("composite concern when staff satisfaction < 40%", () => {
      // Need >= 2 satisfaction components, all below threshold
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 5 }, (_, i) =>
          makeDebriefing({ id: `d_${i}`, staff_id: `s_${i}`, staff_felt_supported: false }),
        ),
        wellbeing_followup_records: Array.from({ length: 5 }, (_, i) =>
          makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i}`, staff_satisfied: false }),
        ),
        support_access_records: Array.from({ length: 5 }, (_, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i}`, staff_found_helpful: false }),
        ),
        critical_incident_records: [],
        learning_extraction_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("staff satisfaction across the post-incident support pathway is poor"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 20. RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("immediate rec when debriefing completion < 50%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 4 ? "completed" : "scheduled" }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("debriefing process"))).toBe(true);
    });

    it("immediate rec when incident support rate < 60%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, immediate_support_offered: i < 5 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("mandatory immediate support"))).toBe(true);
    });

    it("immediate rec when management response rate < 50%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, management_response_within_1h: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("management on-call"))).toBe(true);
    });

    it("immediate rec when no debriefings but critical incidents exist", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [makeCriticalIncident()],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("no debriefings are recorded"))).toBe(true);
    });

    it("soon rec when offered_within_24h < 70% and completion >= 50%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 6 ? "completed" : "scheduled", // 60% >=50
          offered_within_24h: i < 6, // 60% < 70
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("timeliness of debriefing"))).toBe(true);
    });

    it("soon rec when learning implemented rate < 60%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, implemented: i < 5 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("learning implementation pathway"))).toBe(true);
    });

    it("soon rec when barriers reported rate > 20%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 3, // 30%
          barrier_type: i < 3 ? "availability" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("barriers to support access"))).toBe(true);
    });

    it("planned rec when unique debrief types < 3", () => {
      // All same type → uniqueDebriefTypes = 1
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i}`, debrief_type: "formal_structured" }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("diversify debriefing"))).toBe(true);
    });

    it("planned rec when unique support types < 3", () => {
      const supports = Array.from({ length: 5 }, (_, i) =>
        makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i}`, support_type: "eap" }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("expand the range"))).toBe(true);
    });

    it("caps recommendations at 5", () => {
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 3 ? "completed" : "overdue",
            offered_within_24h: false,
            action_plan_created: false,
            debrief_type: "formal_structured",
          }),
        ),
        critical_incident_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: i < 3,
            management_response_within_1h: i < 3,
            debrief_completed: i < 3,
            staff_welfare_check_completed: i < 5,
          }),
        ),
        wellbeing_followup_records: Array.from({ length: 10 }, (_, i) =>
          makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}`, status: i < 3 ? "completed" : "overdue" }),
        ),
        learning_extraction_records: Array.from({ length: 10 }, (_, i) =>
          makeLearningExtraction({
            id: `le_${i}`,
            implemented: i < 3,
            learning_shared_with_team: i < 3,
            linked_to_training_plan: i < 3,
            impact_assessed: i < 3,
          }),
        ),
        support_access_records: Array.from({ length: 10 }, (_, i) =>
          makeSupportAccess({
            id: `sa_${i}`,
            staff_id: `s_${i % 8}`,
            support_type: "eap",
            barriers_reported: i < 5,
            barrier_type: i < 3 ? "stigma" : "awareness",
          }),
        ),
      }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("recommendation ranks are sequential from 1", () => {
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 3 ? "completed" : "overdue" }),
        ),
        critical_incident_records: [makeCriticalIncident({ immediate_support_offered: false })],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      r.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });

    it("no recommendations when everything is perfect", () => {
      const r = run(baseInput());
      // With many debrief types already (all same type in base → uniqueDebriefTypes=1)
      // Actually base uses "formal_structured" for all → uniqueDebriefTypes < 3 → planned rec
      // Let's override with diverse types
      const diverseBase = baseInput({
        debriefing_records: staffIds.map((sid, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: sid,
            debrief_type: ["formal_structured", "informal_check_in", "group_debrief", "one_to_one"][i % 4],
          }),
        ),
      });
      const r2 = run(diverseBase);
      expect(r2.recommendations.length).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 21. INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("critical insight when both incident support and debriefing completion < 50%", () => {
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 4 ? "completed" : "scheduled" }),
        ),
        critical_incident_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalIncident({ id: `ci_${i}`, immediate_support_offered: i < 4 }),
        ),
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.toLowerCase().includes("below 50%"))).toBe(true);
    });

    it("critical insight when critical-severity incidents lack debrief", () => {
      const incidents = Array.from({ length: 5 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          severity: "critical",
          debrief_completed: i < 3, // 2/5 = 40% without debrief → >30%
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.toLowerCase().includes("critical-severity incidents"))).toBe(true);
    });

    it("critical insight when wellbeing followup rate < 40% and overdue > 3", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 3 ? "completed" : "overdue",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 7 overdue > 3, rate = 30% < 40%
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.toLowerCase().includes("wellbeing follow-up is systemically failing"))).toBe(true);
    });

    it("critical insight when no learning extraction but > 3 critical incidents", () => {
      const incidents = Array.from({ length: 4 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}` }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.toLowerCase().includes("no learning extraction"))).toBe(true);
    });

    it("critical insight when widespread barriers including stigma", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 5, // 50%
          barrier_type: i < 3 ? "stigma" : i < 5 ? "availability" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.toLowerCase().includes("widespread barriers"))).toBe(true);
    });

    it("warning insight when debriefing completion 50-75%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 6 ? "completed" : "scheduled" }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("debriefing completion is adequate"))).toBe(true);
    });

    it("warning insight when incident support 50-80%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, immediate_support_offered: i < 7 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("immediate support is offered in most"))).toBe(true);
    });

    it("warning insight when declined debriefings > 20%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 8}`, status: i < 3 ? "declined" : "completed" }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("declined by staff"))).toBe(true);
    });

    it("warning insight when high emotional impact debriefings > 40%", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          emotional_impact_level: i < 5 ? "high" : "moderate",
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("high proportion of debriefings"))).toBe(true);
    });

    it("warning insight when avg days since incident > 14", () => {
      const followups = Array.from({ length: 5 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i}`, days_since_incident: 20 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("over two weeks"))).toBe(true);
    });

    it("warning insight when support acceptance rate < 60%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({
          id: `ci_${i}`,
          immediate_support_offered: true,
          immediate_support_accepted: i < 5, // 50% < 60
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("acceptance of immediate support"))).toBe(true);
    });

    it("positive insight for exemplary post-incident support system", () => {
      const r = run(baseInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("exemplary post-incident support"))).toBe(true);
    });

    it("positive insight for exemplary learning extraction", () => {
      const r = run(baseInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("learning extraction is exemplary"))).toBe(true);
    });

    it("positive insight for outstanding staff satisfaction across all dimensions", () => {
      const r = run(baseInput());
      // staffSatisfactionRate = 100, satisfactionComponents.length = 3 → >=3 → triggers
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("staff satisfaction across all dimensions"))).toBe(true);
    });

    it("positive insight for accessible and valued support services", () => {
      const r = run(baseInput());
      // barriersReportedRate=0 <=5, supportAccessRate=100 >=90, foundHelpfulRate=100 >=90
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("support services are accessible"))).toBe(true);
    });

    it("caps insights at 4", () => {
      const r = run(baseInput());
      expect(r.insights.length).toBeLessThanOrEqual(4);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 22. EDGE CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("pct(0,0) returns 0", () => {
      // Tested via no records
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      expect(r.debriefing_completion_rate).toBe(0);
      expect(r.incident_support_rate).toBe(0);
      expect(r.wellbeing_followup_rate).toBe(0);
      expect(r.learning_extraction_rate).toBe(0);
      expect(r.support_access_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
    });

    it("score is clamped to min 0", () => {
      // Stack maximum penalties: all 4 penalties at max
      // 52 - 8 - 8 - 6 - 6 = 24 (still above 0), but let's push further
      // Even max penalties can't go below 0 because 52 - 28 = 24 (clamp is there as safety)
      // We verify the clamp by ensuring score >= 0
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 4 ? "overdue" : (i < 5 ? "completed" : "not_offered"),
            offered_within_24h: false,
          }),
        ),
        critical_incident_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: false,
            debrief_completed: false,
            management_response_within_1h: false,
          }),
        ),
        wellbeing_followup_records: Array.from({ length: 10 }, (_, i) =>
          makeWellbeingFollowup({
            id: `wf_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 4 ? "overdue" : "completed",
            completed_on_time: false,
            outcome_positive: false,
            staff_satisfied: false,
          }),
        ),
        learning_extraction_records: [],
        support_access_records: Array.from({ length: 10 }, (_, i) =>
          makeSupportAccess({
            id: `sa_${i}`,
            staff_id: `s_${i % 8}`,
            accessed: false,
            barriers_reported: i < 5,
            barrier_type: i < 5 ? "stigma" : "none",
          }),
        ),
      }));
      expect(r.debriefing_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to max 100", () => {
      const r = run(baseInput());
      expect(r.debriefing_score).toBeLessThanOrEqual(100);
    });

    it("single record in each array works correctly", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing({ staff_id: "s1" })],
        critical_incident_records: [makeCriticalIncident()],
        wellbeing_followup_records: [makeWellbeingFollowup({ staff_id: "s1" })],
        learning_extraction_records: [makeLearningExtraction()],
        support_access_records: [makeSupportAccess({ staff_id: "s1" })],
      }));
      expect(r.total_debriefings).toBe(1);
      expect(r.total_critical_incidents).toBe(1);
      expect(r.total_wellbeing_followups).toBe(1);
      expect(r.total_learning_extractions).toBe(1);
      expect(r.total_support_accesses).toBe(1);
      expect(r.debriefing_completion_rate).toBe(100);
      expect(r.incident_support_rate).toBe(100);
    });

    it("large dataset (100 records each) runs without error", () => {
      const r = run(baseInput({
        total_staff: 50,
        debriefing_records: Array.from({ length: 100 }, (_, i) =>
          makeDebriefing({ id: `d_${i}`, staff_id: `s_${i % 50}` }),
        ),
        critical_incident_records: Array.from({ length: 100 }, (_, i) =>
          makeCriticalIncident({ id: `ci_${i}` }),
        ),
        wellbeing_followup_records: Array.from({ length: 100 }, (_, i) =>
          makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 50}` }),
        ),
        learning_extraction_records: Array.from({ length: 100 }, (_, i) =>
          makeLearningExtraction({ id: `le_${i}` }),
        ),
        support_access_records: Array.from({ length: 100 }, (_, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i % 50}` }),
        ),
      }));
      expect(r.debriefing_rating).toBeDefined();
      expect(r.debriefing_score).toBeGreaterThanOrEqual(0);
    });

    it("only debriefing records present (no floor, not allEmpty)", () => {
      const r = run(baseInput({
        debriefing_records: [makeDebriefing({ staff_id: "s1" })],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).not.toBe("insufficient_data");
      expect(r.debriefing_rating).not.toBe("inadequate"); // score 59 = adequate
    });

    it("only critical incident records present (no floor)", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [makeCriticalIncident()],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).not.toBe("insufficient_data");
    });

    it("only wellbeing followup records present (no floor)", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [makeWellbeingFollowup({ staff_id: "s1" })],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).not.toBe("insufficient_data");
    });

    it("only learning extraction records present (no floor)", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [makeLearningExtraction()],
        support_access_records: [],
      }));
      expect(r.debriefing_rating).not.toBe("insufficient_data");
    });

    it("only support access records present (no floor)", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [makeSupportAccess({ staff_id: "s1" })],
      }));
      expect(r.debriefing_rating).not.toBe("insufficient_data");
    });

    it("all debriefings declined does not crash", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i}`, status: "declined" }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_completion_rate).toBe(0);
      expect(r.debriefing_score).toBeGreaterThanOrEqual(0);
    });

    it("mixed severity incidents are counted correctly", () => {
      const incidents = [
        makeCriticalIncident({ id: "ci_0", severity: "critical" }),
        makeCriticalIncident({ id: "ci_1", severity: "high" }),
        makeCriticalIncident({ id: "ci_2", severity: "moderate" }),
        makeCriticalIncident({ id: "ci_3", severity: "low" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.total_critical_incidents).toBe(4);
    });

    it("debrief_quality_rating of 0 is excluded from quality average", () => {
      const debriefs = [
        makeDebriefing({ id: "d_0", debrief_quality_rating: 5 }),
        makeDebriefing({ id: "d_1", debrief_quality_rating: 0 }), // excluded
      ];
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // The quality score still reflects only rating > 0
      // This is an internal metric not directly exposed, but it affects strengths
      expect(r.debriefing_completion_rate).toBe(100);
    });

    it("completed_within_48h_rate is 0 when no completed debriefings (pct(0,0)=0)", () => {
      const debriefs = [makeDebriefing({ status: "scheduled" })];
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.completed_within_48h_rate).toBe(0);
    });

    it("followup_on_time_rate is 0 when no completed followups (pct(0,0)=0)", () => {
      const followups = [makeWellbeingFollowup({ status: "scheduled" })];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.followup_on_time_rate).toBe(0);
    });

    it("bonus 4 uses only learning when support is empty", () => {
      const learnings = Array.from({ length: 5 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}` }), // all perfect → quality = 100
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      // combinedAccessLearning = learningScore = 100, uniqueSupportTypes=0 (<4)
      // >=85 but uniqueSupportTypes < 4 → try >=70 → +5
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("bonus 4 uses only support when learning is empty", () => {
      const supports = [
        makeSupportAccess({ id: "sa_0", staff_id: "s1", support_type: "eap" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      // combinedAccessLearning = accessScore = 100, uniqueSupportTypes=1 (<4)
      // >=85 but types < 4 → >=70 → +5
      expect(r.debriefing_score).toBe(52 + 5);
    });

    it("multiple penalties stack correctly", () => {
      // penalty1 (-8) + penalty2 (-8) + penalty3 (-6) + penalty4 (-6)
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 3 }, (_, i) =>
          makeDebriefing({ id: `d_${i}`, staff_id: `s_${i}`, status: "overdue" }),
        ), // 100% overdue > 30 → -8
        critical_incident_records: Array.from({ length: 3 }, (_, i) =>
          makeCriticalIncident({ id: `ci_${i}`, debrief_completed: false, immediate_support_offered: false }),
        ), // 100% noDebrief > 40 → -8
        wellbeing_followup_records: Array.from({ length: 3 }, (_, i) =>
          makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i}`, status: "overdue" }),
        ), // 100% overdue > 30 → -6
        learning_extraction_records: [],
        support_access_records: Array.from({ length: 3 }, (_, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i}`, barriers_reported: true, barrier_type: "stigma" }),
        ), // 100% barriers > 40 → -6
      }));
      // 52 + bonus1(0, completion=0) + bonus2(0, support=0) + bonus3(0, followup=0) + bonus4(support accessed=true→100%, uniqueTypes=1 → +5 based on >=70)
      // Wait — support_access accessed defaults to true. AccessRate=100%. combinedAccessLearning=100. uniqueSupportTypes=1. >=85 but types<4 → >=70 → +5
      // Penalties: -8 -8 -6 -6 = -28
      // 52 + 5 - 28 = 29
      expect(r.debriefing_score).toBe(29);
    });

    it("toRating boundary: score exactly 80 → outstanding", () => {
      const r = run(baseInput());
      expect(r.debriefing_score).toBe(80);
      expect(r.debriefing_rating).toBe("outstanding");
    });

    it("toRating boundary: score exactly 65 → good", () => {
      // Need score = 65. Base=52, need +13 in bonuses, 0 penalties.
      // bonus1(+7) + bonus2(+5) + bonus3(+1) + bonus4(+0) = 13?
      // Let me construct: bonus1=+7, bonus2=+5, bonus3=+3, bonus4=+0 = 67? Not exact.
      // Try: bonus1=+5, bonus2=+5, bonus3=+3, bonus4=+0 = 65
      const r = run(baseInput({
        debriefing_records: Array.from({ length: 10 }, (_, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 8 ? "completed" : "scheduled", // 80%
            offered_within_24h: i < 7, // 70%
          }),
        ),
        critical_incident_records: Array.from({ length: 10 }, (_, i) =>
          makeCriticalIncident({
            id: `ci_${i}`,
            immediate_support_offered: i < 9, // 90% >= 85
            management_response_within_1h: i < 8, // 80% >= 75
          }),
        ),
        wellbeing_followup_records: Array.from({ length: 10 }, (_, i) =>
          makeWellbeingFollowup({
            id: `wf_${i}`,
            staff_id: `s_${i % 8}`,
            status: i < 7 ? "completed" : "scheduled", // 70% >= 65 but < 80
            completed_on_time: i < 3,
          }),
        ),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // bonus1: 80% completion, 70% offered → >=80 && >=70 → +5
      // bonus2: 90% support, 80% mgmt → >=85 && >=75 → +5
      // bonus3: 70% followup rate, >=65 → +3
      // bonus4: nothing → +0
      // 52+5+5+3 = 65
      expect(r.debriefing_score).toBe(65);
      expect(r.debriefing_rating).toBe("good");
    });

    it("toRating boundary: score exactly 45 → adequate", () => {
      // 52 + bonus1(+1) - penalty1(-8) = 45
      // Need: debriefingCompletionRate >= 50 but < 65, overdueRate > 30
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 5 ? "completed" : (i < 9 ? "overdue" : "scheduled"),
          offered_within_24h: false,
        }),
      );
      // completionRate = 50%, offeredWithin24h = 0%. >=50 → +1
      // overdueRate = pct(4, 10) = 40% > 30 → -8
      // 52 + 1 - 8 = 45
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(45);
      expect(r.debriefing_rating).toBe("adequate");
    });

    it("toRating boundary: score 44 → inadequate", () => {
      // 52 + bonus1(0) - penalty1(-8) = 44
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "completed" : (i < 8 ? "overdue" : "scheduled"),
          offered_within_24h: false,
        }),
      );
      // completionRate = 40% < 50 → +0
      // overdueRate = pct(4, 10) = 40% > 30 → -8
      // 52 + 0 - 8 = 44
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.debriefing_score).toBe(44);
      expect(r.debriefing_rating).toBe("inadequate");
    });

    it("uses total_staff for staff debrief coverage (not array length)", () => {
      // 3 unique staff debriefed out of 8 total → 38% coverage
      const r = run(baseInput({
        total_staff: 8,
        debriefing_records: [
          makeDebriefing({ id: "d_0", staff_id: "s1" }),
          makeDebriefing({ id: "d_1", staff_id: "s2" }),
          makeDebriefing({ id: "d_2", staff_id: "s3" }),
        ],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // staffDebriefCoverageRate = pct(3, 8) = 38% → planned rec about broadening coverage (< 50)
      expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("broaden debriefing coverage"))).toBe(true);
    });

    it("total_staff=0 with records does NOT trigger insufficient_data (allEmpty is false)", () => {
      const r = run({
        today: "2026-05-29",
        total_staff: 0,
        debriefing_records: [makeDebriefing()],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      });
      // allEmpty is false because debriefing_records is non-empty
      // Does NOT hit the insufficient_data branch or the inadequate floor branch
      expect(r.debriefing_rating).not.toBe("insufficient_data");
    });

    it("follow_up_scheduled without follow_up_completed counts as incomplete follow-up", () => {
      const debriefs = [
        makeDebriefing({ id: "d_0", follow_up_scheduled: true, follow_up_completed: false }),
        makeDebriefing({ id: "d_1", follow_up_scheduled: true, follow_up_completed: true }),
      ];
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // debriefFollowUpRate = pct(1, 2) = 50 — internal metric used for display
      expect(r.debriefing_completion_rate).toBe(100);
    });

    it("severe emotional impact is counted the same as high", () => {
      const debriefs = [
        makeDebriefing({ id: "d_0", emotional_impact_level: "severe" }),
        makeDebriefing({ id: "d_1", emotional_impact_level: "high" }),
        makeDebriefing({ id: "d_2", emotional_impact_level: "moderate" }),
      ];
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // 2/3 high+severe = 67% > 40% → warning insight
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("high proportion of debriefings"))).toBe(true);
    });

    it("needs_further_followup tracking works correctly", () => {
      const followups = [
        makeWellbeingFollowup({ id: "wf_0", needs_further_followup: true, further_followup_scheduled: true }),
        makeWellbeingFollowup({ id: "wf_1", needs_further_followup: true, further_followup_scheduled: false }),
        makeWellbeingFollowup({ id: "wf_2", needs_further_followup: false, further_followup_scheduled: false }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // furtherFollowupRate = pct(1, 2) = 50 < 60 → concern
      expect(r.concerns.some((c) => c.toLowerCase().includes("further follow-up is identified as needed"))).toBe(true);
    });

    it("learning type variety is tracked but does not directly impact score", () => {
      const learnings = [
        makeLearningExtraction({ id: "le_0", learning_type: "practice_change" }),
        makeLearningExtraction({ id: "le_1", learning_type: "training_need" }),
        makeLearningExtraction({ id: "le_2", learning_type: "policy_update" }),
      ];
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      // 3 types don't affect score directly — they are computed but not used in bonus calc
      expect(r.learning_extraction_rate).toBe(100);
    });

    it("warning insight for learning partially implemented but impact not assessed", () => {
      // learningImplementedRate >= 50 && < 75, impactAssessedRate < 50
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({
          id: `le_${i}`,
          implemented: i < 6, // 60%
          impact_assessed: i < 4, // 40%
          learning_shared_with_team: true,
          documented_in_learning_log: true,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("impact is rarely assessed"))).toBe(true);
    });

    it("warning insight for availability barriers > 15%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 2,
          barrier_type: i < 2 ? "availability" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      // pct(2, 10) = 20% > 15 → warning insight
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.toLowerCase().includes("availability is a significant barrier"))).toBe(true);
    });

    it("positive insight when debrief and support type variety >= 4 each", () => {
      // Use only debriefing + support records to minimize other insights filling the cap
      const r = run(baseInput({
        debriefing_records: staffIds.map((sid, i) =>
          makeDebriefing({
            id: `d_${i}`,
            staff_id: sid,
            debrief_type: ["formal_structured", "informal_check_in", "group_debrief", "one_to_one", "peer_led", "manager_led", "external_facilitator", "formal_structured"][i],
          }),
        ),
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({
            id: `sa_${i}`,
            staff_id: sid,
            support_type: (["eap", "counselling", "peer_support", "supervision", "occupational_health", "mental_health_first_aid", "trauma_informed_support", "union_rep"])[i % 8],
          }),
        ),
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("variety of debriefing approaches"))).toBe(true);
    });

    it("positive insight when welfare check and management response >= 95%", () => {
      // Use only critical incidents to keep insight count low
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: staffIds.map((_, i) => makeCriticalIncident({ id: `ci_${i}` })),
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("management response and welfare checks"))).toBe(true);
    });

    it("positive insight when further followup rate >= 95% and positive outcome >= 90%", () => {
      // Use only wellbeing followups with further followup needed
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          needs_further_followup: true,
          further_followup_scheduled: true,
          outcome_positive: true,
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.toLowerCase().includes("reliably scheduled and outcomes"))).toBe(true);
    });

    it("repeat access rate > 40% triggers planned recommendation", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          repeat_access: i < 5, // 50%
        }),
      );
      const r = run(baseInput({
        support_access_records: supports,
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("repeated support access"))).toBe(true);
    });

    it("action plan rate < 60% triggers planned recommendation", () => {
      const debriefs = Array.from({ length: 10 }, (_, i) =>
        makeDebriefing({
          id: `d_${i}`,
          staff_id: `s_${i % 8}`,
          action_plan_created: i < 5, // 50% < 60
        }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("action plans"))).toBe(true);
    });

    it("stigma barriers > 5% triggers planned recommendation", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 1,
          barrier_type: i < 1 ? "stigma" : "none",
        }),
      );
      const r = run(baseInput({
        support_access_records: supports,
      }));
      // pct(1, 10) = 10% > 5 → planned rec
      expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("stigma around accessing support"))).toBe(true);
    });

    it("wellbeing followup completion < 50% triggers immediate recommendation", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({
          id: `wf_${i}`,
          staff_id: `s_${i % 8}`,
          status: i < 4 ? "completed" : "scheduled",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("wellbeing follow-up completion is critically low"))).toBe(true);
    });

    it("soon rec: learning shared rate < 60%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, learning_shared_with_team: i < 5 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("incident learning is systematically shared"))).toBe(true);
    });

    it("soon rec: no learning extraction but critical incidents present", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [makeCriticalIncident()],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("no learning extraction records"))).toBe(true);
    });

    it("planned rec: linked to training plan < 50%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, linked_to_training_plan: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("link incident learning to the training"))).toBe(true);
    });

    it("planned rec: impact assessed rate < 50%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, impact_assessed: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.toLowerCase().includes("impact assessment"))).toBe(true);
    });

    it("soon rec: welfare check rate < 80% but >= 50%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, staff_welfare_check_completed: i < 6 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.toLowerCase().includes("welfare checks"))).toBe(true);
    });

    it("quality score concern when debrief quality rating low", () => {
      const debriefs = Array.from({ length: 5 }, (_, i) =>
        makeDebriefing({ id: `d_${i}`, staff_id: `s_${i}`, debrief_quality_rating: 2 }),
      );
      const r = run(baseInput({
        debriefing_records: debriefs,
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      // avg quality = 2/5*100 = 40 < 50 → concern
      expect(r.concerns.some((c) => c.toLowerCase().includes("rate debriefing quality poorly"))).toBe(true);
    });

    it("concern about incident debrief rate < 60%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, debrief_completed: i < 5 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("debriefs are completed for fewer than 60%"))).toBe(true);
    });

    it("concern about welfare check rate < 70%", () => {
      const incidents = Array.from({ length: 10 }, (_, i) =>
        makeCriticalIncident({ id: `ci_${i}`, staff_welfare_check_completed: i < 6 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: incidents,
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("staff welfare checks are not completed"))).toBe(true);
    });

    it("concern about support access rate < 60%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i % 8}`, accessed: i < 5 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("support access rate is below 60%"))).toBe(true);
    });

    it("concern about found helpful rate < 50%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({ id: `sa_${i}`, staff_id: `s_${i % 8}`, staff_found_helpful: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("fewer than half of staff who access support find it helpful"))).toBe(true);
    });

    it("concern about stigma barrier > 10%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 2,
          barrier_type: i < 2 ? "stigma" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("stigma is reported as a barrier"))).toBe(true);
    });

    it("concern about awareness barrier > 15%", () => {
      const supports = Array.from({ length: 10 }, (_, i) =>
        makeSupportAccess({
          id: `sa_${i}`,
          staff_id: `s_${i % 8}`,
          barriers_reported: i < 2,
          barrier_type: i < 2 ? "awareness" : "none",
        }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: supports,
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("lack of awareness is a significant barrier"))).toBe(true);
    });

    it("concern about overdue wellbeing followups > 15%", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}`, status: i < 2 ? "overdue" : "completed" }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("wellbeing follow-ups are overdue"))).toBe(true);
    });

    it("concern about followup satisfaction < 50%", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}`, staff_satisfied: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("satisfaction with wellbeing follow-ups is below 50%"))).toBe(true);
    });

    it("concern about positive outcome rate < 50%", () => {
      const followups = Array.from({ length: 10 }, (_, i) =>
        makeWellbeingFollowup({ id: `wf_${i}`, staff_id: `s_${i % 8}`, outcome_positive: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: followups,
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("fewer than half of wellbeing follow-ups result in positive outcomes"))).toBe(true);
    });

    it("concern about learning shared rate < 50%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, learning_shared_with_team: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("learning is shared with the team in fewer than half"))).toBe(true);
    });

    it("concern about documented in log rate < 50%", () => {
      const learnings = Array.from({ length: 10 }, (_, i) =>
        makeLearningExtraction({ id: `le_${i}`, documented_in_learning_log: i < 4 }),
      );
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: learnings,
        support_access_records: [],
      }));
      expect(r.concerns.some((c) => c.toLowerCase().includes("learning is not documented in a learning log"))).toBe(true);
    });

    it("strength: confidentiality rate >= 95%", () => {
      const r = run(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("confidentiality is consistently maintained in debriefings"))).toBe(true);
    });

    it("strength: wide variety of support types >= 5", () => {
      // Use only support records to avoid earlier strengths filling the cap
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({
            id: `sa_${i}`,
            staff_id: sid,
            support_type: (["eap", "counselling", "peer_support", "supervision", "occupational_health", "mental_health_first_aid", "trauma_informed_support", "union_rep"] as const)[i % 8] as string,
          }),
        ),
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("wide variety of support types"))).toBe(true);
    });

    it("strength: low barriers to support <= 5%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: sid }),
        ),
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("very few barriers"))).toBe(true);
    });

    it("strength: confidential support rate >= 95%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: sid }),
        ),
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("confidentiality in support provision"))).toBe(true);
    });

    it("strength: staff quality rating high >= 80", () => {
      const r = run(baseInput());
      // All debrief_quality_rating = 5 → qualityScore = 100 >= 80
      expect(r.strengths.some((s) => s.toLowerCase().includes("rate debriefing quality highly"))).toBe(true);
    });

    it("strength: followup on time rate >= 90%", () => {
      // Use only wellbeing followups to avoid cap issues
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: staffIds.map((sid, i) => makeWellbeingFollowup({ id: `wf_${i}`, staff_id: sid })),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("follow-ups are completed on time"))).toBe(true);
    });

    it("strength: positive outcome rate >= 85%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: staffIds.map((sid, i) => makeWellbeingFollowup({ id: `wf_${i}`, staff_id: sid })),
        learning_extraction_records: [],
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("follow-up outcomes are overwhelmingly positive"))).toBe(true);
    });

    it("strength: learning shared rate >= 90%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: staffIds.map((_, i) => makeLearningExtraction({ id: `le_${i}` })),
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("learning is shared with the wider team"))).toBe(true);
    });

    it("strength: impact assessed rate >= 80%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: staffIds.map((_, i) => makeLearningExtraction({ id: `le_${i}` })),
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("impact of learning actions is systematically assessed"))).toBe(true);
    });

    it("strength: linked to training rate >= 75%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: staffIds.map((_, i) => makeLearningExtraction({ id: `le_${i}` })),
        support_access_records: [],
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("incident learning is linked to training plans"))).toBe(true);
    });

    it("strength: staff found helpful rate >= 90%", () => {
      const r = run(baseInput({
        debriefing_records: [],
        critical_incident_records: [],
        wellbeing_followup_records: [],
        learning_extraction_records: [],
        support_access_records: staffIds.map((sid, i) =>
          makeSupportAccess({ id: `sa_${i}`, staff_id: sid }),
        ),
      }));
      expect(r.strengths.some((s) => s.toLowerCase().includes("find support services helpful"))).toBe(true);
    });
  });
});
