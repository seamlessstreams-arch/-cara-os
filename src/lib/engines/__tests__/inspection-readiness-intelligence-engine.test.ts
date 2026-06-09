import { describe, it, expect } from "vitest";
import {
  computeInspectionReadiness,
  type InspectionReadinessInput,
} from "../inspection-readiness-intelligence-engine";

function baseInput(overrides: Partial<InspectionReadinessInput> = {}): InspectionReadinessInput {
  return {
    today: "2026-05-26",
    home_name: "Chamberlain House",
    total_children: 4,
    total_staff: 12,
    domain_metrics: [
      { domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 90, critical_alerts: 0, high_alerts: 0, overdue_count: 0, evidence_count: 15, last_updated: "2026-05-25" },
      { domain: "behaviour", domain_label: "Behaviour", compliance_rate: 88, critical_alerts: 0, high_alerts: 1, overdue_count: 0, evidence_count: 20, last_updated: "2026-05-25" },
      { domain: "education", domain_label: "Education", compliance_rate: 92, critical_alerts: 0, high_alerts: 0, overdue_count: 0, evidence_count: 18, last_updated: "2026-05-25" },
      { domain: "health", domain_label: "Health", compliance_rate: 85, critical_alerts: 0, high_alerts: 0, overdue_count: 1, evidence_count: 12, last_updated: "2026-05-24" },
      { domain: "workforce", domain_label: "Workforce", compliance_rate: 90, critical_alerts: 0, high_alerts: 0, overdue_count: 0, evidence_count: 30, last_updated: "2026-05-25" },
      { domain: "quality_assurance", domain_label: "Quality Assurance", compliance_rate: 88, critical_alerts: 0, high_alerts: 0, overdue_count: 0, evidence_count: 10, last_updated: "2026-05-20" },
    ],
    reg44_status: { last_visit_date: "2026-05-10", next_due_date: "2026-06-10", actions_outstanding: 1, visits_in_12_months: 11 },
    reg45_status: { last_report_date: "2026-03-15", next_due_date: "2026-09-15", report_submitted_on_time: true },
    notifiable_events: { pending_notifications: 0, overdue_notifications: 0, total_this_quarter: 2 },
    self_evaluation: { has_current_sef: true, last_updated: "2026-04-01", judgment_area_coverage: 3, action_completion_rate: 75 },
    complaints_summary: { open_complaints: 1, complaints_this_quarter: 2, average_resolution_days: 12, escalated_to_ofsted: 0 },
    staff_compliance: { dbs_compliance_rate: 100, training_compliance_rate: 92, supervision_compliance_rate: 88, staff_with_overdue_dbs: 0, staff_with_overdue_training: 1, staff_with_overdue_supervision: 1 },
    children_plans: { children_with_current_care_plan: 4, children_with_current_risk_assessment: 4, children_with_overdue_lac_review: 0, children_with_health_assessment: 4, pep_completion_rate: 100 },
    safeguarding_summary: { open_referrals: 0, lado_referrals_this_year: 0, return_interview_completion_rate: 100, missing_episodes_this_quarter: 1, exploitation_screenings_current: 4 },
    ...overrides,
  };
}

describe("Inspection Readiness Intelligence Engine", () => {
  it("produces good or outstanding grade for well-run home", () => {
    const result = computeInspectionReadiness(baseInput());
    expect(["good", "outstanding"]).toContain(result.overall_grade);
    expect(result.overall_readiness_score).toBeGreaterThanOrEqual(65);
    expect(result.home_name).toBe("Chamberlain House");
    expect(result.generated_at).toBe("2026-05-26");
    expect(result.judgment_areas).toHaveLength(3);
  });

  it("computes three SCCIF judgment areas", () => {
    const result = computeInspectionReadiness(baseInput());
    const areas = result.judgment_areas.map((j) => j.area);
    expect(areas).toContain("overall_experiences");
    expect(areas).toContain("helped_and_protected");
    expect(areas).toContain("leadership_and_management");
  });

  it("flags DBS non-compliance as critical gap", () => {
    const result = computeInspectionReadiness(baseInput({
      staff_compliance: { dbs_compliance_rate: 83, training_compliance_rate: 90, supervision_compliance_rate: 85, staff_with_overdue_dbs: 2, staff_with_overdue_training: 1, staff_with_overdue_supervision: 1 },
    }));
    const dbsGap = result.regulatory_gaps.find((g) => g.regulation === "Reg 32");
    expect(dbsGap).toBeDefined();
    expect(dbsGap?.severity).toBe("critical");
    const risk = result.key_risks.find((r) => r.risk.includes("DBS"));
    expect(risk).toBeDefined();
    expect(risk?.severity).toBe("critical");
  });

  it("flags missing care plans as critical gap", () => {
    const result = computeInspectionReadiness(baseInput({
      children_plans: { children_with_current_care_plan: 2, children_with_current_risk_assessment: 4, children_with_overdue_lac_review: 0, children_with_health_assessment: 4, pep_completion_rate: 100 },
    }));
    const gap = result.regulatory_gaps.find((g) => g.regulation === "Reg 9");
    expect(gap).toBeDefined();
    expect(gap?.gap_description).toContain("2");
  });

  it("flags overdue notifiable events as critical", () => {
    const result = computeInspectionReadiness(baseInput({
      notifiable_events: { pending_notifications: 1, overdue_notifications: 2, total_this_quarter: 3 },
    }));
    const gap = result.regulatory_gaps.find((g) => g.regulation === "Reg 40");
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe("critical");
  });

  it("flags missing SEF as significant gap", () => {
    const result = computeInspectionReadiness(baseInput({
      self_evaluation: { has_current_sef: false, last_updated: null, judgment_area_coverage: 0, action_completion_rate: 0 },
    }));
    const gap = result.regulatory_gaps.find((g) => g.regulation === "Reg 45");
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe("significant");
  });

  it("assesses evidence strength correctly", () => {
    const result = computeInspectionReadiness(baseInput());
    expect(result.evidence_strength.length).toBeGreaterThanOrEqual(7);
    const staffFiles = result.evidence_strength.find((e) => e.category === "staff_files");
    expect(staffFiles?.strength).toBe("strong");
    const carePlans = result.evidence_strength.find((e) => e.category === "care_plans");
    expect(carePlans?.strength).toBe("strong");
  });

  it("builds compliance matrix", () => {
    const result = computeInspectionReadiness(baseInput());
    expect(result.compliance_matrix.length).toBeGreaterThanOrEqual(7);
    const dbs = result.compliance_matrix.find((c) => c.area === "DBS Checks");
    expect(dbs?.compliant).toBe(true);
    expect(dbs?.rate).toBe(100);
  });

  it("generates positive insights for strong home", () => {
    const result = computeInspectionReadiness(baseInput({
      staff_compliance: { dbs_compliance_rate: 100, training_compliance_rate: 95, supervision_compliance_rate: 95, staff_with_overdue_dbs: 0, staff_with_overdue_training: 0, staff_with_overdue_supervision: 0 },
      self_evaluation: { has_current_sef: true, last_updated: "2026-05-01", judgment_area_coverage: 3, action_completion_rate: 90 },
    }));
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("produces requires_improvement or below for severely non-compliant home", () => {
    const result = computeInspectionReadiness(baseInput({
      domain_metrics: [
        { domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 50, critical_alerts: 3, high_alerts: 5, overdue_count: 4, evidence_count: 5, last_updated: "2026-05-10" },
        { domain: "behaviour", domain_label: "Behaviour", compliance_rate: 45, critical_alerts: 1, high_alerts: 3, overdue_count: 3, evidence_count: 8, last_updated: "2026-05-10" },
        { domain: "education", domain_label: "Education", compliance_rate: 55, critical_alerts: 0, high_alerts: 2, overdue_count: 2, evidence_count: 6, last_updated: "2026-05-10" },
        { domain: "workforce", domain_label: "Workforce", compliance_rate: 40, critical_alerts: 0, high_alerts: 1, overdue_count: 5, evidence_count: 4, last_updated: "2026-05-05" },
      ],
      staff_compliance: { dbs_compliance_rate: 70, training_compliance_rate: 50, supervision_compliance_rate: 40, staff_with_overdue_dbs: 4, staff_with_overdue_training: 6, staff_with_overdue_supervision: 7 },
      children_plans: { children_with_current_care_plan: 1, children_with_current_risk_assessment: 1, children_with_overdue_lac_review: 3, children_with_health_assessment: 2, pep_completion_rate: 50 },
      self_evaluation: { has_current_sef: false, last_updated: null, judgment_area_coverage: 0, action_completion_rate: 0 },
      notifiable_events: { pending_notifications: 2, overdue_notifications: 3, total_this_quarter: 5 },
      safeguarding_summary: { open_referrals: 2, lado_referrals_this_year: 1, return_interview_completion_rate: 50, missing_episodes_this_quarter: 8, exploitation_screenings_current: 1 },
    }));
    expect(["requires_improvement", "inadequate"]).toContain(result.overall_grade);
    expect(result.regulatory_gaps.length).toBeGreaterThan(5);
    expect(result.key_risks.length).toBeGreaterThan(3);
  });

  it("generates action priorities from gaps", () => {
    const result = computeInspectionReadiness(baseInput({
      staff_compliance: { dbs_compliance_rate: 83, training_compliance_rate: 80, supervision_compliance_rate: 75, staff_with_overdue_dbs: 2, staff_with_overdue_training: 2, staff_with_overdue_supervision: 3 },
    }));
    expect(result.action_priorities.length).toBeGreaterThan(0);
    expect(result.action_priorities[0].severity).toBe("critical");
    expect(result.action_priorities[0].regulation).toBe("Reg 32");
  });

  it("flags overdue Reg 44 visit as critical gap", () => {
    const result = computeInspectionReadiness(baseInput({
      reg44_status: { last_visit_date: "2026-04-15", next_due_date: "2026-05-15", actions_outstanding: 5, visits_in_12_months: 10 },
    }));
    const gap = result.regulatory_gaps.find((g) => g.regulation === "Reg 44");
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe("critical");
  });

  it("caps action priorities at 12", () => {
    const result = computeInspectionReadiness(baseInput({
      staff_compliance: { dbs_compliance_rate: 50, training_compliance_rate: 50, supervision_compliance_rate: 40, staff_with_overdue_dbs: 6, staff_with_overdue_training: 6, staff_with_overdue_supervision: 7 },
      children_plans: { children_with_current_care_plan: 0, children_with_current_risk_assessment: 0, children_with_overdue_lac_review: 4, children_with_health_assessment: 0, pep_completion_rate: 0 },
      self_evaluation: { has_current_sef: false, last_updated: null, judgment_area_coverage: 0, action_completion_rate: 0 },
      notifiable_events: { pending_notifications: 3, overdue_notifications: 3, total_this_quarter: 6 },
      reg44_status: { last_visit_date: "2026-03-01", next_due_date: "2026-04-01", actions_outstanding: 10, visits_in_12_months: 6 },
      reg45_status: { last_report_date: null, next_due_date: "2026-03-15", report_submitted_on_time: false },
      safeguarding_summary: { open_referrals: 3, lado_referrals_this_year: 2, return_interview_completion_rate: 30, missing_episodes_this_quarter: 12, exploitation_screenings_current: 0 },
      complaints_summary: { open_complaints: 5, complaints_this_quarter: 8, average_resolution_days: 45, escalated_to_ofsted: 2 },
    }));
    expect(result.action_priorities.length).toBeLessThanOrEqual(12);
  });

  it("generates headline mentioning home name and grade", () => {
    const result = computeInspectionReadiness(baseInput());
    expect(result.headline).toContain("Chamberlain House");
    expect(result.headline).toContain("readiness");
  });

  it("flags complaint escalation to Ofsted as risk", () => {
    const result = computeInspectionReadiness(baseInput({
      complaints_summary: { open_complaints: 2, complaints_this_quarter: 4, average_resolution_days: 25, escalated_to_ofsted: 1 },
    }));
    const gap = result.regulatory_gaps.find((g) => g.regulation === "Reg 39");
    expect(gap).toBeDefined();
    const risk = result.key_risks.find((r) => r.risk.includes("escalated"));
    expect(risk).toBeDefined();
  });
});
