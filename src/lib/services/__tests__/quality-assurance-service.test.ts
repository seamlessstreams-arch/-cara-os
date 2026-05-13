// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE SERVICE TESTS
// Pure-function unit tests for QA metrics computation, alert identification,
// and constant validation. Covers audit ratings, improvement plans, and
// recommendation tracking across all edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  AUDIT_TYPES,
  AUDIT_RATINGS,
  IMPROVEMENT_SOURCES,
} from "../quality-assurance-service";
import { _testing } from "../quality-assurance-service";

const {
  computeQAMetrics,
  identifyQAAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal QualityAudit for testing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAudit(
  overrides: Record<string, unknown> = {},
): any {
  return {
    id: "id" in overrides ? (overrides.id as string) : "audit-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    audit_type: "audit_type" in overrides ? (overrides.audit_type as string) : "reg45_quality",
    audit_date: "audit_date" in overrides ? (overrides.audit_date as string) : "2026-03-15",
    auditor: "auditor" in overrides ? (overrides.auditor as string) : "Jane Smith",
    areas_audited: "areas_audited" in overrides
      ? (overrides.areas_audited as { area: string; rating: string; findings: string; evidence_reviewed: string[] }[])
      : [{ area: "Care Planning", rating: "good", findings: "Satisfactory", evidence_reviewed: ["files"] }],
    overall_rating: "overall_rating" in overrides ? (overrides.overall_rating as string) : "good",
    strengths: "strengths" in overrides ? (overrides.strengths as string[]) : ["Strong leadership"],
    areas_for_improvement: "areas_for_improvement" in overrides ? (overrides.areas_for_improvement as string[]) : ["Record keeping"],
    recommendations: "recommendations" in overrides
      ? (overrides.recommendations as { description: string; priority: string; assigned_to: string; target_date: string; status: string }[])
      : [],
    previous_actions_reviewed: "previous_actions_reviewed" in overrides ? (overrides.previous_actions_reviewed as boolean) : true,
    previous_actions_status: "previous_actions_status" in overrides ? (overrides.previous_actions_status as string) : "all_complete",
    next_audit_date: "next_audit_date" in overrides ? (overrides.next_audit_date as string | null) : null,
    status: "status" in overrides ? (overrides.status as string) : "completed",
    created_at: "created_at" in overrides ? (overrides.created_at as string) : "2026-03-15T00:00:00Z",
    updated_at: "updated_at" in overrides ? (overrides.updated_at as string) : "2026-03-15T00:00:00Z",
  };
}

/** Build a minimal ImprovementPlan for testing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeImprovementPlan(
  overrides: Record<string, unknown> = {},
): any {
  return {
    id: "id" in overrides ? (overrides.id as string) : "plan-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    title: "title" in overrides ? (overrides.title as string) : "Care Quality Improvement",
    source: "source" in overrides ? (overrides.source as string) : "Internal audit",
    created_date: "created_date" in overrides ? (overrides.created_date as string) : "2026-01-10",
    target_completion: "target_completion" in overrides ? (overrides.target_completion as string) : "2026-06-30",
    actions: "actions" in overrides
      ? (overrides.actions as { description: string; responsible: string; target_date: string; status: string; evidence?: string; completion_date?: string }[])
      : [{ description: "Update records", responsible: "Staff A", target_date: "2026-03-01", status: "in_progress" }],
    status: "status" in overrides ? (overrides.status as string) : "active",
    progress_percentage: "progress_percentage" in overrides ? (overrides.progress_percentage as number) : 50,
    review_date: "review_date" in overrides ? (overrides.review_date as string | null) : null,
    reviewed_by: "reviewed_by" in overrides ? (overrides.reviewed_by as string | null) : null,
    created_at: "created_at" in overrides ? (overrides.created_at as string) : "2026-01-10T00:00:00Z",
    updated_at: "updated_at" in overrides ? (overrides.updated_at as string) : "2026-01-10T00:00:00Z",
  };
}

/** Build a minimal AuditRecommendation for testing. */
function makeRecommendation(
  overrides: Record<string, unknown> = {},
): { description: string; priority: string; assigned_to: string; target_date: string; status: string } {
  return {
    description: "description" in overrides ? (overrides.description as string) : "Improve daily recording",
    priority: "priority" in overrides ? (overrides.priority as string) : "high",
    assigned_to: "assigned_to" in overrides ? (overrides.assigned_to as string) : "Staff A",
    target_date: "target_date" in overrides ? (overrides.target_date as string) : "2026-04-30",
    status: "status" in overrides ? (overrides.status as string) : "pending",
  };
}

/** Build a minimal ImprovementAction for testing. */
function makeImprovementAction(
  overrides: Record<string, unknown> = {},
): { description: string; responsible: string; target_date: string; status: string; evidence?: string; completion_date?: string } {
  return {
    description: "description" in overrides ? (overrides.description as string) : "Train staff on new policy",
    responsible: "responsible" in overrides ? (overrides.responsible as string) : "Manager B",
    target_date: "target_date" in overrides ? (overrides.target_date as string) : "2026-04-15",
    status: "status" in overrides ? (overrides.status as string) : "not_started",
    evidence: "evidence" in overrides ? (overrides.evidence as string | undefined) : undefined,
    completion_date: "completion_date" in overrides ? (overrides.completion_date as string | undefined) : undefined,
  };
}

// ── AUDIT_TYPES constant ──────────────────────────────────────────────────

describe("AUDIT_TYPES", () => {
  it("contains exactly 10 audit types", () => {
    expect(AUDIT_TYPES).toHaveLength(10);
  });

  it("each entry has type, label, frequency, and regulation fields", () => {
    for (const entry of AUDIT_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.frequency).toBe("string");
      expect(typeof entry.regulation).toBe("string");
      expect(entry.type.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique type values", () => {
    const types = AUDIT_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("includes reg45_quality type with correct label", () => {
    const reg45 = AUDIT_TYPES.find((t) => t.type === "reg45_quality");
    expect(reg45).toBeDefined();
    expect(reg45!.label).toBe("Reg 45 Quality of Care Review");
    expect(reg45!.frequency).toBe("6-monthly");
    expect(reg45!.regulation).toBe("Reg 45");
  });

  it("includes safeguarding type referencing Reg 12", () => {
    const sg = AUDIT_TYPES.find((t) => t.type === "safeguarding");
    expect(sg).toBeDefined();
    expect(sg!.regulation).toBe("Reg 12");
    expect(sg!.frequency).toBe("Quarterly");
  });

  it("includes medication type referencing Reg 23", () => {
    const med = AUDIT_TYPES.find((t) => t.type === "medication");
    expect(med).toBeDefined();
    expect(med!.regulation).toBe("Reg 23");
    expect(med!.frequency).toBe("Monthly");
  });

  it("includes health_safety type referencing Reg 25", () => {
    const hs = AUDIT_TYPES.find((t) => t.type === "health_safety");
    expect(hs).toBeDefined();
    expect(hs!.regulation).toBe("Reg 25");
  });

  it("includes children_participation type referencing Reg 7/16", () => {
    const cp = AUDIT_TYPES.find((t) => t.type === "children_participation");
    expect(cp).toBeDefined();
    expect(cp!.regulation).toBe("Reg 7/16");
  });

  it("includes complaints type referencing Reg 39", () => {
    const c = AUDIT_TYPES.find((t) => t.type === "complaints");
    expect(c).toBeDefined();
    expect(c!.regulation).toBe("Reg 39");
  });

  it("includes staff_files type with 6-monthly frequency", () => {
    const sf = AUDIT_TYPES.find((t) => t.type === "staff_files");
    expect(sf).toBeDefined();
    expect(sf!.frequency).toBe("6-monthly");
    expect(sf!.regulation).toBe("Reg 32/33");
  });
});

// ── AUDIT_RATINGS constant ────────────────────────────────────────────────

describe("AUDIT_RATINGS", () => {
  it("contains exactly 4 ratings", () => {
    expect(AUDIT_RATINGS).toHaveLength(4);
  });

  it("each entry has rating, label, and value fields", () => {
    for (const entry of AUDIT_RATINGS) {
      expect(typeof entry.rating).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.value).toBe("number");
    }
  });

  it("has unique rating strings", () => {
    const ratings = AUDIT_RATINGS.map((r) => r.rating);
    expect(new Set(ratings).size).toBe(ratings.length);
  });

  it("has unique numeric values", () => {
    const values = AUDIT_RATINGS.map((r) => r.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("maps outstanding to value 4", () => {
    const r = AUDIT_RATINGS.find((r) => r.rating === "outstanding");
    expect(r).toBeDefined();
    expect(r!.value).toBe(4);
    expect(r!.label).toBe("Outstanding");
  });

  it("maps good to value 3", () => {
    const r = AUDIT_RATINGS.find((r) => r.rating === "good");
    expect(r).toBeDefined();
    expect(r!.value).toBe(3);
    expect(r!.label).toBe("Good");
  });

  it("maps requires_improvement to value 2", () => {
    const r = AUDIT_RATINGS.find((r) => r.rating === "requires_improvement");
    expect(r).toBeDefined();
    expect(r!.value).toBe(2);
    expect(r!.label).toBe("Requires Improvement");
  });

  it("maps inadequate to value 1", () => {
    const r = AUDIT_RATINGS.find((r) => r.rating === "inadequate");
    expect(r).toBeDefined();
    expect(r!.value).toBe(1);
    expect(r!.label).toBe("Inadequate");
  });

  it("values are ordered descending from outstanding to inadequate", () => {
    expect(AUDIT_RATINGS[0].value).toBeGreaterThan(AUDIT_RATINGS[1].value);
    expect(AUDIT_RATINGS[1].value).toBeGreaterThan(AUDIT_RATINGS[2].value);
    expect(AUDIT_RATINGS[2].value).toBeGreaterThan(AUDIT_RATINGS[3].value);
  });
});

// ── IMPROVEMENT_SOURCES constant ──────────────────────────────────────────

describe("IMPROVEMENT_SOURCES", () => {
  it("contains exactly 9 sources", () => {
    expect(IMPROVEMENT_SOURCES).toHaveLength(9);
  });

  it("all entries are non-empty strings", () => {
    for (const source of IMPROVEMENT_SOURCES) {
      expect(typeof source).toBe("string");
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it("has unique entries", () => {
    expect(new Set(IMPROVEMENT_SOURCES).size).toBe(IMPROVEMENT_SOURCES.length);
  });

  it("includes Reg 45 review", () => {
    expect(IMPROVEMENT_SOURCES).toContain("Reg 45 review");
  });

  it("includes Ofsted inspection", () => {
    expect(IMPROVEMENT_SOURCES).toContain("Ofsted inspection");
  });

  it("includes Reg 44 visit", () => {
    expect(IMPROVEMENT_SOURCES).toContain("Reg 44 visit");
  });

  it("includes Children's feedback", () => {
    expect(IMPROVEMENT_SOURCES).toContain("Children's feedback");
  });

  it("includes Serious incident review", () => {
    expect(IMPROVEMENT_SOURCES).toContain("Serious incident review");
  });

  it("includes External consultation", () => {
    expect(IMPROVEMENT_SOURCES).toContain("External consultation");
  });
});

// ── computeQAMetrics ──────────────────────────────────────────────────────

describe("computeQAMetrics", () => {
  it("returns zeroed metrics when both arrays are empty", () => {
    const result = computeQAMetrics([], []);
    expect(result.total_audits).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.avg_rating).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.total_recommendations).toBe(0);
    expect(result.recommendations_completed).toBe(0);
    expect(result.recommendations_overdue).toBe(0);
    expect(result.recommendation_completion_rate).toBe(0);
    expect(result.improvement_plans_active).toBe(0);
    expect(result.improvement_plans_completed).toBe(0);
    expect(result.avg_plan_progress).toBe(0);
  });

  it("counts total audits correctly", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "planned" }),
      makeAudit({ id: "a3", status: "overdue" }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.total_audits).toBe(3);
  });

  it("counts completed and overdue audits separately", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "completed" }),
      makeAudit({ id: "a3", status: "overdue" }),
      makeAudit({ id: "a4", status: "in_progress" }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.completed).toBe(2);
    expect(result.overdue).toBe(1);
  });

  it("computes avg_rating from completed audits only", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", overall_rating: "outstanding" }), // 4
      makeAudit({ id: "a2", status: "completed", overall_rating: "good" }),         // 3
      makeAudit({ id: "a3", status: "planned", overall_rating: "inadequate" }),      // not counted
    ];
    const result = computeQAMetrics(audits, []);
    // (4 + 3) / 2 = 3.5
    expect(result.avg_rating).toBe(3.5);
  });

  it("returns avg_rating of 0 when no completed audits exist", () => {
    const audits = [
      makeAudit({ id: "a1", status: "planned" }),
      makeAudit({ id: "a2", status: "in_progress" }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.avg_rating).toBe(0);
  });

  it("rounds avg_rating to 2 decimal places", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", overall_rating: "outstanding" }), // 4
      makeAudit({ id: "a2", status: "completed", overall_rating: "good" }),         // 3
      makeAudit({ id: "a3", status: "completed", overall_rating: "inadequate" }),   // 1
    ];
    const result = computeQAMetrics(audits, []);
    // (4 + 3 + 1) / 3 = 2.666... => 2.67
    expect(result.avg_rating).toBe(2.67);
  });

  it("ignores audits with unrecognised overall_rating for avg calculation", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", overall_rating: "good" }),       // 3
      makeAudit({ id: "a2", status: "completed", overall_rating: "unknown_val" }), // skipped
    ];
    const result = computeQAMetrics(audits, []);
    // Only 'good' counted: 3 / 1 = 3
    expect(result.avg_rating).toBe(3);
  });

  it("groups audits by type with correct counts", () => {
    const audits = [
      makeAudit({ id: "a1", audit_type: "medication", status: "completed", overall_rating: "good" }),
      makeAudit({ id: "a2", audit_type: "medication", status: "planned" }),
      makeAudit({ id: "a3", audit_type: "safeguarding", status: "completed", overall_rating: "outstanding" }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.by_type.medication.count).toBe(2);
    expect(result.by_type.safeguarding.count).toBe(1);
  });

  it("computes per-type avg_rating from completed audits only", () => {
    const audits = [
      makeAudit({ id: "a1", audit_type: "medication", status: "completed", overall_rating: "outstanding" }), // 4
      makeAudit({ id: "a2", audit_type: "medication", status: "completed", overall_rating: "good" }),         // 3
      makeAudit({ id: "a3", audit_type: "medication", status: "planned", overall_rating: "inadequate" }),      // not counted
      makeAudit({ id: "a4", audit_type: "safeguarding", status: "completed", overall_rating: "inadequate" }), // 1
    ];
    const result = computeQAMetrics(audits, []);
    // medication: (4 + 3) / 2 = 3.5
    expect(result.by_type.medication.avg_rating).toBe(3.5);
    // safeguarding: 1 / 1 = 1
    expect(result.by_type.safeguarding.avg_rating).toBe(1);
  });

  it("returns 0 for per-type avg_rating when no completed audits of that type", () => {
    const audits = [
      makeAudit({ id: "a1", audit_type: "medication", status: "planned" }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.by_type.medication.avg_rating).toBe(0);
  });

  it("counts recommendations across all audits", () => {
    const audits = [
      makeAudit({
        id: "a1",
        recommendations: [
          makeRecommendation({ status: "completed" }),
          makeRecommendation({ status: "pending" }),
        ],
      }),
      makeAudit({
        id: "a2",
        recommendations: [
          makeRecommendation({ status: "overdue" }),
        ],
      }),
    ];
    const result = computeQAMetrics(audits, []);
    expect(result.total_recommendations).toBe(3);
    expect(result.recommendations_completed).toBe(1);
    expect(result.recommendations_overdue).toBe(1);
  });

  it("computes recommendation_completion_rate as rounded percentage", () => {
    const audits = [
      makeAudit({
        id: "a1",
        recommendations: [
          makeRecommendation({ status: "completed" }),
          makeRecommendation({ status: "completed" }),
          makeRecommendation({ status: "pending" }),
        ],
      }),
    ];
    const result = computeQAMetrics(audits, []);
    // 2 / 3 = 66.666...% => 67
    expect(result.recommendation_completion_rate).toBe(67);
  });

  it("returns 0 recommendation_completion_rate when no recommendations exist", () => {
    const audits = [makeAudit({ id: "a1", recommendations: [] })];
    const result = computeQAMetrics(audits, []);
    expect(result.recommendation_completion_rate).toBe(0);
  });

  it("counts active and completed improvement plans", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "active", progress_percentage: 60 }),
      makeImprovementPlan({ id: "p2", status: "completed", progress_percentage: 100 }),
      makeImprovementPlan({ id: "p3", status: "active", progress_percentage: 40 }),
      makeImprovementPlan({ id: "p4", status: "overdue", progress_percentage: 20 }),
    ];
    const result = computeQAMetrics([], plans);
    expect(result.improvement_plans_active).toBe(2);
    expect(result.improvement_plans_completed).toBe(1);
  });

  it("computes avg_plan_progress from active plans only", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "active", progress_percentage: 60 }),
      makeImprovementPlan({ id: "p2", status: "active", progress_percentage: 40 }),
      makeImprovementPlan({ id: "p3", status: "completed", progress_percentage: 100 }),
    ];
    const result = computeQAMetrics([], plans);
    // (60 + 40) / 2 = 50
    expect(result.avg_plan_progress).toBe(50);
  });

  it("returns 0 avg_plan_progress when no active plans exist", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "completed", progress_percentage: 100 }),
    ];
    const result = computeQAMetrics([], plans);
    expect(result.avg_plan_progress).toBe(0);
  });

  it("rounds avg_plan_progress to nearest integer", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "active", progress_percentage: 33 }),
      makeImprovementPlan({ id: "p2", status: "active", progress_percentage: 34 }),
    ];
    const result = computeQAMetrics([], plans);
    // (33 + 34) / 2 = 33.5 => 34
    expect(result.avg_plan_progress).toBe(34);
  });

  it("handles a single completed audit with all rating types", () => {
    const audit = makeAudit({ id: "a1", status: "completed", overall_rating: "requires_improvement" });
    const result = computeQAMetrics([audit], []);
    expect(result.avg_rating).toBe(2);
  });
});

// ── identifyQAAlerts ──────────────────────────────────────────────────────

describe("identifyQAAlerts", () => {
  it("returns empty array when there are no issues", () => {
    const audits = [makeAudit({ status: "completed", overall_rating: "good", previous_actions_reviewed: true })];
    const plans = [makeImprovementPlan({ status: "active", progress_percentage: 50 })];
    const alerts = identifyQAAlerts(audits, plans);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when both arrays are empty", () => {
    const alerts = identifyQAAlerts([], []);
    expect(alerts).toEqual([]);
  });

  // overdue_audit
  it("generates overdue_audit alert for a single overdue audit", () => {
    const audits = [makeAudit({ status: "overdue" })];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "overdue_audit");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("1 quality audit overdue");
    expect(alert!.message).toContain("Reg 45");
  });

  it("uses plural wording for multiple overdue audits", () => {
    const audits = [
      makeAudit({ id: "a1", status: "overdue" }),
      makeAudit({ id: "a2", status: "overdue" }),
      makeAudit({ id: "a3", status: "overdue" }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "overdue_audit");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("3 quality audits overdue");
  });

  it("does not generate overdue_audit alert when no audits are overdue", () => {
    const audits = [makeAudit({ status: "completed" }), makeAudit({ id: "a2", status: "planned" })];
    const alerts = identifyQAAlerts(audits, []);
    expect(alerts.find((a) => a.type === "overdue_audit")).toBeUndefined();
  });

  // inadequate_audit
  it("generates inadequate_audit alert for completed audit rated inadequate", () => {
    const audits = [makeAudit({ status: "completed", overall_rating: "inadequate", audit_type: "medication", audit_date: "2026-04-01" })];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "inadequate_audit");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.message).toContain("Medication Audit");
    expect(alert!.message).toContain("Inadequate");
    expect(alert!.message).toContain("2026-04-01");
  });

  it("generates one alert per inadequate audit", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", overall_rating: "inadequate", audit_type: "medication" }),
      makeAudit({ id: "a2", status: "completed", overall_rating: "inadequate", audit_type: "safeguarding" }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const inadequateAlerts = alerts.filter((a) => a.type === "inadequate_audit");
    expect(inadequateAlerts).toHaveLength(2);
  });

  it("does not flag inadequate if audit status is not completed", () => {
    const audits = [makeAudit({ status: "planned", overall_rating: "inadequate" })];
    const alerts = identifyQAAlerts(audits, []);
    expect(alerts.find((a) => a.type === "inadequate_audit")).toBeUndefined();
  });

  it("falls back to audit_type string when type label is not found", () => {
    const audits = [makeAudit({ status: "completed", overall_rating: "inadequate", audit_type: "custom_unknown" })];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "inadequate_audit");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("custom_unknown");
  });

  // overdue_recommendations
  it("generates overdue_recommendations alert when recommendations are overdue", () => {
    const audits = [
      makeAudit({
        recommendations: [
          makeRecommendation({ status: "overdue" }),
        ],
      }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "overdue_recommendations");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("1 audit recommendation overdue");
  });

  it("uses plural wording for multiple overdue recommendations", () => {
    const audits = [
      makeAudit({
        recommendations: [
          makeRecommendation({ status: "overdue" }),
          makeRecommendation({ status: "overdue" }),
          makeRecommendation({ status: "completed" }),
        ],
      }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "overdue_recommendations");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("2 audit recommendations overdue");
  });

  it("does not generate overdue_recommendations when none are overdue", () => {
    const audits = [
      makeAudit({
        recommendations: [
          makeRecommendation({ status: "completed" }),
          makeRecommendation({ status: "pending" }),
        ],
      }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    expect(alerts.find((a) => a.type === "overdue_recommendations")).toBeUndefined();
  });

  // overdue_plan
  it("generates overdue_plan alert for overdue improvement plans", () => {
    const plans = [makeImprovementPlan({ status: "overdue" })];
    const alerts = identifyQAAlerts([], plans);
    const alert = alerts.find((a) => a.type === "overdue_plan");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("1 improvement plan overdue");
    expect(alert!.message).toContain("responsible individual");
  });

  it("uses plural wording for multiple overdue plans", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "overdue" }),
      makeImprovementPlan({ id: "p2", status: "overdue" }),
    ];
    const alerts = identifyQAAlerts([], plans);
    const alert = alerts.find((a) => a.type === "overdue_plan");
    expect(alert!.message).toContain("2 improvement plans overdue");
  });

  it("does not generate overdue_plan when no plans are overdue", () => {
    const plans = [makeImprovementPlan({ status: "active" })];
    const alerts = identifyQAAlerts([], plans);
    expect(alerts.find((a) => a.type === "overdue_plan")).toBeUndefined();
  });

  // stalled_plan
  it("generates stalled_plan alert for active plans below 25% progress", () => {
    const plans = [makeImprovementPlan({ status: "active", progress_percentage: 10 })];
    const alerts = identifyQAAlerts([], plans);
    const alert = alerts.find((a) => a.type === "stalled_plan");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("1 active improvement plan");
    expect(alert!.message).toContain("below 25% progress");
  });

  it("does not flag stalled_plan at exactly 25% progress", () => {
    const plans = [makeImprovementPlan({ status: "active", progress_percentage: 25 })];
    const alerts = identifyQAAlerts([], plans);
    expect(alerts.find((a) => a.type === "stalled_plan")).toBeUndefined();
  });

  it("flags stalled_plan at 24% progress (boundary)", () => {
    const plans = [makeImprovementPlan({ status: "active", progress_percentage: 24 })];
    const alerts = identifyQAAlerts([], plans);
    expect(alerts.find((a) => a.type === "stalled_plan")).toBeDefined();
  });

  it("flags stalled_plan at 0% progress", () => {
    const plans = [makeImprovementPlan({ status: "active", progress_percentage: 0 })];
    const alerts = identifyQAAlerts([], plans);
    expect(alerts.find((a) => a.type === "stalled_plan")).toBeDefined();
  });

  it("does not flag stalled_plan for non-active plans below 25%", () => {
    const plans = [makeImprovementPlan({ status: "overdue", progress_percentage: 10 })];
    const alerts = identifyQAAlerts([], plans);
    expect(alerts.find((a) => a.type === "stalled_plan")).toBeUndefined();
  });

  it("uses plural wording for multiple stalled plans", () => {
    const plans = [
      makeImprovementPlan({ id: "p1", status: "active", progress_percentage: 5 }),
      makeImprovementPlan({ id: "p2", status: "active", progress_percentage: 15 }),
    ];
    const alerts = identifyQAAlerts([], plans);
    const alert = alerts.find((a) => a.type === "stalled_plan");
    expect(alert!.message).toContain("2 active improvement plans");
  });

  // actions_not_reviewed
  it("generates actions_not_reviewed alert for completed audits that did not review previous actions", () => {
    const audits = [makeAudit({ status: "completed", previous_actions_reviewed: false })];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "actions_not_reviewed");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("low");
    expect(alert!.message).toContain("1 completed audit");
    expect(alert!.message).toContain("did not review previous actions");
  });

  it("uses plural wording for multiple audits without review", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", previous_actions_reviewed: false }),
      makeAudit({ id: "a2", status: "completed", previous_actions_reviewed: false }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "actions_not_reviewed");
    expect(alert!.message).toContain("2 completed audits");
  });

  it("does not flag actions_not_reviewed when all completed audits reviewed previous actions", () => {
    const audits = [makeAudit({ status: "completed", previous_actions_reviewed: true })];
    const alerts = identifyQAAlerts(audits, []);
    expect(alerts.find((a) => a.type === "actions_not_reviewed")).toBeUndefined();
  });

  it("does not flag actions_not_reviewed for non-completed audits", () => {
    const audits = [makeAudit({ status: "planned", previous_actions_reviewed: false })];
    const alerts = identifyQAAlerts(audits, []);
    expect(alerts.find((a) => a.type === "actions_not_reviewed")).toBeUndefined();
  });

  // Combined scenario
  it("generates multiple alert types simultaneously", () => {
    const audits = [
      makeAudit({ id: "a1", status: "overdue" }),
      makeAudit({ id: "a2", status: "completed", overall_rating: "inadequate", audit_type: "safeguarding" }),
      makeAudit({
        id: "a3",
        status: "completed",
        previous_actions_reviewed: false,
        recommendations: [makeRecommendation({ status: "overdue" })],
      }),
    ];
    const plans = [
      makeImprovementPlan({ id: "p1", status: "overdue" }),
      makeImprovementPlan({ id: "p2", status: "active", progress_percentage: 5 }),
    ];
    const alerts = identifyQAAlerts(audits, plans);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("overdue_audit");
    expect(types).toContain("inadequate_audit");
    expect(types).toContain("overdue_recommendations");
    expect(types).toContain("overdue_plan");
    expect(types).toContain("stalled_plan");
    expect(types).toContain("actions_not_reviewed");
    expect(alerts.length).toBe(6);
  });

  it("aggregates overdue recommendations across multiple audits", () => {
    const audits = [
      makeAudit({
        id: "a1",
        recommendations: [makeRecommendation({ status: "overdue" })],
      }),
      makeAudit({
        id: "a2",
        recommendations: [
          makeRecommendation({ status: "overdue" }),
          makeRecommendation({ status: "overdue" }),
        ],
      }),
    ];
    const alerts = identifyQAAlerts(audits, []);
    const alert = alerts.find((a) => a.type === "overdue_recommendations");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("3 audit recommendations overdue");
  });
});
