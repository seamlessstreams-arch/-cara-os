import { describe, it, expect } from "vitest";
import {
  computeInspectionReadiness,
  type InspectionReadinessInput,
  type DomainMetric,
} from "./inspection-readiness-intelligence-engine";

// A home that has been provisioned but has recorded nothing. This is the exact
// state a new tenant is in on day one, and the state the live Oak House tenant
// was in when the readiness surface reported a confident grade built from
// literals (safeguarding 85, behaviour 70, workforce 70, DBS/training/
// supervision 100 apiece).
function emptyHome(overrides: Partial<InspectionReadinessInput> = {}): InspectionReadinessInput {
  return {
    today: "2026-07-23",
    home_name: "Oak House",
    total_children: 0,
    total_staff: 0,
    domain_metrics: [],
    reg44_status: { last_visit_date: null, next_due_date: null, actions_outstanding: 0, visits_in_12_months: 0 },
    reg45_status: { last_report_date: null, next_due_date: null, report_submitted_on_time: true },
    notifiable_events: { pending_notifications: 0, overdue_notifications: 0, total_this_quarter: 0 },
    self_evaluation: { has_current_sef: false, last_updated: null, judgment_area_coverage: 0, action_completion_rate: 0 },
    complaints_summary: { open_complaints: 0, complaints_this_quarter: 0, average_resolution_days: 0, escalated_to_ofsted: 0 },
    staff_compliance: {
      dbs_compliance_rate: null,
      training_compliance_rate: null,
      supervision_compliance_rate: null,
      staff_with_overdue_dbs: 0,
      staff_with_overdue_training: 0,
      staff_with_overdue_supervision: 0,
    },
    children_plans: {
      children_with_current_care_plan: 0,
      children_with_current_risk_assessment: 0,
      children_with_overdue_lac_review: 0,
      children_with_health_assessment: 0,
      pep_completion_rate: null,
    },
    safeguarding_summary: {
      open_referrals: 0,
      lado_referrals_this_year: 0,
      return_interview_completion_rate: null,
      missing_episodes_this_quarter: 0,
      exploitation_screenings_current: 0,
    },
    ...overrides,
  };
}

function domain(partial: Partial<DomainMetric> & Pick<DomainMetric, "domain" | "compliance_rate">): DomainMetric {
  return {
    domain_label: partial.domain,
    critical_alerts: 0,
    high_alerts: 0,
    overdue_count: 0,
    evidence_count: 0,
    last_updated: null,
    ...partial,
  };
}

describe("computeInspectionReadiness — a home with no records", () => {
  const result = computeInspectionReadiness(emptyHome());

  it("reports no readiness score at all rather than inventing one", () => {
    expect(result.overall_readiness_score).toBeNull();
    expect(result.overall_grade).toBeNull();
  });

  it("scores every judgment area as unmeasured", () => {
    expect(result.judgment_areas).toHaveLength(3);
    for (const area of result.judgment_areas) {
      expect(area.score).toBeNull();
      expect(area.grade).toBeNull();
    }
  });

  it("says plainly that there is nothing to assess", () => {
    expect(result.headline).toMatch(/no records yet/i);
    // It must not reach for the failing-home wording either.
    expect(result.headline).not.toMatch(/inadequate|non-compliance/i);
  });

  it("claims no compliance anywhere in the matrix", () => {
    for (const item of result.compliance_matrix) {
      if (item.rate === null) expect(item.compliant).toBe(false);
    }
  });

  it("raises no fabricated DBS breach for staff who do not exist", () => {
    const dbsGap = result.regulatory_gaps.find((g) => g.gap_description.includes("DBS"));
    expect(dbsGap).toBeUndefined();
  });
});

describe("computeInspectionReadiness — partially evidenced home", () => {
  it("scores only the domains that hold records", () => {
    const result = computeInspectionReadiness(
      emptyHome({
        total_children: 2,
        // Every risk assessment in place, so the area-specific deductions stay
        // out of the way and the assertion isolates the averaging itself.
        children_plans: {
          children_with_current_care_plan: 2,
          children_with_current_risk_assessment: 2,
          children_with_overdue_lac_review: 0,
          children_with_health_assessment: 2,
          pep_completion_rate: 100,
        },
        domain_metrics: [
          domain({ domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 60, evidence_count: 4 }),
          domain({ domain: "medication", domain_label: "Medication Management", compliance_rate: null }),
        ],
      }),
    );

    const helped = result.judgment_areas.find((a) => a.area === "helped_and_protected");
    // 60 from the one measured domain — the unmeasured one neither drags it to
    // 30 nor lifts it to 80.
    expect(helped?.score).toBe(60);
    expect(result.overall_readiness_score).toBe(60);
  });

  it("names an unmeasured domain as an evidence gap", () => {
    const result = computeInspectionReadiness(
      emptyHome({
        domain_metrics: [
          domain({ domain: "medication", domain_label: "Medication Management", compliance_rate: null }),
        ],
      }),
    );

    expect(result.unmeasured_domains).toContain("Medication Management");
    const helped = result.judgment_areas.find((a) => a.area === "helped_and_protected");
    expect(helped?.gaps.some((g) => /Medication Management.*no records/i.test(g))).toBe(true);
    // And it must never be reported as a strength.
    expect(helped?.strengths ?? []).toHaveLength(0);
  });

  it("carries the unmeasured caveat into the headline of a scored home", () => {
    const result = computeInspectionReadiness(
      emptyHome({
        domain_metrics: [
          domain({ domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 95 }),
          domain({ domain: "workforce", domain_label: "Workforce & Staffing", compliance_rate: null }),
        ],
      }),
    );

    expect(result.overall_readiness_score).toBe(95);
    expect(result.headline).toMatch(/not yet evidenced: Workforce & Staffing/);
  });

  it("still raises a real DBS breach when staff records exist", () => {
    const result = computeInspectionReadiness(
      emptyHome({
        total_staff: 4,
        staff_compliance: {
          dbs_compliance_rate: 75,
          training_compliance_rate: null,
          supervision_compliance_rate: null,
          staff_with_overdue_dbs: 1,
          staff_with_overdue_training: 0,
          staff_with_overdue_supervision: 0,
        },
      }),
    );

    const dbsGap = result.regulatory_gaps.find((g) => g.gap_description.includes("DBS"));
    expect(dbsGap?.severity).toBe("critical");
  });
});
