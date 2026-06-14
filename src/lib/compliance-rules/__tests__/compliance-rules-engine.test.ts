import { describe, it, expect } from "vitest";
import {
  computeComplianceRules,
  type ComplianceRulesInput,
  type ComplianceSupervisionInput,
  type ComplianceTrainingInput,
} from "../compliance-rules-engine";
import type { CornerstoneEvent } from "@/types/cornerstone-event";

const TODAY = "2026-06-03";

// ── Event factory ─────────────────────────────────────────────────────────────

function makeEvent(over: Partial<CornerstoneEvent> & { id: string }): CornerstoneEvent {
  return {
    id: over.id,
    eventType: over.eventType ?? "incident",
    homeId: "home_oak",
    childId: over.childId,
    staffId: over.staffId,
    occurredAt: over.occurredAt ?? "2026-06-01T10:00:00.000Z",
    createdBy: over.createdBy ?? "staff_x",
    summary: over.summary ?? "Incident INC-001: something happened",
    structuredTags: over.structuredTags ?? [],
    evidenceCategories: over.evidenceCategories ?? [],
    riskLevel: over.riskLevel ?? "medium",
    requiresApproval: over.requiresApproval ?? false,
    approvalLevel: over.approvalLevel,
    linkedDocuments: [],
    linkedTasks: [],
    linkedRisks: [],
    linkedNotifications: [],
    caraAnalysis: over.caraAnalysis,
    audit: { createdAt: "2026-06-01T10:00:00.000Z", updatedAt: "2026-06-01T10:00:00.000Z", version: 1, changeHistory: [] },
  };
}

function emptyInput(over: Partial<ComplianceRulesInput> = {}): ComplianceRulesInput {
  return { events: [], supervisions: [], trainingRecords: [], today: TODAY, ...over };
}

describe("computeComplianceRules — output shape", () => {
  it("returns the house-standard shape", () => {
    const res = computeComplianceRules(emptyInput());
    expect(res).toHaveProperty("overview");
    expect(res).toHaveProperty("rule_results");
    expect(res).toHaveProperty("alerts");
    expect(res).toHaveProperty("insights");
    expect(Array.isArray(res.rule_results)).toBe(true);
    expect(Array.isArray(res.alerts)).toBe(true);
    expect(Array.isArray(res.insights)).toBe(true);
  });

  it("with no inputs: nothing evaluated, a positive insight, no alerts", () => {
    const res = computeComplianceRules(emptyInput());
    expect(res.overview.rules_evaluated).toBe(0);
    expect(res.overview.passing).toBe(0);
    expect(res.overview.failing).toBe(0);
    expect(res.alerts).toHaveLength(0);
    expect(res.insights[0].severity).toBe("positive");
  });

  it("every rule_result severity and status is in the allowed set", () => {
    const res = computeComplianceRules(buildFullScenario());
    for (const r of res.rule_results) {
      expect(["critical", "high", "medium", "low"]).toContain(r.severity);
      expect(["pass", "fail"]).toContain(r.status);
    }
    for (const i of res.insights) {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    }
  });
});

// ── (a) mandatory-info ──────────────────────────────────────────────────────

describe("rule (a) mandatory-info", () => {
  it("fails any event with non-empty complianceFlags", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({
        id: "e1",
        riskLevel: "medium",
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: ["Body map required but not completed"], missingInformation: [], confidenceScore: 0.9 },
      })],
    }));
    const r = res.rule_results.find((x) => x.category === "mandatory-info");
    expect(r).toBeDefined();
    expect(r!.status).toBe("fail");
    expect(r!.linked_event_id).toBe("e1");
    expect(r!.message).toContain("Body map");
  });

  it("does NOT fail an event with empty complianceFlags", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({
        id: "e1",
        eventType: "daily_log",
        riskLevel: "low",
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: [], missingInformation: [], confidenceScore: 1 },
      })],
    }));
    expect(res.rule_results.find((x) => x.category === "mandatory-info")).toBeUndefined();
  });

  it("escalates severity with the event risk level (critical event → critical rule)", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({
        id: "e1",
        riskLevel: "critical",
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: ["X"], missingInformation: [], confidenceScore: 0.5 },
      })],
    }));
    expect(res.rule_results.find((x) => x.category === "mandatory-info")!.severity).toBe("critical");
  });
});

// ── (b) approval-threshold ───────────────────────────────────────────────────

describe("rule (b) approval-threshold", () => {
  it("fails a high-risk event that still requires approval", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", riskLevel: "high", requiresApproval: true, approvalLevel: "manager" })],
    }));
    const r = res.rule_results.find((x) => x.category === "approval-threshold");
    expect(r!.status).toBe("fail");
    expect(r!.severity).toBe("high");
    expect(r!.message).toContain("manager");
  });

  it("uses critical severity for a critical-risk event", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", riskLevel: "critical", requiresApproval: true, approvalLevel: "ri" })],
    }));
    expect(res.rule_results.find((x) => x.category === "approval-threshold")!.severity).toBe("critical");
  });

  it("ignores a medium-risk event even if it requires approval", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", riskLevel: "medium", requiresApproval: true })],
    }));
    expect(res.rule_results.find((x) => x.category === "approval-threshold")).toBeUndefined();
  });

  it("ignores a high-risk event that no longer requires approval", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", riskLevel: "high", requiresApproval: false })],
    }));
    expect(res.rule_results.find((x) => x.category === "approval-threshold")).toBeUndefined();
  });
});

// ── (c) safeguarding-notification ────────────────────────────────────────────

describe("rule (c) safeguarding-notification", () => {
  it("fails a missing event with an outstanding return-home-interview tag", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "missing", riskLevel: "high", structuredTags: ["missing", "rhi_outstanding"] })],
    }));
    const r = res.rule_results.find((x) => x.category === "safeguarding-notification");
    expect(r!.status).toBe("fail");
    expect(r!.title).toContain("Missing");
  });

  it("passes a safeguarding event once notifications are evidenced (no outstanding markers)", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({
        id: "e1",
        eventType: "safeguarding",
        riskLevel: "high",
        structuredTags: ["safeguarding"],
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: [], missingInformation: [], confidenceScore: 1 },
      })],
    }));
    const r = res.rule_results.find((x) => x.category === "safeguarding-notification");
    expect(r).toBeDefined();
    expect(r!.status).toBe("pass");
  });

  it("treats a notification-related complianceFlag as outstanding", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({
        id: "e1",
        eventType: "safeguarding",
        riskLevel: "critical",
        structuredTags: ["safeguarding"],
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: ["Ofsted notification (Reg 40) may be required"], missingInformation: [], confidenceScore: 0.8 },
      })],
    }));
    const r = res.rule_results.find((x) => x.category === "safeguarding-notification");
    expect(r!.status).toBe("fail");
    expect(r!.severity).toBe("critical");
  });

  it("does not evaluate non-safeguarding, non-missing events under this rule", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "incident", riskLevel: "high" })],
    }));
    expect(res.rule_results.find((x) => x.category === "safeguarding-notification")).toBeUndefined();
  });
});

// ── (d) physical-intervention-review ─────────────────────────────────────────

describe("rule (d) physical-intervention-review", () => {
  it("fails a restraint whose debrief is outstanding", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "physical_intervention", riskLevel: "high", structuredTags: ["physical_intervention", "debrief_outstanding"] })],
    }));
    const r = res.rule_results.find((x) => x.category === "physical-intervention-review");
    expect(r!.status).toBe("fail");
  });

  it("passes a restraint whose debrief is evidenced", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "physical_intervention", riskLevel: "critical", structuredTags: ["physical_intervention", "injury"] })],
    }));
    const r = res.rule_results.find((x) => x.category === "physical-intervention-review");
    expect(r!.status).toBe("pass");
    expect(r!.severity).toBe("critical");
  });
});

// ── (e) medication-error-followup ────────────────────────────────────────────

describe("rule (e) medication-error-followup", () => {
  it("fails a medication event carrying a harm tag", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "medication", riskLevel: "high", structuredTags: ["medication", "harm", "candour_outstanding"] })],
    }));
    const r = res.rule_results.find((x) => x.category === "medication-error-followup");
    expect(r!.status).toBe("fail");
    expect(r!.message).toContain("duty of candour");
  });

  it("ignores a medication event with no harm tag", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "medication", riskLevel: "low", structuredTags: ["medication", "medication_error"] })],
    }));
    expect(res.rule_results.find((x) => x.category === "medication-error-followup")).toBeUndefined();
  });
});

// ── (f) training-expiry ──────────────────────────────────────────────────────

describe("rule (f) training-expiry", () => {
  const mk = (over: Partial<ComplianceTrainingInput> & { id: string }): ComplianceTrainingInput => ({
    id: over.id, staff_id: over.staff_id ?? "staff_a", course_name: over.course_name ?? "Safeguarding L3",
    category: over.category, status: over.status, is_mandatory: over.is_mandatory ?? true, expiry_date: over.expiry_date ?? null,
  });

  it("fails expired mandatory training as high severity", () => {
    const res = computeComplianceRules(emptyInput({ trainingRecords: [mk({ id: "t1", status: "expired", expiry_date: "2026-06-01" })] }));
    const r = res.rule_results.find((x) => x.category === "training-expiry");
    expect(r!.status).toBe("fail");
    expect(r!.severity).toBe("high");
    expect(r!.linked_staff_id).toBe("staff_a");
  });

  it("fails expiring_soon mandatory training as medium severity", () => {
    const res = computeComplianceRules(emptyInput({ trainingRecords: [mk({ id: "t1", status: "expiring_soon", expiry_date: "2026-06-20" })] }));
    expect(res.rule_results.find((x) => x.category === "training-expiry")!.severity).toBe("medium");
  });

  it("ignores compliant training", () => {
    const res = computeComplianceRules(emptyInput({ trainingRecords: [mk({ id: "t1", status: "compliant" })] }));
    expect(res.rule_results.find((x) => x.category === "training-expiry")).toBeUndefined();
  });

  it("ignores expired NON-mandatory training (does not fail the home)", () => {
    const res = computeComplianceRules(emptyInput({ trainingRecords: [mk({ id: "t1", status: "expired", is_mandatory: false })] }));
    expect(res.rule_results.find((x) => x.category === "training-expiry")).toBeUndefined();
  });
});

// ── (g) supervision-due ──────────────────────────────────────────────────────

describe("rule (g) supervision-due", () => {
  const mk = (over: Partial<ComplianceSupervisionInput> & { id: string }): ComplianceSupervisionInput => ({
    id: over.id, staff_id: over.staff_id ?? "staff_a", type: over.type ?? "formal",
    scheduled_date: over.scheduled_date ?? "2026-06-01", actual_date: over.actual_date ?? null, status: over.status ?? "scheduled",
  });

  it("fails a supervision scheduled in the past and not completed", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-05-01" })] }));
    const r = res.rule_results.find((x) => x.category === "supervision-due");
    expect(r!.status).toBe("fail");
    expect(r!.message).toContain("overdue");
  });

  it("uses high severity once 14+ days overdue", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-05-01" })] }));
    expect(res.rule_results.find((x) => x.category === "supervision-due")!.severity).toBe("high");
  });

  it("uses medium severity when only a few days overdue", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-06-01" })] }));
    expect(res.rule_results.find((x) => x.category === "supervision-due")!.severity).toBe("medium");
  });

  it("ignores a completed supervision", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-05-01", status: "completed", actual_date: "2026-05-01" })] }));
    expect(res.rule_results.find((x) => x.category === "supervision-due")).toBeUndefined();
  });

  it("ignores a future-scheduled supervision", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-07-01" })] }));
    expect(res.rule_results.find((x) => x.category === "supervision-due")).toBeUndefined();
  });

  it("respects an explicit overdue status even with a future date", () => {
    const res = computeComplianceRules(emptyInput({ supervisions: [mk({ id: "s1", scheduled_date: "2026-07-01", status: "overdue" })] }));
    expect(res.rule_results.find((x) => x.category === "supervision-due")!.status).toBe("fail");
  });
});

// ── Overview / alerts / insights ───────────────────────────────────────────────

describe("overview, alerts, insights", () => {
  it("overview tallies passing, failing and by_severity correctly", () => {
    const res = computeComplianceRules(buildFullScenario());
    const o = res.overview;
    expect(o.rules_evaluated).toBe(res.rule_results.length);
    expect(o.passing + o.failing).toBe(o.rules_evaluated);
    const failing = res.rule_results.filter((r) => r.status === "fail");
    expect(o.failing).toBe(failing.length);
    const sumBySeverity = o.by_severity.critical + o.by_severity.high + o.by_severity.medium + o.by_severity.low;
    expect(sumBySeverity).toBe(o.failing);
  });

  it("alerts contain only failing critical/high rules", () => {
    const res = computeComplianceRules(buildFullScenario());
    expect(res.alerts.length).toBeGreaterThan(0);
    for (const a of res.alerts) {
      expect(["critical", "high"]).toContain(a.severity);
    }
    const expected = res.rule_results.filter((r) => r.status === "fail" && (r.severity === "critical" || r.severity === "high")).length;
    expect(res.alerts.length).toBe(expected);
  });

  it("emits a critical insight when there is a critical breach", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", riskLevel: "critical", requiresApproval: true, approvalLevel: "ri" })],
    }));
    expect(res.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("emits only a positive insight when everything passes", () => {
    const res = computeComplianceRules(emptyInput({
      events: [makeEvent({ id: "e1", eventType: "physical_intervention", riskLevel: "high", structuredTags: ["physical_intervention"] })],
    }));
    expect(res.overview.failing).toBe(0);
    expect(res.insights.every((i) => i.severity === "positive")).toBe(true);
  });
});

// ── Ordering ────────────────────────────────────────────────────────────────

describe("ordering", () => {
  it("places failing rules before passing rules, criticals first", () => {
    const res = computeComplianceRules(buildFullScenario());
    const statuses = res.rule_results.map((r) => r.status);
    const firstPass = statuses.indexOf("pass");
    const lastFail = statuses.lastIndexOf("fail");
    if (firstPass !== -1 && lastFail !== -1) expect(firstPass).toBeGreaterThan(lastFail);
    // within failing block, severity is non-decreasing in rank
    const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const failing = res.rule_results.filter((r) => r.status === "fail");
    for (let i = 1; i < failing.length; i++) {
      expect(rank[failing[i].severity]).toBeGreaterThanOrEqual(rank[failing[i - 1].severity]);
    }
  });
});

// ── Determinism ───────────────────────────────────────────────────────────────

describe("determinism", () => {
  it("produces byte-identical JSON for identical input", () => {
    const input = buildFullScenario();
    const a = JSON.stringify(computeComplianceRules(input));
    const b = JSON.stringify(computeComplianceRules(structuredClone(input)));
    expect(a).toBe(b);
  });

  it("does not read the wall clock — omitting today still yields a stable structure", () => {
    // With no date-sensitive inputs (no supervisions), output must not depend on `today`.
    const input = emptyInput({
      today: undefined,
      events: [makeEvent({ id: "e1", riskLevel: "high", requiresApproval: true, approvalLevel: "manager" })],
    });
    const a = JSON.stringify(computeComplianceRules(input));
    const b = JSON.stringify(computeComplianceRules(input));
    expect(a).toBe(b);
  });

  it("is insensitive to input event ordering", () => {
    const base = buildFullScenario();
    const reversed: ComplianceRulesInput = {
      ...base,
      events: [...base.events].reverse(),
      supervisions: [...base.supervisions].reverse(),
      trainingRecords: [...base.trainingRecords].reverse(),
    };
    expect(JSON.stringify(computeComplianceRules(base))).toBe(JSON.stringify(computeComplianceRules(reversed)));
  });
});

// ── A scenario that lights up every rule ────────────────────────────────────────

function buildFullScenario(): ComplianceRulesInput {
  return {
    today: TODAY,
    events: [
      // mandatory-info (critical) + approval-threshold (critical) + safeguarding-notification (critical, outstanding)
      makeEvent({
        id: "evt_sg",
        eventType: "safeguarding",
        riskLevel: "critical",
        requiresApproval: true,
        approvalLevel: "manager",
        structuredTags: ["safeguarding", "child_protection"],
        caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: ["Ofsted notification (Reg 40) may be required"], missingInformation: [], confidenceScore: 0.6 },
      }),
      // missing — outstanding RHI (high)
      makeEvent({ id: "evt_mis", eventType: "missing", riskLevel: "high", structuredTags: ["missing", "rhi_outstanding"] }),
      // physical intervention — debrief outstanding (high)
      makeEvent({ id: "evt_pi", eventType: "physical_intervention", riskLevel: "high", structuredTags: ["physical_intervention", "debrief_outstanding"] }),
      // physical intervention — debrief done (PASS)
      makeEvent({ id: "evt_pi2", eventType: "physical_intervention", riskLevel: "high", structuredTags: ["physical_intervention"] }),
      // medication harm (high)
      makeEvent({ id: "evt_med", eventType: "medication", riskLevel: "high", structuredTags: ["medication", "harm", "candour_outstanding"] }),
    ],
    supervisions: [
      { id: "sup_1", staff_id: "staff_a", type: "formal", scheduled_date: "2026-05-01", actual_date: null, status: "scheduled" }, // high (overdue 33d)
      { id: "sup_2", staff_id: "staff_b", type: "formal", scheduled_date: "2026-06-15", actual_date: null, status: "scheduled" }, // future — ignored
    ],
    trainingRecords: [
      { id: "tr_1", staff_id: "staff_a", course_name: "GDPR Refresher", status: "expired", is_mandatory: true, expiry_date: "2026-06-01" }, // high
      { id: "tr_2", staff_id: "staff_b", course_name: "First Aid", status: "expiring_soon", is_mandatory: true, expiry_date: "2026-06-25" }, // medium
      { id: "tr_3", staff_id: "staff_c", course_name: "Optional CPD", status: "expired", is_mandatory: false }, // ignored
    ],
  };
}
