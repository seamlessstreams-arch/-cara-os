// ══════════════════════════════════════════════════════════════════════════════
// Child Daily Summary Auto-Build — engine tests (Milestone 20)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  rebuildChildDailySummary,
  rebuildChildDailySummariesForHome,
} from "@/lib/care-events/child-daily-summary-builder";
import type { CareEvent, ChildDailySummary } from "@/types/care-events";

const HOME_ID = "home_cds_test";
const CHILD_A = "yp_cds_a";
const CHILD_B = "yp_cds_b";
const DATE = "2026-05-11";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((e) => e.home_id === HOME_ID)) {
    const i = evs.indexOf(e);
    if (i >= 0) evs.splice(i, 1);
  }
  const sums = db.childDailySummaries.findAll() as ChildDailySummary[];
  for (const s of sums.filter((s) => s.home_id === HOME_ID)) {
    const i = sums.indexOf(s);
    if (i >= 0) sums.splice(i, 1);
  }
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: CHILD_A,
    title: "t",
    content: "c",
    category: "general",
    is_current_version: true,
    event_date: DATE,
    status: "verified",
    ...overrides,
  });
}

describe("child daily summary auto-build", () => {
  beforeEach(() => clearAll());

  it("returns null when no events exist for child/date", () => {
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)).toBeNull();
  });

  it("aggregates a single event", () => {
    seed({ category: "wellbeing", mood_score: 4, is_significant: false });
    const s = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    expect(s.event_count).toBe(1);
    expect(s.significant_count).toBe(0);
    expect(s.avg_mood_score).toBe(4);
    expect(s.categories).toEqual(["wellbeing"]);
    expect(s.requires_followup).toBe(false);
  });

  it("aggregates multiple events with mood average", () => {
    seed({ category: "wellbeing", mood_score: 5 });
    seed({ category: "education", mood_score: 3, is_significant: true });
    seed({ category: "wellbeing", mood_score: 4 });
    const s = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    expect(s.event_count).toBe(3);
    expect(s.significant_count).toBe(1);
    expect(s.avg_mood_score).toBe(4);
    expect(s.categories.sort()).toEqual(["education", "wellbeing"]);
  });

  it("flags requires_followup on safeguarding/reg40/manager review", () => {
    seed({ is_safeguarding: true });
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!.requires_followup).toBe(true);

    clearAll();
    seed({ requires_reg40_triage: true });
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!.requires_followup).toBe(true);

    clearAll();
    seed({ requires_manager_review: true });
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!.requires_followup).toBe(true);
  });

  it("excludes draft and returned events", () => {
    seed({ status: "draft" });
    seed({ status: "returned" });
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)).toBeNull();
  });

  it("excludes non-current versions (only findCurrent rows)", () => {
    seed({ is_current_version: false });
    expect(rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)).toBeNull();
  });

  it("is idempotent on (home_id, child_id, summary_date)", () => {
    seed({ mood_score: 4 });
    const a = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    const b = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    expect(b.id).toBe(a.id);
    const all = (db.childDailySummaries.findAll() as ChildDailySummary[]).filter(
      (s) => s.home_id === HOME_ID && s.child_id === CHILD_A && s.summary_date === DATE,
    );
    expect(all.length).toBe(1);
  });

  it("re-aggregates when underlying events change", () => {
    seed({ mood_score: 5 });
    const first = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    expect(first.event_count).toBe(1);
    seed({ mood_score: 3, is_significant: true });
    const second = rebuildChildDailySummary(HOME_ID, CHILD_A, DATE)!;
    expect(second.id).toBe(first.id);
    expect(second.event_count).toBe(2);
    expect(second.significant_count).toBe(1);
    expect(second.avg_mood_score).toBe(4);
  });

  it("rebuildChildDailySummariesForHome handles multiple children/dates", () => {
    seed({ child_id: CHILD_A, event_date: DATE });
    seed({ child_id: CHILD_A, event_date: "2026-05-10" });
    seed({ child_id: CHILD_B, event_date: DATE });
    const r = rebuildChildDailySummariesForHome(HOME_ID);
    expect(r.rebuilt).toBe(3);
    expect(r.summaries.map((s) => `${s.child_id}::${s.summary_date}`).sort()).toEqual([
      `${CHILD_A}::2026-05-10`,
      `${CHILD_A}::${DATE}`,
      `${CHILD_B}::${DATE}`,
    ]);
  });

  it("rebuildChildDailySummariesForHome can restrict to a single date", () => {
    seed({ child_id: CHILD_A, event_date: DATE });
    seed({ child_id: CHILD_A, event_date: "2026-05-10" });
    seed({ child_id: CHILD_B, event_date: DATE });
    const r = rebuildChildDailySummariesForHome(HOME_ID, { summaryDate: DATE });
    expect(r.rebuilt).toBe(2);
    expect(r.summaries.every((s) => s.summary_date === DATE)).toBe(true);
  });
});
