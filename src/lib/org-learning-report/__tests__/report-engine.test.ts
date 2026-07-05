// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING REPORT TESTS
//
// Pins: the six sections derive from the period's records (repeated themes,
// emerging risks, unresolved learning, strengths, child-voice themes, improvement
// evidence); every theme cites its sources; "insufficient data" is stated when
// the period is thin; and the prior period is used to read trend/improvement.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildOrgLearningReport } from "../report-engine";
import type { OrgLearningReportInput } from "../types";

const ASOF = "2026-07-05"; // quarter → 90d recent; prior = 91–180d ago

const base = (o: Partial<OrgLearningReportInput> = {}): OrgLearningReportInput => ({
  homeId: "home_oak",
  asOf: ASOF,
  period: "quarter",
  incidents: [],
  behaviour: [],
  escalations: [],
  ethical: [],
  feedbackLoops: [],
  voice: [],
  restraints: [],
  ...o,
});

const sect = (r: ReturnType<typeof buildOrgLearningReport>, key: string) => r.sections.find((s) => s.key === key)!;

describe("themes derive from the period", () => {
  it("surfaces a repeated incident type with its evidence", () => {
    const r = buildOrgLearningReport(
      base({
        incidents: [
          { id: "i1", date: "2026-06-01", type: "physical_intervention", severity: "high" },
          { id: "i2", date: "2026-06-15", type: "physical_intervention", severity: "high" },
        ],
      }),
    );
    const rep = sect(r, "repeated_theme");
    expect(rep.themes.some((t) => /physical intervention/i.test(t.title))).toBe(true);
    expect(rep.themes[0].sources).toHaveLength(2);
  });

  it("flags high/immediate escalations as an emerging risk", () => {
    const r = buildOrgLearningReport(
      base({ escalations: [{ id: "e1", createdAt: "2026-06-20", status: "decided", confirmedLevel: "immediate_safeguarding" }] }),
    );
    expect(sect(r, "emerging_risk").themes.some((t) => t.weight === "priority")).toBe(true);
  });

  it("reads rising incident volume against the prior period", () => {
    const r = buildOrgLearningReport(
      base({
        incidents: [
          // prior period (91–180d ago): 2
          { id: "p1", date: "2026-03-01", type: "other", severity: "low" },
          { id: "p2", date: "2026-03-10", type: "other", severity: "low" },
          // recent: 3
          { id: "r1", date: "2026-06-01", type: "other", severity: "low" },
          { id: "r2", date: "2026-06-10", type: "other", severity: "low" },
          { id: "r3", date: "2026-06-20", type: "other", severity: "low" },
        ],
      }),
    );
    expect(sect(r, "emerging_risk").themes.some((t) => t.id === "emg_inc_rising")).toBe(true);
  });

  it("counts open ethical cycles, pending loops and un-debriefed restraints as unresolved", () => {
    const r = buildOrgLearningReport(
      base({
        ethical: [{ id: "et1", createdAt: "2026-06-01", cycleComplete: false, hasLearning: false, summary: "x" }],
        feedbackLoops: [{ id: "l1", feedbackDate: "2026-06-05", decisionMade: "pending_consideration" }],
        restraints: [{ id: "rst1", date: "2026-06-10", childDebriefed: false, hasDebriefRecord: false }],
      }),
    );
    const unr = sect(r, "unresolved_learning");
    expect(unr.themes.map((t) => t.id).sort()).toEqual(["unr_debrief", "unr_ethical", "unr_loops"]);
    expect(unr.themes.find((t) => t.id === "unr_debrief")!.weight).toBe("priority");
  });

  it("credits closed cycles-with-learning and acted-on feedback as strengths", () => {
    const r = buildOrgLearningReport(
      base({
        ethical: [{ id: "et1", createdAt: "2026-06-01", cycleComplete: true, hasLearning: true, summary: "x" }],
        feedbackLoops: [{ id: "l1", feedbackDate: "2026-06-05", decisionMade: "acted_on_in_full" }],
      }),
    );
    const str = sect(r, "practice_strength");
    expect(str.themes.map((t) => t.id).sort()).toEqual(["str_cycles", "str_loops"]);
    expect(str.themes.every((t) => t.weight === "positive")).toBe(true);
  });

  it("surfaces a repeated child-voice worry from negative sentiment", () => {
    const r = buildOrgLearningReport(
      base({
        voice: [
          { id: "v1", date: "2026-06-01", category: "feeling_safe", sentiment: "unhappy" },
          { id: "v2", date: "2026-06-08", category: "feeling_safe", sentiment: "very_unhappy" },
          { id: "v3", date: "2026-06-09", category: "food", sentiment: "happy" },
        ],
      }),
    );
    const cv = sect(r, "child_voice_theme");
    expect(cv.themes.some((t) => /feeling safe/i.test(t.title))).toBe(true);
    expect(cv.themes[0].evidenceCount).toBe(2);
  });

  it("reads a drop in incidents as evidence of improvement", () => {
    const r = buildOrgLearningReport(
      base({
        incidents: [
          { id: "p1", date: "2026-03-01", type: "other", severity: "low" },
          { id: "p2", date: "2026-03-05", type: "other", severity: "low" },
          { id: "p3", date: "2026-03-10", type: "other", severity: "low" },
          { id: "p4", date: "2026-03-15", type: "other", severity: "low" },
          { id: "r1", date: "2026-06-01", type: "other", severity: "low" },
        ],
      }),
    );
    expect(sect(r, "improvement_evidence").themes.some((t) => t.id === "imp_inc_down")).toBe(true);
  });
});

describe("honesty", () => {
  it("marks sections insufficient_data and gives an honest headline when the period is empty", () => {
    const r = buildOrgLearningReport(base());
    expect(sect(r, "child_voice_theme").insufficientData).toBe(true);
    expect(r.headline).toMatch(/not enough activity/i);
    expect(r.totalEvidence).toBe(0);
  });

  it("does not treat prior-period-only records as this period's themes", () => {
    const r = buildOrgLearningReport(
      base({ incidents: [{ id: "old", date: "2026-01-01", type: "physical_intervention", severity: "high" }] }),
    );
    // 2026-01-01 is >180d before asOf → outside both windows
    expect(sect(r, "repeated_theme").themes).toHaveLength(0);
  });

  it("every theme carries at least one source", () => {
    const r = buildOrgLearningReport(
      base({
        incidents: [
          { id: "i1", date: "2026-06-01", type: "physical_intervention", severity: "high" },
          { id: "i2", date: "2026-06-15", type: "physical_intervention", severity: "high" },
        ],
        feedbackLoops: [{ id: "l1", feedbackDate: "2026-06-05", decisionMade: "acted_on_in_full" }],
      }),
    );
    for (const s of r.sections) for (const t of s.themes) expect(t.sources.length).toBeGreaterThan(0);
  });
});
