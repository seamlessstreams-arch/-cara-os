// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDIT QUALITY ASSURANCE INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the audit quality intelligence engine.
// Reg 45 (review of quality of care), Schedule 6, SCCIF governance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAuditQualityIntelligence,
  daysBetween,
  type AuditInput,
  type AuditStatus,
  type StaffRef,
} from "../audit-quality-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `audit_${++_id}`;
}

function makeAudit(overrides: Partial<AuditInput> = {}): AuditInput {
  return {
    id: overrides.id ?? uid(),
    title: "Test Audit",
    category: "general",
    date: "2026-05-20",
    completed_by: "staff_1",
    score: 85,
    max_score: 100,
    status: "completed",
    findings: 0,
    actions: 0,
    created_at: "2026-05-20",
    ...overrides,
  };
}

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_ryan", name: "Ryan Clarke" },
];

function run(
  audits: AuditInput[] = [],
  staff: StaffRef[] = STAFF,
  today: string = TODAY,
) {
  return computeAuditQualityIntelligence({ audits, staff, today });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween calculates correctly", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  it("daysBetween returns 0 for same date", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("daysBetween handles negative (future to past)", () => {
    expect(daysBetween("2026-05-30", "2026-05-25")).toBe(-5);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns zeroed overview with no audits", () => {
    const r = run([]);
    expect(r.overview.total_audits).toBe(0);
    expect(r.overview.completed_count).toBe(0);
    expect(r.overview.avg_compliance_score).toBe(0);
    expect(r.overview.overdue_count).toBe(0);
    expect(r.audit_profiles).toHaveLength(0);
    expect(r.category_analysis).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total audits", () => {
    const r = run([makeAudit(), makeAudit(), makeAudit()]);
    expect(r.overview.total_audits).toBe(3);
  });

  it("counts by status", () => {
    const r = run([
      makeAudit({ status: "completed" }),
      makeAudit({ status: "completed" }),
      makeAudit({ status: "scheduled", score: 0, completed_by: null }),
      makeAudit({ status: "in_progress", score: 0, completed_by: null }),
    ]);
    expect(r.overview.completed_count).toBe(2);
    expect(r.overview.scheduled_count).toBe(1);
    expect(r.overview.in_progress_count).toBe(1);
  });

  it("counts overdue audits (scheduled/in_progress with date < today)", () => {
    const r = run([
      makeAudit({ status: "scheduled", date: "2026-05-20", score: 0, completed_by: null }), // past → overdue
      makeAudit({ status: "in_progress", date: "2026-05-23", score: 0, completed_by: null }), // past → overdue
      makeAudit({ status: "scheduled", date: "2026-06-01", score: 0, completed_by: null }), // future → not overdue
      makeAudit({ status: "completed", date: "2026-05-20" }), // completed → not overdue
    ]);
    expect(r.overview.overdue_count).toBe(2);
  });

  it("scheduled on today is not overdue", () => {
    const r = run([
      makeAudit({ status: "scheduled", date: TODAY, score: 0, completed_by: null }),
    ]);
    expect(r.overview.overdue_count).toBe(0);
  });

  it("calculates average compliance score across completed audits", () => {
    const r = run([
      makeAudit({ score: 90, max_score: 100 }),
      makeAudit({ score: 80, max_score: 100 }),
      makeAudit({ status: "scheduled", score: 0, max_score: 100, completed_by: null }),
    ]);
    // avg of 90% and 80% = 85%
    expect(r.overview.avg_compliance_score).toBe(85);
  });

  it("counts high-performing audits (>=90%)", () => {
    const r = run([
      makeAudit({ score: 95, max_score: 100 }),
      makeAudit({ score: 90, max_score: 100 }),
      makeAudit({ score: 80, max_score: 100 }),
    ]);
    expect(r.overview.high_performing_count).toBe(2);
  });

  it("counts below-threshold audits (<70%)", () => {
    const r = run([
      makeAudit({ score: 60, max_score: 100 }),
      makeAudit({ score: 50, max_score: 100 }),
      makeAudit({ score: 85, max_score: 100 }),
    ]);
    expect(r.overview.below_threshold_count).toBe(2);
  });

  it("sums findings and actions", () => {
    const r = run([
      makeAudit({ findings: 3, actions: 2 }),
      makeAudit({ findings: 1, actions: 1 }),
    ]);
    expect(r.overview.total_findings).toBe(4);
    expect(r.overview.total_actions).toBe(3);
    expect(r.overview.unresolved_findings).toBe(1);
  });

  it("unresolved findings floors at 0", () => {
    const r = run([
      makeAudit({ findings: 1, actions: 3 }),
    ]);
    expect(r.overview.unresolved_findings).toBe(0);
  });

  it("counts categories covered", () => {
    const r = run([
      makeAudit({ category: "medication" }),
      makeAudit({ category: "medication" }),
      makeAudit({ category: "health_safety" }),
      makeAudit({ category: "finance" }),
    ]);
    expect(r.overview.categories_covered).toBe(3);
  });
});

// ── Audit Profiles ──────────────────────────────────────────────────────────

describe("audit profiles", () => {
  it("computes compliance percentage for completed audits", () => {
    const r = run([makeAudit({ id: "a1", score: 78, max_score: 100 })]);
    expect(r.audit_profiles[0].compliance_pct).toBe(78);
  });

  it("compliance is 0 for scheduled audits", () => {
    const r = run([makeAudit({ status: "scheduled", score: 0, completed_by: null })]);
    expect(r.audit_profiles[0].compliance_pct).toBe(0);
  });

  it("resolves completed_by to staff name", () => {
    const r = run([makeAudit({ completed_by: "staff_darren" })]);
    expect(r.audit_profiles[0].completed_by_name).toBe("Darren Laville");
  });

  it("falls back to staff_id when not in staffMap", () => {
    const r = run([makeAudit({ completed_by: "staff_unknown" })], []);
    expect(r.audit_profiles[0].completed_by_name).toBe("staff_unknown");
  });

  it("completed_by_name is null for scheduled audits", () => {
    const r = run([makeAudit({ status: "scheduled", completed_by: null })]);
    expect(r.audit_profiles[0].completed_by_name).toBeNull();
  });

  it("calculates days_since_or_until correctly", () => {
    // date = 2026-05-20, today = 2026-05-25 → -5 (5 days ago)
    const r = run([makeAudit({ date: "2026-05-20" })]);
    expect(r.audit_profiles[0].days_since_or_until).toBe(-5);

    // date = 2026-06-01, today = 2026-05-25 → +7 (7 days ahead)
    const r2 = run([makeAudit({ date: "2026-06-01" })]);
    expect(r2.audit_profiles[0].days_since_or_until).toBe(7);
  });

  it("marks scheduled audits in the past as overdue", () => {
    const r = run([makeAudit({ status: "scheduled", date: "2026-05-20", score: 0, completed_by: null })]);
    expect(r.audit_profiles[0].is_overdue).toBe(true);
  });

  it("does not mark completed audits as overdue", () => {
    const r = run([makeAudit({ status: "completed", date: "2026-05-10" })]);
    expect(r.audit_profiles[0].is_overdue).toBe(false);
  });

  it("calculates unresolved findings per audit", () => {
    const r = run([makeAudit({ findings: 3, actions: 1 })]);
    expect(r.audit_profiles[0].unresolved_findings).toBe(2);
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags overdue audits", () => {
    const r = run([makeAudit({ status: "scheduled", date: "2026-05-20", score: 0, completed_by: null })]);
    expect(r.audit_profiles[0].risk_flags).toContain("overdue");
  });

  it("flags below_threshold (<70%)", () => {
    const r = run([makeAudit({ score: 65, max_score: 100 })]);
    expect(r.audit_profiles[0].risk_flags).toContain("below_threshold");
  });

  it("flags critical_score (<50%)", () => {
    const r = run([makeAudit({ score: 40, max_score: 100 })]);
    expect(r.audit_profiles[0].risk_flags).toContain("critical_score");
    expect(r.audit_profiles[0].risk_flags).toContain("below_threshold");
  });

  it("flags unresolved_findings", () => {
    const r = run([makeAudit({ findings: 2, actions: 1 })]);
    expect(r.audit_profiles[0].risk_flags).toContain("unresolved_findings");
  });

  it("flags no_actions_raised when findings exist but actions = 0", () => {
    const r = run([makeAudit({ findings: 3, actions: 0 })]);
    expect(r.audit_profiles[0].risk_flags).toContain("no_actions_raised");
  });

  it("no risk flags for a high-scoring completed audit", () => {
    const r = run([makeAudit({ score: 95, max_score: 100, findings: 0, actions: 0 })]);
    expect(r.audit_profiles[0].risk_flags).toHaveLength(0);
  });
});

// ── Category Analysis ───────────────────────────────────────────────────────

describe("category analysis", () => {
  it("groups by category and counts", () => {
    const r = run([
      makeAudit({ category: "medication" }),
      makeAudit({ category: "medication" }),
      makeAudit({ category: "finance" }),
    ]);
    expect(r.category_analysis).toHaveLength(2);
    const med = r.category_analysis.find((c) => c.category === "medication")!;
    expect(med.audit_count).toBe(2);
    expect(med.completed_count).toBe(2);
  });

  it("calculates average compliance per category", () => {
    const r = run([
      makeAudit({ category: "medication", score: 90, max_score: 100 }),
      makeAudit({ category: "medication", score: 80, max_score: 100 }),
    ]);
    const med = r.category_analysis.find((c) => c.category === "medication")!;
    expect(med.avg_compliance_score).toBe(85);
  });

  it("sorts by weakest compliance first", () => {
    const r = run([
      makeAudit({ category: "finance", score: 95, max_score: 100 }),
      makeAudit({ category: "medication", score: 60, max_score: 100 }),
      makeAudit({ category: "health_safety", score: 80, max_score: 100 }),
    ]);
    expect(r.category_analysis[0].category).toBe("medication");
    expect(r.category_analysis[2].category).toBe("finance");
  });

  it("sums findings and actions per category", () => {
    const r = run([
      makeAudit({ category: "medication", findings: 2, actions: 1 }),
      makeAudit({ category: "medication", findings: 1, actions: 1 }),
    ]);
    const med = r.category_analysis.find((c) => c.category === "medication")!;
    expect(med.total_findings).toBe(3);
    expect(med.total_actions).toBe(2);
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: overdue audits", () => {
    const r = run([
      makeAudit({ status: "scheduled", date: "2026-05-20", title: "Overdue Audit", score: 0, completed_by: null }),
    ]);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("overdue");
    expect(critical[0].message).toContain("Overdue Audit");
  });

  it("no critical when no overdue", () => {
    const r = run([makeAudit({ status: "completed" })]);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(0);
  });

  it("high: audits below 70%", () => {
    const r = run([
      makeAudit({ score: 60, max_score: 100, title: "Low Audit" }),
    ]);
    const high = r.alerts.filter((a) => a.message.includes("below 70%"));
    expect(high).toHaveLength(1);
    expect(high[0].message).toContain("Low Audit");
  });

  it("high: unresolved findings", () => {
    const r = run([
      makeAudit({ findings: 3, actions: 1 }),
    ]);
    const high = r.alerts.filter((a) => a.message.includes("without corresponding"));
    expect(high).toHaveLength(1);
    expect(high[0].message).toContain("2 finding(s)");
  });

  it("medium: scheduled within 7 days", () => {
    const r = run([
      makeAudit({ status: "scheduled", date: "2026-05-28", title: "Upcoming Audit", score: 0, completed_by: null }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("within the next 7 days"));
    expect(med).toHaveLength(1);
    expect(med[0].message).toContain("Upcoming Audit");
  });

  it("medium: in-progress audits", () => {
    const r = run([
      makeAudit({ status: "in_progress", date: "2026-05-28", score: 0, completed_by: null }),
    ]);
    const med = r.alerts.filter((a) => a.message.includes("in progress"));
    expect(med).toHaveLength(1);
  });

  it("low: no completed audits in last 30 days", () => {
    const r = run([
      makeAudit({ status: "completed", date: "2026-04-01" }), // >30 days ago
    ]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(1);
    expect(low[0].message).toContain("No audits completed in the last 30 days");
  });

  it("no low alert when recent audits exist", () => {
    const r = run([makeAudit({ status: "completed", date: "2026-05-20" })]);
    const low = r.alerts.filter((a) => a.severity === "low" && a.message.includes("No audits completed"));
    expect(low).toHaveLength(0);
  });
});

// ── ARIA Insights ───────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical: overdue audits", () => {
    const r = run([
      makeAudit({ status: "scheduled", date: "2026-05-20", score: 0, completed_by: null }),
    ]);
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].text).toContain("overdue");
  });

  it("warning: below-threshold audits", () => {
    const r = run([
      makeAudit({ score: 60, max_score: 100 }),
      makeAudit({ score: 90, max_score: 100 }),
    ]);
    const warnings = r.insights.filter((i) => i.text.includes("below 70%"));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].text).toContain("1 of 2");
  });

  it("warning: unresolved findings", () => {
    const r = run([
      makeAudit({ findings: 3, actions: 1 }),
    ]);
    const warnings = r.insights.filter((i) => i.text.includes("corrective actions"));
    expect(warnings).toHaveLength(1);
  });

  it("positive: high average compliance >=85%", () => {
    const r = run([
      makeAudit({ score: 90, max_score: 100 }),
      makeAudit({ score: 85, max_score: 100 }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("Average audit compliance"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("88%"); // (90+85)/2 = 87.5 → 88
  });

  it("no high compliance insight when avg < 85%", () => {
    const r = run([
      makeAudit({ score: 80, max_score: 100 }),
      makeAudit({ score: 75, max_score: 100 }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("Average audit compliance"));
    expect(pos).toHaveLength(0);
  });

  it("positive: no overdue audits", () => {
    const r = run([makeAudit({ status: "completed" })]);
    const pos = r.insights.filter((i) => i.text.includes("No audits are overdue"));
    expect(pos).toHaveLength(1);
  });

  it("positive: all completed above 80%", () => {
    const r = run([
      makeAudit({ score: 85, max_score: 100 }),
      makeAudit({ score: 92, max_score: 100 }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("scored 80% or above"));
    expect(pos).toHaveLength(1);
  });

  it("no all-above-80 insight when any is below", () => {
    const r = run([
      makeAudit({ score: 75, max_score: 100 }),
      makeAudit({ score: 92, max_score: 100 }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("scored 80% or above"));
    expect(pos).toHaveLength(0);
  });

  it("positive: diverse audit coverage >=3 categories", () => {
    const r = run([
      makeAudit({ category: "medication" }),
      makeAudit({ category: "finance" }),
      makeAudit({ category: "health_safety" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("distinct areas"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("3 distinct areas");
  });

  it("positive: recent audit activity (2+ in 30 days)", () => {
    const r = run([
      makeAudit({ status: "completed", date: "2026-05-20" }),
      makeAudit({ status: "completed", date: "2026-05-15" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("completed in the last 30 days"));
    expect(pos).toHaveLength(1);
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  // Mirrors the 5 seeded audits from store.ts
  const oakAudits: AuditInput[] = [
    {
      id: "a1", title: "Medication Administration Audit", category: "medication",
      date: "2026-05-11", completed_by: "staff_darren", score: 92, max_score: 100,
      status: "completed", findings: 1, actions: 1, created_at: "2026-05-11",
    },
    {
      id: "a2", title: "Health & Safety Walk-around", category: "health_safety",
      date: "2026-05-18", completed_by: "staff_ryan", score: 87, max_score: 100,
      status: "completed", findings: 2, actions: 2, created_at: "2026-05-18",
    },
    {
      id: "a3", title: "Records Quality Audit — Care Plans", category: "care_records",
      date: "2026-06-01", completed_by: null, score: 0, max_score: 100,
      status: "scheduled", findings: 0, actions: 0, created_at: "2026-05-25",
    },
    {
      id: "a4", title: "Finance Audit — Petty Cash", category: "finance",
      date: "2026-04-25", completed_by: "staff_darren", score: 78, max_score: 100,
      status: "completed", findings: 3, actions: 2, created_at: "2026-04-25",
    },
    {
      id: "a5", title: "Safeguarding & Child Protection Audit", category: "safeguarding",
      date: "2026-06-15", completed_by: null, score: 0, max_score: 100,
      status: "scheduled", findings: 0, actions: 0, created_at: "2026-05-25",
    },
  ];

  it("produces correct overview for Chamberlain House audit data", () => {
    const r = run(oakAudits, STAFF);
    const o = r.overview;

    expect(o.total_audits).toBe(5);
    expect(o.completed_count).toBe(3);
    expect(o.scheduled_count).toBe(2);
    expect(o.in_progress_count).toBe(0);
    expect(o.overdue_count).toBe(0); // both scheduled are in the future

    // Completed scores: 92, 87, 78 → avg = 85.67 → rounds to 86
    expect(o.avg_compliance_score).toBe(86);

    // >=90%: a1(92) = 1
    expect(o.high_performing_count).toBe(1);
    // <70%: a4(78) is above 70 → 0
    expect(o.below_threshold_count).toBe(0);

    // Findings: 1+2+0+3+0 = 6, Actions: 1+2+0+2+0 = 5
    expect(o.total_findings).toBe(6);
    expect(o.total_actions).toBe(5);
    expect(o.unresolved_findings).toBe(1);

    // 5 categories: medication, health_safety, care_records, finance, safeguarding
    expect(o.categories_covered).toBe(5);
  });

  it("produces correct audit profiles for Chamberlain House", () => {
    const r = run(oakAudits, STAFF);

    const a1 = r.audit_profiles.find((p) => p.audit_id === "a1")!;
    expect(a1.compliance_pct).toBe(92);
    expect(a1.completed_by_name).toBe("Darren Laville");
    expect(a1.is_overdue).toBe(false);
    expect(a1.risk_flags).toHaveLength(0);

    const a4 = r.audit_profiles.find((p) => p.audit_id === "a4")!;
    expect(a4.compliance_pct).toBe(78);
    expect(a4.unresolved_findings).toBe(1);
    expect(a4.risk_flags).toContain("unresolved_findings");
  });

  it("produces correct category analysis for Chamberlain House", () => {
    const r = run(oakAudits, STAFF);
    expect(r.category_analysis).toHaveLength(5);
    // Weakest first: scheduled categories have avg 0, then finance 78, health_safety 87, medication 92
    const first = r.category_analysis[0];
    expect(first.avg_compliance_score).toBe(0); // one of the scheduled categories
  });

  it("fires expected alerts for Chamberlain House data", () => {
    const r = run(oakAudits, STAFF);

    // No overdue → no critical
    const criticals = r.alerts.filter((a) => a.severity === "critical");
    expect(criticals).toHaveLength(0);

    // No below 70% → no high for low scores
    const lowScore = r.alerts.filter((a) => a.message.includes("below 70%"));
    expect(lowScore).toHaveLength(0);

    // 1 unresolved finding → high
    const unresolved = r.alerts.filter((a) => a.message.includes("without corresponding"));
    expect(unresolved).toHaveLength(1);

    // a3 is scheduled 2026-06-01 = 7 days from today (within 7 days)
    const upcoming = r.alerts.filter((a) => a.message.includes("within the next 7 days"));
    expect(upcoming).toHaveLength(1);
  });

  it("fires expected ARIA insights for Chamberlain House data", () => {
    const r = run(oakAudits, STAFF);

    // No overdue → no critical insight
    expect(r.insights.filter((i) => i.severity === "critical")).toHaveLength(0);

    // Unresolved findings → warning
    const unresolvedW = r.insights.filter((i) => i.text.includes("corrective actions"));
    expect(unresolvedW).toHaveLength(1);

    // Avg 86 >= 85 → positive high compliance
    const highAvg = r.insights.filter((i) => i.text.includes("Average audit compliance"));
    expect(highAvg).toHaveLength(1);

    // No overdue → positive
    const noOverdue = r.insights.filter((i) => i.text.includes("No audits are overdue"));
    expect(noOverdue).toHaveLength(1);

    // Not all above 80% (a4 = 78%) → no all-above insight
    const allAbove = r.insights.filter((i) => i.text.includes("scored 80% or above"));
    expect(allAbove).toHaveLength(0);

    // 5 categories → diverse coverage positive
    const diverse = r.insights.filter((i) => i.text.includes("distinct areas"));
    expect(diverse).toHaveLength(1);

    // 2 completed in last 30 days (a1 May 11, a2 May 18) → recent activity
    const recent = r.insights.filter((i) => i.text.includes("completed in the last 30 days"));
    expect(recent).toHaveLength(1);
  });
});
