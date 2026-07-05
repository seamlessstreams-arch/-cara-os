// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTINUOUS HEALTH CHECK TESTS
//
// Pins: each check fires on the right record; the restraint repair gap is
// critical; issues are most-severe-first; a clean home scores 100/healthy;
// practice issues are NEVER auto-fixable and always need human review.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { runSystemHealthCheck } from "../health-check-engine";
import type { SystemHealthInput } from "../types";

const ASOF = "2026-07-05";

const clean = (o: Partial<SystemHealthInput> = {}): SystemHealthInput => ({
  homeId: "home_oak",
  asOf: ASOF,
  children: [{ id: "yp_alex", name: "Alex" }, { id: "yp_casey", name: "Casey" }],
  tasks: [],
  incidents: [],
  restraints: [],
  missingEpisodes: [],
  reviews: [],
  dailyLogDatesByChild: { yp_alex: ["2026-07-05"], yp_casey: ["2026-07-04"] },
  ...o,
});

describe("a clean home", () => {
  it("scores 100 and reads healthy with no issues", () => {
    const r = runSystemHealthCheck(clean());
    expect(r.issues).toEqual([]);
    expect(r.healthScore).toBe(100);
    expect(r.status).toBe("healthy");
    expect(r.checksRun).toHaveLength(7);
  });
});

describe("checks fire on the right records", () => {
  it("flags an overdue action", () => {
    const r = runSystemHealthCheck(clean({ tasks: [{ id: "t1", title: "Update plan", due_date: "2026-06-20", status: "in_progress" }] }));
    expect(r.issues.some((i) => i.category === "overdue_action" && i.recordId === "t1")).toBe(true);
  });

  it("does NOT flag a completed overdue task", () => {
    const r = runSystemHealthCheck(clean({ tasks: [{ id: "t1", title: "Done", due_date: "2026-06-20", status: "completed" }] }));
    expect(r.issues.some((i) => i.category === "overdue_action")).toBe(false);
  });

  it("flags missing management oversight on an open incident", () => {
    const r = runSystemHealthCheck(clean({ incidents: [{ id: "inc1", type: "physical_intervention", date: "2026-07-01", requires_oversight: true, has_oversight: false, status: "open" }] }));
    expect(r.issues.some((i) => i.category === "missing_oversight" && i.recordId === "inc1")).toBe(true);
  });

  it("flags a restraint repair gap as CRITICAL", () => {
    const r = runSystemHealthCheck(clean({ restraints: [{ id: "rst7", date: "2026-06-25", child_debriefed: false, has_debrief: false, child_id: "yp_alex" }] }));
    const gap = r.issues.find((i) => i.category === "restraint_repair_gap");
    expect(gap).toBeTruthy();
    expect(gap!.severity).toBe("critical");
    expect(r.status).toBe("action_required"); // any critical → action_required
  });

  it("flags a missing return interview", () => {
    const r = runSystemHealthCheck(clean({ missingEpisodes: [{ id: "m1", date: "2026-06-28", has_return_interview: false, child_id: "yp_alex" }] }));
    expect(r.issues.some((i) => i.category === "missing_return_interview")).toBe(true);
  });

  it("flags an overdue review", () => {
    const r = runSystemHealthCheck(clean({ reviews: [{ id: "ra1", kind: "Risk assessment", next_review_date: "2026-06-01", child_id: "yp_alex" }] }));
    expect(r.issues.some((i) => i.category === "overdue_review" && i.recordId === "ra1")).toBe(true);
  });

  it("flags a recording gap when a child has no recent daily log", () => {
    const r = runSystemHealthCheck(clean({ dailyLogDatesByChild: { yp_alex: ["2026-06-20"], yp_casey: ["2026-07-04"] } }));
    expect(r.issues.some((i) => i.category === "recording_gap" && i.childId === "yp_alex")).toBe(true);
  });

  it("flags an orphaned reference to a non-resident child", () => {
    const r = runSystemHealthCheck(clean({ incidents: [{ id: "inc1", type: "other", date: "2026-07-01", requires_oversight: false, has_oversight: false, status: "open", child_id: "yp_ghost" }] }));
    expect(r.issues.some((i) => i.category === "orphaned_reference" && i.recordId === "inc1")).toBe(true);
  });
});

describe("ordering, scoring and safety", () => {
  it("returns issues most-severe-first", () => {
    const r = runSystemHealthCheck(clean({
      reviews: [{ id: "ra1", kind: "Risk assessment", next_review_date: "2026-06-01" }], // medium
      restraints: [{ id: "rst7", date: "2026-06-25", child_debriefed: false, has_debrief: false }], // critical
    }));
    expect(r.issues[0].severity).toBe("critical");
  });

  it("never marks a practice issue auto-fixable, and always requires human review", () => {
    const r = runSystemHealthCheck(clean({
      restraints: [{ id: "rst7", date: "2026-06-25", child_debriefed: false, has_debrief: false }],
      tasks: [{ id: "t1", title: "x", due_date: "2026-06-20", status: "open" }],
    }));
    expect(r.issues.every((i) => i.autoFixable === false)).toBe(true);
    expect(r.issues.every((i) => i.humanReviewRequired === true)).toBe(true);
    expect(r.disclaimer).toMatch(/never auto-changes a safeguarding record/i);
  });
});
