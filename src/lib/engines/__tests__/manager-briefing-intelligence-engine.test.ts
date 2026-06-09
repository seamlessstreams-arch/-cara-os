import { describe, it, expect } from "vitest";
import {
  computeManagerBriefing,
  type ManagerBriefingInput,
  type DomainDigest,
  type ChildAttentionInput,
} from "../manager-briefing-intelligence-engine";

function makeDomain(overrides: Partial<DomainDigest> = {}): DomainDigest {
  return {
    domain: "safeguarding",
    domain_label: "Safeguarding",
    critical_alerts: 0,
    high_alerts: 0,
    medium_alerts: 0,
    total_alerts: 0,
    compliance_rate: 95,
    overdue_count: 0,
    improving_count: 1,
    worsening_count: 0,
    key_metric_label: "Incidents (30d)",
    key_metric_value: 3,
    key_metric_target: null,
    alerts: [],
    insights: [],
    ...overrides,
  };
}

function makeChild(overrides: Partial<ChildAttentionInput> = {}): ChildAttentionInput {
  return {
    child_id: "yp_1",
    child_name: "Alex",
    domains_flagged: ["safeguarding"],
    highest_severity: "medium",
    flags: ["Missing episode this week"],
    ...overrides,
  };
}

function makeInput(overrides: Partial<ManagerBriefingInput> = {}): ManagerBriefingInput {
  return {
    domains: [makeDomain()],
    children_attention: [],
    total_children: 4,
    total_staff: 12,
    home_name: "Chamberlain House",
    today: "2026-05-26",
    ...overrides,
  };
}

describe("Manager Briefing Intelligence Engine", () => {
  it("produces a stable briefing when all domains are green", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", domain_label: "Safeguarding" }),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour" }),
        makeDomain({ domain: "workforce", domain_label: "Workforce" }),
      ],
    }));

    expect(result.executive_summary.overall_risk_level).toBe("stable");
    expect(result.executive_summary.total_critical_alerts).toBe(0);
    expect(result.executive_summary.domains_at_risk).toBe(0);
    expect(result.executive_summary.domains_compliant).toBe(3);
    expect(result.domain_health).toHaveLength(3);
    expect(result.domain_health.every((d) => d.status === "green")).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights[0].severity).toBe("positive");
  });

  it("flags critical risk when any domain has critical alerts", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", critical_alerts: 2, total_alerts: 2, alerts: [
          { severity: "critical", message: "Unresolved safeguarding concern" },
          { severity: "critical", message: "Missing child not yet returned" },
        ]}),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour" }),
        makeDomain({ domain: "workforce", domain_label: "Workforce" }),
      ],
    }));

    expect(result.executive_summary.overall_risk_level).toBe("critical");
    expect(result.executive_summary.total_critical_alerts).toBe(2);
    expect(result.executive_summary.domains_at_risk).toBe(1);
    expect(result.domain_health[0].status).toBe("red");
    expect(result.priority_actions.length).toBeGreaterThanOrEqual(2);
    expect(result.priority_actions[0].severity).toBe("critical");
  });

  it("computes elevated risk for high alerts without criticals", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", high_alerts: 3, total_alerts: 3, alerts: [
          { severity: "high", message: "Alert 1" },
          { severity: "high", message: "Alert 2" },
          { severity: "high", message: "Alert 3" },
        ]}),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour" }),
      ],
    }));

    expect(result.executive_summary.overall_risk_level).toBe("elevated");
  });

  it("computes moderate risk for single high alert", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", high_alerts: 1, total_alerts: 1, alerts: [
          { severity: "high", message: "Overdue review" },
        ]}),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour" }),
      ],
    }));

    expect(result.executive_summary.overall_risk_level).toBe("moderate");
  });

  it("computes domain status correctly — amber for low compliance", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "workforce", domain_label: "Workforce", compliance_rate: 65 }),
      ],
    }));

    expect(result.domain_health[0].status).toBe("amber");
  });

  it("computes domain status correctly — red for overdue > 2", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "supervision", domain_label: "Supervision", overdue_count: 4 }),
      ],
    }));

    expect(result.domain_health[0].status).toBe("red");
  });

  it("aggregates children requiring attention sorted by severity", () => {
    const result = computeManagerBriefing(makeInput({
      children_attention: [
        makeChild({ child_id: "yp_1", child_name: "Alex", highest_severity: "medium" }),
        makeChild({ child_id: "yp_2", child_name: "Jordan", highest_severity: "critical", flags: ["Self-harm risk", "Missing episode"] }),
        makeChild({ child_id: "yp_3", child_name: "Sam", highest_severity: "high" }),
      ],
    }));

    expect(result.children_attention).toHaveLength(3);
    expect(result.children_attention[0].child_name).toBe("Jordan");
    expect(result.children_attention[0].severity).toBe("critical");
    expect(result.children_attention[0].action_required).toContain("Immediate");
    expect(result.children_attention[1].child_name).toBe("Sam");
    expect(result.executive_summary.children_requiring_attention).toBe(3);
  });

  it("computes regulatory compliance summary correctly", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 98 }),
        makeDomain({ domain: "workforce", domain_label: "Workforce", compliance_rate: 72 }),
        makeDomain({ domain: "education", domain_label: "Education", compliance_rate: 85 }),
        makeDomain({ domain: "premises", domain_label: "Premises", compliance_rate: null }),
      ],
    }));

    expect(result.regulatory_compliance.overall_compliance_pct).toBe(85);
    expect(result.regulatory_compliance.domains_above_threshold).toBe(2);
    expect(result.regulatory_compliance.domains_below_threshold).toBe(1);
    expect(result.regulatory_compliance.weakest_domain).toBe("Workforce");
    expect(result.regulatory_compliance.weakest_domain_rate).toBe(72);
    expect(result.regulatory_compliance.strongest_domain).toBe("Safeguarding");
  });

  it("computes trend analysis across domains", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", domain_label: "Safeguarding", improving_count: 3, worsening_count: 0 }),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour", improving_count: 0, worsening_count: 2 }),
        makeDomain({ domain: "workforce", domain_label: "Workforce", improving_count: 1, worsening_count: 1 }),
      ],
    }));

    expect(result.trend_analysis.domains_improving).toBe(1);
    expect(result.trend_analysis.domains_worsening).toBe(1);
    expect(result.trend_analysis.domains_stable).toBe(1);
    expect(result.trend_analysis.improving_domains).toContain("Safeguarding");
    expect(result.trend_analysis.worsening_domains).toContain("Behaviour");
    expect(result.trend_analysis.overall_direction).toBe("stable");
  });

  it("generates priority actions ranked by severity", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", alerts: [
          { severity: "medium", message: "Review overdue" },
          { severity: "critical", message: "Urgent safeguarding concern" },
        ]}),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour", alerts: [
          { severity: "high", message: "Escalating behaviour pattern" },
        ]}),
      ],
    }));

    expect(result.priority_actions[0].severity).toBe("critical");
    expect(result.priority_actions[0].action).toContain("Urgent");
    expect(result.priority_actions[1].severity).toBe("high");
    expect(result.priority_actions[2].severity).toBe("medium");
    expect(result.priority_actions[0].regulatory_ref).toBeTruthy();
  });

  it("generates ARIA insights for compliance warnings", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "workforce", domain_label: "Workforce", compliance_rate: 60 }),
        makeDomain({ domain: "safeguarding", domain_label: "Safeguarding", compliance_rate: 92 }),
      ],
    }));

    const complianceInsight = result.insights.find((i) => i.text.includes("Compliance"));
    expect(complianceInsight).toBeTruthy();
    expect(complianceInsight!.severity).toBe("warning");
    expect(complianceInsight!.text).toContain("Workforce");
  });

  it("generates positive insight when stable with improving domains", () => {
    const result = computeManagerBriefing(makeInput({
      domains: [
        makeDomain({ domain: "safeguarding", domain_label: "Safeguarding", improving_count: 2, worsening_count: 0 }),
        makeDomain({ domain: "behaviour", domain_label: "Behaviour", improving_count: 1, worsening_count: 0 }),
      ],
    }));

    expect(result.executive_summary.overall_risk_level).toBe("stable");
    const positiveInsight = result.insights.find((i) => i.severity === "positive");
    expect(positiveInsight).toBeTruthy();
    expect(positiveInsight!.text).toContain("Positive trajectory");
  });

  it("caps priority actions at 15", () => {
    const manyAlerts = Array.from({ length: 25 }, (_, i) => ({
      severity: "medium" as const,
      message: `Alert ${i + 1}`,
    }));
    const result = computeManagerBriefing(makeInput({
      domains: [makeDomain({ domain: "safeguarding", alerts: manyAlerts })],
    }));

    expect(result.priority_actions.length).toBeLessThanOrEqual(15);
  });

  it("handles empty domains gracefully", () => {
    const result = computeManagerBriefing(makeInput({ domains: [] }));

    expect(result.executive_summary.overall_risk_level).toBe("stable");
    expect(result.executive_summary.domains_total).toBe(0);
    expect(result.domain_health).toHaveLength(0);
    expect(result.regulatory_compliance.overall_compliance_pct).toBe(100);
  });

  it("includes generated_at and home_name in result", () => {
    const result = computeManagerBriefing(makeInput());

    expect(result.generated_at).toBe("2026-05-26");
    expect(result.home_name).toBe("Chamberlain House");
  });

  it("multi-domain child flags generate holistic review action", () => {
    const result = computeManagerBriefing(makeInput({
      children_attention: [
        makeChild({
          child_id: "yp_1",
          child_name: "Alex",
          highest_severity: "medium",
          domains_flagged: ["safeguarding", "behaviour", "health"],
          flags: ["Missing episode", "Aggression increase", "Missed GP appointment"],
        }),
      ],
    }));

    expect(result.children_attention[0].action_required).toContain("holistic");
  });
});
