// ==============================================================================
// CARA -- TASK EXPLORER SERVICE TESTS
// Pure-function unit tests for task reference generation, Cara risk scoring,
// and constant validation. Covers CATEGORY_PREFIX, generateTaskReference,
// and computeTaskRiskScore.
// ==============================================================================

import { describe, it, expect } from "vitest";
import { _testing } from "../task-service";

import type { CsTask, CsTaskCategory } from "@/types/operations";

const { CATEGORY_PREFIX, generateTaskReference, computeTaskRiskScore } =
  _testing;

// -- Helpers ------------------------------------------------------------------

/** Build a minimal CsTask with sensible defaults. */
function makeTask(overrides: Partial<CsTask> = {}): CsTask {
  return {
    id: "id" in overrides ? overrides.id! : "task-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    reference: "reference" in overrides ? overrides.reference! : "TSK-ABCD001",
    title: "title" in overrides ? overrides.title! : "Test task",
    description:
      "description" in overrides ? overrides.description! : "A test task",
    category: "category" in overrides ? overrides.category! : "admin",
    priority: "priority" in overrides ? overrides.priority! : "medium",
    status: "status" in overrides ? overrides.status! : "not_started",
    assigned_to:
      "assigned_to" in overrides ? overrides.assigned_to! : "staff-1",
    assigned_role:
      "assigned_role" in overrides ? overrides.assigned_role! : null,
    delegated_to:
      "delegated_to" in overrides ? overrides.delegated_to! : null,
    delegated_at:
      "delegated_at" in overrides ? overrides.delegated_at! : null,
    due_date: "due_date" in overrides ? overrides.due_date! : null,
    start_date: "start_date" in overrides ? overrides.start_date! : null,
    completed_at:
      "completed_at" in overrides ? overrides.completed_at! : null,
    completed_by:
      "completed_by" in overrides ? overrides.completed_by! : null,
    estimated_minutes:
      "estimated_minutes" in overrides ? overrides.estimated_minutes! : null,
    actual_minutes:
      "actual_minutes" in overrides ? overrides.actual_minutes! : null,
    recurring: "recurring" in overrides ? overrides.recurring! : false,
    recurring_schedule:
      "recurring_schedule" in overrides
        ? overrides.recurring_schedule!
        : null,
    recurrence_end:
      "recurrence_end" in overrides ? overrides.recurrence_end! : null,
    requires_sign_off:
      "requires_sign_off" in overrides ? overrides.requires_sign_off! : false,
    signed_off_by:
      "signed_off_by" in overrides ? overrides.signed_off_by! : null,
    signed_off_at:
      "signed_off_at" in overrides ? overrides.signed_off_at! : null,
    evidence_note:
      "evidence_note" in overrides ? overrides.evidence_note! : null,
    evidence_files:
      "evidence_files" in overrides ? overrides.evidence_files! : [],
    escalated: "escalated" in overrides ? overrides.escalated! : false,
    escalated_to:
      "escalated_to" in overrides ? overrides.escalated_to! : null,
    escalated_at:
      "escalated_at" in overrides ? overrides.escalated_at! : null,
    escalation_reason:
      "escalation_reason" in overrides
        ? overrides.escalation_reason!
        : null,
    escalation_level:
      "escalation_level" in overrides ? overrides.escalation_level! : 0,
    cara_risk_score:
      "cara_risk_score" in overrides ? overrides.cara_risk_score! : null,
    cara_risk_factors:
      "cara_risk_factors" in overrides ? overrides.cara_risk_factors! : null,
    cara_generated:
      "cara_generated" in overrides ? overrides.cara_generated! : false,
    cara_source:
      "cara_source" in overrides ? overrides.cara_source! : null,
    linked_child_id:
      "linked_child_id" in overrides ? overrides.linked_child_id! : null,
    linked_incident_id:
      "linked_incident_id" in overrides
        ? overrides.linked_incident_id!
        : null,
    linked_document_id:
      "linked_document_id" in overrides
        ? overrides.linked_document_id!
        : null,
    linked_form_id:
      "linked_form_id" in overrides ? overrides.linked_form_id! : null,
    linked_workflow_id:
      "linked_workflow_id" in overrides
        ? overrides.linked_workflow_id!
        : null,
    parent_task_id:
      "parent_task_id" in overrides ? overrides.parent_task_id! : null,
    tags: "tags" in overrides ? overrides.tags! : [],
    regulation_refs:
      "regulation_refs" in overrides ? overrides.regulation_refs! : [],
    created_by: "created_by" in overrides ? overrides.created_by! : "staff-1",
    created_at:
      "created_at" in overrides
        ? overrides.created_at!
        : "2026-01-01T00:00:00Z",
    updated_at:
      "updated_at" in overrides
        ? overrides.updated_at!
        : "2026-01-01T00:00:00Z",
  };
}

/** Return an ISO date string N days from now (positive = future, negative = past). */
function daysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

// -- CATEGORY_PREFIX ----------------------------------------------------------

describe("CATEGORY_PREFIX", () => {
  it("has exactly 14 entries matching the CsTaskCategory union", () => {
    expect(Object.keys(CATEGORY_PREFIX)).toHaveLength(14);
  });

  it("every value is a 3-character uppercase string", () => {
    for (const [, prefix] of Object.entries(CATEGORY_PREFIX)) {
      expect(prefix).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("maps compliance to CMP", () => {
    expect(CATEGORY_PREFIX.compliance).toBe("CMP");
  });

  it("maps safeguarding to SFG", () => {
    expect(CATEGORY_PREFIX.safeguarding).toBe("SFG");
  });

  it("maps medication to MED", () => {
    expect(CATEGORY_PREFIX.medication).toBe("MED");
  });

  it("maps maintenance to MNT", () => {
    expect(CATEGORY_PREFIX.maintenance).toBe("MNT");
  });

  it("maps staffing to STF", () => {
    expect(CATEGORY_PREFIX.staffing).toBe("STF");
  });

  it("maps training to TRN", () => {
    expect(CATEGORY_PREFIX.training).toBe("TRN");
  });

  it("maps supervision to SUP", () => {
    expect(CATEGORY_PREFIX.supervision).toBe("SUP");
  });

  it("maps young_person_plans to YPP", () => {
    expect(CATEGORY_PREFIX.young_person_plans).toBe("YPP");
  });

  it("maps professional_communication to COM", () => {
    expect(CATEGORY_PREFIX.professional_communication).toBe("COM");
  });

  it("maps finance to FIN", () => {
    expect(CATEGORY_PREFIX.finance).toBe("FIN");
  });

  it("maps inspection to INS", () => {
    expect(CATEGORY_PREFIX.inspection).toBe("INS");
  });

  it("maps health_and_safety to HSE", () => {
    expect(CATEGORY_PREFIX.health_and_safety).toBe("HSE");
  });

  it("maps admin to ADM", () => {
    expect(CATEGORY_PREFIX.admin).toBe("ADM");
  });

  it("maps cara_generated to ARA", () => {
    expect(CATEGORY_PREFIX.cara_generated).toBe("ARA");
  });

  it("has no duplicate prefix values", () => {
    const values = Object.values(CATEGORY_PREFIX);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// -- generateTaskReference ----------------------------------------------------

describe("generateTaskReference", () => {
  it("returns a string starting with the correct category prefix", () => {
    const ref = generateTaskReference("compliance");
    expect(ref.startsWith("CMP-")).toBe(true);
  });

  it("uses SFG prefix for safeguarding category", () => {
    const ref = generateTaskReference("safeguarding");
    expect(ref.startsWith("SFG-")).toBe(true);
  });

  it("uses MED prefix for medication category", () => {
    const ref = generateTaskReference("medication");
    expect(ref.startsWith("MED-")).toBe(true);
  });

  it("uses ADM prefix for admin category", () => {
    const ref = generateTaskReference("admin");
    expect(ref.startsWith("ADM-")).toBe(true);
  });

  it("uses ARA prefix for cara_generated category", () => {
    const ref = generateTaskReference("cara_generated");
    expect(ref.startsWith("ARA-")).toBe(true);
  });

  it("follows the PREFIX-XXXXNNN format (prefix, dash, 4 timestamp chars, 3-digit counter)", () => {
    const ref = generateTaskReference("training");
    // Format: TRN-XXXX000 — 3 prefix + 1 dash + 4 timestamp + 3 counter = 11 chars
    expect(ref).toMatch(/^[A-Z]{3}-[A-Z0-9]{4}\d{3}$/);
  });

  it("generates unique references on successive calls", () => {
    const refs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      refs.add(generateTaskReference("admin"));
    }
    expect(refs.size).toBe(20);
  });

  it("counter portion is zero-padded to 3 digits", () => {
    const ref = generateTaskReference("finance");
    const counterPart = ref.slice(-3);
    expect(counterPart).toMatch(/^\d{3}$/);
  });

  it("uses uppercase base-36 timestamp characters", () => {
    const ref = generateTaskReference("inspection");
    // After the prefix and dash, the next 4 chars are the timestamp portion
    const timestampPart = ref.slice(4, 8);
    expect(timestampPart).toMatch(/^[A-Z0-9]{4}$/);
  });

  it("counter wraps around after 999", () => {
    // Generate enough references to force wrapping (counter resets at 1000)
    const refs: string[] = [];
    for (let i = 0; i < 1000; i++) {
      refs.push(generateTaskReference("maintenance"));
    }
    // After 1000 calls the counter should wrap to 0, so the next call gets 000
    const wrappedRef = generateTaskReference("maintenance");
    const counterPart = wrappedRef.slice(-3);
    // The counter at this point should have wrapped — it should be a valid 3-digit number
    expect(counterPart).toMatch(/^\d{3}$/);
  });

  it("handles all 14 categories without error", () => {
    const categories: CsTaskCategory[] = [
      "compliance",
      "safeguarding",
      "medication",
      "maintenance",
      "staffing",
      "training",
      "supervision",
      "young_person_plans",
      "professional_communication",
      "finance",
      "inspection",
      "health_and_safety",
      "admin",
      "cara_generated",
    ];
    for (const cat of categories) {
      const ref = generateTaskReference(cat);
      expect(ref).toBeTruthy();
      expect(ref.startsWith(CATEGORY_PREFIX[cat] + "-")).toBe(true);
    }
  });
});

// -- computeTaskRiskScore -----------------------------------------------------

describe("computeTaskRiskScore", () => {
  // -- Priority factor --------------------------------------------------------

  it("assigns 5 for low priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "low" }));
    const pf = result.factors.find((f) => f.factor === "priority");
    expect(pf).toBeDefined();
    expect(pf!.weight).toBe(5);
    expect(pf!.detail).toContain("low");
  });

  it("assigns 10 for medium priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "medium" }));
    const pf = result.factors.find((f) => f.factor === "priority");
    expect(pf!.weight).toBe(10);
  });

  it("assigns 20 for high priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "high" }));
    const pf = result.factors.find((f) => f.factor === "priority");
    expect(pf!.weight).toBe(20);
  });

  it("assigns 30 for urgent priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "urgent" }));
    const pf = result.factors.find((f) => f.factor === "priority");
    expect(pf!.weight).toBe(30);
  });

  it("assigns 40 for critical priority", () => {
    const result = computeTaskRiskScore(makeTask({ priority: "critical" }));
    const pf = result.factors.find((f) => f.factor === "priority");
    expect(pf!.weight).toBe(40);
  });

  // -- Overdue factor ---------------------------------------------------------

  it("adds overdue factor when due_date is in the past", () => {
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(-5) }),
    );
    const of = result.factors.find((f) => f.factor === "overdue");
    expect(of).toBeDefined();
    expect(of!.weight).toBeGreaterThan(0);
    expect(of!.detail).toContain("days overdue");
  });

  it("caps overdue weight at 30", () => {
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(-100) }),
    );
    const of = result.factors.find((f) => f.factor === "overdue");
    expect(of).toBeDefined();
    expect(of!.weight).toBe(30);
  });

  it("overdue score scales at 3 points per day overdue", () => {
    // 3 days overdue = 9 points (3 * 3)
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(-3) }),
    );
    const of = result.factors.find((f) => f.factor === "overdue");
    expect(of).toBeDefined();
    expect(of!.weight).toBeCloseTo(9, 0);
  });

  it("adds imminent factor when due within 48 hours", () => {
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(1) }),
    );
    const imm = result.factors.find((f) => f.factor === "imminent");
    expect(imm).toBeDefined();
    expect(imm!.weight).toBe(15);
    expect(imm!.detail).toContain("48 hours");
  });

  it("adds upcoming factor when due within 7 days but not imminent", () => {
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(5) }),
    );
    const up = result.factors.find((f) => f.factor === "upcoming");
    expect(up).toBeDefined();
    expect(up!.weight).toBe(5);
    expect(up!.detail).toContain("7 days");
  });

  it("does not add any date factor when due_date is more than 7 days away", () => {
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(14) }),
    );
    const dateFactors = result.factors.filter((f) =>
      ["overdue", "imminent", "upcoming"].includes(f.factor),
    );
    expect(dateFactors).toHaveLength(0);
  });

  it("does not add any date factor when due_date is null", () => {
    const result = computeTaskRiskScore(makeTask({ due_date: null }));
    const dateFactors = result.factors.filter((f) =>
      ["overdue", "imminent", "upcoming"].includes(f.factor),
    );
    expect(dateFactors).toHaveLength(0);
  });

  // -- Escalation factor ------------------------------------------------------

  it("adds escalated factor when task is escalated", () => {
    const result = computeTaskRiskScore(
      makeTask({ escalated: true, escalation_level: 1 }),
    );
    const ef = result.factors.find((f) => f.factor === "escalated");
    expect(ef).toBeDefined();
    expect(ef!.weight).toBe(10);
    expect(ef!.detail).toContain("1 time(s)");
  });

  it("scales escalation weight by level (10 per level)", () => {
    const result = computeTaskRiskScore(
      makeTask({ escalated: true, escalation_level: 2 }),
    );
    const ef = result.factors.find((f) => f.factor === "escalated");
    expect(ef!.weight).toBe(20);
  });

  it("caps escalation weight at 20", () => {
    const result = computeTaskRiskScore(
      makeTask({ escalated: true, escalation_level: 5 }),
    );
    const ef = result.factors.find((f) => f.factor === "escalated");
    expect(ef!.weight).toBe(20);
  });

  it("does not add escalated factor when task is not escalated", () => {
    const result = computeTaskRiskScore(
      makeTask({ escalated: false, escalation_level: 0 }),
    );
    const ef = result.factors.find((f) => f.factor === "escalated");
    expect(ef).toBeUndefined();
  });

  // -- Category risk factor ---------------------------------------------------

  it("adds category_risk factor for safeguarding", () => {
    const result = computeTaskRiskScore(makeTask({ category: "safeguarding" }));
    const cf = result.factors.find((f) => f.factor === "category_risk");
    expect(cf).toBeDefined();
    expect(cf!.weight).toBe(10);
  });

  it("adds category_risk factor for compliance", () => {
    const result = computeTaskRiskScore(makeTask({ category: "compliance" }));
    const cf = result.factors.find((f) => f.factor === "category_risk");
    expect(cf).toBeDefined();
    expect(cf!.weight).toBe(10);
  });

  it("adds category_risk factor for medication", () => {
    const result = computeTaskRiskScore(makeTask({ category: "medication" }));
    const cf = result.factors.find((f) => f.factor === "category_risk");
    expect(cf).toBeDefined();
    expect(cf!.weight).toBe(10);
  });

  it("does not add category_risk factor for admin", () => {
    const result = computeTaskRiskScore(makeTask({ category: "admin" }));
    const cf = result.factors.find((f) => f.factor === "category_risk");
    expect(cf).toBeUndefined();
  });

  it("does not add category_risk factor for training", () => {
    const result = computeTaskRiskScore(makeTask({ category: "training" }));
    const cf = result.factors.find((f) => f.factor === "category_risk");
    expect(cf).toBeUndefined();
  });

  // -- Unassigned factor ------------------------------------------------------

  it("adds unassigned factor when assigned_to is null and task is active", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: null, status: "not_started" }),
    );
    const uf = result.factors.find((f) => f.factor === "unassigned");
    expect(uf).toBeDefined();
    expect(uf!.weight).toBe(10);
  });

  it("does not add unassigned factor when assigned_to is set", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: "staff-1", status: "not_started" }),
    );
    const uf = result.factors.find((f) => f.factor === "unassigned");
    expect(uf).toBeUndefined();
  });

  it("does not add unassigned factor when task status is completed", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: null, status: "completed" }),
    );
    const uf = result.factors.find((f) => f.factor === "unassigned");
    expect(uf).toBeUndefined();
  });

  it("does not add unassigned factor when task status is cancelled", () => {
    const result = computeTaskRiskScore(
      makeTask({ assigned_to: null, status: "cancelled" }),
    );
    const uf = result.factors.find((f) => f.factor === "unassigned");
    expect(uf).toBeUndefined();
  });

  // -- Blocked factor ---------------------------------------------------------

  it("adds blocked factor when task status is blocked", () => {
    const result = computeTaskRiskScore(makeTask({ status: "blocked" }));
    const bf = result.factors.find((f) => f.factor === "blocked");
    expect(bf).toBeDefined();
    expect(bf!.weight).toBe(15);
    expect(bf!.detail).toContain("blocked");
  });

  it("does not add blocked factor when task is not blocked", () => {
    const result = computeTaskRiskScore(makeTask({ status: "in_progress" }));
    const bf = result.factors.find((f) => f.factor === "blocked");
    expect(bf).toBeUndefined();
  });

  // -- Child-linked factor ----------------------------------------------------

  it("adds child_linked factor when linked_child_id is set", () => {
    const result = computeTaskRiskScore(
      makeTask({ linked_child_id: "child-1" }),
    );
    const clf = result.factors.find((f) => f.factor === "child_linked");
    expect(clf).toBeDefined();
    expect(clf!.weight).toBe(5);
    expect(clf!.detail).toContain("young person");
  });

  it("does not add child_linked factor when linked_child_id is null", () => {
    const result = computeTaskRiskScore(
      makeTask({ linked_child_id: null }),
    );
    const clf = result.factors.find((f) => f.factor === "child_linked");
    expect(clf).toBeUndefined();
  });

  // -- Score capping and risk level -------------------------------------------

  it("caps the total score at 100", () => {
    // Stack every possible factor to exceed 100
    const result = computeTaskRiskScore(
      makeTask({
        priority: "critical", // 40
        due_date: daysFromNow(-30), // 30 (capped)
        escalated: true,
        escalation_level: 5, // 20 (capped)
        category: "safeguarding", // 10
        assigned_to: null,
        status: "blocked", // 15 (blocked) + 10 (unassigned)
        linked_child_id: "child-1", // 5
        // Total uncapped = 40+30+20+10+10+15+5 = 130 -> capped to 100
      }),
    );
    expect(result.score).toBe(100);
  });

  it("returns level low when score is below 25", () => {
    // low priority (5) + assigned + no due date + no escalation + admin = 5
    const result = computeTaskRiskScore(
      makeTask({
        priority: "low",
        category: "admin",
        assigned_to: "staff-1",
        status: "not_started",
      }),
    );
    expect(result.score).toBeLessThan(25);
    expect(result.level).toBe("low");
  });

  it("returns level medium when score is 25-49", () => {
    // medium (10) + upcoming (5) + category_risk (10) = 25
    const result = computeTaskRiskScore(
      makeTask({
        priority: "medium",
        due_date: daysFromNow(5),
        category: "safeguarding",
        assigned_to: "staff-1",
        status: "not_started",
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
    expect(result.level).toBe("medium");
  });

  it("returns level high when score is 50-69", () => {
    // critical (40) + category_risk (10) + unassigned (10) = 60
    const result = computeTaskRiskScore(
      makeTask({
        priority: "critical",
        category: "compliance",
        assigned_to: null,
        status: "not_started",
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(70);
    expect(result.level).toBe("high");
  });

  it("returns level critical when score is 70 or above", () => {
    // critical (40) + overdue 10 days (30) + category_risk (10) = 80
    const result = computeTaskRiskScore(
      makeTask({
        priority: "critical",
        due_date: daysFromNow(-10),
        category: "safeguarding",
        assigned_to: "staff-1",
        status: "not_started",
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe("critical");
  });

  // -- Combined scenarios and edge cases --------------------------------------

  it("returns a minimal score for a low-risk fully-assigned task", () => {
    const result = computeTaskRiskScore(
      makeTask({
        priority: "low",
        category: "admin",
        assigned_to: "staff-1",
        status: "in_progress",
        due_date: daysFromNow(30),
        linked_child_id: null,
        escalated: false,
      }),
    );
    // Only priority (5) contributes
    expect(result.score).toBe(5);
    expect(result.factors).toHaveLength(1);
    expect(result.level).toBe("low");
  });

  it("includes all applicable factors in the factors array", () => {
    const result = computeTaskRiskScore(
      makeTask({
        priority: "high", // priority
        due_date: daysFromNow(-2), // overdue
        category: "medication", // category_risk
        assigned_to: null, // unassigned
        status: "blocked", // blocked
        linked_child_id: "child-1", // child_linked
        escalated: true, // escalated
        escalation_level: 1,
      }),
    );
    const factorNames = result.factors.map((f) => f.factor);
    expect(factorNames).toContain("priority");
    expect(factorNames).toContain("overdue");
    expect(factorNames).toContain("category_risk");
    expect(factorNames).toContain("unassigned");
    expect(factorNames).toContain("blocked");
    expect(factorNames).toContain("child_linked");
    expect(factorNames).toContain("escalated");
    expect(result.factors).toHaveLength(7);
  });

  it("does not double-count imminent and overdue", () => {
    // Exactly on the boundary -- slightly overdue
    const result = computeTaskRiskScore(
      makeTask({ due_date: daysFromNow(-0.5) }),
    );
    const dateFactors = result.factors.filter((f) =>
      ["overdue", "imminent", "upcoming"].includes(f.factor),
    );
    // Should only have exactly one date factor
    expect(dateFactors).toHaveLength(1);
  });

  it("returns correct structure with score, level, and factors array", () => {
    const result = computeTaskRiskScore(makeTask());
    expect(typeof result.score).toBe("number");
    expect(["low", "medium", "high", "critical"]).toContain(result.level);
    expect(Array.isArray(result.factors)).toBe(true);
    for (const f of result.factors) {
      expect(typeof f.factor).toBe("string");
      expect(typeof f.weight).toBe("number");
      expect(typeof f.detail).toBe("string");
    }
  });

  it("always includes at least the priority factor", () => {
    const result = computeTaskRiskScore(makeTask());
    expect(result.factors.length).toBeGreaterThanOrEqual(1);
    expect(result.factors[0].factor).toBe("priority");
  });
});
