// ══════════════════════════════════════════════════════════════════════════════
// Inspection Readiness — engine tests (Milestone 22)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { computeInspectionReadiness } from "@/lib/care-events/inspection-readiness";
import type { CareEvent, AnnexAEvidenceItem, ChildDailySummary } from "@/types/care-events";

const HOME_ID = "home_readiness_test";
const TODAY = new Date().toISOString().slice(0, 10);

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((e) => e.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
  const anx = db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[];
  for (const q of anx.filter((q) => q.home_id === HOME_ID)) {
    const i = anx.indexOf(q); if (i >= 0) anx.splice(i, 1);
  }
  const cds = db.childDailySummaries.findAll() as ChildDailySummary[];
  for (const s of cds.filter((s) => s.home_id === HOME_ID)) {
    const i = cds.indexOf(s); if (i >= 0) cds.splice(i, 1);
  }
  // Clear failed routes/jobs by patching them to a non-failed state.
  for (const r of db.careEventRoutes.findFailed().filter((r) => r.home_id === HOME_ID)) {
    db.careEventRoutes.patch(r.id, { status: "completed" });
  }
  for (const j of db.careEventJobs.findFailed().filter((j) => j.home_id === HOME_ID)) {
    db.careEventJobs.patch(j.id, { status: "completed" });
  }
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "t", content: "c",
    category: "general",
    is_current_version: true,
    event_date: TODAY,
    status: "verified",
    ...overrides,
  });
}

describe("inspection readiness", () => {
  beforeEach(() => clearAll());

  it("scores 100 and severity ready when nothing is outstanding", () => {
    const r = computeInspectionReadiness(HOME_ID);
    expect(r.overall_score).toBe(100);
    expect(r.severity).toBe("ready");
    expect(r.blocking_categories).toEqual([]);
  });

  it("includes all eight categories", () => {
    const r = computeInspectionReadiness(HOME_ID);
    expect(r.categories.map((c) => c.key).sort()).toEqual([
      "amendment_review", "annex_a_evidence", "care_event_currency",
      "daily_summary_coverage", "manager_review", "reg45_evidence",
      "returned_records", "routing_health",
    ]);
  });

  it("penalises manager review backlog", () => {
    seed({ status: "manager_review_required" });
    seed({ status: "manager_review_required" });
    const r = computeInspectionReadiness(HOME_ID);
    const cat = r.categories.find((c) => c.key === "manager_review")!;
    expect(cat.score).toBe(84); // 100 - 2*8
    expect(cat.blocking).toBe(true);
    expect(r.blocking_categories).toContain("manager_review");
  });

  it("penalises returned records", () => {
    seed({ status: "returned" });
    const cat = computeInspectionReadiness(HOME_ID).categories.find((c) => c.key === "returned_records")!;
    expect(cat.score).toBe(90);
    expect(cat.open_count).toBe(1);
  });

  it("penalises sensitive amendments awaiting review", () => {
    const prev = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: prev.id,
      is_safeguarding: true, status: "submitted",
      amended_at: "2026-05-10T10:00:00Z",
    });
    const cat = computeInspectionReadiness(HOME_ID).categories.find((c) => c.key === "amendment_review")!;
    expect(cat.score).toBe(85); // 100 - 15
    expect(cat.blocking).toBe(true);
  });

  it("computes daily summary coverage as a ratio", () => {
    seed({ event_date: TODAY });
    seed({ event_date: TODAY, child_id: "yp_b" });
    db.childDailySummaries.upsert({
      home_id: HOME_ID, child_id: "yp_a", summary_date: TODAY,
      event_count: 1, significant_count: 0, avg_mood_score: null,
      categories: ["general"], summary_text: "x", requires_followup: false,
    });
    const cat = computeInspectionReadiness(HOME_ID).categories.find((c) => c.key === "daily_summary_coverage")!;
    expect(cat.score).toBe(50); // 1/2
  });

  it("computes care event currency from finalised ratio", () => {
    seed({ status: "verified" });
    seed({ status: "submitted" });
    seed({ status: "submitted" });
    const cat = computeInspectionReadiness(HOME_ID).categories.find((c) => c.key === "care_event_currency")!;
    expect(cat.score).toBe(33); // 1/3 -> 33
  });

  it("severity drops as backlog grows", () => {
    expect(computeInspectionReadiness(HOME_ID).severity).toBe("ready");
    for (let i = 0; i < 7; i++) seed({ status: "manager_review_required" });
    const r = computeInspectionReadiness(HOME_ID);
    expect(r.severity).not.toBe("ready");
    expect(r.blocking_categories.length).toBeGreaterThan(0);
  });
});
