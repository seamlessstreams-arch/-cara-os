// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-HEALING INTEGRITY ENGINE TESTS
//
// The core pin is the SAFETY INVARIANT: only a missing mirror in a derived index
// is ever safe_auto; every practice-meaning repair is needs_human; and the apply
// guard refuses anything practice-targeted even if it were mislabelled safe_auto.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { runSelfHealingScan, selectAutoRepairs } from "../self-healing-engine";
import type { SelfHealingInput, SelfHealingPlan, IntegrityRepair } from "../types";

const ASOF = "2026-07-05";

const base = (o: Partial<SelfHealingInput> = {}): SelfHealingInput => ({
  homeId: "home_oak",
  asOf: ASOF,
  childIds: ["yp_alex", "yp_casey"],
  incidents: [],
  tasks: [],
  ...o,
});

describe("a structurally sound store", () => {
  it("proposes no repairs when links are symmetric", () => {
    const plan = runSelfHealingScan(base({
      incidents: [{ id: "inc_1", linked_task_ids: ["task_1"], child_id: "yp_alex" }],
      tasks: [{ id: "task_1", linked_incident_id: "inc_1", child_id: "yp_alex" }],
    }));
    expect(plan.repairs).toEqual([]);
    expect(plan.summary.total).toBe(0);
  });
});

describe("missing back-link → the only safe_auto repair", () => {
  const plan = runSelfHealingScan(base({
    incidents: [{ id: "inc_1", linked_task_ids: [], child_id: "yp_alex" }],
    tasks: [{ id: "task_1", linked_incident_id: "inc_1", child_id: "yp_alex" }],
  }));
  const r = plan.repairs.find((x) => x.kind === "missing_back_link");

  it("is classified safe_auto, reversible, non-practice", () => {
    expect(r).toBeTruthy();
    expect(r!.classification).toBe("safe_auto");
    expect(r!.reversible).toBe(true);
    expect(r!.targetIsPractice).toBe(false);
  });

  it("restores the mirror in its `after` without changing content", () => {
    expect(r!.after).toContain("task_1");
    expect(r!.recordType).toBe("incidents");
  });
});

describe("everything that carries practice meaning → needs_human, never safe_auto", () => {
  it("flags a conflicting link (an incident lists a task that points at a different incident)", () => {
    // inc_1 claims task_1, but task_1 authoritatively links to inc_2 → conflict on inc_1.
    // (Separately, inc_2 gets a safe_auto missing_back_link — a different repair.)
    const plan = runSelfHealingScan(base({
      incidents: [{ id: "inc_1", linked_task_ids: ["task_1"] }, { id: "inc_2", linked_task_ids: [] }],
      tasks: [{ id: "task_1", linked_incident_id: "inc_2" }],
    }));
    const conflict = plan.repairs.find((r) => r.kind === "conflicting_link");
    expect(conflict).toBeTruthy();
    expect(conflict!.recordId).toBe("inc_1");
    expect(conflict!.classification).toBe("needs_human");
  });

  it("flags a dangling child reference as needs_human", () => {
    const plan = runSelfHealingScan(base({
      incidents: [{ id: "inc_1", linked_task_ids: [], child_id: "yp_ghost" }],
    }));
    const orphan = plan.repairs.find((r) => r.kind === "dangling_child_reference");
    expect(orphan).toBeTruthy();
    expect(orphan!.classification).toBe("needs_human");
  });

  it("flags duplicate ids as critical needs_human", () => {
    const plan = runSelfHealingScan(base({
      tasks: [{ id: "task_1", linked_incident_id: undefined }, { id: "task_1", linked_incident_id: undefined }],
    }));
    const dup = plan.repairs.find((r) => r.kind === "duplicate_id");
    expect(dup).toBeTruthy();
    expect(dup!.severity).toBe("critical");
    expect(dup!.classification).toBe("needs_human");
  });

  it("never labels any non-mirror repair safe_auto", () => {
    const plan = runSelfHealingScan(base({
      incidents: [{ id: "inc_1", linked_task_ids: ["task_1"], child_id: "yp_ghost" }, { id: "inc_2", linked_task_ids: [] }],
      tasks: [{ id: "task_1", linked_incident_id: "inc_2" }],
    }));
    for (const r of plan.repairs) {
      if (r.kind !== "missing_back_link") expect(r.classification).toBe("needs_human");
    }
  });
});

describe("the apply safety guard", () => {
  it("selects only safe_auto/reversible/non-practice repairs", () => {
    const plan = runSelfHealingScan(base({
      incidents: [{ id: "inc_1", linked_task_ids: [], child_id: "yp_ghost" }],
      tasks: [{ id: "task_1", linked_incident_id: "inc_1" }],
    }));
    const { apply, skip } = selectAutoRepairs(plan);
    expect(apply.every((r) => r.classification === "safe_auto" && r.reversible && !r.targetIsPractice)).toBe(true);
    // the dangling-child repair must be skipped
    expect(skip.some((s) => s.repair.kind === "dangling_child_reference")).toBe(true);
  });

  it("REFUSES a repair mislabelled safe_auto but targeting a practice record", () => {
    const poisoned: SelfHealingPlan = {
      homeId: "home_oak",
      asOf: ASOF,
      repairs: [
        {
          id: "bad",
          kind: "conflicting_link",
          classification: "safe_auto", // wrong on purpose
          severity: "high",
          recordType: "incidents",
          recordId: "inc_1",
          description: "mislabelled",
          rationale: "test",
          reversible: true,
          targetIsPractice: true, // the guard must catch this
          before: "x",
          after: "y",
        } as IntegrityRepair,
      ],
      summary: { total: 1, safeAuto: 1, needsHuman: 0, byKind: { conflicting_link: 1 } },
      disclaimer: "",
      engineVersion: "1.0.0",
    };
    const { apply, skip } = selectAutoRepairs(poisoned);
    expect(apply).toHaveLength(0);
    expect(skip[0].reason).toMatch(/targets a practice record/i);
  });
});
