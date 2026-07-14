// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE FORM INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the care form intelligence engine.
// Reg 35, Reg 37, Schedule 1, SCCIF documentation quality.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeCareFormIntelligence,
  daysBetween,
  type CareFormInput,
  type CareFormStatus,
  type CareFormPriority,
  type StaffRef,
} from "../care-form-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `form_${++_id}`;
}

function makeForm(overrides: Partial<CareFormInput> = {}): CareFormInput {
  return {
    id: overrides.id ?? uid(),
    title: "Test Form",
    form_type: "daily_check",
    status: "submitted",
    priority: "medium",
    linked_child_id: null,
    linked_staff_id: null,
    linked_incident_id: null,
    description: "Test description",
    submitted_at: "2026-05-20T10:00:00Z",
    submitted_by: "staff_1",
    reviewed_by: null,
    reviewed_at: null,
    approved_at: null,
    approved_by: null,
    due_date: "2026-05-30",
    tags: [],
    created_at: "2026-05-20T09:00:00Z",
    ...overrides,
  };
}

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_edward", name: "Edward Scott" },
  { id: "staff_ryan", name: "Ryan Clarke" },
  { id: "staff_chervelle", name: "Chervelle Ramirez" },
];

function run(
  forms: CareFormInput[] = [],
  staff: StaffRef[] = STAFF,
  today: string = TODAY,
) {
  return computeCareFormIntelligence({ forms, staff, today });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween calculates correctly", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  it("daysBetween returns 0 for same date", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns zeroed overview with no forms", () => {
    const r = run([]);
    expect(r.overview.total_forms).toBe(0);
    expect(r.overview.completion_rate).toBe(100);
    expect(r.overview.avg_review_days).toBe(0);
    expect(r.form_type_analysis).toHaveLength(0);
    expect(r.form_profiles).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total forms", () => {
    const r = run([makeForm(), makeForm(), makeForm()]);
    expect(r.overview.total_forms).toBe(3);
  });

  it("counts by status", () => {
    const r = run([
      makeForm({ status: "draft", submitted_at: null, submitted_by: null }),
      makeForm({ status: "submitted" }),
      makeForm({ status: "pending_review" }),
      makeForm({ status: "approved" }),
      makeForm({ status: "rejected" }),
      makeForm({ status: "archived" }),
    ]);
    expect(r.overview.draft_count).toBe(1);
    expect(r.overview.submitted_count).toBe(1);
    expect(r.overview.pending_review_count).toBe(1);
    expect(r.overview.approved_count).toBe(1);
    expect(r.overview.rejected_count).toBe(1);
    expect(r.overview.archived_count).toBe(1);
  });

  it("counts overdue forms (past due, not approved/archived)", () => {
    const r = run([
      makeForm({ due_date: "2026-05-20", status: "submitted" }),     // overdue
      makeForm({ due_date: "2026-05-20", status: "approved" }),      // approved → not overdue
      makeForm({ due_date: "2026-05-20", status: "archived" }),      // archived → not overdue
      makeForm({ due_date: "2026-06-01", status: "submitted" }),     // future → not overdue
      makeForm({ due_date: null, status: "submitted" }),              // no due date → not overdue
    ]);
    expect(r.overview.overdue_count).toBe(1);
  });

  it("form due today is not overdue", () => {
    const r = run([makeForm({ due_date: TODAY, status: "submitted" })]);
    expect(r.overview.overdue_count).toBe(0);
  });

  it("counts urgent forms (not approved/archived)", () => {
    const r = run([
      makeForm({ priority: "urgent", status: "submitted" }),
      makeForm({ priority: "urgent", status: "approved" }),    // approved → not counted
      makeForm({ priority: "high", status: "submitted" }),     // not urgent
    ]);
    expect(r.overview.urgent_count).toBe(1);
  });

  it("counts high priority forms (not approved/archived)", () => {
    const r = run([
      makeForm({ priority: "high", status: "submitted" }),
      makeForm({ priority: "high", status: "approved" }),      // approved → not counted
    ]);
    expect(r.overview.high_priority_count).toBe(1);
  });

  it("counts child-linked and incident-linked forms", () => {
    const r = run([
      makeForm({ linked_child_id: "yp_1" }),
      makeForm({ linked_child_id: "yp_2", linked_incident_id: "inc_1" }),
      makeForm({ linked_child_id: null }),
    ]);
    expect(r.overview.child_linked_count).toBe(2);
    expect(r.overview.incident_linked_count).toBe(1);
  });

  it("calculates completion rate (approved / actionable)", () => {
    const r = run([
      makeForm({ status: "approved" }),
      makeForm({ status: "submitted" }),
      makeForm({ status: "draft", submitted_at: null }),   // draft excluded from actionable
      makeForm({ status: "archived" }),                     // archived excluded
    ]);
    // actionable = approved + submitted = 2, approved = 1 → 50%
    expect(r.overview.completion_rate).toBe(50);
  });

  it("calculates average review days", () => {
    const r = run([
      makeForm({
        submitted_at: "2026-05-20T10:00:00Z",
        reviewed_at: "2026-05-22T10:00:00Z",
        reviewed_by: "staff_darren",
      }),
      makeForm({
        submitted_at: "2026-05-18T10:00:00Z",
        reviewed_at: "2026-05-22T10:00:00Z",
        reviewed_by: "staff_darren",
      }),
    ]);
    // (2 + 4) / 2 = 3
    expect(r.overview.avg_review_days).toBe(3);
  });

  it("counts form types used", () => {
    const r = run([
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "daily_check" }),
      makeForm({ form_type: "safeguarding_referral" }),
    ]);
    expect(r.overview.form_types_used).toBe(3);
  });
});

// ── Form Type Analysis ──────────────────────────────────────────────────────

describe("form type analysis", () => {
  it("groups by form type", () => {
    const r = run([
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "risk_assessment", status: "approved" }),
      makeForm({ form_type: "daily_check" }),
    ]);
    expect(r.form_type_analysis).toHaveLength(2);
    const ra = r.form_type_analysis.find((t) => t.form_type === "risk_assessment")!;
    expect(ra.count).toBe(2);
    expect(ra.approved_count).toBe(1);
    expect(ra.pending_count).toBe(1); // submitted counts as pending
  });

  it("sorts by most used first", () => {
    const r = run([
      makeForm({ form_type: "daily_check" }),
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "risk_assessment" }),
    ]);
    expect(r.form_type_analysis[0].form_type).toBe("risk_assessment");
  });

  it("counts overdue and urgent per type", () => {
    const r = run([
      makeForm({ form_type: "risk_assessment", due_date: "2026-05-20", status: "submitted" }),
      makeForm({ form_type: "risk_assessment", priority: "urgent", status: "submitted" }),
    ]);
    const ra = r.form_type_analysis.find((t) => t.form_type === "risk_assessment")!;
    expect(ra.overdue_count).toBe(1);
    expect(ra.urgent_count).toBe(1);
  });
});

// ── Form Profiles ───────────────────────────────────────────────────────────

describe("form profiles", () => {
  it("resolves staff names", () => {
    const r = run([
      makeForm({ submitted_by: "staff_darren", reviewed_by: "staff_edward" }),
    ]);
    expect(r.form_profiles[0].submitted_by_name).toBe("Darren Laville");
    expect(r.form_profiles[0].reviewed_by_name).toBe("Edward Scott");
  });

  it("falls back to staff_id when not in staffMap", () => {
    const r = run([makeForm({ submitted_by: "staff_unknown" })], []);
    expect(r.form_profiles[0].submitted_by_name).toBe("staff_unknown");
  });

  it("marks overdue forms with days_overdue", () => {
    const r = run([makeForm({ due_date: "2026-05-20", status: "submitted" })]);
    expect(r.form_profiles[0].is_overdue).toBe(true);
    expect(r.form_profiles[0].days_overdue).toBe(5);
  });

  it("calculates days since submitted", () => {
    const r = run([makeForm({ submitted_at: "2026-05-20T10:00:00Z" })]);
    expect(r.form_profiles[0].days_since_submitted).toBe(5);
  });

  it("days_since_submitted is null for draft forms", () => {
    const r = run([makeForm({ status: "draft", submitted_at: null })]);
    expect(r.form_profiles[0].days_since_submitted).toBeNull();
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags overdue forms", () => {
    const r = run([makeForm({ due_date: "2026-05-20", status: "submitted" })]);
    expect(r.form_profiles[0].risk_flags).toContain("overdue");
  });

  it("flags urgent incomplete forms", () => {
    const r = run([makeForm({ priority: "urgent", status: "submitted" })]);
    expect(r.form_profiles[0].risk_flags).toContain("urgent_incomplete");
  });

  it("no urgent flag when approved", () => {
    const r = run([makeForm({ priority: "urgent", status: "approved" })]);
    expect(r.form_profiles[0].risk_flags).not.toContain("urgent_incomplete");
  });

  it("flags stale submissions (>7 days)", () => {
    const r = run([makeForm({ status: "submitted", submitted_at: "2026-05-10T10:00:00Z" })]);
    expect(r.form_profiles[0].risk_flags).toContain("stale_submission");
  });

  it("flags review delayed (pending_review >7 days)", () => {
    const r = run([makeForm({ status: "pending_review", submitted_at: "2026-05-10T10:00:00Z" })]);
    expect(r.form_profiles[0].risk_flags).toContain("review_delayed");
  });

  it("flags rejected forms", () => {
    const r = run([makeForm({ status: "rejected" })]);
    expect(r.form_profiles[0].risk_flags).toContain("rejected");
  });

  it("flags incident-linked incomplete forms", () => {
    const r = run([makeForm({ linked_incident_id: "inc_1", status: "submitted" })]);
    expect(r.form_profiles[0].risk_flags).toContain("incident_linked_incomplete");
  });

  it("no incident flag when approved", () => {
    const r = run([makeForm({ linked_incident_id: "inc_1", status: "approved" })]);
    expect(r.form_profiles[0].risk_flags).not.toContain("incident_linked_incomplete");
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: urgent forms not approved", () => {
    const r = run([makeForm({ priority: "urgent", status: "submitted" })]);
    const critical = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("urgent"));
    expect(critical).toHaveLength(1);
  });

  it("critical: overdue forms", () => {
    const r = run([makeForm({ due_date: "2026-05-20", status: "submitted" })]);
    const critical = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("past due"));
    expect(critical).toHaveLength(1);
  });

  it("high: pending review forms", () => {
    const r = run([makeForm({ status: "pending_review" })]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("awaiting manager review"));
    expect(high).toHaveLength(1);
  });

  it("high: stale submitted forms (>7 days)", () => {
    const r = run([makeForm({ status: "submitted", submitted_at: "2026-05-10T10:00:00Z" })]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("more than 7 days"));
    expect(high).toHaveLength(1);
  });

  it("medium: draft forms not submitted", () => {
    const r = run([makeForm({ status: "draft", submitted_at: null })]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("draft"));
    expect(med).toHaveLength(1);
  });

  it("low: no safeguarding forms", () => {
    const r = run([makeForm({ form_type: "daily_check", tags: [] })]);
    const low = r.alerts.filter((a) => a.severity === "low" && a.message.includes("safeguarding"));
    expect(low).toHaveLength(1);
  });

  it("no low alert when safeguarding forms exist", () => {
    const r = run([makeForm({ tags: ["safeguarding"] })]);
    const low = r.alerts.filter((a) => a.severity === "low" && a.message.includes("safeguarding"));
    expect(low).toHaveLength(0);
  });

  it("no low alert when safeguarding_referral type exists", () => {
    const r = run([makeForm({ form_type: "safeguarding_referral" })]);
    const low = r.alerts.filter((a) => a.severity === "low" && a.message.includes("safeguarding"));
    expect(low).toHaveLength(0);
  });
});

// ── Cara Insights ───────────────────────────────────────────────────────────

describe("Cara insights", () => {
  it("critical: overdue forms", () => {
    const r = run([makeForm({ due_date: "2026-05-20", status: "submitted" })]);
    const critical = r.insights.filter((i) => i.severity === "critical" && i.text.includes("past their due date"));
    expect(critical).toHaveLength(1);
  });

  it("critical: urgent incomplete", () => {
    const r = run([makeForm({ priority: "urgent", status: "submitted" })]);
    const critical = r.insights.filter((i) => i.severity === "critical" && i.text.includes("urgent-priority"));
    expect(critical).toHaveLength(1);
  });

  it("warning: low completion rate (<50%)", () => {
    const r = run([
      makeForm({ status: "submitted" }),
      makeForm({ status: "submitted" }),
      makeForm({ status: "submitted" }),
    ]);
    const warnings = r.insights.filter((i) => i.text.includes("completion rate"));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("warning");
  });

  it("warning: stale submissions", () => {
    const r = run([makeForm({ status: "submitted", submitted_at: "2026-05-10T10:00:00Z" })]);
    const warnings = r.insights.filter((i) => i.text.includes("unreviewed"));
    expect(warnings).toHaveLength(1);
  });

  it("positive: high completion rate (>=80%)", () => {
    const r = run([
      makeForm({ status: "approved" }),
      makeForm({ status: "approved" }),
      makeForm({ status: "approved" }),
      makeForm({ status: "approved" }),
      makeForm({ status: "submitted" }),
    ]);
    // 4/5 = 80%
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("completion rate"));
    expect(pos).toHaveLength(1);
  });

  it("positive: no overdue forms", () => {
    const r = run([makeForm({ due_date: "2026-06-01", status: "submitted" })]);
    const pos = r.insights.filter((i) => i.text.includes("No forms are past their due date"));
    expect(pos).toHaveLength(1);
  });

  it("positive: fast review turnaround", () => {
    const r = run([
      makeForm({
        submitted_at: "2026-05-20T10:00:00Z",
        reviewed_at: "2026-05-21T10:00:00Z",
        reviewed_by: "staff_darren",
      }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("review turnaround"));
    expect(pos).toHaveLength(1);
  });

  it("positive: child-linked forms", () => {
    const r = run([
      makeForm({ linked_child_id: "yp_1" }),
      makeForm({ linked_child_id: "yp_2" }),
      makeForm({ linked_child_id: null }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("linked to specific children"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("67%");
  });

  it("positive: diverse form types (>=3)", () => {
    const r = run([
      makeForm({ form_type: "daily_check" }),
      makeForm({ form_type: "risk_assessment" }),
      makeForm({ form_type: "safeguarding_referral" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("form types"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("3 form types");
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  const oakForms: CareFormInput[] = [
    {
      id: "form_001", title: "Alex W — Return from Missing Interview",
      form_type: "return_from_missing", status: "submitted", priority: "high",
      linked_child_id: "yp_alex", linked_staff_id: null, linked_incident_id: null,
      description: "Return interview following MFC-2026-003.",
      submitted_at: "2026-04-02T10:30:00Z", submitted_by: "staff_edward",
      reviewed_by: "staff_darren", reviewed_at: "2026-04-02T14:00:00Z",
      approved_at: null, approved_by: null,
      due_date: "2026-04-02", tags: ["missing", "safeguarding", "yp_alex"],
      created_at: "2026-04-02T10:00:00Z",
    },
    {
      id: "form_002", title: "Casey T — CAMHS Risk Assessment (April 2026)",
      form_type: "risk_assessment", status: "approved", priority: "high",
      linked_child_id: "yp_casey", linked_staff_id: null, linked_incident_id: null,
      description: "Monthly risk assessment updated.",
      submitted_at: "2026-04-14T09:00:00Z", submitted_by: "staff_darren",
      reviewed_by: "staff_darren", reviewed_at: "2026-04-14T09:30:00Z",
      approved_at: "2026-04-14T09:30:00Z", approved_by: "staff_darren",
      due_date: "2026-04-15", tags: ["risk", "camhs", "yp_casey"],
      created_at: "2026-04-13T16:00:00Z",
    },
    {
      id: "form_003", title: "Jordan T — Weekly Supervision Note (Week 15)",
      form_type: "supervision_record", status: "draft", priority: "medium",
      linked_child_id: "yp_jordan", linked_staff_id: "staff_ryan",
      linked_incident_id: null, description: "Weekly therapeutic support session note.",
      submitted_at: null, submitted_by: null,
      reviewed_by: null, reviewed_at: null,
      approved_at: null, approved_by: null,
      due_date: "2026-04-19", tags: ["supervision", "yp_jordan"],
      created_at: "2026-04-17T11:00:00Z",
    },
    {
      id: "form_004", title: "Chamberlain House — Monthly Health & Safety Check",
      form_type: "health_safety_check", status: "pending_review", priority: "medium",
      linked_child_id: null, linked_staff_id: "staff_chervelle",
      linked_incident_id: null, description: "Monthly H&S walkround checklist.",
      submitted_at: "2026-04-15T16:00:00Z", submitted_by: "staff_chervelle",
      reviewed_by: null, reviewed_at: null,
      approved_at: null, approved_by: null,
      due_date: "2026-04-16", tags: ["health_safety", "maintenance"],
      created_at: "2026-04-15T15:00:00Z",
    },
    {
      id: "form_005", title: "Alex W — Contextual Safeguarding Referral",
      form_type: "safeguarding_referral", status: "submitted", priority: "urgent",
      linked_child_id: "yp_alex", linked_staff_id: null,
      linked_incident_id: "inc_004", description: "MASH referral following disclosure.",
      submitted_at: "2026-04-14T20:00:00Z", submitted_by: "staff_darren",
      reviewed_by: null, reviewed_at: null,
      approved_at: null, approved_by: null,
      due_date: "2026-04-14", tags: ["safeguarding", "ce", "mash", "yp_alex", "urgent"],
      created_at: "2026-04-14T19:30:00Z",
    },
  ];

  it("produces correct overview for Chamberlain House care form data", () => {
    const r = run(oakForms, STAFF);
    const o = r.overview;

    expect(o.total_forms).toBe(5);
    expect(o.draft_count).toBe(1);      // form_003
    expect(o.submitted_count).toBe(2);   // form_001, form_005
    expect(o.pending_review_count).toBe(1); // form_004
    expect(o.approved_count).toBe(1);    // form_002
    expect(o.rejected_count).toBe(0);
    expect(o.archived_count).toBe(0);

    // Overdue: form_001 (due 2026-04-02, submitted), form_003 (due 2026-04-19, draft — overdue since not approved),
    // form_004 (due 2026-04-16, pending_review), form_005 (due 2026-04-14, submitted)
    // form_003 is draft with due_date 2026-04-19, NOT approved/archived → overdue
    expect(o.overdue_count).toBe(4);

    // Urgent (not approved/archived): form_005 = 1
    expect(o.urgent_count).toBe(1);

    // High priority (not approved/archived): form_001 = 1
    expect(o.high_priority_count).toBe(1);

    // Child-linked: form_001 (yp_alex), form_002 (yp_casey), form_003 (yp_jordan), form_005 (yp_alex) = 4
    expect(o.child_linked_count).toBe(4);

    // Incident-linked: form_005 = 1
    expect(o.incident_linked_count).toBe(1);

    // Actionable = total - draft - archived = 5 - 1 - 0 = 4. Approved = 1. Rate = 25%
    expect(o.completion_rate).toBe(25);

    // Reviewed forms: form_001 (submitted → reviewed same day ≈ 0d), form_002 (submitted → reviewed same day ≈ 0d)
    expect(o.avg_review_days).toBe(0);

    // 5 unique form types
    expect(o.form_types_used).toBe(5);
  });

  it("fires expected alerts for Chamberlain House data", () => {
    const r = run(oakForms, STAFF);

    // Critical: 1 urgent form (form_005)
    const urgentAlert = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("urgent"));
    expect(urgentAlert).toHaveLength(1);

    // Critical: 4 overdue forms
    const overdueAlert = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("past due"));
    expect(overdueAlert).toHaveLength(1);

    // High: 1 pending review (form_004)
    const pendingAlert = r.alerts.filter((a) => a.severity === "high" && a.message.includes("awaiting manager review"));
    expect(pendingAlert).toHaveLength(1);

    // High: stale submissions (form_001 submitted 2026-04-02, form_005 submitted 2026-04-14 → both >7 days)
    const staleAlert = r.alerts.filter((a) => a.severity === "high" && a.message.includes("more than 7 days"));
    expect(staleAlert).toHaveLength(1);

    // Medium: 1 draft (form_003)
    const draftAlert = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("draft"));
    expect(draftAlert).toHaveLength(1);

    // No low safeguarding alert (form_005 has safeguarding tag)
    const safeguardingLow = r.alerts.filter((a) => a.severity === "low" && a.message.includes("safeguarding"));
    expect(safeguardingLow).toHaveLength(0);
  });

  it("fires expected Cara insights for Chamberlain House data", () => {
    const r = run(oakForms, STAFF);

    // Critical: 4 overdue
    const overdueCrit = r.insights.filter((i) => i.severity === "critical" && i.text.includes("past their due date"));
    expect(overdueCrit).toHaveLength(1);

    // Critical: 1 urgent incomplete
    const urgentCrit = r.insights.filter((i) => i.severity === "critical" && i.text.includes("urgent-priority"));
    expect(urgentCrit).toHaveLength(1);

    // Warning: completion rate 25% < 50%
    const lowCompW = r.insights.filter((i) => i.severity === "warning" && i.text.includes("completion rate"));
    expect(lowCompW).toHaveLength(1);

    // Warning: stale submissions
    const staleW = r.insights.filter((i) => i.text.includes("unreviewed"));
    expect(staleW).toHaveLength(1);

    // Positive: child-linked 80% (4/5)
    const childPos = r.insights.filter((i) => i.text.includes("linked to specific children"));
    expect(childPos).toHaveLength(1);
    expect(childPos[0].text).toContain("80%");

    // Positive: 5 form types >= 3
    const diversePos = r.insights.filter((i) => i.text.includes("form types"));
    expect(diversePos).toHaveLength(1);
    expect(diversePos[0].text).toContain("5 form types");
  });
});
