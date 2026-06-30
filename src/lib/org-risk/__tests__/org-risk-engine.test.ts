import { describe, it, expect } from "vitest";
import {
  buildOrgRiskDashboard,
  draftObjectiveFromIndicator,
  draftObjectiveFromCorrelation,
  orgRiskObjectiveRef,
  type OrgRiskInput,
} from "../org-risk-engine";

const NOW = "2026-06-23T12:00:00.000Z";

function input(over: Partial<OrgRiskInput> = {}): OrgRiskInput {
  return {
    now: NOW,
    staff: [],
    supervisions: [],
    trainingRecords: [],
    incidents: [],
    missing: [],
    complaints: [],
    leave: [],
    ...over,
  };
}

const staff = (n: number, type: string) =>
  Array.from({ length: n }, (_, i) => ({ id: `s${type}${i}`, employment_status: "active", employment_type: type, end_date: null }) as never);

describe("buildOrgRiskDashboard", () => {
  it("reports low risk for a settled, well-staffed home", () => {
    const d = buildOrgRiskDashboard(input({ staff: staff(12, "permanent") }));
    expect(d.overallLevel).toBe("low");
    expect(d.indicators).toHaveLength(8);
    expect(d.trend).toHaveLength(6);
  });

  it("is deterministic", () => {
    const args = input({ staff: staff(10, "permanent") });
    expect(buildOrgRiskDashboard(args)).toEqual(buildOrgRiskDashboard(args));
  });

  it("rates staffing higher when bank/agency share is large", () => {
    const d = buildOrgRiskDashboard(input({ staff: [...staff(5, "permanent"), ...staff(5, "agency")] }));
    const staffing = d.indicators.find((i) => i.key === "staffing")!;
    expect(["moderate", "high", "critical"]).toContain(staffing.level);
  });

  it("flags overdue supervision", () => {
    const d = buildOrgRiskDashboard(input({
      staff: staff(8, "permanent"),
      supervisions: Array.from({ length: 3 }, (_, i) => ({ id: `sup${i}`, status: "scheduled", scheduled_date: "2026-05-01", actual_date: null }) as never),
    }));
    const sup = d.indicators.find((i) => i.key === "supervision")!;
    expect(["moderate", "high"]).toContain(sup.level);
  });

  it("rates incidents and correlates with agency use", () => {
    const incidents = Array.from({ length: 9 }, (_, i) => ({ id: `i${i}`, child_id: "yp_a", date: "2026-06-10", severity: "moderate", type: "x", description: "" }) as never);
    const d = buildOrgRiskDashboard(input({ staff: [...staff(5, "permanent"), ...staff(4, "agency")], incidents }));
    expect(d.indicators.find((i) => i.key === "incidents")!.level).toBe("high");
    expect(d.correlations.some((c) => c.key === "agency_incidents")).toBe(true);
  });

  it("buckets a six-month incident trend", () => {
    const incidents = [
      { id: "i1", child_id: "yp_a", date: "2026-06-10", severity: "low", type: "x", description: "" },
      { id: "i2", child_id: "yp_a", date: "2026-05-05", severity: "low", type: "x", description: "" },
    ] as never[];
    const d = buildOrgRiskDashboard(input({ staff: staff(8, "permanent"), incidents }));
    const jun = d.trend.find((t) => t.month === "2026-06")!;
    const may = d.trend.find((t) => t.month === "2026-05")!;
    expect(jun.incidents).toBe(1);
    expect(may.incidents).toBe(1);
  });
});

describe("org-risk action planning (improvement-objective drafts)", () => {
  it("drafts a high-priority objective from a critical indicator with a stable ref in the notes", () => {
    const draft = draftObjectiveFromIndicator({
      key: "training",
      label: "Mandatory training",
      value: "7 not compliant",
      level: "critical",
      detail: "7 of 10 mandatory training records need attention.",
    });
    expect(draft.priority).toBe("high");
    expect(draft.title).toContain("mandatory training");
    expect(draft.title).toContain("7 not compliant");
    expect(draft.notes).toContain("7 of 10 mandatory training records need attention.");
    expect(draft.ref).toBe(orgRiskObjectiveRef("training"));
    expect(draft.ref).toBe("[ref:org-risk:training]");
    expect(draft.notes).toContain(draft.ref);
  });

  it("maps indicator level to priority (moderate -> medium, low -> low)", () => {
    expect(draftObjectiveFromIndicator({ key: "sickness", label: "Sickness", value: "6 days", level: "moderate", detail: "" }).priority).toBe("medium");
    expect(draftObjectiveFromIndicator({ key: "missing", label: "Missing", value: "0", level: "low", detail: "" }).priority).toBe("low");
  });

  it("drafts from a correlation: truncates long text, rates concern->high / watch->medium", () => {
    const concern = draftObjectiveFromCorrelation({
      key: "agency_incidents",
      severity: "concern",
      text: "Bank/agency cover and incidents are both elevated — extra induction and consistent handovers may help.",
    });
    expect(concern.priority).toBe("high");
    expect(concern.title.startsWith("Act on: ")).toBe(true);
    expect(concern.title.endsWith("…")).toBe(true);
    expect(concern.ref).toBe("[ref:org-risk:agency_incidents]");
    expect(concern.notes).toContain(concern.ref);

    const watch = draftObjectiveFromCorrelation({ key: "sickness_supervision", severity: "watch", text: "short" });
    expect(watch.priority).toBe("medium");
    expect(watch.title).toBe("Act on: short");
  });
});
