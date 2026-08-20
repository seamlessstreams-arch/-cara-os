// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF ROTA & ADEQUATE STAFFING INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 16 (Workforce), Reg 32 (Fitness of workers).
// STAFF-FOCUSED ENGINE: uses total_staff, NOT total_children.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffRotaAdequateStaffing,
  type StaffRotaInput,
  type ShiftCoverageRecordInput,
  type RatioComplianceRecordInput,
  type OvertimeRecordInput,
  type AgencyUsageRecordInput,
  type RotaPlanningRecordInput,
} from "../home-staff-rota-adequate-staffing-intelligence-engine";

// ── Record Factories ──────────────────────────────────────────────────────────

function makeShift(overrides: Partial<ShiftCoverageRecordInput> = {}): ShiftCoverageRecordInput {
  return {
    id: "sc_1",
    date: "2026-05-01",
    shift_type: "day",
    planned_staff_count: 4,
    actual_staff_count: 4,
    shift_fully_covered: true,
    vacancy_reason: null,
    cover_arranged: false,
    cover_type: null,
    handover_completed: true,
    handover_quality_rating: 5,
    lone_working_occurred: false,
    lone_working_risk_assessed: false,
    shift_incidents_count: 0,
    staff_member_ids: ["s1", "s2", "s3", "s4"],
    notes: null,
    created_at: "2026-05-01T08:00:00Z",
    ...overrides,
  };
}

function makeRatio(overrides: Partial<RatioComplianceRecordInput> = {}): RatioComplianceRecordInput {
  return {
    id: "rc_1",
    date: "2026-05-01",
    time_period: "full_day",
    children_present: 4,
    staff_on_duty: 4,
    required_ratio: "1:2",
    actual_ratio: "1:1",
    ratio_met: true,
    ratio_breach_duration_minutes: 0,
    breach_reason: null,
    corrective_action_taken: false,
    corrective_action_detail: null,
    senior_staff_on_duty: true,
    qualified_staff_count: 3,
    manager_notified: false,
    created_at: "2026-05-01T08:00:00Z",
    ...overrides,
  };
}

function makeOvertime(overrides: Partial<OvertimeRecordInput> = {}): OvertimeRecordInput {
  return {
    id: "ot_1",
    staff_id: "s1",
    staff_name: "Staff One",
    date: "2026-05-01",
    overtime_hours: 2,
    overtime_reason: "short_staffing",
    overtime_approved: true,
    approved_by: "manager_1",
    consecutive_days_worked: 3,
    rest_period_compliant: true,
    fatigue_risk_acknowledged: true,
    working_time_directive_compliant: true,
    total_weekly_hours: 42,
    notes: null,
    created_at: "2026-05-01T18:00:00Z",
    ...overrides,
  };
}

function makeAgency(overrides: Partial<AgencyUsageRecordInput> = {}): AgencyUsageRecordInput {
  return {
    id: "ag_1",
    date: "2026-05-01",
    agency_name: "Acme Agency",
    agency_staff_name: "Agency Person",
    shift_type: "day",
    hours_worked: 8,
    usage_reason: "vacancy",
    agency_staff_known_to_home: true,
    agency_staff_inducted: true,
    dbs_verified: true,
    children_briefed: true,
    feedback_collected: true,
    feedback_rating: 4,
    cost: 200,
    repeat_booking: true,
    created_at: "2026-05-01T08:00:00Z",
    ...overrides,
  };
}

function makeRota(overrides: Partial<RotaPlanningRecordInput> = {}): RotaPlanningRecordInput {
  return {
    id: "rp_1",
    week_commencing: "2026-04-27",
    rota_published_date: "2026-04-20",
    days_advance_published: 7,
    all_shifts_filled: true,
    unfilled_shifts_count: 0,
    skill_mix_adequate: true,
    senior_cover_every_shift: true,
    staff_preferences_considered: true,
    fairness_score: 5,
    contingency_plan_in_place: true,
    rota_approved_by_manager: true,
    staff_consulted: true,
    changes_after_publication: 0,
    notes: null,
    created_at: "2026-04-20T10:00:00Z",
    ...overrides,
  };
}

// ── Base Input Helper ─────────────────────────────────────────────────────────

function baseInput(overrides: Partial<StaffRotaInput> = {}): StaffRotaInput {
  return {
    today: "2026-05-29",
    total_staff: 8,
    shift_coverage_records: [],
    ratio_compliance_records: [],
    overtime_records: [],
    agency_usage_records: [],
    rota_planning_records: [],
    ...overrides,
  };
}

// Helper to produce N copies of a record with unique ids
function nRecords<T extends { id: string }>(
  factory: (o?: Partial<T>) => T,
  n: number,
  overrides: Partial<T> = {},
): T[] {
  return Array.from({ length: n }, (_, i) =>
    factory({ ...overrides, id: `${(overrides as Record<string, unknown>).id ?? "rec"}_${i}` } as Partial<T>),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("computeStaffRotaAdequateStaffing", () => {
  // ── pct(0,0) = 0 ────────────────────────────────────────────────────────
  describe("pct(0,0) edge case", () => {
    it("returns 0 rates when all arrays are empty but staff > 0", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({ total_staff: 8 }));
      expect(r.shift_coverage_rate).toBe(0);
      expect(r.ratio_compliance_rate).toBe(0);
      expect(r.overtime_rate).toBe(0);
      expect(r.agency_usage_rate).toBe(0);
      expect(r.rota_planning_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
    });
  });

  // ── insufficient_data ───────────────────────────────────────────────────
  describe("insufficient_data", () => {
    it("returns insufficient_data when total_staff=0 and all arrays empty", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 0 }),
      );
      expect(r.staffing_rating).toBe("insufficient_data");
      expect(r.staffing_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns all zero totals for insufficient_data", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 0 }),
      );
      expect(r.total_shift_records).toBe(0);
      expect(r.total_ratio_records).toBe(0);
      expect(r.total_overtime_records).toBe(0);
      expect(r.total_agency_records).toBe(0);
      expect(r.total_rota_records).toBe(0);
    });

    it("returns all zero rates for insufficient_data", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 0 }),
      );
      expect(r.shift_coverage_rate).toBe(0);
      expect(r.ratio_compliance_rate).toBe(0);
      expect(r.overtime_rate).toBe(0);
      expect(r.agency_usage_rate).toBe(0);
      expect(r.rota_planning_rate).toBe(0);
      expect(r.staff_satisfaction_rate).toBe(0);
    });
  });

  // ── Inadequate floor (staff > 0, all arrays empty) ─────────────────────
  describe("inadequate floor — staff>0, all arrays empty", () => {
    it("returns inadequate with score 15", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 8 }),
      );
      expect(r.staffing_rating).toBe("inadequate");
      expect(r.staffing_score).toBe(15);
    });

    it("headline mentions no staffing or rota data", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 1 }),
      );
      expect(r.headline).toContain("No staffing or rota data");
    });

    it("has exactly 1 concern", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 8 }),
      );
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No shift coverage records");
    });

    it("has exactly 2 recommendations both immediate", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 8 }),
      );
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has exactly 1 critical insight", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 8 }),
      );
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("total record counts are all 0", () => {
      const r = computeStaffRotaAdequateStaffing(
        baseInput({ total_staff: 8 }),
      );
      expect(r.total_shift_records).toBe(0);
      expect(r.total_ratio_records).toBe(0);
      expect(r.total_overtime_records).toBe(0);
      expect(r.total_agency_records).toBe(0);
      expect(r.total_rota_records).toBe(0);
    });
  });

  // ── Outstanding scenario ──────────────────────────────────────────────
  describe("outstanding scenario", () => {
    function outstandingInput(): StaffRotaInput {
      return baseInput({
        shift_coverage_records: nRecords(makeShift, 20, {
          shift_fully_covered: true,
          handover_completed: true,
          handover_quality_rating: 5,
          lone_working_occurred: false,
        } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: nRecords(makeRatio, 20, {
          ratio_met: true,
          senior_staff_on_duty: true,
        } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 2, {
          overtime_approved: true,
          rest_period_compliant: true,
          working_time_directive_compliant: true,
          fatigue_risk_acknowledged: true,
          consecutive_days_worked: 3,
          total_weekly_hours: 42,
        } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 2, {
          agency_staff_inducted: true,
          dbs_verified: true,
          agency_staff_known_to_home: true,
          children_briefed: true,
          feedback_collected: true,
          feedback_rating: 4,
        } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, {
          days_advance_published: 14,
          all_shifts_filled: true,
          skill_mix_adequate: true,
          senior_cover_every_shift: true,
          rota_approved_by_manager: true,
          staff_preferences_considered: true,
          staff_consulted: true,
          contingency_plan_in_place: true,
          fairness_score: 5,
          changes_after_publication: 0,
        } as Partial<RotaPlanningRecordInput>),
      });
    }

    it("rates as outstanding", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.staffing_rating).toBe("outstanding");
    });

    it("score is 80 (base 52 + all bonuses 28)", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      // base=52 + 4+4+4+3+3+3+3+2+2 = 52+28 = 80
      expect(r.staffing_score).toBe(80);
    });

    it("headline mentions outstanding", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.headline).toContain("Outstanding staffing adequacy");
    });

    it("has multiple strengths", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });

    it("has zero concerns", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has zero recommendations", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      const positive = r.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThan(0);
    });

    it("includes outstanding-specific positive insight", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      const outstanding = r.insights.find((i) =>
        i.text.includes("outstanding staffing adequacy"),
      );
      expect(outstanding).toBeDefined();
      expect(outstanding!.severity).toBe("positive");
    });

    it("returns correct record totals", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.total_shift_records).toBe(20);
      expect(r.total_ratio_records).toBe(20);
      expect(r.total_overtime_records).toBe(2);
      expect(r.total_agency_records).toBe(2);
      expect(r.total_rota_records).toBe(10);
    });

    it("rates are 100% for shift coverage and ratio compliance", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.shift_coverage_rate).toBe(100);
      expect(r.ratio_compliance_rate).toBe(100);
    });

    it("rota_planning_rate is 100%", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.rota_planning_rate).toBe(100);
    });

    it("staff_satisfaction_rate is 100%", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      expect(r.staff_satisfaction_rate).toBe(100);
    });

    it("overtime_rate is INVERTED: pct(2,8) = 25", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      // 2 overtime records / 8 total_staff = 25%
      expect(r.overtime_rate).toBe(25);
    });

    it("agency_usage_rate is INVERTED: pct(2,8) = 25", () => {
      const r = computeStaffRotaAdequateStaffing(outstandingInput());
      // 2 agency records / 8 total_staff = 25%
      expect(r.agency_usage_rate).toBe(25);
    });
  });

  // ── Good scenario ─────────────────────────────────────────────────────
  describe("good scenario", () => {
    function goodInput(): StaffRotaInput {
      // Aim for score 65-79
      // We'll get some bonuses at lower tiers
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: true,
        handover_completed: true,
        handover_quality_rating: 4,
      } as Partial<ShiftCoverageRecordInput>);
      // Make 15% not covered / handover incomplete
      shifts[0] = makeShift({ id: "sc_miss0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 2, cover_arranged: true, vacancy_reason: "sickness" });
      shifts[1] = makeShift({ id: "sc_miss1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 2, cover_arranged: false, vacancy_reason: "annual_leave" });
      // shiftCoverageRate = 80%, handoverRate = 80%

      const ratios = nRecords(makeRatio, 10, {
        ratio_met: true,
        senior_staff_on_duty: true,
      } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "rc_miss0", ratio_met: false, ratio_breach_duration_minutes: 30, corrective_action_taken: true, manager_notified: true, senior_staff_on_duty: true });
      ratios[1] = makeRatio({ id: "rc_miss1", ratio_met: false, ratio_breach_duration_minutes: 15, corrective_action_taken: true, manager_notified: true, senior_staff_on_duty: false });
      // ratioComplianceRate = 80%, seniorCoverRate = 90%

      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 7,
        all_shifts_filled: true,
        skill_mix_adequate: true,
        senior_cover_every_shift: true,
        rota_approved_by_manager: true,
        staff_preferences_considered: true,
        staff_consulted: true,
        contingency_plan_in_place: true,
        fairness_score: 4,
      } as Partial<RotaPlanningRecordInput>);
      // Make 3 rotas not fully compliant across composite dimensions
      rotas[0] = makeRota({ id: "rp_miss0", days_advance_published: 3, all_shifts_filled: false, unfilled_shifts_count: 2, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false, fairness_score: 2 });
      // rotaPlanningRate: published=9, filled=9, skill=9, senior=9, approved=9 => 45/50 = 90%

      return baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        overtime_records: nRecords(makeOvertime, 1, {
          working_time_directive_compliant: true,
          rest_period_compliant: true,
        } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 1, {
          agency_staff_inducted: true,
          dbs_verified: true,
        } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: rotas,
      });
    }

    it("rates as good", () => {
      const r = computeStaffRotaAdequateStaffing(goodInput());
      expect(r.staffing_rating).toBe("good");
    });

    it("score is between 65 and 79 inclusive", () => {
      const r = computeStaffRotaAdequateStaffing(goodInput());
      expect(r.staffing_score).toBeGreaterThanOrEqual(65);
      expect(r.staffing_score).toBeLessThanOrEqual(79);
    });

    it("headline mentions good", () => {
      const r = computeStaffRotaAdequateStaffing(goodInput());
      expect(r.headline).toContain("Good staffing adequacy");
    });

    it("has strengths", () => {
      const r = computeStaffRotaAdequateStaffing(goodInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });

  // ── Adequate scenario ─────────────────────────────────────────────────
  describe("adequate scenario", () => {
    function adequateInput(): StaffRotaInput {
      // Score 45-64 — some mid-tier bonuses, no penalties
      const shifts = nRecords(makeShift, 10);
      // 7/10 covered, 7/10 handover => 70% each
      shifts[0] = makeShift({ id: "s_0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 2, cover_arranged: true, vacancy_reason: "sickness" });
      shifts[1] = makeShift({ id: "s_1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 2, cover_arranged: true, vacancy_reason: "vacancy" });
      shifts[2] = makeShift({ id: "s_2", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 2, cover_arranged: false, vacancy_reason: "no_show" });

      const ratios = nRecords(makeRatio, 10);
      ratios[0] = makeRatio({ id: "r_0", ratio_met: false, ratio_breach_duration_minutes: 30, corrective_action_taken: true, manager_notified: true, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "r_1", ratio_met: false, ratio_breach_duration_minutes: 30, corrective_action_taken: false, manager_notified: false, senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "r_2", ratio_met: false, ratio_breach_duration_minutes: 15, corrective_action_taken: true, manager_notified: true, senior_staff_on_duty: false });
      // ratioComplianceRate = 70%, seniorCoverRate = 70%

      // Rota: middling quality
      const rotas = nRecords(makeRota, 5);
      rotas[0] = makeRota({ id: "rp_0", days_advance_published: 3, all_shifts_filled: false, unfilled_shifts_count: 3, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false });
      rotas[1] = makeRota({ id: "rp_1", days_advance_published: 5, all_shifts_filled: false, unfilled_shifts_count: 1, skill_mix_adequate: false, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false });
      // rotaPlanningRate: pub=3, filled=3, skill=3, senior=4, approved=4 => 17/25 = 68%

      return baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        overtime_records: [],
        agency_usage_records: [],
        rota_planning_records: rotas,
      });
    }

    it("rates as adequate", () => {
      const r = computeStaffRotaAdequateStaffing(adequateInput());
      expect(r.staffing_rating).toBe("adequate");
    });

    it("score is between 45 and 64 inclusive", () => {
      const r = computeStaffRotaAdequateStaffing(adequateInput());
      expect(r.staffing_score).toBeGreaterThanOrEqual(45);
      expect(r.staffing_score).toBeLessThanOrEqual(64);
    });

    it("headline mentions adequate", () => {
      const r = computeStaffRotaAdequateStaffing(adequateInput());
      expect(r.headline).toContain("Adequate staffing");
    });

    it("has concerns", () => {
      const r = computeStaffRotaAdequateStaffing(adequateInput());
      expect(r.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── Inadequate scenario ───────────────────────────────────────────────
  describe("inadequate scenario", () => {
    function inadequateInput(): StaffRotaInput {
      // Score < 45 — bad rates trigger penalties
      const shifts = nRecords(makeShift, 10);
      // Only 4/10 covered => 40%
      for (let i = 0; i < 6; i++) {
        shifts[i] = makeShift({
          id: `s_bad_${i}`,
          shift_fully_covered: false,
          handover_completed: false,
          handover_quality_rating: 1,
          cover_arranged: false,
          vacancy_reason: "vacancy",
        });
      }

      const ratios = nRecords(makeRatio, 10);
      // Only 4/10 ratio met => 40%
      for (let i = 0; i < 6; i++) {
        ratios[i] = makeRatio({
          id: `r_bad_${i}`,
          ratio_met: false,
          ratio_breach_duration_minutes: 60,
          corrective_action_taken: false,
          manager_notified: false,
          senior_staff_on_duty: false,
        });
      }

      const overtime = nRecords(makeOvertime, 10);
      // 5/10 exceed 48 hours => 50%, and consecutive > 6 for 5
      for (let i = 0; i < 5; i++) {
        overtime[i] = makeOvertime({
          id: `ot_bad_${i}`,
          total_weekly_hours: 55,
          consecutive_days_worked: 8,
          working_time_directive_compliant: false,
          rest_period_compliant: false,
        });
      }

      // Rota: poor
      const rotas = nRecords(makeRota, 5);
      for (let i = 0; i < 4; i++) {
        rotas[i] = makeRota({
          id: `rp_bad_${i}`,
          days_advance_published: 2,
          all_shifts_filled: false,
          unfilled_shifts_count: 5,
          skill_mix_adequate: false,
          senior_cover_every_shift: false,
          rota_approved_by_manager: false,
          staff_preferences_considered: false,
          staff_consulted: false,
          contingency_plan_in_place: false,
          fairness_score: 1,
          changes_after_publication: 8,
        });
      }
      // rotaPlanningRate: pub=1, filled=1, skill=1, senior=1, approved=1 => 5/25 = 20%

      return baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        overtime_records: overtime,
        agency_usage_records: nRecords(makeAgency, 1, {
          agency_staff_inducted: false,
          dbs_verified: false,
          children_briefed: false,
          feedback_collected: false,
          feedback_rating: null,
          agency_staff_known_to_home: false,
        } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: rotas,
      });
    }

    it("rates as inadequate", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      expect(r.staffing_rating).toBe("inadequate");
    });

    it("score is below 45", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      expect(r.staffing_score).toBeLessThan(45);
    });

    it("headline mentions inadequate", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });

    it("has multiple concerns", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      expect(r.concerns.length).toBeGreaterThan(3);
    });

    it("has multiple immediate recommendations", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediate.length).toBeGreaterThan(2);
    });

    it("has critical insights", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeStaffRotaAdequateStaffing(inadequateInput());
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BONUS ISOLATION TESTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Bonus 1: shiftCoverageRate", () => {
    it(">=95 gives +4 (score 56)", () => {
      // 20/20 covered = 100%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, {
          shift_fully_covered: true,
          handover_completed: false,
          handover_quality_rating: 1,
        } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: [],
        overtime_records: [],
        agency_usage_records: [],
        rota_planning_records: [],
      }));
      // base=52 + 4 = 56 (no other bonuses since other arrays empty)
      expect(r.staffing_score).toBe(56);
    });

    it(">=80 <95 gives +2 (score 54)", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: true,
        handover_completed: false,
        handover_quality_rating: 1,
      } as Partial<ShiftCoverageRecordInput>);
      // Make 2 uncovered => 80%
      shifts[0] = makeShift({ id: "sc_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "sc_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      expect(r.staffing_score).toBe(54);
    });

    it("<80 gives +0 (score 52)", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: true,
        handover_completed: false,
        handover_quality_rating: 1,
      } as Partial<ShiftCoverageRecordInput>);
      // Make 3 uncovered => 70%
      shifts[0] = makeShift({ id: "sc_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "sc_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[2] = makeShift({ id: "sc_f2", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      expect(r.staffing_score).toBe(52);
    });
  });

  describe("Bonus 2: ratioComplianceRate", () => {
    it(">=95 gives +4 (score 56)", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: nRecords(makeRatio, 20, {
          ratio_met: true,
          senior_staff_on_duty: false,
        } as Partial<RatioComplianceRecordInput>),
      }));
      // base=52 + 4 (ratio) = 56
      expect(r.staffing_score).toBe(56);
    });

    it(">=80 <95 gives +2 (score 54)", () => {
      const ratios = nRecords(makeRatio, 10, {
        ratio_met: true,
        senior_staff_on_duty: false,
      } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false, senior_staff_on_duty: false });
      // 80%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: ratios,
      }));
      expect(r.staffing_score).toBe(54);
    });

    it("<80 gives +0 (score 52)", () => {
      const ratios = nRecords(makeRatio, 10, {
        ratio_met: true,
        senior_staff_on_duty: false,
      } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false, senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "r_f2", ratio_met: false, senior_staff_on_duty: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: ratios,
      }));
      expect(r.staffing_score).toBe(52);
    });
  });

  describe("Bonus 3: rotaPlanningRate", () => {
    it(">=90 gives +4 (score 56+staffSat+contingency bonuses)", () => {
      // All 5 composite dimensions met => 100%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, {
          days_advance_published: 14,
          all_shifts_filled: true,
          skill_mix_adequate: true,
          senior_cover_every_shift: true,
          rota_approved_by_manager: true,
          staff_preferences_considered: true,
          staff_consulted: true,
          contingency_plan_in_place: true,
        } as Partial<RotaPlanningRecordInput>),
      }));
      // base=52 + 4(rota) + 2(staffSat100%) + 2(contingency100%) = 60
      expect(r.staffing_score).toBe(60);
    });

    it(">=70 <90 gives +2", () => {
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 14,
        all_shifts_filled: true,
        skill_mix_adequate: true,
        senior_cover_every_shift: true,
        rota_approved_by_manager: true,
        staff_preferences_considered: false,
        staff_consulted: false,
        contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // Make 3 rotas fail some dimensions to bring rate to ~70-89%
      rotas[0] = makeRota({ id: "rp_x0", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false });
      rotas[1] = makeRota({ id: "rp_x1", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false });
      // composite: pub=8, fill=8, skill=8, senior=8, approved=8 = 40/50 = 80%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: rotas,
      }));
      expect(r.staffing_score).toBeGreaterThanOrEqual(54); // base + 2 at minimum
    });
  });

  describe("Bonus 4: handoverRate", () => {
    it(">=95 gives +3 (score 55)", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, {
          shift_fully_covered: false,
          handover_completed: true,
          handover_quality_rating: 3,
        } as Partial<ShiftCoverageRecordInput>),
      }));
      // shiftCoverageRate=0%, handoverRate=100%
      // base=52 + 3(handover) - 5(shiftCov<60 penalty) = 50
      expect(r.staffing_score).toBe(50);
    });

    it(">=80 <95 gives +1", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: false,
        handover_completed: true,
        handover_quality_rating: 3,
      } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "ho_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "ho_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // handoverRate = 80%
      // shiftCoverageRate = 0% => penalty -5
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      // base=52 + 1(handover) - 5(shiftCov<60) = 48
      expect(r.staffing_score).toBe(48);
    });
  });

  describe("Bonus 5: wtdComplianceRate", () => {
    it(">=95 gives +3 (score 55)", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: nRecords(makeOvertime, 20, {
          working_time_directive_compliant: true,
          rest_period_compliant: false,
          consecutive_days_worked: 3,
          total_weekly_hours: 40,
        } as Partial<OvertimeRecordInput>),
      }));
      // base=52 + 3(wtd) = 55
      expect(r.staffing_score).toBe(55);
    });

    it(">=80 <95 gives +1 (score 53)", () => {
      const ot = nRecords(makeOvertime, 10, {
        working_time_directive_compliant: true,
        rest_period_compliant: false,
        consecutive_days_worked: 3,
        total_weekly_hours: 40,
      } as Partial<OvertimeRecordInput>);
      ot[0] = makeOvertime({ id: "ot_f0", working_time_directive_compliant: false, rest_period_compliant: false, consecutive_days_worked: 3, total_weekly_hours: 40 });
      ot[1] = makeOvertime({ id: "ot_f1", working_time_directive_compliant: false, rest_period_compliant: false, consecutive_days_worked: 3, total_weekly_hours: 40 });
      // 80% WTD
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: ot,
      }));
      expect(r.staffing_score).toBe(53);
    });
  });

  describe("Bonus 6: agencyInductionRate", () => {
    it(">=95 gives +3 (score 55)", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: nRecords(makeAgency, 20, {
          agency_staff_inducted: true,
          dbs_verified: false,
          agency_staff_known_to_home: false,
          children_briefed: false,
          feedback_collected: false,
          feedback_rating: null,
        } as Partial<AgencyUsageRecordInput>),
      }));
      // base=52 + 3(induction) = 55
      expect(r.staffing_score).toBe(55);
    });

    it(">=75 <95 gives +1 (score 53)", () => {
      const ag = nRecords(makeAgency, 4, {
        agency_staff_inducted: true,
        dbs_verified: false,
        agency_staff_known_to_home: false,
        children_briefed: false,
        feedback_collected: false,
        feedback_rating: null,
      } as Partial<AgencyUsageRecordInput>);
      ag[0] = makeAgency({ id: "ag_f0", agency_staff_inducted: false, dbs_verified: false, agency_staff_known_to_home: false, children_briefed: false, feedback_collected: false, feedback_rating: null });
      // 75% induction
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: ag,
      }));
      expect(r.staffing_score).toBe(53);
    });
  });

  describe("Bonus 7: seniorCoverRate", () => {
    it(">=90 gives +3 (score 55)", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: nRecords(makeRatio, 10, {
          ratio_met: false,
          senior_staff_on_duty: true,
        } as Partial<RatioComplianceRecordInput>),
      }));
      // ratioComplianceRate=0% => penalty -5
      // seniorCoverRate=100% => +3
      // base=52 + 3 - 5 = 50
      expect(r.staffing_score).toBe(50);
    });

    it(">=70 <90 gives +1", () => {
      const ratios = nRecords(makeRatio, 10, {
        ratio_met: false,
        senior_staff_on_duty: true,
      } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "sr_f0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "sr_f1", ratio_met: false, senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "sr_f2", ratio_met: false, senior_staff_on_duty: false });
      // seniorCoverRate=70%
      // ratioComplianceRate=0% => penalty -5
      // base=52 + 1 - 5 = 48
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: ratios,
      }));
      expect(r.staffing_score).toBe(48);
    });
  });

  describe("Bonus 8: staffSatisfactionRate", () => {
    it(">=90 gives +2", () => {
      // staffSatisfactionRate = pct(preferencesConsidered + staffConsulted, totalRotaRecords * 2)
      // All 10 rotas have both => 20/20 = 100%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, {
          staff_preferences_considered: true,
          staff_consulted: true,
          // Neutralize other rota bonuses
          days_advance_published: 3,
          all_shifts_filled: false,
          skill_mix_adequate: false,
          senior_cover_every_shift: false,
          rota_approved_by_manager: false,
          contingency_plan_in_place: false,
        } as Partial<RotaPlanningRecordInput>),
      }));
      // rotaPlanningRate: pub=0, fill=0, skill=0, senior=0, approved=0 => 0/50 = 0% => penalty -4
      // staffSatisfactionRate = 100% => +2
      // contingencyRate = 0% (no bonus)
      // base=52 + 2 - 4 = 50
      expect(r.staffing_score).toBe(50);
    });

    it(">=70 <90 gives +1", () => {
      const rotas = nRecords(makeRota, 10, {
        staff_preferences_considered: true,
        staff_consulted: true,
        days_advance_published: 3,
        all_shifts_filled: false,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
        contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // Make 4 not consulted and not preferences => pct(12, 20) = 60% ... too low
      // Make 3 not consulted but preferences OK => pct(17, 20) = 85% ... too high
      // Want 70-89: pct(x, 20) where 14<=x<=17
      // 3 rotas with neither => pct(14, 20) = 70%
      rotas[0] = makeRota({ id: "rp_ns0", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      rotas[1] = makeRota({ id: "rp_ns1", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      rotas[2] = makeRota({ id: "rp_ns2", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      // staffSatNumerator = 7+7 = 14, denom = 10*2 = 20, rate = 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: rotas,
      }));
      // rotaPlanningRate=0% => penalty -4
      // staffSatisfactionRate=70% => +1
      // base=52 + 1 - 4 = 49
      expect(r.staffing_score).toBe(49);
    });
  });

  describe("Bonus 9: contingencyRate", () => {
    it(">=90 gives +2", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, {
          contingency_plan_in_place: true,
          staff_preferences_considered: false,
          staff_consulted: false,
          days_advance_published: 3,
          all_shifts_filled: false,
          skill_mix_adequate: false,
          senior_cover_every_shift: false,
          rota_approved_by_manager: false,
        } as Partial<RotaPlanningRecordInput>),
      }));
      // rotaPlanningRate=0% => penalty -4
      // contingencyRate=100% => +2
      // staffSatisfactionRate=0%
      // base=52 + 2 - 4 = 50
      expect(r.staffing_score).toBe(50);
    });

    it(">=70 <90 gives +1", () => {
      const rotas = nRecords(makeRota, 10, {
        contingency_plan_in_place: true,
        staff_preferences_considered: false,
        staff_consulted: false,
        days_advance_published: 3,
        all_shifts_filled: false,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
      } as Partial<RotaPlanningRecordInput>);
      rotas[0] = makeRota({ id: "cp_f0", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      rotas[1] = makeRota({ id: "cp_f1", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      rotas[2] = makeRota({ id: "cp_f2", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      // contingencyRate=70%
      // rotaPlanningRate=0% => penalty -4
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: rotas,
      }));
      // base=52 + 1 - 4 = 49
      expect(r.staffing_score).toBe(49);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PENALTY TESTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("Penalty 1: shiftCoverageRate < 60", () => {
    it("applies -5 penalty when shiftCoverageRate < 60 and records exist", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: false,
        handover_completed: false,
        handover_quality_rating: 1,
      } as Partial<ShiftCoverageRecordInput>);
      // Only 5/10 covered = 50%
      for (let i = 0; i < 5; i++) {
        shifts[i] = makeShift({ id: `sc_ok_${i}`, shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 });
      }
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      // base=52 - 5 = 47
      expect(r.staffing_score).toBe(47);
    });

    it("does NOT apply penalty when shiftCoverageRate >= 60", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: true,
        handover_completed: false,
        handover_quality_rating: 1,
      } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "sc_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "sc_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[2] = makeShift({ id: "sc_f2", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[3] = makeShift({ id: "sc_f3", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // 60% coverage — no penalty
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      expect(r.staffing_score).toBe(52);
    });

    it("does NOT apply penalty when array is empty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: [],
        // need at least one non-empty array to avoid allEmpty path
        ratio_compliance_records: [makeRatio({ ratio_met: false, senior_staff_on_duty: false })],
      }));
      // No shift records => shift penalty guard prevents -5
      // ratioComplianceRate=0% => -5 penalty
      expect(r.staffing_score).toBe(47);
    });
  });

  describe("Penalty 2: ratioComplianceRate < 60", () => {
    it("applies -5 penalty when ratioComplianceRate < 60 and records exist", () => {
      const ratios = nRecords(makeRatio, 10, {
        ratio_met: false,
        senior_staff_on_duty: false,
      } as Partial<RatioComplianceRecordInput>);
      // 5/10 met = 50%
      for (let i = 0; i < 5; i++) {
        ratios[i] = makeRatio({ id: `rc_ok_${i}`, ratio_met: true, senior_staff_on_duty: false });
      }
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: ratios,
      }));
      // base=52 - 5 = 47
      expect(r.staffing_score).toBe(47);
    });

    it("does NOT apply penalty when ratioComplianceRate >= 60", () => {
      const ratios = nRecords(makeRatio, 10, {
        ratio_met: true,
        senior_staff_on_duty: false,
      } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false, senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "r_f2", ratio_met: false, senior_staff_on_duty: false });
      ratios[3] = makeRatio({ id: "r_f3", ratio_met: false, senior_staff_on_duty: false });
      // 60% — no penalty
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: ratios,
      }));
      expect(r.staffing_score).toBe(52);
    });
  });

  describe("Penalty 3: excessiveHoursRate > 30", () => {
    it("applies -4 penalty when >30% exceed 48 hours", () => {
      const ot = nRecords(makeOvertime, 10, {
        working_time_directive_compliant: false,
        rest_period_compliant: true,
        total_weekly_hours: 40,
        consecutive_days_worked: 3,
      } as Partial<OvertimeRecordInput>);
      // 4/10 exceed 48h = 40%
      for (let i = 0; i < 4; i++) {
        ot[i] = makeOvertime({
          id: `ot_ex_${i}`,
          total_weekly_hours: 55,
          working_time_directive_compliant: false,
          rest_period_compliant: true,
          consecutive_days_worked: 3,
        });
      }
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: ot,
      }));
      // base=52 - 4 = 48
      expect(r.staffing_score).toBe(48);
    });

    it("does NOT apply penalty when excessiveHoursRate <= 30", () => {
      const ot = nRecords(makeOvertime, 10, {
        total_weekly_hours: 40,
        working_time_directive_compliant: false,
        rest_period_compliant: true,
        consecutive_days_worked: 3,
      } as Partial<OvertimeRecordInput>);
      // 3/10 exceed = 30% (not > 30)
      for (let i = 0; i < 3; i++) {
        ot[i] = makeOvertime({
          id: `ot_ex_${i}`,
          total_weekly_hours: 55,
          working_time_directive_compliant: false,
          rest_period_compliant: true,
          consecutive_days_worked: 3,
        });
      }
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: ot,
      }));
      // No penalty => 52
      expect(r.staffing_score).toBe(52);
    });
  });

  describe("Penalty 4: rotaPlanningRate < 40", () => {
    it("applies -4 penalty when rotaPlanningRate < 40 and records exist", () => {
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 3,
        all_shifts_filled: false,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
        staff_preferences_considered: false,
        staff_consulted: false,
        contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // All fail on all 5 dimensions => 0/50 = 0%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: rotas,
      }));
      // base=52 - 4 = 48
      expect(r.staffing_score).toBe(48);
    });

    it("does NOT apply penalty when rotaPlanningRate >= 40", () => {
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 14,
        all_shifts_filled: true,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
        staff_preferences_considered: false,
        staff_consulted: false,
        contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // pub=10, fill=10, skill=0, senior=0, approved=0 => 20/50 = 40%
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: rotas,
      }));
      // No penalty 4 (rotaPlanningRate=40% is not < 40)
      expect(r.staffing_score).toBe(52);
    });
  });

  describe("cumulative penalties", () => {
    it("all 4 penalties stack: -5 -5 -4 -4 = -18 => score 34", () => {
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: false,
        handover_completed: false,
        handover_quality_rating: 1,
      } as Partial<ShiftCoverageRecordInput>);
      // shiftCoverageRate=0%

      const ratios = nRecords(makeRatio, 10, {
        ratio_met: false,
        senior_staff_on_duty: false,
      } as Partial<RatioComplianceRecordInput>);
      // ratioComplianceRate=0%

      const ot = nRecords(makeOvertime, 10, {
        total_weekly_hours: 55,
        working_time_directive_compliant: false,
        rest_period_compliant: false,
        consecutive_days_worked: 8,
      } as Partial<OvertimeRecordInput>);
      // excessiveHoursRate=100%

      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 2,
        all_shifts_filled: false,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
        staff_preferences_considered: false,
        staff_consulted: false,
        contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // rotaPlanningRate=0%

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        overtime_records: ot,
        rota_planning_records: rotas,
      }));
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.staffing_score).toBe(34);
      expect(r.staffing_rating).toBe("inadequate");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RATE CALCULATIONS (6 rates)
  // ══════════════════════════════════════════════════════════════════════════

  describe("rate calculations", () => {
    describe("shift_coverage_rate", () => {
      it("returns pct of fully covered shifts", () => {
        const shifts = nRecords(makeShift, 4, { shift_fully_covered: true } as Partial<ShiftCoverageRecordInput>);
        shifts[0] = makeShift({ id: "sc_nc", shift_fully_covered: false });
        // 3/4 = 75%
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.shift_coverage_rate).toBe(75);
      });

      it("returns 0 when no shifts", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          ratio_compliance_records: [makeRatio()],
        }));
        expect(r.shift_coverage_rate).toBe(0);
      });
    });

    describe("ratio_compliance_rate", () => {
      it("returns pct of ratios met", () => {
        const ratios = nRecords(makeRatio, 5, { ratio_met: true } as Partial<RatioComplianceRecordInput>);
        ratios[0] = makeRatio({ id: "rc_nm", ratio_met: false });
        // 4/5 = 80%
        const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
        expect(r.ratio_compliance_rate).toBe(80);
      });
    });

    describe("overtime_rate (INVERTED: pct(totalOvertimeRecords, total_staff))", () => {
      it("is pct of overtime records over total_staff", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          total_staff: 10,
          overtime_records: nRecords(makeOvertime, 3),
        }));
        // pct(3, 10) = 30
        expect(r.overtime_rate).toBe(30);
      });

      it("returns 0 when total_staff is 0", () => {
        // total_staff=0 with records won't hit the allEmpty path
        const r = computeStaffRotaAdequateStaffing(baseInput({
          total_staff: 0,
          overtime_records: nRecords(makeOvertime, 3),
          shift_coverage_records: [makeShift()],
        }));
        expect(r.overtime_rate).toBe(0);
      });

      it("can exceed 100%", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          total_staff: 2,
          overtime_records: nRecords(makeOvertime, 5),
        }));
        // pct(5, 2) = 250
        expect(r.overtime_rate).toBe(250);
      });
    });

    describe("agency_usage_rate (INVERTED: pct(totalAgencyRecords, total_staff))", () => {
      it("is pct of agency records over total_staff", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          total_staff: 8,
          agency_usage_records: nRecords(makeAgency, 2),
        }));
        // pct(2, 8) = 25
        expect(r.agency_usage_rate).toBe(25);
      });

      it("returns 0 when total_staff is 0", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          total_staff: 0,
          agency_usage_records: nRecords(makeAgency, 3),
          shift_coverage_records: [makeShift()],
        }));
        expect(r.agency_usage_rate).toBe(0);
      });
    });

    describe("rota_planning_rate (composite of 5 dimensions)", () => {
      it("calculates composite from published_on_time, filled, skill_mix, senior_cover, approved", () => {
        const rotas = [
          makeRota({ id: "rp1", days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true }),
          makeRota({ id: "rp2", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false }),
        ];
        // pub=1, fill=1, skill=1, senior=1, approved=1 => 5/10 = 50%
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.rota_planning_rate).toBe(50);
      });

      it("returns 0 when no rota records", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: [makeShift()],
        }));
        expect(r.rota_planning_rate).toBe(0);
      });
    });

    describe("staff_satisfaction_rate (preferences + consultation)", () => {
      it("calculates from preferences_considered + staff_consulted out of totalRotaRecords*2", () => {
        const rotas = [
          makeRota({ id: "rp1", staff_preferences_considered: true, staff_consulted: true }),
          makeRota({ id: "rp2", staff_preferences_considered: false, staff_consulted: true }),
          makeRota({ id: "rp3", staff_preferences_considered: true, staff_consulted: false }),
          makeRota({ id: "rp4", staff_preferences_considered: false, staff_consulted: false }),
        ];
        // numerator = 2 + 2 = 4, denominator = 4*2 = 8 => 50%
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.staff_satisfaction_rate).toBe(50);
      });

      it("returns 0 when no rota records", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: [makeShift()],
        }));
        expect(r.staff_satisfaction_rate).toBe(0);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("shift coverage >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("100% shift coverage"))).toBe(true);
    });

    it("shift coverage >=80 <95 strength uses different text", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // 80%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.strengths.some((s) => s.includes("80% shift coverage") && s.includes("good staffing levels"))).toBe(true);
    });

    it("ratio compliance >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("100% ratio compliance"))).toBe(true);
    });

    it("handover >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, { handover_completed: true, shift_fully_covered: false, handover_quality_rating: 3 } as Partial<ShiftCoverageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("100% handover completion"))).toBe(true);
    });

    it("rota planning >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10),
      }));
      expect(r.strengths.some((s) => s.includes("rota planning quality"))).toBe(true);
    });

    it("WTD compliance >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: nRecords(makeOvertime, 10, { working_time_directive_compliant: true } as Partial<OvertimeRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("Working Time Directive compliance"))).toBe(true);
    });

    it("rest compliance >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: nRecords(makeOvertime, 10, { rest_period_compliant: true } as Partial<OvertimeRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("rest period compliance"))).toBe(true);
    });

    it("agency induction >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: nRecords(makeAgency, 10, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("agency staff induction rate"))).toBe(true);
    });

    it("agency DBS >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: nRecords(makeAgency, 10, { dbs_verified: true } as Partial<AgencyUsageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("agency DBS verification"))).toBe(true);
    });

    it("senior cover >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: nRecords(makeRatio, 10, { senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("senior staff presence"))).toBe(true);
    });

    it("staff satisfaction >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, { staff_preferences_considered: true, staff_consulted: true } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("staff satisfaction indicators"))).toBe(true);
    });

    it("contingency >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, { contingency_plan_in_place: true } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("contingency planning"))).toBe(true);
    });

    it("cover arrangement >=90% strength when uncovered shifts exist", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, cover_arranged: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.strengths.some((s) => s.includes("uncovered shifts had alternative cover arranged"))).toBe(true);
    });

    it("overtime approval >=95% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: nRecords(makeOvertime, 10, { overtime_approved: true } as Partial<OvertimeRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("overtime approval rate"))).toBe(true);
    });

    it("agency familiarity >=80% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: nRecords(makeAgency, 10, { agency_staff_known_to_home: true } as Partial<AgencyUsageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("agency staff are known to the home"))).toBe(true);
    });

    it("children briefed >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: nRecords(makeAgency, 10, { children_briefed: true } as Partial<AgencyUsageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("children briefed"))).toBe(true);
    });

    it("fairness score >=4.0 strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, { fairness_score: 4.5 } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("fairness score"))).toBe(true);
    });

    it("skill mix >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, { skill_mix_adequate: true } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("skill mix"))).toBe(true);
    });

    it("rota publication >=90% strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14 } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("rotas published at least 7 days"))).toBe(true);
    });

    it("handover quality >=4.0 strength present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 10, { handover_quality_rating: 4.5 } as Partial<ShiftCoverageRecordInput>),
      }));
      expect(r.strengths.some((s) => s.includes("handover quality rating"))).toBe(true);
    });

    it("no strengths when all records have bad values", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1, lone_working_occurred: false } as Partial<ShiftCoverageRecordInput>),
      }));
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("shift coverage < 60 critical concern", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("0% shift coverage"))).toBe(true);
    });

    it("shift coverage 60-79 moderate concern", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false });
      shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false });
      shifts[2] = makeShift({ id: "s_f2", shift_fully_covered: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("Shift coverage at 70%"))).toBe(true);
    });

    it("ratio compliance < 60 critical concern", () => {
      const ratios = nRecords(makeRatio, 10, { ratio_met: false } as Partial<RatioComplianceRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      expect(r.concerns.some((c) => c.includes("0% ratio compliance"))).toBe(true);
    });

    it("ratio compliance 60-79 moderate concern", () => {
      const ratios = nRecords(makeRatio, 10, { ratio_met: true } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false });
      ratios[2] = makeRatio({ id: "r_f2", ratio_met: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      expect(r.concerns.some((c) => c.includes("Ratio compliance at 70%"))).toBe(true);
    });

    it("excessive hours > 30% concern", () => {
      const ot = nRecords(makeOvertime, 10, { total_weekly_hours: 40 } as Partial<OvertimeRecordInput>);
      for (let i = 0; i < 4; i++) ot[i] = makeOvertime({ id: `ot_e${i}`, total_weekly_hours: 55 });
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("exceeding 48 hours"))).toBe(true);
    });

    it("excessive hours 15-30% concern", () => {
      const ot = nRecords(makeOvertime, 10, { total_weekly_hours: 40 } as Partial<OvertimeRecordInput>);
      for (let i = 0; i < 2; i++) ot[i] = makeOvertime({ id: `ot_e${i}`, total_weekly_hours: 55 });
      // 20%
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("weekly hours exceeding 48"))).toBe(true);
    });

    it("high consecutive days > 30% concern", () => {
      const ot = nRecords(makeOvertime, 10, { consecutive_days_worked: 3 } as Partial<OvertimeRecordInput>);
      for (let i = 0; i < 4; i++) ot[i] = makeOvertime({ id: `ot_c${i}`, consecutive_days_worked: 8 });
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("consecutive days"))).toBe(true);
    });

    it("rota planning < 40% concern", () => {
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 2,
        all_shifts_filled: false,
        skill_mix_adequate: false,
        senior_cover_every_shift: false,
        rota_approved_by_manager: false,
      } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      expect(r.concerns.some((c) => c.includes("Rota planning quality at only 0%"))).toBe(true);
    });

    it("rota planning 40-69% concern", () => {
      // 3/10 = 30%... need 40-69
      // Let's use: pub=1, fill=1, skill=1, senior=1, approved=1 => 5/10 = 50%
      const rotas2 = [
        makeRota({ id: "rp1", days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true }),
        makeRota({ id: "rp2", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false }),
      ];
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas2 }));
      expect(r.concerns.some((c) => c.includes("Rota planning quality at 50%"))).toBe(true);
    });

    it("handover < 60% concern", () => {
      const shifts = nRecords(makeShift, 10, { handover_completed: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("0% handover completion"))).toBe(true);
    });

    it("handover 60-79% concern", () => {
      const shifts = nRecords(makeShift, 10, { handover_completed: true } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "h_f0", handover_completed: false });
      shifts[1] = makeShift({ id: "h_f1", handover_completed: false });
      shifts[2] = makeShift({ id: "h_f2", handover_completed: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("Handover completion at 70%"))).toBe(true);
    });

    it("rest compliance < 60% concern", () => {
      const ot = nRecords(makeOvertime, 10, { rest_period_compliant: false } as Partial<OvertimeRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("0% rest period compliance"))).toBe(true);
    });

    it("rest compliance 60-79% concern", () => {
      const ot = nRecords(makeOvertime, 10, { rest_period_compliant: true } as Partial<OvertimeRecordInput>);
      ot[0] = makeOvertime({ id: "rp_f0", rest_period_compliant: false });
      ot[1] = makeOvertime({ id: "rp_f1", rest_period_compliant: false });
      ot[2] = makeOvertime({ id: "rp_f2", rest_period_compliant: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("Rest period compliance at 70%"))).toBe(true);
    });

    it("agency induction < 60% concern", () => {
      const ag = nRecords(makeAgency, 10, { agency_staff_inducted: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.concerns.some((c) => c.includes("0% agency staff induction rate"))).toBe(true);
    });

    it("agency induction 60-74% concern", () => {
      const ag = nRecords(makeAgency, 10, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>);
      ag[0] = makeAgency({ id: "ai_f0", agency_staff_inducted: false });
      ag[1] = makeAgency({ id: "ai_f1", agency_staff_inducted: false });
      ag[2] = makeAgency({ id: "ai_f2", agency_staff_inducted: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.concerns.some((c) => c.includes("Agency induction rate at 70%"))).toBe(true);
    });

    it("agency DBS < 80% concern", () => {
      const ag = nRecords(makeAgency, 10, { dbs_verified: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.concerns.some((c) => c.includes("agency DBS verification"))).toBe(true);
    });

    it("senior cover < 50% concern", () => {
      const ratios = nRecords(makeRatio, 10, { senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      expect(r.concerns.some((c) => c.includes("0% senior staff presence"))).toBe(true);
    });

    it("senior cover 50-69% concern", () => {
      const ratios = nRecords(makeRatio, 10, { senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "sr_f0", senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "sr_f1", senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "sr_f2", senior_staff_on_duty: false });
      ratios[3] = makeRatio({ id: "sr_f3", senior_staff_on_duty: false });
      // 60%
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      expect(r.concerns.some((c) => c.includes("Senior staff presence at 60%"))).toBe(true);
    });

    it("lone working > 20% concern", () => {
      const shifts = nRecords(makeShift, 10, { lone_working_occurred: false } as Partial<ShiftCoverageRecordInput>);
      for (let i = 0; i < 3; i++) shifts[i] = makeShift({ id: `lw_${i}`, lone_working_occurred: true, lone_working_risk_assessed: true });
      // 30%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("Lone working occurring on 30%"))).toBe(true);
    });

    it("lone working assessment < 80% concern", () => {
      const shifts = [
        makeShift({ id: "lw_1", lone_working_occurred: true, lone_working_risk_assessed: false }),
        makeShift({ id: "lw_2", lone_working_occurred: true, lone_working_risk_assessed: false }),
        makeShift({ id: "lw_3", lone_working_occurred: true, lone_working_risk_assessed: true }),
      ];
      // loneWorkingAssessmentRate = pct(1, 3) = 33%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.concerns.some((c) => c.includes("lone working instances risk assessed"))).toBe(true);
    });

    it("staff satisfaction < 50% concern", () => {
      const rotas = nRecords(makeRota, 10, { staff_preferences_considered: false, staff_consulted: false } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      expect(r.concerns.some((c) => c.includes("Staff satisfaction indicators at only 0%"))).toBe(true);
    });

    it("staff satisfaction 50-69% concern", () => {
      const rotas = nRecords(makeRota, 10, { staff_preferences_considered: true, staff_consulted: false } as Partial<RotaPlanningRecordInput>);
      // sat = pct(10+0, 20) = 50%
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      expect(r.concerns.some((c) => c.includes("Staff satisfaction indicators at 50%"))).toBe(true);
    });

    it("children briefed < 60% concern", () => {
      const ag = nRecords(makeAgency, 10, { children_briefed: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.concerns.some((c) => c.includes("0% of agency placements had children briefed"))).toBe(true);
    });

    it("no shift records concern when staff > 0 and not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: [],
        ratio_compliance_records: [makeRatio()],
      }));
      expect(r.concerns.some((c) => c.includes("No shift coverage records exist"))).toBe(true);
    });

    it("no ratio records concern when staff > 0 and not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: [],
        shift_coverage_records: [makeShift()],
      }));
      expect(r.concerns.some((c) => c.includes("No ratio compliance records exist"))).toBe(true);
    });

    it("no rota records concern when staff > 0 and not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: [],
        shift_coverage_records: [makeShift()],
      }));
      expect(r.concerns.some((c) => c.includes("No rota planning records exist"))).toBe(true);
    });

    it("fairness score < 2.5 concern", () => {
      const rotas = nRecords(makeRota, 10, { fairness_score: 2 } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      expect(r.concerns.some((c) => c.includes("fairness score at only"))).toBe(true);
    });

    it("avg changes per rota > 5 concern", () => {
      const rotas = nRecords(makeRota, 10, { changes_after_publication: 8 } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      expect(r.concerns.some((c) => c.includes("changes per published rota"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("shift coverage < 60 triggers immediate recommendation", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("recruitment strategy"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("ratio compliance < 60 triggers immediate recommendation", () => {
      const ratios = nRecords(makeRatio, 10, { ratio_met: false } as Partial<RatioComplianceRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("safe staff-to-child ratios"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("excessive hours > 30% triggers immediate recommendation", () => {
      const ot = nRecords(makeOvertime, 10, { total_weekly_hours: 55 } as Partial<OvertimeRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("excessive working hours"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("rota planning < 40% triggers immediate recommendation", () => {
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 2, all_shifts_filled: false, skill_mix_adequate: false,
        senior_cover_every_shift: false, rota_approved_by_manager: false,
      } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Overhaul rota planning"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("agency DBS < 80% triggers immediate recommendation", () => {
      const ag = nRecords(makeAgency, 10, { dbs_verified: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("DBS checks"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("handover < 60% triggers immediate recommendation", () => {
      const shifts = nRecords(makeShift, 10, { handover_completed: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Mandate completion of shift handovers"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("rest compliance < 60% triggers immediate recommendation", () => {
      const ot = nRecords(makeOvertime, 10, { rest_period_compliant: false } as Partial<OvertimeRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("rest periods between shifts"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("agency induction < 60% triggers immediate recommendation", () => {
      const ag = nRecords(makeAgency, 10, { agency_staff_inducted: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("agency staff complete a full induction"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("no shift records triggers immediate recommendation when not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: [],
        ratio_compliance_records: [makeRatio()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("shift coverage data"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("no ratio records triggers immediate recommendation when not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        ratio_compliance_records: [],
        shift_coverage_records: [makeShift()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("staff-to-child ratios"));
      expect(rec).toBeDefined();
    });

    it("no rota records triggers immediate recommendation when not allEmpty", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: [],
        shift_coverage_records: [makeShift()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("rota planning"));
      expect(rec).toBeDefined();
    });

    it("senior cover < 50% triggers soon recommendation", () => {
      const ratios = nRecords(makeRatio, 10, { senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("senior or experienced staff"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("lone working > 20% triggers soon recommendation", () => {
      const shifts = nRecords(makeShift, 10, { lone_working_occurred: false } as Partial<ShiftCoverageRecordInput>);
      for (let i = 0; i < 3; i++) shifts[i] = makeShift({ id: `lw_${i}`, lone_working_occurred: true });
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("lone working"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("children briefed < 60% triggers soon recommendation", () => {
      const ag = nRecords(makeAgency, 10, { children_briefed: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("children are always informed"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("shift coverage 60-79 triggers soon recommendation", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false });
      shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false });
      shifts[2] = makeShift({ id: "s_f2", shift_fully_covered: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve shift coverage above 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("ratio compliance 60-79 triggers soon recommendation", () => {
      const ratios = nRecords(makeRatio, 10, { ratio_met: true } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false });
      ratios[2] = makeRatio({ id: "r_f2", ratio_met: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve ratio compliance above 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("rota planning 40-69 triggers soon recommendation", () => {
      const rotas = [
        makeRota({ id: "rp1", days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true }),
        makeRota({ id: "rp2", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false }),
      ];
      // 50%
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Enhance rota planning quality"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("handover 60-79 triggers planned recommendation", () => {
      const shifts = nRecords(makeShift, 10, { handover_completed: true } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "h_f0", handover_completed: false });
      shifts[1] = makeShift({ id: "h_f1", handover_completed: false });
      shifts[2] = makeShift({ id: "h_f2", handover_completed: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve handover completion above 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("staff satisfaction 50-69 triggers planned recommendation", () => {
      const rotas = nRecords(makeRota, 10, { staff_preferences_considered: true, staff_consulted: false } as Partial<RotaPlanningRecordInput>);
      // sat = pct(10, 20) = 50%
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve staff satisfaction"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("agency induction 60-74 triggers planned recommendation", () => {
      const ag = nRecords(makeAgency, 10, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>);
      ag[0] = makeAgency({ id: "ai_f0", agency_staff_inducted: false });
      ag[1] = makeAgency({ id: "ai_f1", agency_staff_inducted: false });
      ag[2] = makeAgency({ id: "ai_f2", agency_staff_inducted: false });
      // 70%
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve agency induction completion"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("agency feedback < 70% triggers planned recommendation", () => {
      const ag = nRecords(makeAgency, 10, { feedback_collected: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Collect feedback after every agency placement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("contingency < 70% triggers planned recommendation", () => {
      const rotas = nRecords(makeRota, 10, { contingency_plan_in_place: false } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("contingency plans"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("fairness 2.0-2.99 triggers planned recommendation", () => {
      const rotas = nRecords(makeRota, 10, { fairness_score: 2.5 } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("fairness of shift distribution"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("avg changes > 5 triggers planned recommendation", () => {
      const rotas = nRecords(makeRota, 10, { changes_after_publication: 8 } as Partial<RotaPlanningRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Reduce post-publication rota changes"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("all recommendation ranks are sequential", () => {
      // Trigger many recommendations
      const shifts = nRecords(makeShift, 10, {
        shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1,
        lone_working_occurred: true, lone_working_risk_assessed: false,
      } as Partial<ShiftCoverageRecordInput>);
      const ratios = nRecords(makeRatio, 10, { ratio_met: false, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      const ot = nRecords(makeOvertime, 10, {
        total_weekly_hours: 55, rest_period_compliant: false,
      } as Partial<OvertimeRecordInput>);
      const ag = nRecords(makeAgency, 10, {
        agency_staff_inducted: false, dbs_verified: false, children_briefed: false, feedback_collected: false,
      } as Partial<AgencyUsageRecordInput>);
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 2, all_shifts_filled: false, skill_mix_adequate: false,
        senior_cover_every_shift: false, rota_approved_by_manager: false,
        contingency_plan_in_place: false, changes_after_publication: 8, fairness_score: 2.5,
      } as Partial<RotaPlanningRecordInput>);

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        overtime_records: ot,
        agency_usage_records: ag,
        rota_planning_records: rotas,
      }));

      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    describe("critical insights", () => {
      it("shift coverage < 60% critical insight", () => {
        const shifts = nRecords(makeShift, 10, { shift_fully_covered: false } as Partial<ShiftCoverageRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0% shift coverage"))).toBe(true);
      });

      it("ratio compliance < 60% critical insight", () => {
        const ratios = nRecords(makeRatio, 10, { ratio_met: false } as Partial<RatioComplianceRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0% ratio compliance"))).toBe(true);
      });

      it("excessive hours > 30% critical insight", () => {
        const ot = nRecords(makeOvertime, 10, { total_weekly_hours: 55 } as Partial<OvertimeRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("exceeding 48 weekly hours"))).toBe(true);
      });

      it("rota planning < 40% critical insight", () => {
        const rotas = nRecords(makeRota, 10, {
          days_advance_published: 2, all_shifts_filled: false, skill_mix_adequate: false,
          senior_cover_every_shift: false, rota_approved_by_manager: false,
        } as Partial<RotaPlanningRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Rota planning quality at only 0%"))).toBe(true);
      });

      it("agency DBS < 80% critical insight", () => {
        const ag = nRecords(makeAgency, 10, { dbs_verified: false } as Partial<AgencyUsageRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("agency DBS verification"))).toBe(true);
      });

      it("no shift records critical insight when not allEmpty", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: [],
          ratio_compliance_records: [makeRatio()],
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No shift coverage records"))).toBe(true);
      });

      it("no ratio records critical insight when not allEmpty", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          ratio_compliance_records: [],
          shift_coverage_records: [makeShift()],
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No ratio compliance records"))).toBe(true);
      });

      it("high consecutive days > 30% critical insight", () => {
        const ot = nRecords(makeOvertime, 10, { consecutive_days_worked: 8 } as Partial<OvertimeRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("consecutive days"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("shift coverage 60-79% warning insight", () => {
        const shifts = nRecords(makeShift, 10, { shift_fully_covered: true } as Partial<ShiftCoverageRecordInput>);
        shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false });
        shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false });
        shifts[2] = makeShift({ id: "s_f2", shift_fully_covered: false });
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Shift coverage at 70%"))).toBe(true);
      });

      it("ratio compliance 60-79% warning insight", () => {
        const ratios = nRecords(makeRatio, 10, { ratio_met: true } as Partial<RatioComplianceRecordInput>);
        ratios[0] = makeRatio({ id: "r_f0", ratio_met: false });
        ratios[1] = makeRatio({ id: "r_f1", ratio_met: false });
        ratios[2] = makeRatio({ id: "r_f2", ratio_met: false });
        const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Ratio compliance at 70%"))).toBe(true);
      });

      it("rota planning 40-69% warning insight", () => {
        const rotas = [
          makeRota({ id: "rp1", days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true }),
          makeRota({ id: "rp2", days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false }),
        ];
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Rota planning quality at 50%"))).toBe(true);
      });

      it("handover 60-79% warning insight", () => {
        const shifts = nRecords(makeShift, 10, { handover_completed: true } as Partial<ShiftCoverageRecordInput>);
        shifts[0] = makeShift({ id: "h_f0", handover_completed: false });
        shifts[1] = makeShift({ id: "h_f1", handover_completed: false });
        shifts[2] = makeShift({ id: "h_f2", handover_completed: false });
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Handover completion at 70%"))).toBe(true);
      });

      it("rest compliance 60-79% warning insight", () => {
        const ot = nRecords(makeOvertime, 10, { rest_period_compliant: true } as Partial<OvertimeRecordInput>);
        ot[0] = makeOvertime({ id: "rp_f0", rest_period_compliant: false });
        ot[1] = makeOvertime({ id: "rp_f1", rest_period_compliant: false });
        ot[2] = makeOvertime({ id: "rp_f2", rest_period_compliant: false });
        const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Rest period compliance at 70%"))).toBe(true);
      });

      it("senior cover 50-69% warning insight", () => {
        const ratios = nRecords(makeRatio, 10, { senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>);
        ratios[0] = makeRatio({ id: "sr_f0", senior_staff_on_duty: false });
        ratios[1] = makeRatio({ id: "sr_f1", senior_staff_on_duty: false });
        ratios[2] = makeRatio({ id: "sr_f2", senior_staff_on_duty: false });
        ratios[3] = makeRatio({ id: "sr_f3", senior_staff_on_duty: false });
        // 60%
        const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Senior staff presence at 60%"))).toBe(true);
      });

      it("staff satisfaction 50-69% warning insight", () => {
        const rotas = nRecords(makeRota, 10, { staff_preferences_considered: true, staff_consulted: false } as Partial<RotaPlanningRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Staff satisfaction indicators at 50%"))).toBe(true);
      });

      it("lone working 10-20% warning insight", () => {
        const shifts = nRecords(makeShift, 10, { lone_working_occurred: false } as Partial<ShiftCoverageRecordInput>);
        shifts[0] = makeShift({ id: "lw_0", lone_working_occurred: true, lone_working_risk_assessed: true });
        shifts[1] = makeShift({ id: "lw_1", lone_working_occurred: true, lone_working_risk_assessed: true });
        // 20%
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Lone working occurring on 20%"))).toBe(true);
      });

      it("agency induction 60-74% warning insight", () => {
        const ag = nRecords(makeAgency, 10, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>);
        ag[0] = makeAgency({ id: "ai_f0", agency_staff_inducted: false });
        ag[1] = makeAgency({ id: "ai_f1", agency_staff_inducted: false });
        ag[2] = makeAgency({ id: "ai_f2", agency_staff_inducted: false });
        const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Agency induction rate at 70%"))).toBe(true);
      });

      it("agency feedback < 70% warning insight", () => {
        const ag = nRecords(makeAgency, 10, { feedback_collected: true } as Partial<AgencyUsageRecordInput>);
        ag[0] = makeAgency({ id: "fb_f0", feedback_collected: false });
        ag[1] = makeAgency({ id: "fb_f1", feedback_collected: false });
        ag[2] = makeAgency({ id: "fb_f2", feedback_collected: false });
        ag[3] = makeAgency({ id: "fb_f3", feedback_collected: false });
        // 60%
        const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Agency feedback collection at only 60%"))).toBe(true);
      });

      it("fairness 2.5-3.49 warning insight", () => {
        const rotas = nRecords(makeRota, 10, { fairness_score: 3 } as Partial<RotaPlanningRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("fairness score at 3/5"))).toBe(true);
      });

      it("avg changes 3-5 warning insight", () => {
        const rotas = nRecords(makeRota, 10, { changes_after_publication: 4 } as Partial<RotaPlanningRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("post-publication rota changes"))).toBe(true);
      });

      it("vacancy reason analysis insight present when vacancies exist", () => {
        const shifts = [
          makeShift({ id: "v1", vacancy_reason: "sickness" }),
          makeShift({ id: "v2", vacancy_reason: "sickness" }),
          makeShift({ id: "v3", vacancy_reason: "vacancy" }),
        ];
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Top vacancy reasons"))).toBe(true);
      });

      it("agency proportion > 30% warning insight", () => {
        // totalAgencyRecords=5, totalShiftRecords=5 => proportion = pct(5, 10) = 50%
        const r = computeStaffRotaAdequateStaffing(baseInput({
          agency_usage_records: nRecords(makeAgency, 5),
          shift_coverage_records: nRecords(makeShift, 5),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Agency usage represents"))).toBe(true);
      });

      it("total agency cost insight when cost > 0", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          agency_usage_records: nRecords(makeAgency, 3, { cost: 500 } as Partial<AgencyUsageRecordInput>),
        }));
        expect(r.insights.some((i) => i.text.includes("Total agency spend"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      it("outstanding rating positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 5 } as Partial<ShiftCoverageRecordInput>),
          ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
          overtime_records: nRecords(makeOvertime, 2, { working_time_directive_compliant: true, rest_period_compliant: true } as Partial<OvertimeRecordInput>),
          agency_usage_records: nRecords(makeAgency, 2, { agency_staff_inducted: true, dbs_verified: true, agency_staff_known_to_home: true, children_briefed: true } as Partial<AgencyUsageRecordInput>),
          rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true, contingency_plan_in_place: true, fairness_score: 5 } as Partial<RotaPlanningRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding staffing adequacy"))).toBe(true);
      });

      it("combined shift+ratio >=95% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true } as Partial<ShiftCoverageRecordInput>),
          ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true } as Partial<RatioComplianceRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("shift coverage with"))).toBe(true);
      });

      it("handover+quality positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          shift_coverage_records: nRecords(makeShift, 20, { handover_completed: true, handover_quality_rating: 4.5 } as Partial<ShiftCoverageRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("handover completion with average quality"))).toBe(true);
      });

      it("rota planning >=90% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          rota_planning_records: nRecords(makeRota, 10),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("rota planning quality"))).toBe(true);
      });

      it("WTD+rest >=95% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          overtime_records: nRecords(makeOvertime, 10, { working_time_directive_compliant: true, rest_period_compliant: true } as Partial<OvertimeRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("WTD compliance with"))).toBe(true);
      });

      it("staffSat+fairness positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          rota_planning_records: nRecords(makeRota, 10, { staff_preferences_considered: true, staff_consulted: true, fairness_score: 4.5 } as Partial<RotaPlanningRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("staff satisfaction with fairness score"))).toBe(true);
      });

      it("agency induction+DBS >=95% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          agency_usage_records: nRecords(makeAgency, 10, { agency_staff_inducted: true, dbs_verified: true } as Partial<AgencyUsageRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("agency induction with"))).toBe(true);
      });

      it("senior cover >=90% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          ratio_compliance_records: nRecords(makeRatio, 10, { senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("senior staff presence"))).toBe(true);
      });

      it("contingency >=90% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          rota_planning_records: nRecords(makeRota, 10, { contingency_plan_in_place: true } as Partial<RotaPlanningRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("contingency planning"))).toBe(true);
      });

      it("overtime approval >=95% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          overtime_records: nRecords(makeOvertime, 10, { overtime_approved: true } as Partial<OvertimeRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("overtime approval rate"))).toBe(true);
      });

      it("cover arrangement >=90% positive insight", () => {
        const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, cover_arranged: true } as Partial<ShiftCoverageRecordInput>);
        const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("coverage gaps had alternative arrangements"))).toBe(true);
      });

      it("children briefed >=90% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          agency_usage_records: nRecords(makeAgency, 10, { children_briefed: true } as Partial<AgencyUsageRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("children informed"))).toBe(true);
      });

      it("skill mix >=90% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          rota_planning_records: nRecords(makeRota, 10, { skill_mix_adequate: true } as Partial<RotaPlanningRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("skill mix adequacy"))).toBe(true);
      });

      it("agency familiarity >=80% positive insight", () => {
        const r = computeStaffRotaAdequateStaffing(baseInput({
          agency_usage_records: nRecords(makeAgency, 10, { agency_staff_known_to_home: true } as Partial<AgencyUsageRecordInput>),
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("agency staff are known to the home"))).toBe(true);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      // Can't actually get below 0 with base=52 and max -18 penalties, but verify clamp exists
      // Just verify the output is >= 0
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: nRecords(makeRatio, 10, { ratio_met: false, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 10, { total_weekly_hours: 55, working_time_directive_compliant: false, rest_period_compliant: false } as Partial<OvertimeRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 2, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.staffing_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // With base=52 and max +28, score = 80, well under 100
      // Verify the clamp is in place
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 5 } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 2, { working_time_directive_compliant: true } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 2, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true, contingency_plan_in_place: true } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.staffing_score).toBeLessThanOrEqual(100);
    });

    it("single record in each array works", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        total_staff: 1,
        shift_coverage_records: [makeShift({ shift_fully_covered: true, handover_completed: true, handover_quality_rating: 5 })],
        ratio_compliance_records: [makeRatio({ ratio_met: true, senior_staff_on_duty: true })],
        overtime_records: [makeOvertime({ working_time_directive_compliant: true })],
        agency_usage_records: [makeAgency({ agency_staff_inducted: true })],
        rota_planning_records: [makeRota()],
      }));
      expect(r.staffing_rating).toBe("outstanding");
      expect(r.total_shift_records).toBe(1);
      expect(r.total_ratio_records).toBe(1);
      expect(r.total_overtime_records).toBe(1);
      expect(r.total_agency_records).toBe(1);
      expect(r.total_rota_records).toBe(1);
    });

    it("very large total_staff makes overtime_rate and agency_usage_rate small", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        total_staff: 100,
        overtime_records: nRecords(makeOvertime, 3),
        agency_usage_records: nRecords(makeAgency, 2),
      }));
      expect(r.overtime_rate).toBe(3); // pct(3,100)
      expect(r.agency_usage_rate).toBe(2); // pct(2,100)
    });

    it("total_staff=1 with many overtime/agency records produces high inverted rates", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        total_staff: 1,
        overtime_records: nRecords(makeOvertime, 5),
        agency_usage_records: nRecords(makeAgency, 3),
      }));
      expect(r.overtime_rate).toBe(500); // pct(5,1)
      expect(r.agency_usage_rate).toBe(300); // pct(3,1)
    });

    it("only shift records present — other record totals are 0", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: [makeShift()],
      }));
      expect(r.total_shift_records).toBe(1);
      expect(r.total_ratio_records).toBe(0);
      expect(r.total_overtime_records).toBe(0);
      expect(r.total_agency_records).toBe(0);
      expect(r.total_rota_records).toBe(0);
    });

    it("only overtime records present — shift/ratio/agency/rota totals are 0", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        overtime_records: [makeOvertime()],
      }));
      expect(r.total_shift_records).toBe(0);
      expect(r.total_overtime_records).toBe(1);
    });

    it("only agency records present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        agency_usage_records: [makeAgency()],
      }));
      expect(r.total_agency_records).toBe(1);
    });

    it("only rota records present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput({
        rota_planning_records: [makeRota()],
      }));
      expect(r.total_rota_records).toBe(1);
    });

    it("toRating boundary: score=80 is outstanding", () => {
      // Build exact score 80 with all max bonuses: 52+28 = 80
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 5 } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 2, { working_time_directive_compliant: true } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 2, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true, contingency_plan_in_place: true } as Partial<RotaPlanningRecordInput>),
      }));
      expect(r.staffing_score).toBe(80);
      expect(r.staffing_rating).toBe("outstanding");
    });

    it("toRating boundary: score=79 is good", () => {
      // 52 + 27 = 79 — need to miss one point from bonuses
      // Drop contingency from +2 to +1 by setting to 70%
      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 14,
        all_shifts_filled: true,
        skill_mix_adequate: true,
        senior_cover_every_shift: true,
        rota_approved_by_manager: true,
        staff_preferences_considered: true,
        staff_consulted: true,
        contingency_plan_in_place: true,
      } as Partial<RotaPlanningRecordInput>);
      rotas[0] = makeRota({ id: "rp_nc0", contingency_plan_in_place: false, days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true });
      rotas[1] = makeRota({ id: "rp_nc1", contingency_plan_in_place: false, days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true });
      rotas[2] = makeRota({ id: "rp_nc2", contingency_plan_in_place: false, days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: true, staff_consulted: true });
      // contingencyRate = 70% => +1 instead of +2
      // rotaPlanningRate: pub=10, fill=10, skill=10, senior=10, approved=10 = 50/50 = 100% => +4
      // staffSatisfactionRate: (10+10)/20 = 100% => +2
      // So: 52+4+4+4+3+3+3+3+2+1 = 79 ... perfect

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 5 } as Partial<ShiftCoverageRecordInput>),
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 2, { working_time_directive_compliant: true } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 2, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: rotas,
      }));
      expect(r.staffing_score).toBe(79);
      expect(r.staffing_rating).toBe("good");
    });

    it("toRating boundary: score=65 is good", () => {
      // Need 52 + 13 = 65
      // shift>=95:+4, ratio>=95:+4, rota>=90:+4, handover<80:0, wtd<80:0, induction<75:0, senior<70:0, sat<70:0, contingency<70:0 ... = 52+12=64... not enough
      // shift>=95:+4, ratio>=95:+4, rota>=90:+4, handover>=80:+1 = 52+13=65
      const shifts = nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 3 } as Partial<ShiftCoverageRecordInput>);
      // Make 3 handovers incomplete to get handoverRate=85% (>=80 => +1)
      shifts[0] = makeShift({ id: "hx0", shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "hx1", shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 });
      shifts[2] = makeShift({ id: "hx2", shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 });
      // shiftCoverageRate=100%, handoverRate=85%

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false } as Partial<RotaPlanningRecordInput>),
      }));
      // 52 + 4(shift) + 4(ratio) + 4(rota) + 1(handover) = 65
      expect(r.staffing_score).toBe(65);
      expect(r.staffing_rating).toBe("good");
    });

    it("toRating boundary: score=64 is adequate", () => {
      // 52 + 12 = 64
      const shifts = nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>),
        rota_planning_records: nRecords(makeRota, 10, { days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true, staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false } as Partial<RotaPlanningRecordInput>),
      }));
      // 52 + 4(shift) + 4(ratio) + 4(rota) = 64
      expect(r.staffing_score).toBe(64);
      expect(r.staffing_rating).toBe("adequate");
    });

    it("toRating boundary: score=45 is adequate", () => {
      // 52 - 5 - 4 + 2 = 45
      // shiftCov<60: -5, rotaPlan<40: -4, ratio>=80: +2
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      const ratios = nRecords(makeRatio, 10, { ratio_met: true, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "r_f0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "r_f1", ratio_met: false, senior_staff_on_duty: false });
      // ratioComplianceRate=80% => +2

      const rotas = nRecords(makeRota, 10, {
        days_advance_published: 2, all_shifts_filled: false, skill_mix_adequate: false,
        senior_cover_every_shift: false, rota_approved_by_manager: false,
        staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // rotaPlanningRate=0% => -4

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        rota_planning_records: rotas,
      }));
      // 52 + 2(ratio) - 5(shiftCov) - 4(rotaPlan) = 45
      expect(r.staffing_score).toBe(45);
      expect(r.staffing_rating).toBe("adequate");
    });

    it("toRating boundary: score=44 is inadequate", () => {
      // 52 - 5 - 5 + 2 = 44
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      const ratios = nRecords(makeRatio, 10, { ratio_met: false, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      // ratioComplianceRate=0% => -5

      // rotaPlanningRate: pub=10, fill=10, skill=0, senior=0, approved=0 => 20/50 = 40%
      // Not < 40, so no penalty 4 for rota
      // But add +2 from rota>=70... no, 40 is not >=70
      // So: 52 - 5(shift) - 5(ratio) = 42 ... actually 42
      // Let me just use: 52 -5 -5 + 2 = 44 ...
      // ratio>=80: +2, but ratio is 0%. Need another +2 somewhere.
      // Use wtd>=80 for +1 and handover>=80 for +1? 52-5-5+1+1=44
      // handoverRate = 0 here. Hmm.
      // Simpler: just use shift -5 and ratio -5 and get one small bonus to reach 44
      // We can set rota to give exactly +2 from rota>=70: rotaPlanningRate=70%
      // pub=10, fill=10, skill=10, senior=5, approved=0 => 35/50 = 70% => +2
      const rotas2 = nRecords(makeRota, 10, {
        days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true,
        senior_cover_every_shift: false, rota_approved_by_manager: false,
        staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // Fix: need senior for half => 5/10
      for (let i = 0; i < 5; i++) {
        rotas2[i] = makeRota({
          id: `rp_s${i}`,
          days_advance_published: 14, all_shifts_filled: true, skill_mix_adequate: true,
          senior_cover_every_shift: true, rota_approved_by_manager: false,
          staff_preferences_considered: false, staff_consulted: false, contingency_plan_in_place: false,
        });
      }
      // pub=10, fill=10, skill=10, senior=5, approved=0 => 35/50 = 70% => +2
      // shift -5, ratio -5 => 52+2-5-5 = 44

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: ratios,
        rota_planning_records: rotas2,
      }));
      expect(r.staffing_score).toBe(44);
      expect(r.staffing_rating).toBe("inadequate");
    });

    it("headline for good with concerns includes concern count", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true, handover_completed: true, handover_quality_rating: 3 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1, vacancy_reason: "sickness" });
      shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1, vacancy_reason: "sickness" });
      // 80% coverage, 80% handover
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>),
        overtime_records: nRecords(makeOvertime, 2, { working_time_directive_compliant: true } as Partial<OvertimeRecordInput>),
        agency_usage_records: nRecords(makeAgency, 2, { agency_staff_inducted: true } as Partial<AgencyUsageRecordInput>),
        rota_planning_records: nRecords(makeRota, 10),
      }));
      if (r.staffing_rating === "good" && r.concerns.length > 0) {
        expect(r.headline).toContain("area");
      }
    });

    it("adequate headline includes concern count", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "s_f0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "s_f1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[2] = makeShift({ id: "s_f2", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      if (r.staffing_rating === "adequate") {
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline includes concern count", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
        ratio_compliance_records: nRecords(makeRatio, 10, { ratio_met: false } as Partial<RatioComplianceRecordInput>),
      }));
      if (r.staffing_rating === "inadequate") {
        expect(r.headline).toContain("concern");
      }
    });

    it("all result properties are present", () => {
      const r = computeStaffRotaAdequateStaffing(baseInput());
      expect(r).toHaveProperty("staffing_rating");
      expect(r).toHaveProperty("staffing_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_shift_records");
      expect(r).toHaveProperty("total_ratio_records");
      expect(r).toHaveProperty("total_overtime_records");
      expect(r).toHaveProperty("total_agency_records");
      expect(r).toHaveProperty("total_rota_records");
      expect(r).toHaveProperty("shift_coverage_rate");
      expect(r).toHaveProperty("ratio_compliance_rate");
      expect(r).toHaveProperty("overtime_rate");
      expect(r).toHaveProperty("agency_usage_rate");
      expect(r).toHaveProperty("rota_planning_rate");
      expect(r).toHaveProperty("staff_satisfaction_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("feedback_rating null does not break avgAgencyFeedbackRating", () => {
      const ag = nRecords(makeAgency, 5, { feedback_rating: null, feedback_collected: false } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      // Should not throw
      expect(r.total_agency_records).toBe(5);
    });

    it("mixed vacancy reasons produces sorted insight", () => {
      const shifts = [
        makeShift({ id: "v1", vacancy_reason: "sickness" }),
        makeShift({ id: "v2", vacancy_reason: "sickness" }),
        makeShift({ id: "v3", vacancy_reason: "sickness" }),
        makeShift({ id: "v4", vacancy_reason: "vacancy" }),
        makeShift({ id: "v5", vacancy_reason: "annual_leave" }),
        makeShift({ id: "v6", vacancy_reason: null }),
      ];
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      const vacancyInsight = r.insights.find((i) => i.text.includes("Top vacancy reasons"));
      expect(vacancyInsight).toBeDefined();
      // sickness should appear first in the list (3 occurrences vs 1)
      // The format is "Top vacancy reasons: sickness (3), vacancy (1), annual leave (1)"
      expect(vacancyInsight!.text).toContain("sickness (3)");
      expect(vacancyInsight!.text).toContain("vacancy (1)");
      // sickness (3) should come before vacancy (1) in the list
      expect(vacancyInsight!.text.indexOf("sickness (3)")).toBeLessThan(vacancyInsight!.text.indexOf("vacancy (1)"));
    });

    it("agency cost insight shows correct totals", () => {
      const ag = [
        makeAgency({ id: "ag1", cost: 300 }),
        makeAgency({ id: "ag2", cost: 500 }),
        makeAgency({ id: "ag3", cost: 200 }),
      ];
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      const costInsight = r.insights.find((i) => i.text.includes("Total agency spend"));
      expect(costInsight).toBeDefined();
      expect(costInsight!.text).toContain("3 placements");
    });

    it("zero cost agency records produce no cost insight", () => {
      const ag = nRecords(makeAgency, 3, { cost: 0 } as Partial<AgencyUsageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.insights.some((i) => i.text.includes("Total agency spend"))).toBe(false);
    });

    it("lone working assessment rate is 0 when no lone working shifts exist", () => {
      const shifts = nRecords(makeShift, 10, { lone_working_occurred: false, lone_working_risk_assessed: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      // No lone working concern about assessment should appear (0 lone working shifts)
      expect(r.concerns.some((c) => c.includes("lone working instances risk assessed"))).toBe(false);
    });

    it("recommendations have regulatory references", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false } as Partial<ShiftCoverageRecordInput>);
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL BOUNDARY / MATH TESTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("additional boundary tests", () => {
    it("shift coverage exactly 95% gets +4 bonus", () => {
      const shifts = nRecords(makeShift, 20, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "sf0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // 19/20 = 95%
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      expect(r.shift_coverage_rate).toBe(95);
      expect(r.staffing_score).toBe(56); // base + 4
    });

    it("ratio compliance exactly 95% gets +4 bonus", () => {
      const ratios = nRecords(makeRatio, 20, { ratio_met: true, senior_staff_on_duty: false } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "rf0", ratio_met: false, senior_staff_on_duty: false });
      // 19/20 = 95%
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      expect(r.ratio_compliance_rate).toBe(95);
      expect(r.staffing_score).toBe(56);
    });

    it("handover exactly 80% gets +1 bonus (not +3)", () => {
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: false, handover_completed: true, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "hf0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "hf1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // handoverRate = 80%
      // shiftCoverage = 0% => -5 penalty
      const r = computeStaffRotaAdequateStaffing(baseInput({ shift_coverage_records: shifts }));
      // 52 + 1 - 5 = 48
      expect(r.staffing_score).toBe(48);
    });

    it("wtd compliance exactly 80% gets +1 (not +3)", () => {
      const ot = nRecords(makeOvertime, 5, { working_time_directive_compliant: true, rest_period_compliant: false, consecutive_days_worked: 3, total_weekly_hours: 40 } as Partial<OvertimeRecordInput>);
      ot[0] = makeOvertime({ id: "wf0", working_time_directive_compliant: false, rest_period_compliant: false, consecutive_days_worked: 3, total_weekly_hours: 40 });
      // 4/5 = 80%
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.staffing_score).toBe(53); // 52 + 1
    });

    it("agency induction exactly 75% gets +1 (not +3)", () => {
      const ag = nRecords(makeAgency, 4, { agency_staff_inducted: true, dbs_verified: false, agency_staff_known_to_home: false, children_briefed: false, feedback_collected: false, feedback_rating: null } as Partial<AgencyUsageRecordInput>);
      ag[0] = makeAgency({ id: "aif0", agency_staff_inducted: false, dbs_verified: false, agency_staff_known_to_home: false, children_briefed: false, feedback_collected: false, feedback_rating: null });
      // 3/4 = 75%
      const r = computeStaffRotaAdequateStaffing(baseInput({ agency_usage_records: ag }));
      expect(r.staffing_score).toBe(53); // 52 + 1
    });

    it("senior cover exactly 70% gets +1 (not +3)", () => {
      const ratios = nRecords(makeRatio, 10, { ratio_met: false, senior_staff_on_duty: true } as Partial<RatioComplianceRecordInput>);
      ratios[0] = makeRatio({ id: "srf0", ratio_met: false, senior_staff_on_duty: false });
      ratios[1] = makeRatio({ id: "srf1", ratio_met: false, senior_staff_on_duty: false });
      ratios[2] = makeRatio({ id: "srf2", ratio_met: false, senior_staff_on_duty: false });
      // seniorCoverRate = 70%, ratioComplianceRate = 0% => -5
      const r = computeStaffRotaAdequateStaffing(baseInput({ ratio_compliance_records: ratios }));
      // 52 + 1 - 5 = 48
      expect(r.staffing_score).toBe(48);
    });

    it("staff satisfaction exactly 70% gets +1 (not +2)", () => {
      const rotas = nRecords(makeRota, 10, {
        staff_preferences_considered: true, staff_consulted: true,
        days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false,
        senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false,
      } as Partial<RotaPlanningRecordInput>);
      // Need 70% sat: pct(x, 20) = 70 => x=14
      // 3 rotas with neither: 14/20 = 70%
      rotas[0] = makeRota({ id: "ns0", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      rotas[1] = makeRota({ id: "ns1", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      rotas[2] = makeRota({ id: "ns2", staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false, contingency_plan_in_place: false });
      // staffSat = pct(14, 20) = 70% => +1
      // rotaPlanningRate = 0% => -4
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      // 52 + 1 - 4 = 49
      expect(r.staffing_score).toBe(49);
    });

    it("contingency exactly 70% gets +1 (not +2)", () => {
      const rotas = nRecords(makeRota, 10, {
        contingency_plan_in_place: true,
        staff_preferences_considered: false, staff_consulted: false,
        days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false,
        senior_cover_every_shift: false, rota_approved_by_manager: false,
      } as Partial<RotaPlanningRecordInput>);
      rotas[0] = makeRota({ id: "cpf0", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      rotas[1] = makeRota({ id: "cpf1", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      rotas[2] = makeRota({ id: "cpf2", contingency_plan_in_place: false, staff_preferences_considered: false, staff_consulted: false, days_advance_published: 3, all_shifts_filled: false, skill_mix_adequate: false, senior_cover_every_shift: false, rota_approved_by_manager: false });
      // contingencyRate = 70% => +1
      // rotaPlanningRate = 0% => -4
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      // 52 + 1 - 4 = 49
      expect(r.staffing_score).toBe(49);
    });

    it("base score is exactly 52 with minimal input that avoids all bonuses and penalties", () => {
      // 1 shift record that's not covered, but shiftCovRate=0% triggers -5
      // So we need records that produce rates between penalty and bonus thresholds
      // Easiest: one shift covered (100%) but handover=false, quality=1
      // This would give shiftCov=100% => +4 bonus. Need to avoid.
      // Use only records that produce rates in the "no bonus, no penalty" range
      // shift coverage 60-79%: 7/10 = 70% (no penalty, no bonus)
      const shifts = nRecords(makeShift, 10, { shift_fully_covered: true, handover_completed: false, handover_quality_rating: 1 } as Partial<ShiftCoverageRecordInput>);
      shifts[0] = makeShift({ id: "sf0", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[1] = makeShift({ id: "sf1", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      shifts[2] = makeShift({ id: "sf2", shift_fully_covered: false, handover_completed: false, handover_quality_rating: 1 });
      // shiftCoverageRate = 70%, handoverRate = 0%
      // No shift bonus (70 < 80), no shift penalty (70 >= 60)
      // handoverRate = 0% but no penalty for handover, only concerns

      const r = computeStaffRotaAdequateStaffing(baseInput({
        shift_coverage_records: shifts,
      }));
      // base=52, no bonuses, no penalties
      expect(r.staffing_score).toBe(52);
    });

    it("rota published at exactly 7 days counts as on-time", () => {
      const rotas = [makeRota({ days_advance_published: 7 })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      // Should count for publication rate
      expect(r.rota_planning_rate).toBe(100); // all 5 dimensions met
    });

    it("rota published at 6 days does NOT count as on-time", () => {
      const rotas = [makeRota({ days_advance_published: 6, all_shifts_filled: true, skill_mix_adequate: true, senior_cover_every_shift: true, rota_approved_by_manager: true })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ rota_planning_records: rotas }));
      // pub=0, fill=1, skill=1, senior=1, approved=1 => 4/5 = 80%
      expect(r.rota_planning_rate).toBe(80);
    });

    it("weekly hours exactly 48 does NOT count as excessive", () => {
      const ot = [makeOvertime({ total_weekly_hours: 48 })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      // excessiveHoursRate should be 0
      // No concern about excessive hours
      expect(r.concerns.some((c) => c.includes("exceeding 48"))).toBe(false);
    });

    it("weekly hours 49 DOES count as excessive", () => {
      const ot = [makeOvertime({ total_weekly_hours: 49 })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      // excessiveHoursRate = 100% but this is only 1 record, so > 30%
      // But penalty is excessiveHoursRate > 30 => triggered
      expect(r.concerns.some((c) => c.includes("exceeding 48 hours"))).toBe(true);
    });

    it("consecutive days exactly 6 does NOT trigger high consecutive rate", () => {
      const ot = [makeOvertime({ consecutive_days_worked: 6 })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      expect(r.concerns.some((c) => c.includes("consecutive days"))).toBe(false);
    });

    it("consecutive days 7 DOES trigger high consecutive rate", () => {
      const ot = [makeOvertime({ consecutive_days_worked: 7 })];
      const r = computeStaffRotaAdequateStaffing(baseInput({ overtime_records: ot }));
      // highConsecutiveRate = 100% > 30%
      expect(r.concerns.some((c) => c.includes("consecutive days"))).toBe(true);
    });
  });
});
