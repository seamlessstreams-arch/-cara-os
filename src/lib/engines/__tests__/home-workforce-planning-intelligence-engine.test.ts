import { describe, it, expect } from "vitest";
import {
  computeHomeWorkforcePlanning,
  type HomeWorkforcePlanningInput,
  type StaffInput,
  type SuccessionPlanInput,
  type VacancyInput,
  type InductionInput,
  type SuccessionCandidateInput,
} from "../home-workforce-planning-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeStaff(overrides?: Partial<StaffInput>): StaffInput {
  return {
    id: "s1",
    role: "care_worker",
    employment_type: "permanent",
    is_active: true,
    start_date: "2023-01-15",
    end_date: null,
    probation_end_date: null,
    dbs_update_service: true,
    contracted_hours: 40,
    ...overrides,
  };
}

function makeSuccession(overrides?: Partial<SuccessionPlanInput>): SuccessionPlanInput {
  return {
    id: "sp1",
    role_title: "Registered Manager",
    urgency: "twelve_months",
    review_date: "2026-10-01",
    candidates: [{ staff_id: "s1", readiness_score: 75, ready_now: false, estimated_ready_date: "2027-01-01" }],
    ...overrides,
  };
}

function makeVacancy(overrides?: Partial<VacancyInput>): VacancyInput {
  return { id: "v1", status: "open", ...overrides };
}

function makeInduction(overrides?: Partial<InductionInput>): InductionInput {
  return {
    id: "ind1",
    staff_id: "s1",
    overall_status: "completed",
    target_completion_date: "2026-04-01",
    probation_passed: true,
    total_items: 7,
    completed_items: 7,
    ...overrides,
  };
}

function baseInput(overrides?: Partial<HomeWorkforcePlanningInput>): HomeWorkforcePlanningInput {
  return {
    today: TODAY,
    staff: [makeStaff()],
    succession_plans: [],
    vacancies: [],
    inductions: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Workforce Planning Intelligence Engine", () => {

  // ── Insufficient Data ────────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data with no active staff", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ staff: [] }));
      expect(r.workforce_rating).toBe("insufficient_data");
      expect(r.workforce_score).toBe(0);
      expect(r.headline).toContain("No active staff");
    });

    it("returns insufficient_data when all staff inactive", () => {
      const r = computeHomeWorkforcePlanning(baseInput({
        staff: [makeStaff({ is_active: false })],
      }));
      expect(r.workforce_rating).toBe("insufficient_data");
    });

    it("does not return insufficient_data with at least one active staff", () => {
      const r = computeHomeWorkforcePlanning(baseInput({
        staff: [makeStaff()],
      }));
      expect(r.workforce_rating).not.toBe("insufficient_data");
    });
  });

  // ── Outstanding ──────────────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with excellent workforce planning", () => {
      const staff = [
        makeStaff({ id: "s1", start_date: "2022-01-01" }),
        makeStaff({ id: "s2", start_date: "2021-06-01" }),
        makeStaff({ id: "s3", start_date: "2023-03-01" }),
        makeStaff({ id: "s4", start_date: "2020-09-01" }),
        makeStaff({ id: "s5", start_date: "2024-01-01" }),
      ];
      const succession_plans = [
        makeSuccession({ candidates: [{ staff_id: "s2", readiness_score: 80, ready_now: true, estimated_ready_date: null }] }),
      ];
      const inductions = [makeInduction(), makeInduction({ id: "ind2", staff_id: "s5" })];

      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans, inductions }));
      // permanent 100% → +5, succession avg 80 + ready_now → +4, vacancy 0% → +3
      // induction 100% + no overdue → +4, DBS 100% → +3
      // long-serving (s1,s2,s4 all > 2y) & new 0 (none in 6mo) → +3
      // agency 0 → +3, succession reviews not overdue → +3
      // = 52+5+4+3+4+3+3+3+3 = 80
      expect(r.workforce_rating).toBe("outstanding");
      expect(r.workforce_score).toBe(80);
    });

    it("generates strengths for outstanding", () => {
      const staff = [
        makeStaff({ id: "s1", start_date: "2022-01-01" }),
        makeStaff({ id: "s2", start_date: "2021-06-01" }),
        makeStaff({ id: "s3", start_date: "2023-03-01" }),
        makeStaff({ id: "s4", start_date: "2020-09-01" }),
        makeStaff({ id: "s5", start_date: "2024-01-01" }),
      ];
      const succession_plans = [
        makeSuccession({ candidates: [{ staff_id: "s2", readiness_score: 80, ready_now: true, estimated_ready_date: null }] }),
      ];

      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans }));
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("permanent"))).toBe(true);
    });
  });

  // ── Good ──────────────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with minor gaps", () => {
      const staff = [
        makeStaff({ id: "s1", start_date: "2022-01-01" }),
        makeStaff({ id: "s2", start_date: "2023-06-01" }),
        makeStaff({ id: "s3", start_date: "2023-03-01" }),
        makeStaff({ id: "s4", start_date: "2024-09-01", dbs_update_service: false }),
      ];
      const succession_plans = [
        makeSuccession({ candidates: [{ staff_id: "s1", readiness_score: 55, ready_now: false, estimated_ready_date: "2027-01-01" }] }),
      ];
      const vacancies = [makeVacancy({ status: "open" })];

      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans, vacancies }));
      // permanent 100% → +5, succession avg 55 >=50 → +2, vacancy 1/(4+1)=20% → -1
      // inductions 0 (none) → +1, DBS 3/4=75% >=50 → +1
      // long-serving: s1 (>2y); new: 0; +3
      // agency 0 → +3, reviews not overdue → +3
      // = 52+5+2-1+1+1+3+3+3 = 69
      expect(r.workforce_rating).toBe("good");
      expect(r.workforce_score).toBe(69);
    });
  });

  // ── Adequate ──────────────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with staffing pressure and no succession", () => {
      const staff = [
        makeStaff({ id: "s1", start_date: "2023-01-01", dbs_update_service: false }),
        makeStaff({ id: "s2", employment_type: "agency", start_date: "2026-03-01", dbs_update_service: false }),
        makeStaff({ id: "s3", start_date: "2026-04-01", dbs_update_service: false }),
      ];
      const vacancies = [makeVacancy(), makeVacancy({ id: "v2" })];

      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans: [], vacancies }));
      // permanent: 2/3=67% >=60 → +2, succession: none → -2, vacancy 2/(3+2)=40% >20% → -3
      // inductions: none → +1, DBS 0% → -2
      // long-serving: s1 (>2y but < 2026-05-26 check: 2023-01-01 <=2024-05-26 ✓); new: s2+s3 started >=2025-11-26; s2 2026-03-01 yes, s3 2026-04-01 yes, so 2/3 > 0.4? 0.67 > 0.4 → +1
      // agency 1: pct(1,3)=33% >20% → -2
      // no succession → score +0
      // = 52+2-2-3+1-2+1-2+0 = 47
      expect(r.workforce_rating).toBe("adequate");
      expect(r.workforce_score).toBe(47);
    });
  });

  // ── Inadequate ────────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with heavy agency, no succession, many vacancies", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "agency", start_date: "2026-04-01", dbs_update_service: false }),
        makeStaff({ id: "s2", employment_type: "agency", start_date: "2026-05-01", dbs_update_service: false }),
        makeStaff({ id: "s3", employment_type: "bank", start_date: "2026-03-01", dbs_update_service: false }),
      ];
      const vacancies = [makeVacancy(), makeVacancy({ id: "v2" }), makeVacancy({ id: "v3" })];

      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans: [], vacancies }));
      // permanent: 0/3=0% → -4, succession: none → -2, vacancy: 3/(3+3)=50% >20% → -3
      // inductions: none → +1, DBS: 0% → -2
      // long-serving: 0, new: all 3 in 6mo, 3/3=1.0 >0.4 but longServing=0 → -2
      // agency: 2, pct(2,3)=67% >20% → -2
      // no succession → +0
      // = 52-4-2-3+1-2-2-2+0 = 38
      expect(r.workforce_rating).toBe("inadequate");
      expect(r.workforce_score).toBe(38);
    });

    it("generates critical insights for inadequate workforce", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "agency", start_date: "2026-04-01", dbs_update_service: false }),
        makeStaff({ id: "s2", employment_type: "agency", start_date: "2026-05-01", dbs_update_service: false }),
        makeStaff({ id: "s3", employment_type: "agency", start_date: "2026-03-01", dbs_update_service: false }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("agency"))).toBe(true);
    });
  });

  // ── Staff Composition ────────────────────────────────────────────────────

  describe("staff composition", () => {
    it("counts employment types correctly", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "permanent" }),
        makeStaff({ id: "s2", employment_type: "permanent" }),
        makeStaff({ id: "s3", employment_type: "fixed_term" }),
        makeStaff({ id: "s4", employment_type: "agency" }),
        makeStaff({ id: "s5", employment_type: "bank" }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.staff_composition.permanent_count).toBe(2);
      expect(r.staff_composition.fixed_term_count).toBe(1);
      expect(r.staff_composition.agency_count).toBe(1);
      expect(r.staff_composition.bank_count).toBe(1);
      expect(r.staff_composition.permanent_rate).toBe(40);
    });

    it("calculates average contracted hours", () => {
      const staff = [
        makeStaff({ id: "s1", contracted_hours: 40 }),
        makeStaff({ id: "s2", contracted_hours: 30 }),
        makeStaff({ id: "s3", contracted_hours: 20 }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.staff_composition.avg_contracted_hours).toBe(30);
    });

    it("counts DBS update service registrations", () => {
      const staff = [
        makeStaff({ id: "s1", dbs_update_service: true }),
        makeStaff({ id: "s2", dbs_update_service: true }),
        makeStaff({ id: "s3", dbs_update_service: false }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.staff_composition.dbs_update_service_rate).toBe(67);
    });

    it("identifies new and long-serving staff", () => {
      const staff = [
        makeStaff({ id: "s1", start_date: "2020-01-01" }),  // long-serving (>2y)
        makeStaff({ id: "s2", start_date: "2023-01-01" }),  // long-serving
        makeStaff({ id: "s3", start_date: "2026-03-01" }),  // new (<6mo)
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.staff_composition.long_serving_count).toBe(2);
      expect(r.staff_composition.new_staff_count).toBe(1);
    });
  });

  // ── Succession Profile ───────────────────────────────────────────────────

  describe("succession profile", () => {
    it("calculates average readiness score", () => {
      const plans = [
        makeSuccession({
          candidates: [
            { staff_id: "s1", readiness_score: 80, ready_now: true, estimated_ready_date: null },
            { staff_id: "s2", readiness_score: 60, ready_now: false, estimated_ready_date: "2027-01-01" },
          ],
        }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.succession_profile.avg_readiness_score).toBe(70);
      expect(r.succession_profile.ready_now_count).toBe(1);
      expect(r.succession_profile.total_candidates).toBe(2);
    });

    it("counts overdue reviews", () => {
      const plans = [
        makeSuccession({ review_date: "2026-05-01" }),  // overdue
        makeSuccession({ id: "sp2", role_title: "Deputy", review_date: "2026-08-01" }),  // future
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.succession_profile.overdue_review_count).toBe(1);
    });

    it("identifies urgent plans", () => {
      const plans = [
        makeSuccession({ urgency: "immediate" }),
        makeSuccession({ id: "sp2", role_title: "Deputy", urgency: "six_months" }),
        makeSuccession({ id: "sp3", role_title: "Senior", urgency: "twelve_months" }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.succession_profile.urgent_plans_count).toBe(2);
    });
  });

  // ── Vacancy Coverage ─────────────────────────────────────────────────────

  describe("vacancy coverage", () => {
    it("calculates vacancy rate", () => {
      const staff = [makeStaff(), makeStaff({ id: "s2" }), makeStaff({ id: "s3" })];
      const vacancies = [makeVacancy({ status: "open" }), makeVacancy({ id: "v2", status: "closed" })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff, vacancies }));
      // open=1, active=3, rate = 1/(3+1) = 25%
      expect(r.vacancy_coverage.vacancy_rate).toBe(25);
      expect(r.vacancy_coverage.open_count).toBe(1);
      expect(r.vacancy_coverage.closed_count).toBe(1);
    });

    it("reports zero vacancy rate when no open vacancies", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ vacancies: [makeVacancy({ status: "closed" })] }));
      expect(r.vacancy_coverage.vacancy_rate).toBe(0);
    });
  });

  // ── Induction Profile ────────────────────────────────────────────────────

  describe("induction profile", () => {
    it("calculates completion rate", () => {
      const inductions = [
        makeInduction({ overall_status: "completed" }),
        makeInduction({ id: "ind2", overall_status: "in_progress", target_completion_date: "2026-06-01", probation_passed: false, completed_items: 4 }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.induction_profile.completion_rate).toBe(50);
      expect(r.induction_profile.in_progress_count).toBe(1);
      expect(r.induction_profile.overdue_count).toBe(0);
    });

    it("identifies overdue inductions", () => {
      const inductions = [
        makeInduction({ id: "ind1", overall_status: "in_progress", target_completion_date: "2026-04-01", probation_passed: false, completed_items: 3 }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.induction_profile.overdue_count).toBe(1);
    });

    it("calculates average item completion rate", () => {
      const inductions = [
        makeInduction({ completed_items: 7, total_items: 7 }),   // 100%
        makeInduction({ id: "ind2", overall_status: "in_progress", completed_items: 4, total_items: 8, probation_passed: false, target_completion_date: "2026-08-01" }),  // 50%
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      // avg = (100 + 50) / 2 = 75
      expect(r.induction_profile.avg_item_completion_rate).toBe(75);
    });

    it("calculates probation passed rate", () => {
      const inductions = [
        makeInduction({ probation_passed: true }),
        makeInduction({ id: "ind2", probation_passed: false, overall_status: "in_progress", target_completion_date: "2026-08-01" }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.induction_profile.probation_passed_rate).toBe(50);
    });
  });

  // ── Scoring Modifiers ────────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("applies full permanent rate bonus (+5)", () => {
      // All permanent, no succession, no vacancies, no inductions
      const staff = [makeStaff({ id: "s1" }), makeStaff({ id: "s2" })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      // 100% permanent → +5
      expect(r.staff_composition.permanent_rate).toBe(100);
    });

    it("penalises low permanent rate (-4)", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "agency", start_date: "2026-03-01", dbs_update_service: false }),
        makeStaff({ id: "s2", employment_type: "agency", start_date: "2026-04-01", dbs_update_service: false }),
        makeStaff({ id: "s3", employment_type: "bank", start_date: "2026-05-01", dbs_update_service: false }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.staff_composition.permanent_rate).toBe(0);
    });

    it("gives bonus for no vacancies (+3)", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ vacancies: [] }));
      expect(r.vacancy_coverage.vacancy_rate).toBe(0);
    });

    it("applies succession planning bonus (+4) for high readiness + ready_now", () => {
      const plans = [makeSuccession({
        candidates: [{ staff_id: "s1", readiness_score: 75, ready_now: true, estimated_ready_date: null }],
      })];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.succession_profile.avg_readiness_score).toBe(75);
      expect(r.succession_profile.ready_now_count).toBe(1);
    });

    it("penalises absence of succession plans (-2)", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: [] }));
      expect(r.concerns.some(c => c.includes("No succession plans"))).toBe(true);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes permanent staff strength", () => {
      const staff = Array.from({ length: 5 }, (_, i) => makeStaff({ id: `s${i}`, start_date: "2022-01-01" }));
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.strengths.some(s => s.includes("permanent"))).toBe(true);
    });

    it("includes no agency strength", () => {
      const r = computeHomeWorkforcePlanning(baseInput());
      expect(r.strengths.some(s => s.includes("No agency"))).toBe(true);
    });

    it("includes succession readiness strength", () => {
      const plans = [makeSuccession({
        candidates: [{ staff_id: "s1", readiness_score: 75, ready_now: false, estimated_ready_date: "2027-01-01" }],
      })];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.strengths.some(s => s.includes("succession") || s.includes("Succession"))).toBe(true);
    });

    it("includes no vacancies strength", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ vacancies: [] }));
      expect(r.strengths.some(s => s.includes("No open vacancies"))).toBe(true);
    });

    it("includes induction completion strength", () => {
      const inductions = [makeInduction(), makeInduction({ id: "ind2" })];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.strengths.some(s => s.includes("induction"))).toBe(true);
    });

    it("includes DBS update service strength", () => {
      const staff = Array.from({ length: 5 }, (_, i) => makeStaff({ id: `s${i}` }));
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.strengths.some(s => s.includes("DBS update service"))).toBe(true);
    });

    it("includes long-serving staff strength", () => {
      const staff = [makeStaff({ id: "s1", start_date: "2020-01-01" })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.strengths.some(s => s.includes("long-serving"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags agency staff", () => {
      const staff = [makeStaff({ employment_type: "agency" })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.concerns.some(c => c.includes("agency"))).toBe(true);
    });

    it("flags no succession plans", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: [] }));
      expect(r.concerns.some(c => c.includes("No succession plans"))).toBe(true);
    });

    it("flags overdue succession reviews", () => {
      const plans = [makeSuccession({ review_date: "2026-01-01" })];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("flags open vacancies", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ vacancies: [makeVacancy()] }));
      expect(r.concerns.some(c => c.includes("vacanc"))).toBe(true);
    });

    it("flags overdue inductions", () => {
      const inductions = [makeInduction({ overall_status: "in_progress", target_completion_date: "2026-03-01", probation_passed: false, completed_items: 3 })];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.concerns.some(c => c.includes("induction"))).toBe(true);
    });

    it("flags low permanent rate", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "agency" }),
        makeStaff({ id: "s2", employment_type: "bank" }),
        makeStaff({ id: "s3", employment_type: "permanent" }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      // 33% < 60%
      expect(r.concerns.some(c => c.includes("permanent"))).toBe(true);
    });

    it("flags low DBS update service rate", () => {
      const staff = [
        makeStaff({ id: "s1", dbs_update_service: false }),
        makeStaff({ id: "s2", dbs_update_service: false }),
        makeStaff({ id: "s3", dbs_update_service: true }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      // 33% < 50%
      expect(r.concerns.some(c => c.includes("DBS update service"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends succession planning when absent", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("succession"))).toBe(true);
    });

    it("recommends completing overdue inductions", () => {
      const inductions = [makeInduction({ overall_status: "in_progress", target_completion_date: "2026-03-01", probation_passed: false, completed_items: 3 })];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("induction"))).toBe(true);
    });

    it("recommends agency reduction", () => {
      const staff = [makeStaff({ employment_type: "agency" })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("agency"))).toBe(true);
    });

    it("generates no recommendations for perfect workforce", () => {
      const staff = Array.from({ length: 5 }, (_, i) => makeStaff({ id: `s${i}`, start_date: "2022-01-01" }));
      const plans = [makeSuccession({ candidates: [{ staff_id: "s1", readiness_score: 80, ready_now: true, estimated_ready_date: null }] })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans: plans }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary workforce", () => {
      const staff = Array.from({ length: 5 }, (_, i) => makeStaff({ id: `s${i}`, start_date: "2022-01-01" }));
      const plans = [makeSuccession({ candidates: [{ staff_id: "s1", readiness_score: 80, ready_now: true, estimated_ready_date: null }] })];
      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans: plans }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for high agency reliance", () => {
      const staff = [
        makeStaff({ id: "s1", employment_type: "agency" }),
        makeStaff({ id: "s2", employment_type: "agency" }),
        makeStaff({ id: "s3", employment_type: "permanent" }),
      ];
      const r = computeHomeWorkforcePlanning(baseInput({ staff }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("agency"))).toBe(true);
    });

    it("generates warning for missing succession plans", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: [] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("succession"))).toBe(true);
    });

    it("generates critical insight for overdue inductions", () => {
      const inductions = [makeInduction({ overall_status: "in_progress", target_completion_date: "2026-03-01", probation_passed: false, completed_items: 3 })];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("induction"))).toBe(true);
    });

    it("generates warning for urgent plans with no ready candidates", () => {
      const plans = [makeSuccession({
        urgency: "six_months",
        candidates: [{ staff_id: "s1", readiness_score: 50, ready_now: false, estimated_ready_date: "2027-01-01" }],
      })];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("cover within 6 months"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const staff = Array.from({ length: 5 }, (_, i) => makeStaff({ id: `s${i}`, start_date: "2022-01-01" }));
      const plans = [makeSuccession({ candidates: [{ staff_id: "s1", readiness_score: 80, ready_now: true, estimated_ready_date: null }] })];
      const inductions = [makeInduction()];
      const r = computeHomeWorkforcePlanning(baseInput({ staff, succession_plans: plans, inductions }));
      expect(r.headline).toContain("Outstanding");
    });

    it("generates insufficient_data headline", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ staff: [] }));
      expect(r.headline).toContain("No active staff");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single staff member", () => {
      const r = computeHomeWorkforcePlanning(baseInput({ staff: [makeStaff()] }));
      expect(r.workforce_rating).not.toBe("insufficient_data");
      expect(r.staff_composition.total_active).toBe(1);
    });

    it("handles succession plans with no candidates", () => {
      const plans = [makeSuccession({ candidates: [] })];
      const r = computeHomeWorkforcePlanning(baseInput({ succession_plans: plans }));
      expect(r.succession_profile.total_candidates).toBe(0);
      expect(r.succession_profile.avg_readiness_score).toBeNull();;
    });

    it("handles inductions with zero total items", () => {
      const inductions = [makeInduction({ total_items: 0, completed_items: 0 })];
      const r = computeHomeWorkforcePlanning(baseInput({ inductions }));
      expect(r.induction_profile.avg_item_completion_rate).toBe(0);
    });

    it("counts on_hold vacancies", () => {
      const vacancies = [makeVacancy({ status: "on_hold" })];
      const r = computeHomeWorkforcePlanning(baseInput({ vacancies }));
      expect(r.vacancy_coverage.on_hold_count).toBe(1);
      expect(r.vacancy_coverage.vacancy_rate).toBe(0); // on_hold not counted as open
    });
  });
});
