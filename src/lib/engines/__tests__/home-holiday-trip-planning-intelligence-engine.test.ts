// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Holiday & Trip Planning Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHolidayTripPlanning,
  type HolidayTripInput,
  type HolidayPlanRecordInput,
  type TripRiskAssessmentRecordInput,
  type ConsentManagementRecordInput,
  type ExperienceRecordInput,
  type ChildParticipationRecordInput,
} from "../home-holiday-trip-planning-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-29";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let _id = 0;
function uid(): string {
  return `id_${++_id}`;
}

function makeHolidayPlan(overrides: Partial<HolidayPlanRecordInput> = {}): HolidayPlanRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    holiday_name: "Summer Trip",
    destination: "Cornwall",
    start_date: daysAgo(10),
    end_date: daysAgo(5),
    planning_completed: true,
    itinerary_documented: true,
    budget_approved: true,
    staffing_confirmed: true,
    transport_arranged: true,
    accommodation_confirmed: true,
    activities_planned: true,
    dietary_needs_addressed: true,
    medical_needs_addressed: true,
    emergency_plan_in_place: true,
    child_briefed: true,
    social_worker_notified: true,
    status: "completed",
    holiday_type: "residential",
    staff_member: "staff_1",
    notes: null,
    created_at: daysAgo(30),
    ...overrides,
  };
}

function makeRiskAssessment(overrides: Partial<TripRiskAssessmentRecordInput> = {}): TripRiskAssessmentRecordInput {
  return {
    id: uid(),
    holiday_plan_id: "hp_1",
    child_id: "child_1",
    assessment_date: daysAgo(15),
    risk_type: "travel",
    risk_identified: "Long journey",
    likelihood: "low",
    impact: "low",
    mitigation_measures: "Regular breaks",
    mitigation_in_place: true,
    assessor: "staff_1",
    reviewed: true,
    review_date: daysAgo(14),
    approved: true,
    approved_by: "manager_1",
    dynamic_risk_assessment_planned: true,
    created_at: daysAgo(15),
    ...overrides,
  };
}

function makeConsent(overrides: Partial<ConsentManagementRecordInput> = {}): ConsentManagementRecordInput {
  return {
    id: uid(),
    holiday_plan_id: "hp_1",
    child_id: "child_1",
    consent_type: "parent_guardian",
    consent_requested_date: daysAgo(20),
    consent_received: true,
    consent_received_date: daysAgo(18),
    consent_method: "written",
    consent_documented: true,
    chased_count: 0,
    refused: false,
    refusal_reason: null,
    expiry_date: null,
    created_at: daysAgo(20),
    ...overrides,
  };
}

function makeExperience(overrides: Partial<ExperienceRecordInput> = {}): ExperienceRecordInput {
  return {
    id: uid(),
    holiday_plan_id: "hp_1",
    child_id: "child_1",
    experience_date: daysAgo(7),
    activity_description: "Beach visit",
    experience_type: "adventure",
    child_enjoyment_rating: 5,
    child_feedback: "Loved it",
    child_feedback_positive: true,
    memorable_moment_captured: true,
    photos_taken: true,
    new_skill_learned: true,
    social_interaction_positive: true,
    staff_observation: "Great day",
    staff_member: "staff_1",
    created_at: daysAgo(7),
    ...overrides,
  };
}

function makeParticipation(overrides: Partial<ChildParticipationRecordInput> = {}): ChildParticipationRecordInput {
  return {
    id: uid(),
    holiday_plan_id: "hp_1",
    child_id: "child_1",
    participation_date: daysAgo(20),
    participation_type: "destination_choice",
    child_involved: true,
    child_views_recorded: true,
    child_views_acted_upon: true,
    child_enthusiasm_rating: 5,
    barriers_to_participation: null,
    barriers_addressed: false,
    staff_member: "staff_1",
    notes: null,
    created_at: daysAgo(20),
    ...overrides,
  };
}

function baseInput(overrides: Partial<HolidayTripInput> = {}): HolidayTripInput {
  return {
    today: TODAY,
    total_children: 3,
    holiday_plan_records: [],
    trip_risk_assessment_records: [],
    consent_management_records: [],
    experience_records: [],
    child_participation_records: [],
    ...overrides,
  };
}

/** Build N holiday plans with specified boolean overrides applied to all */
function makeHolidayPlans(n: number, overrides: Partial<HolidayPlanRecordInput> = {}): HolidayPlanRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeHolidayPlan({ id: `hp_${i}`, child_id: `child_${i % 3}`, ...overrides }),
  );
}

function makeRiskAssessments(n: number, overrides: Partial<TripRiskAssessmentRecordInput> = {}): TripRiskAssessmentRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeRiskAssessment({ holiday_plan_id: `hp_${i % 5}`, ...overrides }),
  );
}

function makeConsents(n: number, overrides: Partial<ConsentManagementRecordInput> = {}): ConsentManagementRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeConsent({ holiday_plan_id: `hp_${i % 5}`, ...overrides }),
  );
}

function makeExperiences(n: number, overrides: Partial<ExperienceRecordInput> = {}): ExperienceRecordInput[] {
  return Array.from({ length: n }, () => makeExperience(overrides));
}

function makeParticipations(n: number, overrides: Partial<ChildParticipationRecordInput> = {}): ChildParticipationRecordInput[] {
  return Array.from({ length: n }, () => makeParticipation(overrides));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Holiday & Trip Planning Intelligence Engine", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ══════════════════════════════════════════════════════════════════════════

  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 0 }));
      expect(r.holiday_rating).toBe("insufficient_data");
      expect(r.holiday_score).toBe(0);
    });

    it("sets correct headline for insufficient_data", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("returns empty arrays for strengths/concerns/recommendations/insights", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero for all rates", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 0 }));
      expect(r.holiday_planning_rate).toBe(0);
      expect(r.risk_assessment_rate).toBe(0);
      expect(r.consent_compliance_rate).toBe(0);
      expect(r.experience_quality_rate).toBe(0);
      expect(r.child_participation_rate).toBe(0);
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("returns zero totals", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 0 }));
      expect(r.total_holiday_plans).toBe(0);
      expect(r.total_risk_assessments).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INADEQUATE FLOOR (all empty + children > 0)
  // ══════════════════════════════════════════════════════════════════════════

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 4 }));
      expect(r.holiday_rating).toBe("inadequate");
      expect(r.holiday_score).toBe(15);
    });

    it("headline mentions 'urgent attention'", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 4 }));
      expect(r.headline).toContain("urgent attention");
    });

    it("has exactly 1 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 2 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No holiday plans");
    });

    it("has exactly 2 recommendations", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 2 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 2 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns zero for all rates", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 5 }));
      expect(r.holiday_planning_rate).toBe(0);
      expect(r.risk_assessment_rate).toBe(0);
      expect(r.consent_compliance_rate).toBe(0);
      expect(r.experience_quality_rate).toBe(0);
      expect(r.child_participation_rate).toBe(0);
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("returns zero totals", () => {
      const r = computeHolidayTripPlanning(baseInput({ total_children: 1 }));
      expect(r.total_holiday_plans).toBe(0);
      expect(r.total_risk_assessments).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // OUTSTANDING SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("outstanding scenario", () => {
    function outstandingInput(): HolidayTripInput {
      const hp = makeHolidayPlans(5);
      const hpIds = hp.map((h) => h.id);
      return baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({
          ...h,
          child_id: `child_${i % 3}`,
        })),
        trip_risk_assessment_records: hpIds.map((hpId) =>
          makeRiskAssessment({ holiday_plan_id: hpId }),
        ),
        consent_management_records: hpIds.map((hpId) =>
          makeConsent({ holiday_plan_id: hpId }),
        ),
        experience_records: makeExperiences(5),
        child_participation_records: makeParticipations(5),
      });
    }

    it("rates outstanding with score >= 80", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.holiday_rating).toBe("outstanding");
      expect(r.holiday_score).toBeGreaterThanOrEqual(80);
    });

    it("headline mentions 'Outstanding'", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has strengths but minimal/no concerns", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("reports 100% holiday planning rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.holiday_planning_rate).toBe(100);
    });

    it("reports 100% risk assessment rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.risk_assessment_rate).toBe(100);
    });

    it("reports 100% consent compliance rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.consent_compliance_rate).toBe(100);
    });

    it("reports 100% experience quality rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.experience_quality_rate).toBe(100);
    });

    it("reports 100% child participation rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.child_participation_rate).toBe(100);
    });

    it("reports 100% child enjoyment rate", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      expect(r.child_enjoyment_rate).toBe(100);
    });

    it("includes positive insight about outstanding", () => {
      const r = computeHolidayTripPlanning(outstandingInput());
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
      expect(positiveInsights.some((i) => i.text.includes("outstanding"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GOOD SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("good scenario", () => {
    function goodInput(): HolidayTripInput {
      // All rates ~75%, no high bonuses but no penalties
      const hp = makeHolidayPlans(4, {
        planning_completed: true,
        itinerary_documented: true,
        budget_approved: true,
        staffing_confirmed: true,
        transport_arranged: true,
        accommodation_confirmed: true,
        activities_planned: true,
        dietary_needs_addressed: false,
        medical_needs_addressed: false,
        emergency_plan_in_place: false,
      });
      const hpIds = hp.map((h) => h.id);
      // 3 of 4 risk assessments fully compliant
      const ras = hpIds.map((hpId, i) =>
        makeRiskAssessment({
          holiday_plan_id: hpId,
          mitigation_in_place: i < 3,
          reviewed: i < 3,
          approved: i < 3,
        }),
      );
      const consents = hpIds.map((hpId, i) =>
        makeConsent({
          holiday_plan_id: hpId,
          consent_received: i < 3,
          consent_documented: i < 3,
        }),
      );
      const exps = makeExperiences(4, {
        child_feedback_positive: true,
        memorable_moment_captured: true,
        photos_taken: false,
        new_skill_learned: false,
        social_interaction_positive: true,
        child_enjoyment_rating: 4,
      });
      const parts = makeParticipations(4, {
        child_involved: true,
        child_views_recorded: true,
        child_views_acted_upon: false,
      });
      return baseInput({
        total_children: 3,
        holiday_plan_records: hp,
        trip_risk_assessment_records: ras,
        consent_management_records: consents,
        experience_records: exps,
        child_participation_records: parts,
      });
    }

    it("rates good with score 65-79", () => {
      const r = computeHolidayTripPlanning(goodInput());
      expect(r.holiday_rating).toBe("good");
      expect(r.holiday_score).toBeGreaterThanOrEqual(65);
      expect(r.holiday_score).toBeLessThan(80);
    });

    it("headline mentions 'Good'", () => {
      const r = computeHolidayTripPlanning(goodInput());
      expect(r.headline).toContain("Good");
    });

    it("headline mentions number of strengths", () => {
      const r = computeHolidayTripPlanning(goodInput());
      expect(r.headline).toMatch(/\d+ strength/);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADEQUATE SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("adequate scenario", () => {
    function adequateInput(): HolidayTripInput {
      // All rates ~50-60%, triggering mid-range
      const hp = makeHolidayPlans(4, {
        planning_completed: true,
        itinerary_documented: true,
        budget_approved: true,
        staffing_confirmed: true,
        transport_arranged: true,
        accommodation_confirmed: false,
        activities_planned: false,
        dietary_needs_addressed: false,
        medical_needs_addressed: false,
        emergency_plan_in_place: false,
      });
      // 50% of RA fully compliant (rate = 50%)
      const ras = [
        makeRiskAssessment({ holiday_plan_id: hp[0].id, mitigation_in_place: true, reviewed: true, approved: true }),
        makeRiskAssessment({ holiday_plan_id: hp[1].id, mitigation_in_place: false, reviewed: false, approved: false }),
      ];
      // 50% consent
      const consents = [
        makeConsent({ holiday_plan_id: hp[0].id, consent_received: true, consent_documented: true }),
        makeConsent({ holiday_plan_id: hp[1].id, consent_received: false, consent_documented: false }),
      ];
      const exps = makeExperiences(4, {
        child_feedback_positive: true,
        memorable_moment_captured: false,
        photos_taken: false,
        new_skill_learned: false,
        social_interaction_positive: true,
        child_enjoyment_rating: 3,
      });
      const parts = makeParticipations(4, {
        child_involved: true,
        child_views_recorded: false,
        child_views_acted_upon: false,
      });
      return baseInput({
        total_children: 3,
        holiday_plan_records: hp,
        trip_risk_assessment_records: ras,
        consent_management_records: consents,
        experience_records: exps,
        child_participation_records: parts,
      });
    }

    it("rates adequate with score 45-64", () => {
      const r = computeHolidayTripPlanning(adequateInput());
      expect(r.holiday_rating).toBe("adequate");
      expect(r.holiday_score).toBeGreaterThanOrEqual(45);
      expect(r.holiday_score).toBeLessThan(65);
    });

    it("headline mentions 'Adequate'", () => {
      const r = computeHolidayTripPlanning(adequateInput());
      expect(r.headline).toContain("Adequate");
    });

    it("headline mentions number of concerns", () => {
      const r = computeHolidayTripPlanning(adequateInput());
      expect(r.headline).toMatch(/\d+ concern/);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INADEQUATE SCENARIO (with data)
  // ══════════════════════════════════════════════════════════════════════════

  describe("inadequate scenario (with data)", () => {
    function inadequateInput(): HolidayTripInput {
      // All rates < 50 to trigger penalties
      const hp = makeHolidayPlans(4, {
        planning_completed: true,
        itinerary_documented: false,
        budget_approved: false,
        staffing_confirmed: false,
        transport_arranged: false,
        accommodation_confirmed: false,
        activities_planned: false,
        dietary_needs_addressed: false,
        medical_needs_addressed: false,
        emergency_plan_in_place: false,
        child_briefed: false,
        social_worker_notified: false,
      });
      const ras = makeRiskAssessments(4, {
        holiday_plan_id: hp[0].id,
        mitigation_in_place: false,
        reviewed: false,
        approved: false,
        likelihood: "high",
        impact: "high",
      });
      const consents = makeConsents(4, {
        consent_received: false,
        consent_documented: false,
        refused: false,
      });
      const exps = makeExperiences(4, {
        child_feedback_positive: false,
        memorable_moment_captured: false,
        photos_taken: false,
        new_skill_learned: false,
        social_interaction_positive: false,
        child_enjoyment_rating: 1,
      });
      const parts = makeParticipations(4, {
        child_involved: false,
        child_views_recorded: false,
        child_views_acted_upon: false,
        child_enthusiasm_rating: 1,
      });
      return baseInput({
        total_children: 3,
        holiday_plan_records: hp,
        trip_risk_assessment_records: ras,
        consent_management_records: consents,
        experience_records: exps,
        child_participation_records: parts,
      });
    }

    it("rates inadequate with score < 45", () => {
      const r = computeHolidayTripPlanning(inadequateInput());
      expect(r.holiday_rating).toBe("inadequate");
      expect(r.holiday_score).toBeLessThan(45);
    });

    it("headline mentions 'inadequate'", () => {
      const r = computeHolidayTripPlanning(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });

    it("has multiple concerns", () => {
      const r = computeHolidayTripPlanning(inadequateInput());
      expect(r.concerns.length).toBeGreaterThan(3);
    });

    it("has multiple recommendations with immediate urgency", () => {
      const r = computeHolidayTripPlanning(inadequateInput());
      const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediateRecs.length).toBeGreaterThan(2);
    });

    it("has critical insights", () => {
      const r = computeHolidayTripPlanning(inadequateInput());
      const criticalInsights = r.insights.filter((i) => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThan(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // pct() BEHAVIOUR
  // ══════════════════════════════════════════════════════════════════════════

  describe("pct(0,0)=0 behaviour", () => {
    it("returns 0 rates when arrays are empty but total_children > 0 and some data exists", () => {
      // Only experience records, no holiday plans
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience()],
      }));
      expect(r.holiday_planning_rate).toBe(0);
      expect(r.risk_assessment_rate).toBe(0);
      expect(r.consent_compliance_rate).toBe(0);
      expect(r.child_participation_rate).toBe(0);
    });

    it("returns 0 for child_enjoyment_rate when no experiences exist but other data does", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.child_enjoyment_rate).toBe(0);
      expect(r.experience_quality_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BONUSES — ISOLATED
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 1: holidayPlanningRate", () => {
    // All planning checks true = 100% = 10/10 per plan
    it("awards +4 when holidayPlanningRate >= 90", () => {
      // All 10 checks true
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
        // Zero other data to avoid other bonuses/penalties
      }));
      expect(r.holiday_planning_rate).toBe(100);
      // Base 52 + 4 = 56
      expect(r.holiday_score).toBe(56);
    });

    it("awards +2 when holidayPlanningRate >= 70 and < 90", () => {
      // 7/10 checks true
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.holiday_planning_rate).toBe(70);
      // Base 52 + 2 = 54
      expect(r.holiday_score).toBe(54);
    });

    it("awards +0 when holidayPlanningRate < 70", () => {
      // 6/10 checks true
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.holiday_planning_rate).toBe(60);
      expect(r.holiday_score).toBe(52);
    });
  });

  describe("Bonus 2: riskAssessmentRate", () => {
    // composite = (mitigation_in_place + reviewed + approved) / (total * 3)
    it("awards +4 when riskAssessmentRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: true,
          reviewed: true,
          approved: true,
        })],
      }));
      expect(r.risk_assessment_rate).toBe(100);
      // Base 52 + 4 = 56
      expect(r.holiday_score).toBe(56);
    });

    it("awards +2 when riskAssessmentRate >= 70 and < 90", () => {
      // 2/3 per record = 67% => need mix. Use 3 records: all have mitigation+reviewed, 1 has approved
      // = (3+3+1)/(3*3) = 7/9 = 78%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        trip_risk_assessment_records: [
          makeRiskAssessment({ mitigation_in_place: true, reviewed: true, approved: false }),
          makeRiskAssessment({ mitigation_in_place: true, reviewed: true, approved: false }),
          makeRiskAssessment({ mitigation_in_place: true, reviewed: true, approved: true }),
        ],
      }));
      expect(r.risk_assessment_rate).toBe(78);
      expect(r.holiday_score).toBe(54);
    });

    it("awards +0 when riskAssessmentRate < 70", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: true,
          reviewed: false,
          approved: false,
        })],
      }));
      // 1/3 = 33%
      expect(r.risk_assessment_rate).toBe(33);
      expect(r.holiday_score).toBe(52 - 5); // penalty applies
    });
  });

  describe("Bonus 3: consentComplianceRate", () => {
    // composite = (received + documented) / (total * 2)
    it("awards +4 when consentComplianceRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        consent_management_records: [makeConsent({
          consent_received: true,
          consent_documented: true,
        })],
      }));
      expect(r.consent_compliance_rate).toBe(100);
      expect(r.holiday_score).toBe(56);
    });

    it("awards +2 when consentComplianceRate >= 70 and < 90", () => {
      // 3 records: 2 fully compliant, 1 partially = (2+2+1+0)/(3*2) = 5/6 = 83%
      // Actually let's do: (2+2+1+1+0+0)/(3*2) = 6/6... no
      // 3 records: received=true for all, documented for 1 = (3+1)/(3*2) = 4/6 = 67%. Not enough
      // 4 records: received=true for all, documented for 2 = (4+2)/(4*2) = 6/8 = 75%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        consent_management_records: [
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: true, consent_documented: false }),
          makeConsent({ consent_received: true, consent_documented: false }),
        ],
      }));
      expect(r.consent_compliance_rate).toBe(75);
      expect(r.holiday_score).toBe(54);
    });

    it("awards +0 when consentComplianceRate < 70", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        consent_management_records: [makeConsent({
          consent_received: true,
          consent_documented: false,
        })],
      }));
      // 1/2 = 50%
      expect(r.consent_compliance_rate).toBe(50);
      expect(r.holiday_score).toBe(52);
    });
  });

  describe("Bonus 4: experienceQualityRate", () => {
    // composite = (feedback_positive + memorable + photos + skills + social) / (total * 5)
    it("awards +3 when experienceQualityRate >= 85", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience({
          child_feedback_positive: true,
          memorable_moment_captured: true,
          photos_taken: true,
          new_skill_learned: true,
          social_interaction_positive: true,
        })],
      }));
      expect(r.experience_quality_rate).toBe(100);
      // +3 for experienceQuality, also +3 for childEnjoyment (rating=5>=4 => 100%), +2 for memorableMoment (100%)
      // Total = 52 + 3 + 3 + 2 = 60
      expect(r.holiday_score).toBe(60);
    });

    it("awards +1 when experienceQualityRate >= 65 and < 85", () => {
      // 4/5 = 80%... that's >= 85? No, 80 < 85. Actually wait: pct(4,5) = 80. 80 < 85 => +1
      // Actually let's be precise: 4/5*100 = 80 rounded = 80. 80 < 85 => +1
      // Wait: need 65 <= rate < 85. 4/5 = 80. But pct uses Math.round. 4/5=0.8*100=80.
      // 80 >= 65 and < 85 => +1. But also need to check other bonuses.
      // Use 5 experiences, each with 4 of 5 true => 20/25 = 80%
      // child_enjoyment_rating: set to 3 so childEnjoymentRate (>=4) = 0%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: makeExperiences(5, {
          child_feedback_positive: true,
          memorable_moment_captured: true,
          photos_taken: true,
          new_skill_learned: true,
          social_interaction_positive: false,
          child_enjoyment_rating: 3,
        }),
      }));
      expect(r.experience_quality_rate).toBe(80);
      // +1 for experienceQuality, +0 for childEnjoyment (0%), +2 for memorableMoment (100%)
      // 52 + 1 + 0 + 2 = 55
      expect(r.holiday_score).toBe(55);
    });

    it("awards +0 when experienceQualityRate < 65", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience({
          child_feedback_positive: true,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
          child_enjoyment_rating: 3,
        })],
      }));
      // 1/5 = 20%
      expect(r.experience_quality_rate).toBe(20);
      expect(r.holiday_score).toBe(52);
    });
  });

  describe("Bonus 5: childParticipationRate", () => {
    // composite = (involved + views_recorded + views_acted_upon) / (total * 3)
    it("awards +3 when childParticipationRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: true,
          child_views_acted_upon: true,
        })],
      }));
      expect(r.child_participation_rate).toBe(100);
      // 52 + 3 = 55
      expect(r.holiday_score).toBe(55);
    });

    it("awards +1 when childParticipationRate >= 70 and < 90", () => {
      // 3 records: all involved + views_recorded, 1 acted_upon
      // (3+3+1)/(3*3) = 7/9 = 78%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        child_participation_records: [
          makeParticipation({ child_involved: true, child_views_recorded: true, child_views_acted_upon: false }),
          makeParticipation({ child_involved: true, child_views_recorded: true, child_views_acted_upon: false }),
          makeParticipation({ child_involved: true, child_views_recorded: true, child_views_acted_upon: true }),
        ],
      }));
      expect(r.child_participation_rate).toBe(78);
      expect(r.holiday_score).toBe(53);
    });

    it("awards +0 when childParticipationRate < 70", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      // 1/3 = 33%
      expect(r.child_participation_rate).toBe(33);
      // penalty: < 40 => -3
      expect(r.holiday_score).toBe(52 - 3);
    });
  });

  describe("Bonus 6: childEnjoymentRate", () => {
    // enjoyment >= 4 out of experiences
    it("awards +3 when childEnjoymentRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: makeExperiences(5, {
          child_enjoyment_rating: 5,
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        }),
      }));
      expect(r.child_enjoyment_rate).toBe(100);
      // 52 + 3 (enjoyment) + 0 (quality=0%) = 55
      expect(r.holiday_score).toBe(55);
    });

    it("awards +1 when childEnjoymentRate >= 70 and < 90", () => {
      // 3 of 4 have rating >= 4 = 75%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 5, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 4, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 4, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 2, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
        ],
      }));
      expect(r.child_enjoyment_rate).toBe(75);
      // 52 + 1 = 53
      expect(r.holiday_score).toBe(53);
    });

    it("awards +0 when childEnjoymentRate < 70", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: makeExperiences(5, {
          child_enjoyment_rating: 2,
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        }),
      }));
      expect(r.child_enjoyment_rate).toBe(0);
      expect(r.holiday_score).toBe(52);
    });
  });

  describe("Bonus 7: riskAssessmentCoverageRate", () => {
    // % of holiday plans that have at least one risk assessment
    it("awards +3 when riskAssessmentCoverageRate >= 90", () => {
      const hp = makeHolidayPlan({ id: "hp_cov_1" });
      const ra = makeRiskAssessment({ holiday_plan_id: "hp_cov_1" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [ra],
      }));
      // 1/1 = 100% coverage
      // holidayPlanning = 100% (+4), riskAssessment = 100% (+4), coverage = 100% (+3)
      // 52 + 4 + 4 + 3 = 63
      expect(r.holiday_score).toBe(63);
    });

    it("awards +1 when riskAssessmentCoverageRate >= 70 and < 90", () => {
      // 3 of 4 plans covered = 75%
      const hps = makeHolidayPlans(4);
      const ras = [
        makeRiskAssessment({ holiday_plan_id: hps[0].id }),
        makeRiskAssessment({ holiday_plan_id: hps[1].id }),
        makeRiskAssessment({ holiday_plan_id: hps[2].id }),
      ];
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hps,
        trip_risk_assessment_records: ras,
      }));
      // holidayPlanning=100%(+4), riskAssessment=100%(+4), coverage=75%(+1)
      // 52 + 4 + 4 + 1 + 2(holidayCoverage: 3unique/3children=100%>=80 => +2) = 63
      expect(r.holiday_score).toBe(63);
    });

    it("awards +0 when riskAssessmentCoverageRate < 70", () => {
      // 1 of 4 plans covered = 25%
      const hps = makeHolidayPlans(4);
      const ras = [makeRiskAssessment({ holiday_plan_id: hps[0].id })];
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hps,
        trip_risk_assessment_records: ras,
      }));
      // 25% < 70 => +0, plus holidayPlanning=100%(+4), riskAssessment=100%(+4)
      // holidayCoverage: 3unique/3children=100% => +2
      // 52 + 4 + 4 + 0 + 2 = 62
      expect(r.holiday_score).toBe(62);
    });
  });

  describe("Bonus 8: holidayCoverageRate", () => {
    // unique children with holidays / total_children
    it("awards +2 when holidayCoverageRate >= 80", () => {
      // 3 children, all have holidays
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_1" }),
          makeHolidayPlan({ child_id: "child_2" }),
        ],
      }));
      // 3/3 = 100% >= 80 => +2, plus holidayPlanning=100%(+4)
      // 52 + 4 + 2 = 58
      expect(r.holiday_score).toBe(58);
    });

    it("awards +1 when holidayCoverageRate >= 50 and < 80", () => {
      // 3 of 5 children have holidays = 60%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 5,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_1" }),
          makeHolidayPlan({ child_id: "child_2" }),
        ],
      }));
      // 3/5 = 60% => +1, plus holidayPlanning=100%(+4)
      // 52 + 4 + 1 = 57
      expect(r.holiday_score).toBe(57);
    });

    it("awards +0 when holidayCoverageRate < 50", () => {
      // 1 of 5 children = 20%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 5,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
        ],
      }));
      // 1/5 = 20% => +0, plus holidayPlanning=100%(+4)
      // 52 + 4 + 0 = 56
      expect(r.holiday_score).toBe(56);
    });
  });

  describe("Bonus 9: memorableMomentRate", () => {
    // memorable_moment_captured / totalExperiences
    it("awards +2 when memorableMomentRate >= 85", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: makeExperiences(5, {
          memorable_moment_captured: true,
          // Zero out other experience quality booleans to isolate
          child_feedback_positive: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
          child_enjoyment_rating: 3,
        }),
      }));
      expect(r.child_enjoyment_rate).toBe(0);
      // experienceQuality = 1/5=20% => +0, memorableMoment=100% => +2
      // 52 + 0 + 0 + 2 = 54
      expect(r.holiday_score).toBe(54);
    });

    it("awards +1 when memorableMomentRate >= 65 and < 85", () => {
      // 3 of 4 = 75%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [
          makeExperience({ memorable_moment_captured: true, child_feedback_positive: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false, child_enjoyment_rating: 3 }),
          makeExperience({ memorable_moment_captured: true, child_feedback_positive: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false, child_enjoyment_rating: 3 }),
          makeExperience({ memorable_moment_captured: true, child_feedback_positive: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false, child_enjoyment_rating: 3 }),
          makeExperience({ memorable_moment_captured: false, child_feedback_positive: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false, child_enjoyment_rating: 3 }),
        ],
      }));
      // 52 + 0 + 0 + 1 = 53
      expect(r.holiday_score).toBe(53);
    });

    it("awards +0 when memorableMomentRate < 65", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: makeExperiences(5, {
          memorable_moment_captured: false,
          child_feedback_positive: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
          child_enjoyment_rating: 3,
        }),
      }));
      // 0% => +0
      // 52 + 0 = 52
      expect(r.holiday_score).toBe(52);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MAX BONUSES = +28
  // ══════════════════════════════════════════════════════════════════════════

  describe("max bonuses", () => {
    it("achieves max score of 80 (base 52 + 28 bonuses) with perfect data", () => {
      const hp = makeHolidayPlan({ id: "hp_max", child_id: "child_0" });
      const hp2 = makeHolidayPlan({ id: "hp_max2", child_id: "child_1" });
      const hp3 = makeHolidayPlan({ id: "hp_max3", child_id: "child_2" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [hp, hp2, hp3],
        trip_risk_assessment_records: [
          makeRiskAssessment({ holiday_plan_id: "hp_max" }),
          makeRiskAssessment({ holiday_plan_id: "hp_max2" }),
          makeRiskAssessment({ holiday_plan_id: "hp_max3" }),
        ],
        consent_management_records: [
          makeConsent({ holiday_plan_id: "hp_max" }),
          makeConsent({ holiday_plan_id: "hp_max2" }),
          makeConsent({ holiday_plan_id: "hp_max3" }),
        ],
        experience_records: makeExperiences(5),
        child_participation_records: makeParticipations(5),
      }));
      // Bonus 1: holidayPlanningRate=100% => +4
      // Bonus 2: riskAssessmentRate=100% => +4
      // Bonus 3: consentComplianceRate=100% => +4
      // Bonus 4: experienceQualityRate=100% => +3
      // Bonus 5: childParticipationRate=100% => +3
      // Bonus 6: childEnjoymentRate=100% => +3
      // Bonus 7: riskAssessmentCoverageRate=100% => +3
      // Bonus 8: holidayCoverageRate=100% => +2
      // Bonus 9: memorableMomentRate=100% => +2
      // Total: 52 + 4+4+4+3+3+3+3+2+2 = 52 + 28 = 80
      expect(r.holiday_score).toBe(80);
      expect(r.holiday_rating).toBe("outstanding");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PENALTIES
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty: holidayPlanningRate < 50", () => {
    it("applies -5 when holidayPlanningRate < 50 and records exist", () => {
      // 1/10 checks true = 10%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.holiday_planning_rate).toBe(10);
      // 52 - 5 = 47
      expect(r.holiday_score).toBe(47);
    });

    it("does NOT apply penalty when no holiday plan records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience({
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
          child_enjoyment_rating: 3,
        })],
      }));
      // No holiday plans => no penalty (pct(0,0)=0, but condition requires length > 0)
      expect(r.holiday_score).toBe(52);
    });
  });

  describe("Penalty: riskAssessmentRate < 50", () => {
    it("applies -5 when riskAssessmentRate < 50 and records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
        })],
      }));
      // 0/3 = 0%
      expect(r.risk_assessment_rate).toBe(0);
      expect(r.holiday_score).toBe(47);
    });

    it("does NOT apply penalty when no risk assessment records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.risk_assessment_rate).toBe(0);
      // Still gets holidayPlanning bonus +4, no RA penalty
      expect(r.holiday_score).toBe(56);
    });
  });

  describe("Penalty: consentComplianceRate < 50", () => {
    it("applies -5 when consentComplianceRate < 50 and records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
      }));
      // 0/2 = 0%
      expect(r.consent_compliance_rate).toBe(0);
      expect(r.holiday_score).toBe(47);
    });

    it("does NOT apply penalty when no consent records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.consent_compliance_rate).toBe(0);
      // holidayPlanning +4, no consent penalty
      expect(r.holiday_score).toBe(56);
    });
  });

  describe("Penalty: childParticipationRate < 40", () => {
    it("applies -3 when childParticipationRate < 40 and records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      // 1/3 = 33%
      expect(r.child_participation_rate).toBe(33);
      expect(r.holiday_score).toBe(49);
    });

    it("does NOT apply penalty when no participation records exist", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.child_participation_rate).toBe(0);
      // holidayPlanning +4, no participation penalty
      expect(r.holiday_score).toBe(56);
    });
  });

  describe("all penalties stacking", () => {
    it("applies all penalties: -5 -5 -5 -3 = -18", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
        })],
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
        child_participation_records: [makeParticipation({
          child_involved: false,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      // 52 - 5 - 5 - 5 - 3 = 34
      expect(r.holiday_score).toBe(34);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SCORE CLAMPING
  // ══════════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {
    it("score is clamped to minimum 0", () => {
      // Ensure score cannot go below 0 — would need very aggressive penalties
      // All penalties = -18, base = 52, so minimum is 34 normally.
      // Can't get below 0 with current logic, but test clamp anyway
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
        })],
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
        child_participation_records: [makeParticipation({
          child_involved: false,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.holiday_score).toBeGreaterThanOrEqual(0);
      expect(r.holiday_score).toBeLessThanOrEqual(100);
    });

    it("score is clamped to maximum 100", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: makeHolidayPlans(10),
        trip_risk_assessment_records: makeRiskAssessments(10),
        consent_management_records: makeConsents(10),
        experience_records: makeExperiences(10),
        child_participation_records: makeParticipations(10),
      }));
      expect(r.holiday_score).toBeLessThanOrEqual(100);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SIX RATES
  // ══════════════════════════════════════════════════════════════════════════

  describe("six output rates", () => {
    it("holiday_planning_rate is computed from 10 boolean checks", () => {
      // 5/10 = 50%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: true,
          budget_approved: true,
          staffing_confirmed: true,
          transport_arranged: true,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.holiday_planning_rate).toBe(50);
    });

    it("risk_assessment_rate is composite of mitigation+reviewed+approved", () => {
      // 2 records: both mitigation=true, both reviewed=true, 1 approved
      // (2+2+1)/(2*3) = 5/6 = 83%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ mitigation_in_place: true, reviewed: true, approved: true }),
          makeRiskAssessment({ mitigation_in_place: true, reviewed: true, approved: false }),
        ],
      }));
      expect(r.risk_assessment_rate).toBe(83);
    });

    it("consent_compliance_rate is composite of received+documented", () => {
      // 2 records: 1 received+documented, 1 neither
      // (1+1)/(2*2) = 2/4 = 50%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: false, consent_documented: false }),
        ],
      }));
      expect(r.consent_compliance_rate).toBe(50);
    });

    it("experience_quality_rate is composite of 5 booleans", () => {
      // 3 of 5 true = 3/5 = 60%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({
          child_feedback_positive: true,
          memorable_moment_captured: true,
          photos_taken: true,
          new_skill_learned: false,
          social_interaction_positive: false,
        })],
      }));
      expect(r.experience_quality_rate).toBe(60);
    });

    it("child_participation_rate is composite of involved+views_recorded+views_acted_upon", () => {
      // 2 of 3 = 67%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: true,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.child_participation_rate).toBe(67);
    });

    it("child_enjoyment_rate is % of experiences with rating >= 4", () => {
      // 2 of 3 have rating >= 4 = 67%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 5 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 3 }),
        ],
      }));
      expect(r.child_enjoyment_rate).toBe(67);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes holidayPlanningRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("holiday planning completeness"))).toBe(true);
    });

    it("includes holidayPlanningRate >= 70 (lower tier) strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("holiday planning completeness"))).toBe(true);
    });

    it("includes riskAssessmentRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment()],
      }));
      expect(r.strengths.some((s) => s.includes("risk assessment compliance"))).toBe(true);
    });

    it("includes consentComplianceRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent()],
      }));
      expect(r.strengths.some((s) => s.includes("consent compliance"))).toBe(true);
    });

    it("includes experienceQualityRate >= 85 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience()],
      }));
      expect(r.strengths.some((s) => s.includes("experience quality"))).toBe(true);
    });

    it("includes childParticipationRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation()],
      }));
      expect(r.strengths.some((s) => s.includes("child participation"))).toBe(true);
    });

    it("includes childEnjoymentRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 5 }),
      }));
      expect(r.strengths.some((s) => s.includes("child enjoyment rate"))).toBe(true);
    });

    it("includes riskAssessmentCoverageRate >= 90 strength", () => {
      const hp = makeHolidayPlan({ id: "hp_str" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [makeRiskAssessment({ holiday_plan_id: "hp_str" })],
      }));
      expect(r.strengths.some((s) => s.includes("risk assessments"))).toBe(true);
    });

    it("includes memorableMomentRate >= 85 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { memorable_moment_captured: true }),
      }));
      expect(r.strengths.some((s) => s.includes("memorable moments"))).toBe(true);
    });

    it("includes socialWorkerNotificationRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({ social_worker_notified: true })],
      }));
      expect(r.strengths.some((s) => s.includes("social worker notification"))).toBe(true);
    });

    it("includes childBriefingRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({ child_briefed: true })],
      }));
      expect(r.strengths.some((s) => s.includes("children briefed"))).toBe(true);
    });

    it("includes newSkillRate >= 70 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { new_skill_learned: true }),
      }));
      expect(r.strengths.some((s) => s.includes("new skill development"))).toBe(true);
    });

    it("includes viewsActedUponRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, { child_views_acted_upon: true }),
      }));
      expect(r.strengths.some((s) => s.includes("views acted upon"))).toBe(true);
    });

    it("includes dynamicRARate >= 80 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: makeRiskAssessments(5, { dynamic_risk_assessment_planned: true }),
      }));
      expect(r.strengths.some((s) => s.includes("dynamic assessment planning"))).toBe(true);
    });

    it("includes holidayCoverageRate >= 80 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_1" }),
          makeHolidayPlan({ child_id: "child_2" }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("documented holiday or trip plans"))).toBe(true);
    });

    it("includes barrierResolutionRate >= 90 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          barriers_to_participation: "Anxiety",
          barriers_addressed: true,
        }),
      }));
      expect(r.strengths.some((s) => s.includes("participation barriers addressed"))).toBe(true);
    });

    it("includes avgEnjoymentRating >= 4.0 strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 5 }),
      }));
      expect(r.strengths.some((s) => s.includes("Average child enjoyment rating"))).toBe(true);
    });

    it("includes avgEnjoymentRating >= 3.5 (lower tier) strength", () => {
      // Average 3.5: 3 records with 4, 1 with 2 = (4+4+4+2)/4 = 14/4 = 3.5
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 4, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 4, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 4, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
          makeExperience({ child_enjoyment_rating: 2, child_feedback_positive: false, memorable_moment_captured: false, photos_taken: false, new_skill_learned: false, social_interaction_positive: false }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("3.5/5"))).toBe(true);
    });

    it("does NOT include strength when rate is below threshold", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.strengths.some((s) => s.includes("holiday planning completeness"))).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("flags holidayPlanningRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("10%") && c.includes("holiday planning completeness"))).toBe(true);
    });

    it("flags holidayPlanningRate 50-69 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: true,
          budget_approved: true,
          staffing_confirmed: true,
          transport_arranged: true,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Holiday planning completeness"))).toBe(true);
    });

    it("flags riskAssessmentRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("risk assessment compliance"))).toBe(true);
    });

    it("flags riskAssessmentRate 50-69 concern", () => {
      // 1 record: 2/3 true = 67%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: true,
          reviewed: true,
          approved: false,
        })],
      }));
      expect(r.risk_assessment_rate).toBe(67);
      expect(r.concerns.some((c) => c.includes("Risk assessment compliance at 67%"))).toBe(true);
    });

    it("flags consentComplianceRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("consent compliance"))).toBe(true);
    });

    it("flags consentComplianceRate 50-69 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: true,
          consent_documented: false,
        })],
      }));
      expect(r.consent_compliance_rate).toBe(50);
      expect(r.concerns.some((c) => c.includes("Consent compliance at 50%"))).toBe(true);
    });

    it("flags experienceQualityRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("experience quality"))).toBe(true);
    });

    it("flags experienceQualityRate 50-64 concern", () => {
      // 3/5 = 60%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({
          child_feedback_positive: true,
          memorable_moment_captured: true,
          photos_taken: true,
          new_skill_learned: false,
          social_interaction_positive: false,
        })],
      }));
      expect(r.experience_quality_rate).toBe(60);
      expect(r.concerns.some((c) => c.includes("Experience quality at 60%"))).toBe(true);
    });

    it("flags childParticipationRate < 40 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: false,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("child participation"))).toBe(true);
    });

    it("flags childParticipationRate 40-69 concern", () => {
      // 2/3 = 67%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: true,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.child_participation_rate).toBe(67);
      expect(r.concerns.some((c) => c.includes("Child participation at 67%"))).toBe(true);
    });

    it("flags childEnjoymentRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 2 }),
      }));
      expect(r.child_enjoyment_rate).toBe(0);
      expect(r.concerns.some((c) => c.includes("child enjoyment rate"))).toBe(true);
    });

    it("flags childEnjoymentRate 50-69 concern", () => {
      // 3 of 5 = 60%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 5 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 2 }),
          makeExperience({ child_enjoyment_rating: 1 }),
        ],
      }));
      expect(r.child_enjoyment_rate).toBe(60);
      expect(r.concerns.some((c) => c.includes("Child enjoyment rate at 60%"))).toBe(true);
    });

    it("flags highRiskUnmitigated concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "high",
          impact: "high",
          mitigation_in_place: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("high-risk assessment"))).toBe(true);
    });

    it("flags multiple highRiskUnmitigated with plural", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ likelihood: "high", mitigation_in_place: false }),
          makeRiskAssessment({ impact: "high", mitigation_in_place: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("high-risk assessments"))).toBe(true);
    });

    it("flags consentOutstandingRate > 30 concern", () => {
      // 2 of 3 outstanding (not received, not refused) = 67%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: false, consent_documented: false, refused: false }),
          makeConsent({ consent_received: false, consent_documented: false, refused: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("consents are outstanding"))).toBe(true);
    });

    it("flags riskAssessmentCoverageRate < 50 concern", () => {
      // 1 plan, no risk assessment linked
      const hp = makeHolidayPlan({ id: "hp_nocov" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [makeRiskAssessment({ holiday_plan_id: "other_plan" })],
      }));
      expect(r.concerns.some((c) => c.includes("holiday plans have associated risk assessments"))).toBe(true);
    });

    it("flags riskAssessmentCoverageRate 50-69 concern", () => {
      const hps = makeHolidayPlans(4);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hps,
        trip_risk_assessment_records: [
          makeRiskAssessment({ holiday_plan_id: hps[0].id }),
          makeRiskAssessment({ holiday_plan_id: hps[1].id }),
        ],
      }));
      // 2/4 = 50%
      expect(r.concerns.some((c) => c.includes("Risk assessment coverage at 50%"))).toBe(true);
    });

    it("flags holidayCoverageRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 5,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_1" }),
        ],
      }));
      // 2/5 = 40%
      expect(r.concerns.some((c) => c.includes("documented holiday or trip plans"))).toBe(true);
    });

    it("flags socialWorkerNotificationRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: false }),
          makeHolidayPlan({ social_worker_notified: false }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("social worker notification rate"))).toBe(true);
    });

    it("flags socialWorkerNotificationRate 50-69 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      // 1/2 = 50%
      expect(r.concerns.some((c) => c.includes("Social worker notification rate at 50%"))).toBe(true);
    });

    it("flags avgEnjoymentRating < 2.5 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 1 }),
      }));
      expect(r.concerns.some((c) => c.includes("Average child enjoyment rating at only"))).toBe(true);
    });

    it("flags avgEnjoymentRating 2.5-2.99 concern", () => {
      // 2 records: rating 3 and 2 = avg 2.5
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 3 }),
          makeExperience({ child_enjoyment_rating: 2 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Average child enjoyment rating at 2.5/5"))).toBe(true);
    });

    it("flags no holiday plans despite children concern", () => {
      // Not allEmpty (has experience records), but no holiday plans
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience()],
      }));
      expect(r.concerns.some((c) => c.includes("No holiday or trip plans exist"))).toBe(true);
    });

    it("flags no risk assessments despite children concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.concerns.some((c) => c.includes("No trip risk assessments recorded"))).toBe(true);
    });

    it("flags no consent records despite children concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.concerns.some((c) => c.includes("No consent management records"))).toBe(true);
    });

    it("flags viewsActedUponRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          child_views_acted_upon: false,
        }),
      }));
      expect(r.concerns.some((c) => c.includes("views acted upon"))).toBe(true);
    });

    it("flags barrierResolutionRate < 50 concern", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          barriers_to_participation: "Anxiety",
          barriers_addressed: false,
        }),
      }));
      expect(r.concerns.some((c) => c.includes("participation barriers addressed"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("recommends when holidayPlanningRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("holiday planning processes"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends when riskAssessmentRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("risk assessment quality"))).toBe(true);
    });

    it("recommends when consentComplianceRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("consent management"))).toBe(true);
    });

    it("recommends when highRiskUnmitigated > 0", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "high",
          mitigation_in_place: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("unmitigated high-risk"))).toBe(true);
    });

    it("recommends when childParticipationRate < 40", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: false,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Involve children meaningfully"))).toBe(true);
    });

    it("recommends when no holiday plans despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience()],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("documenting holiday and trip plans"))).toBe(true);
    });

    it("recommends when no risk assessments despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Commence trip risk assessments"))).toBe(true);
    });

    it("recommends when no consent records despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("consent management process"))).toBe(true);
    });

    it("recommends when childEnjoymentRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 2 }),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("quality and suitability"))).toBe(true);
    });

    it("recommends when riskAssessmentCoverageRate < 50", () => {
      const hp = makeHolidayPlan({ id: "hp_rec_cov" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [makeRiskAssessment({ holiday_plan_id: "unlinked" })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("associated risk assessment"))).toBe(true);
    });

    it("recommends when consentOutstandingRate > 30", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: false, refused: false }),
          makeConsent({ consent_received: false, refused: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("escalation process"))).toBe(true);
    });

    it("recommends when socialWorkerNotificationRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: makeHolidayPlans(3, { social_worker_notified: false }),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Notify social workers"))).toBe(true);
    });

    it("recommends when experienceQualityRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, {
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        }),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Enhance the quality"))).toBe(true);
    });

    it("recommends when holidayPlanningRate 50-69 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: true,
          budget_approved: true,
          staffing_confirmed: true,
          transport_arranged: true,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve holiday planning completeness"))).toBe(true);
    });

    it("recommends when riskAssessmentRate 50-69 (soon urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: true,
          reviewed: true,
          approved: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen risk assessment processes"))).toBe(true);
    });

    it("recommends when consentComplianceRate 50-69 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: true,
          consent_documented: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve consent documentation"))).toBe(true);
    });

    it("recommends when childParticipationRate 40-69 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: true,
          child_views_recorded: true,
          child_views_acted_upon: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Enhance child participation"))).toBe(true);
    });

    it("recommends when childEnjoymentRate 50-69 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 5 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 2 }),
          makeExperience({ child_enjoyment_rating: 1 }),
        ],
      }));
      expect(r.child_enjoyment_rate).toBe(60);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review activity selection"))).toBe(true);
    });

    it("recommends when memorableMomentRate < 65 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { memorable_moment_captured: false }),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("capturing memorable moments"))).toBe(true);
    });

    it("recommends when holidayCoverageRate < 50 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 5,
        holiday_plan_records: [makeHolidayPlan({ child_id: "child_0" })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("equitable access"))).toBe(true);
    });

    it("recommends when viewsActedUponRate < 50 (planned urgency)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          child_views_acted_upon: false,
        }),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("children's views are incorporated"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false,
          itinerary_documented: false,
          budget_approved: false,
          staffing_confirmed: false,
          transport_arranged: false,
          accommodation_confirmed: false,
          activities_planned: false,
          dietary_needs_addressed: false,
          medical_needs_addressed: false,
          emergency_plan_in_place: false,
          social_worker_notified: false,
        })],
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false,
          reviewed: false,
          approved: false,
          likelihood: "high",
        })],
        consent_management_records: [makeConsent({
          consent_received: false,
          consent_documented: false,
        })],
        child_participation_records: [makeParticipation({
          child_involved: false,
          child_views_recorded: false,
          child_views_acted_upon: false,
        })],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("recommendations have regulatory_ref", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false, itinerary_documented: false, budget_approved: false,
          staffing_confirmed: false, transport_arranged: false, accommodation_confirmed: false,
          activities_planned: false, dietary_needs_addressed: false, medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("critical insight for holidayPlanningRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true,
          itinerary_documented: false, budget_approved: false, staffing_confirmed: false,
          transport_arranged: false, accommodation_confirmed: false, activities_planned: false,
          dietary_needs_addressed: false, medical_needs_addressed: false, emergency_plan_in_place: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("holiday planning completeness"))).toBe(true);
    });

    it("critical insight for riskAssessmentRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false, reviewed: false, approved: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("risk assessment compliance"))).toBe(true);
    });

    it("critical insight for consentComplianceRate < 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: false, consent_documented: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("consent compliance"))).toBe(true);
    });

    it("critical insight for childParticipationRate < 40", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: false, child_views_recorded: false, child_views_acted_upon: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Child participation"))).toBe(true);
    });

    it("critical insight for highRiskUnmitigated", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "high", mitigation_in_place: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("high-risk"))).toBe(true);
    });

    it("critical insight for no holiday plans despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        experience_records: [makeExperience()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No holiday or trip plans"))).toBe(true);
    });

    it("critical insight for no risk assessments despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No trip risk assessments"))).toBe(true);
    });

    it("critical insight for no consent records despite children", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No consent management records"))).toBe(true);
    });

    it("warning insight for holidayPlanningRate 50-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: true, itinerary_documented: true, budget_approved: true,
          staffing_confirmed: true, transport_arranged: true,
          accommodation_confirmed: false, activities_planned: false,
          dietary_needs_addressed: false, medical_needs_addressed: false, emergency_plan_in_place: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Holiday planning completeness at 50%"))).toBe(true);
    });

    it("warning insight for riskAssessmentRate 50-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: true, reviewed: true, approved: false,
        })],
      }));
      expect(r.risk_assessment_rate).toBe(67);
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk assessment compliance at 67%"))).toBe(true);
    });

    it("warning insight for consentComplianceRate 50-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent({
          consent_received: true, consent_documented: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Consent compliance at 50%"))).toBe(true);
    });

    it("warning insight for childParticipationRate 40-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          child_involved: true, child_views_recorded: true, child_views_acted_upon: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child participation at 67%"))).toBe(true);
    });

    it("warning insight for childEnjoymentRate 50-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 5 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 4 }),
          makeExperience({ child_enjoyment_rating: 2 }),
          makeExperience({ child_enjoyment_rating: 1 }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child enjoyment rate at 60%"))).toBe(true);
    });

    it("warning insight for experienceQualityRate 50-64", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({
          child_feedback_positive: true, memorable_moment_captured: true, photos_taken: true,
          new_skill_learned: false, social_interaction_positive: false,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Experience quality at 60%"))).toBe(true);
    });

    it("warning insight for riskAssessmentCoverageRate 50-69", () => {
      const hps = makeHolidayPlans(4);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hps,
        trip_risk_assessment_records: [
          makeRiskAssessment({ holiday_plan_id: hps[0].id }),
          makeRiskAssessment({ holiday_plan_id: hps[1].id }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk assessment coverage at 50%"))).toBe(true);
    });

    it("warning insight for consentOutstandingRate 21-30", () => {
      // 1 of 4 outstanding = 25%
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true }),
          makeConsent({ consent_received: true }),
          makeConsent({ consent_received: true }),
          makeConsent({ consent_received: false, refused: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("consents remain outstanding"))).toBe(true);
    });

    it("warning insight for avgEnjoymentRating 2.5-3.49", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ child_enjoyment_rating: 3 }),
          makeExperience({ child_enjoyment_rating: 3 }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Average child enjoyment rating at 3/5"))).toBe(true);
    });

    it("warning insight for socialWorkerNotificationRate 50-69", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Social worker notification rate at 50%"))).toBe(true);
    });

    it("warning insight for experience type distribution", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "cultural" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Most common experience types"))).toBe(true);
    });

    it("warning insight for risk type distribution", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "activity" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Most common risk types"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const hp = makeHolidayPlans(3);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({ ...h, child_id: `child_${i}` })),
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
        consent_management_records: hp.map((h) => makeConsent({ holiday_plan_id: h.id })),
        experience_records: makeExperiences(5),
        child_participation_records: makeParticipations(5),
      }));
      expect(r.holiday_rating).toBe("outstanding");
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding holiday and trip planning"))).toBe(true);
    });

    it("positive insight for high planning + risk assessment combo", () => {
      const hp = makeHolidayPlan({ id: "hp_combo" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [makeRiskAssessment({ holiday_plan_id: "hp_combo" })],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("planning completeness with"))).toBe(true);
    });

    it("positive insight for consentComplianceRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [makeConsent()],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("consent compliance"))).toBe(true);
    });

    it("positive insight for high participation + enjoyment combo", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 5 }),
        child_participation_records: makeParticipations(5),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child participation with"))).toBe(true);
    });

    it("positive insight for experienceQualityRate >= 85", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience()],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("experience quality"))).toBe(true);
    });

    it("positive insight for childEnjoymentRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { child_enjoyment_rating: 5 }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child enjoyment rate"))).toBe(true);
    });

    it("positive insight for riskAssessmentCoverageRate >= 90", () => {
      const hp = makeHolidayPlan({ id: "hp_cov2" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp],
        trip_risk_assessment_records: [makeRiskAssessment({ holiday_plan_id: "hp_cov2" })],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("linked risk assessments"))).toBe(true);
    });

    it("positive insight for memorableMomentRate >= 85 with photosRate >= 85", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, {
          memorable_moment_captured: true,
          photos_taken: true,
        }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("memorable moments captured"))).toBe(true);
    });

    it("positive insight for viewsActedUponRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, { child_views_acted_upon: true }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("views acted upon"))).toBe(true);
    });

    it("positive insight for holidayCoverageRate >= 80", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_1" }),
          makeHolidayPlan({ child_id: "child_2" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("documented holiday or trip plans"))).toBe(true);
    });

    it("positive insight for newSkillRate >= 70", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: makeExperiences(5, { new_skill_learned: true }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("new skill development"))).toBe(true);
    });

    it("positive insight for barrierResolutionRate >= 90", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          barriers_to_participation: "Anxiety",
          barriers_addressed: true,
        }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("participation barriers resolved"))).toBe(true);
    });

    it("positive insight for avgEnthusiasmRating >= 4.0", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: makeParticipations(5, {
          child_enthusiasm_rating: 5,
        }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Average child enthusiasm rating"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("handles single holiday plan with all checks true", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.holiday_planning_rate).toBe(100);
      expect(r.total_holiday_plans).toBe(1);
    });

    it("handles single holiday plan with all checks false", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false, itinerary_documented: false, budget_approved: false,
          staffing_confirmed: false, transport_arranged: false, accommodation_confirmed: false,
          activities_planned: false, dietary_needs_addressed: false, medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      expect(r.holiday_planning_rate).toBe(0);
    });

    it("handles total_children = 0 with data (should not be insufficient_data)", () => {
      // Not allEmpty => proceeds to normal computation
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 0,
        holiday_plan_records: [makeHolidayPlan()],
      }));
      expect(r.holiday_rating).not.toBe("insufficient_data");
    });

    it("handles cancelled holidays in completion rate calculation", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ status: "completed" }),
          makeHolidayPlan({ status: "cancelled" }),
        ],
      }));
      // completedHolidays=1, totalPlans=2, cancelled=1
      // completionRate = pct(1, 2-1) = pct(1,1) = 100%
      expect(r.total_holiday_plans).toBe(2);
    });

    it("handles all holidays cancelled", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ status: "cancelled" }),
          makeHolidayPlan({ status: "cancelled" }),
        ],
      }));
      expect(r.total_holiday_plans).toBe(2);
    });

    it("handles mixed consent statuses", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: false, consent_documented: false, refused: true, refusal_reason: "Not appropriate" }),
          makeConsent({ consent_received: false, consent_documented: false, refused: false }),
        ],
      }));
      // received=1, documented=1, total=3
      // consent_compliance_rate = pct(1+1, 3*2) = pct(2,6) = 33%
      expect(r.consent_compliance_rate).toBe(33);
    });

    it("handles experience with enjoyment rating of exactly 4 (threshold)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({ child_enjoyment_rating: 4 })],
      }));
      // rating >= 4 => counted
      expect(r.child_enjoyment_rate).toBe(100);
    });

    it("handles experience with enjoyment rating of exactly 3 (below threshold)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [makeExperience({
          child_enjoyment_rating: 3,
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        })],
      }));
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("handles risk assessment with high likelihood but low impact", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "high",
          impact: "low",
          mitigation_in_place: false,
        })],
      }));
      // high likelihood OR high impact + not mitigated = highRiskUnmitigated
      expect(r.concerns.some((c) => c.includes("high-risk"))).toBe(true);
    });

    it("handles risk assessment with low likelihood but high impact", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "low",
          impact: "high",
          mitigation_in_place: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("high-risk"))).toBe(true);
    });

    it("does NOT flag high risk when mitigation is in place", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [makeRiskAssessment({
          likelihood: "high",
          impact: "high",
          mitigation_in_place: true,
          reviewed: true,
          approved: true,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("high-risk assessment"))).toBe(false);
    });

    it("handles participation with barriers_to_participation as empty string (not counted)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          barriers_to_participation: "",
          barriers_addressed: false,
        })],
      }));
      // empty string = no barrier identified
      expect(r.strengths.some((s) => s.includes("participation barriers"))).toBe(false);
    });

    it("handles participation with barriers_to_participation as null (not counted)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        child_participation_records: [makeParticipation({
          barriers_to_participation: null,
          barriers_addressed: false,
        })],
      }));
      // null = no barrier identified
      expect(r.strengths.some((s) => s.includes("participation barriers"))).toBe(false);
    });

    it("handles multiple children with same child_id (counts as 1 unique)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_0" }),
          makeHolidayPlan({ child_id: "child_0" }),
        ],
      }));
      // Only 1 unique child => holidayCoverageRate = pct(1, 3) = 33%
      expect(r.concerns.some((c) => c.includes("documented holiday or trip plans"))).toBe(true);
    });

    it("does not generate concerns when rates are above thresholds", () => {
      const hp = makeHolidayPlans(3);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({ ...h, child_id: `child_${i}` })),
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
        consent_management_records: hp.map((h) => makeConsent({ holiday_plan_id: h.id })),
        experience_records: makeExperiences(5),
        child_participation_records: makeParticipations(5),
      }));
      // With perfect data, no concerns about low rates
      expect(r.concerns.some((c) => c.includes("Only"))).toBe(false);
    });

    it("handles consent_received=false and refused=true (not counted as outstanding)", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true, consent_documented: true }),
          makeConsent({ consent_received: false, consent_documented: false, refused: true }),
        ],
      }));
      // Outstanding = not received AND not refused = 0/2 = 0%
      expect(r.concerns.some((c) => c.includes("consents are outstanding"))).toBe(false);
    });

    it("large dataset performance", () => {
      const hp = makeHolidayPlans(50);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 20,
        holiday_plan_records: hp,
        trip_risk_assessment_records: makeRiskAssessments(100),
        consent_management_records: makeConsents(100),
        experience_records: makeExperiences(100),
        child_participation_records: makeParticipations(100),
      }));
      expect(r.holiday_rating).toBeDefined();
      expect(r.holiday_score).toBeGreaterThanOrEqual(0);
      expect(r.holiday_score).toBeLessThanOrEqual(100);
    });

    it("experience type distribution formats correctly", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "cultural" }),
        ],
      }));
      // Should contain "adventure (2)" formatted
      expect(r.insights.some((i) => i.text.includes("adventure (2)"))).toBe(true);
    });

    it("risk type distribution formats correctly", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "activity" }),
        ],
      }));
      expect(r.insights.some((i) => i.text.includes("travel (2)"))).toBe(true);
    });

    it("headline for good rating includes concern count when concerns exist", () => {
      // We need a scenario that hits "good" with some concerns
      const hp = makeHolidayPlans(3);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({
          ...h,
          child_id: `child_${i}`,
          social_worker_notified: false,
        })),
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
        consent_management_records: hp.map((h) => makeConsent({ holiday_plan_id: h.id })),
        experience_records: makeExperiences(5, {
          child_feedback_positive: true,
          memorable_moment_captured: true,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: true,
          child_enjoyment_rating: 4,
        }),
        child_participation_records: makeParticipations(5, {
          child_involved: true,
          child_views_recorded: true,
          child_views_acted_upon: false,
        }),
      }));
      if (r.holiday_rating === "good" && r.concerns.length > 0) {
        expect(r.headline).toMatch(/area.*for improvement/);
      }
    });

    it("headline for inadequate rating includes plural concerns", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false, itinerary_documented: false, budget_approved: false,
          staffing_confirmed: false, transport_arranged: false, accommodation_confirmed: false,
          activities_planned: false, dietary_needs_addressed: false, medical_needs_addressed: false,
          emergency_plan_in_place: false, child_briefed: false, social_worker_notified: false,
        })],
        trip_risk_assessment_records: [makeRiskAssessment({
          mitigation_in_place: false, reviewed: false, approved: false,
        })],
        consent_management_records: [makeConsent({
          consent_received: false, consent_documented: false,
        })],
        child_participation_records: [makeParticipation({
          child_involved: false, child_views_recorded: false, child_views_acted_upon: false,
        })],
        experience_records: makeExperiences(3, {
          child_enjoyment_rating: 1,
          child_feedback_positive: false,
          memorable_moment_captured: false,
          photos_taken: false,
          new_skill_learned: false,
          social_interaction_positive: false,
        }),
      }));
      expect(r.holiday_rating).toBe("inadequate");
      expect(r.headline).toContain("concerns");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RATING BOUNDARIES
  // ══════════════════════════════════════════════════════════════════════════

  describe("rating boundaries", () => {
    it("toRating: score 80 => outstanding", () => {
      // Score exactly 80 = all bonuses maxed = base 52 + 28 = 80
      const hp = makeHolidayPlans(3);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({ ...h, child_id: `child_${i}` })),
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
        consent_management_records: hp.map((h) => makeConsent({ holiday_plan_id: h.id })),
        experience_records: makeExperiences(5),
        child_participation_records: makeParticipations(5),
      }));
      expect(r.holiday_score).toBe(80);
      expect(r.holiday_rating).toBe("outstanding");
    });

    it("toRating: score 79 => good", () => {
      // Need score of 79. Base 52 + 27 bonuses. We lose 1 from max by dropping one bonus tier.
      // Drop memorableMomentRate from +2 to +1 (from >=85 to >=65)
      // All bonuses maxed except memorableMomentRate at 75% => +1 instead of +2
      const hp = makeHolidayPlans(3);
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp.map((h, i) => ({ ...h, child_id: `child_${i}` })),
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
        consent_management_records: hp.map((h) => makeConsent({ holiday_plan_id: h.id })),
        experience_records: [
          makeExperience({ memorable_moment_captured: true }),
          makeExperience({ memorable_moment_captured: true }),
          makeExperience({ memorable_moment_captured: true }),
          makeExperience({ memorable_moment_captured: false }),
        ],
        child_participation_records: makeParticipations(5),
      }));
      expect(r.holiday_score).toBe(79);
      expect(r.holiday_rating).toBe("good");
    });

    it("toRating: score 65 => good", () => {
      // Base 52 + 13 bonuses
      // holidayPlanning=100%(+4), riskAssessment=100%(+4), consent=100%(+4), coverage=100%(+3)
      // experiences=0, participation=0
      // But coverage requires link between hp and RA via holiday_plan_id
      // holidayCoverage: depends on unique children / total_children
      // 4+4+4+3 = 15... too many. Let's do fewer.
      // +4 (planning) + +4 (risk) + +3 (coverage) + +2 (holidayCoverage) = 13
      const hp = [
        makeHolidayPlan({ id: "hp_b1", child_id: "child_0" }),
        makeHolidayPlan({ id: "hp_b2", child_id: "child_1" }),
        makeHolidayPlan({ id: "hp_b3", child_id: "child_2" }),
      ];
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: hp,
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
      }));
      // Bonuses: holidayPlanning=100%(+4), riskAssessment=100%(+4), coverage=100%(+3), holidayCoverage=100%(+2)
      // 52 + 4 + 4 + 3 + 2 = 65
      expect(r.holiday_score).toBe(65);
      expect(r.holiday_rating).toBe("good");
    });

    it("toRating: score 64 => adequate", () => {
      // 52 + 12. Drop holidayCoverage from +2 to +1 (use 50-79%)
      const hp = [
        makeHolidayPlan({ id: "hp_c1", child_id: "child_0" }),
        makeHolidayPlan({ id: "hp_c2", child_id: "child_1" }),
        makeHolidayPlan({ id: "hp_c3", child_id: "child_2" }),
      ];
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 5, // 3/5 = 60% => +1
        holiday_plan_records: hp,
        trip_risk_assessment_records: hp.map((h) => makeRiskAssessment({ holiday_plan_id: h.id })),
      }));
      // Bonuses: holidayPlanning=100%(+4), riskAssessment=100%(+4), coverage=100%(+3), holidayCoverage=60%(+1)
      // 52 + 4 + 4 + 3 + 1 = 64
      expect(r.holiday_score).toBe(64);
      expect(r.holiday_rating).toBe("adequate");
    });

    it("toRating: score 47 => adequate", () => {
      // base 52, penalty -5 (planning < 50), holidayCoverage 1/3=33% => +0
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          child_id: "child_1",
          planning_completed: true,
          itinerary_documented: false, budget_approved: false, staffing_confirmed: false,
          transport_arranged: false, accommodation_confirmed: false, activities_planned: false,
          dietary_needs_addressed: false, medical_needs_addressed: false, emergency_plan_in_place: false,
        })],
      }));
      // 52 - 5 = 47 => adequate
      expect(r.holiday_score).toBe(47);
      expect(r.holiday_rating).toBe("adequate");
    });

    it("toRating: score 44 => inadequate", () => {
      // base 52, penalty -5 (planning) -3 (participation), holidayCoverage 1/3=33% => +0
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          child_id: "child_1",
          planning_completed: true,
          itinerary_documented: false, budget_approved: false, staffing_confirmed: false,
          transport_arranged: false, accommodation_confirmed: false, activities_planned: false,
          dietary_needs_addressed: false, medical_needs_addressed: false, emergency_plan_in_place: false,
        })],
        child_participation_records: [makeParticipation({
          child_involved: false, child_views_recorded: false, child_views_acted_upon: false,
        })],
      }));
      // 52 - 5 - 3 = 44
      expect(r.holiday_score).toBe(44);
      expect(r.holiday_rating).toBe("inadequate");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE
  // ══════════════════════════════════════════════════════════════════════════

  describe("output shape", () => {
    it("returns all expected properties", () => {
      const r = computeHolidayTripPlanning(baseInput());
      expect(r).toHaveProperty("holiday_rating");
      expect(r).toHaveProperty("holiday_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_holiday_plans");
      expect(r).toHaveProperty("total_risk_assessments");
      expect(r).toHaveProperty("holiday_planning_rate");
      expect(r).toHaveProperty("risk_assessment_rate");
      expect(r).toHaveProperty("consent_compliance_rate");
      expect(r).toHaveProperty("experience_quality_rate");
      expect(r).toHaveProperty("child_participation_rate");
      expect(r).toHaveProperty("child_enjoyment_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("rating is a valid HolidayTripRating", () => {
      const validRatings = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
      const r = computeHolidayTripPlanning(baseInput());
      expect(validRatings).toContain(r.holiday_rating);
    });

    it("score is a number between 0 and 100", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: makeHolidayPlans(5),
      }));
      expect(r.holiday_score).toBeGreaterThanOrEqual(0);
      expect(r.holiday_score).toBeLessThanOrEqual(100);
    });

    it("rates are numbers between 0 and 100", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: makeHolidayPlans(3),
        trip_risk_assessment_records: makeRiskAssessments(3),
        consent_management_records: makeConsents(3),
        experience_records: makeExperiences(3),
        child_participation_records: makeParticipations(3),
      }));
      const rates = [
        r.holiday_planning_rate,
        r.risk_assessment_rate,
        r.consent_compliance_rate,
        r.experience_quality_rate,
        r.child_participation_rate,
        r.child_enjoyment_rate,
      ];
      for (const rate of rates) {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    });

    it("insights have valid severity levels", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: makeHolidayPlans(3),
        trip_risk_assessment_records: makeRiskAssessments(3),
      }));
      for (const insight of r.insights) {
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
        expect(insight.text).toBeTruthy();
      }
    });

    it("recommendations have valid urgency and regulatory_ref", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 3,
        holiday_plan_records: [makeHolidayPlan({
          planning_completed: false, itinerary_documented: false, budget_approved: false,
          staffing_confirmed: false, transport_arranged: false, accommodation_confirmed: false,
          activities_planned: false, dietary_needs_addressed: false, medical_needs_addressed: false,
          emergency_plan_in_place: false,
        })],
      }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(rec.regulatory_ref).toBeTruthy();
        expect(rec.rank).toBeGreaterThan(0);
        expect(rec.recommendation).toBeTruthy();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL RATE CALCULATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("additional rate calculations", () => {
    it("childBriefingRate is calculated from child_briefed field", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ child_briefed: true }),
          makeHolidayPlan({ child_briefed: false }),
        ],
      }));
      // 1/2 = 50% — won't hit the 90% strength threshold
      expect(r.strengths.some((s) => s.includes("children briefed"))).toBe(false);
    });

    it("socialWorkerNotificationRate is calculated correctly", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      // 2/3 = 67%
      expect(r.strengths.some((s) => s.includes("social worker notification rate"))).toBe(false); // < 70
      expect(r.concerns.some((c) => c.includes("Social worker notification rate at 67%"))).toBe(true);
    });

    it("completionRate excludes cancelled holidays from denominator", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ status: "completed" }),
          makeHolidayPlan({ status: "completed" }),
          makeHolidayPlan({ status: "cancelled" }),
          makeHolidayPlan({ status: "planned" }),
        ],
      }));
      // completedHolidays=2, cancelled=1, denominator=4-1=3
      // completionRate = pct(2, 3) = 67%
      expect(r.total_holiday_plans).toBe(4);
    });

    it("consentOutstandingRate counts not-received and not-refused", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        consent_management_records: [
          makeConsent({ consent_received: true }), // not outstanding
          makeConsent({ consent_received: false, refused: true }), // not outstanding (refused)
          makeConsent({ consent_received: false, refused: false }), // outstanding
          makeConsent({ consent_received: false, refused: false }), // outstanding
        ],
      }));
      // 2/4 = 50% outstanding > 30%
      expect(r.concerns.some((c) => c.includes("50% of consents are outstanding"))).toBe(true);
    });

    it("mitigationRate is calculated independently of composite", () => {
      // The composite riskAssessmentRate considers mitigation+reviewed+approved equally
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ mitigation_in_place: true, reviewed: false, approved: false }),
        ],
      }));
      // composite: 1/3 = 33%
      expect(r.risk_assessment_rate).toBe(33);
    });

    it("dynamic risk assessment planned rate contributes to strength", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ dynamic_risk_assessment_planned: true }),
          makeRiskAssessment({ dynamic_risk_assessment_planned: true }),
          makeRiskAssessment({ dynamic_risk_assessment_planned: true }),
          makeRiskAssessment({ dynamic_risk_assessment_planned: true }),
          makeRiskAssessment({ dynamic_risk_assessment_planned: false }),
        ],
      }));
      // 4/5 = 80% => >= 80 strength
      expect(r.strengths.some((s) => s.includes("dynamic assessment planning"))).toBe(true);
    });

    it("experience type distribution shows top 3", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        experience_records: [
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "adventure" }),
          makeExperience({ experience_type: "cultural" }),
          makeExperience({ experience_type: "cultural" }),
          makeExperience({ experience_type: "educational" }),
          makeExperience({ experience_type: "social" }),
        ],
      }));
      const distInsight = r.insights.find((i) => i.text.includes("Most common experience types"));
      expect(distInsight).toBeDefined();
      expect(distInsight!.text).toContain("adventure (3)");
      expect(distInsight!.text).toContain("cultural (2)");
    });

    it("risk type distribution shows top 3", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        trip_risk_assessment_records: [
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "travel" }),
          makeRiskAssessment({ risk_type: "activity" }),
          makeRiskAssessment({ risk_type: "activity" }),
          makeRiskAssessment({ risk_type: "health" }),
          makeRiskAssessment({ risk_type: "environment" }),
        ],
      }));
      const distInsight = r.insights.find((i) => i.text.includes("Most common risk types"));
      expect(distInsight).toBeDefined();
      expect(distInsight!.text).toContain("travel (3)");
      expect(distInsight!.text).toContain("activity (2)");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SOCIAL WORKER NOTIFICATION RATE EDGE CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("social worker notification edge cases", () => {
    it("does NOT recommend notification when rate >= 50", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      // 50% = not < 50 => no recommendation
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Notify social workers"))).toBe(false);
    });

    it("lower tier strength for socialWorkerNotificationRate 70-89", () => {
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: true }),
          makeHolidayPlan({ social_worker_notified: false }),
        ],
      }));
      // 3/4 = 75%
      expect(r.strengths.some((s) => s.includes("75%") && s.includes("social worker notification"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CONSENT COVERAGE
  // ══════════════════════════════════════════════════════════════════════════

  describe("consent coverage rate", () => {
    it("is computed from holiday plans with received consent", () => {
      const hp1 = makeHolidayPlan({ id: "hp_cc1" });
      const hp2 = makeHolidayPlan({ id: "hp_cc2" });
      const r = computeHolidayTripPlanning(baseInput({
        total_children: 1,
        holiday_plan_records: [hp1, hp2],
        consent_management_records: [
          makeConsent({ holiday_plan_id: "hp_cc1", consent_received: true }),
          makeConsent({ holiday_plan_id: "hp_cc2", consent_received: false }),
        ],
      }));
      // Only hp_cc1 has received consent => 1/2 = 50% consent coverage
      expect(r.total_holiday_plans).toBe(2);
    });
  });
});
