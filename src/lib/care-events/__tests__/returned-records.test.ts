// ══════════════════════════════════════════════════════════════════════════════
// Returned Records Queue — engine tests (Milestone 23)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadReturnedRecordsQueue,
  returnedRecordsCount,
} from "@/lib/care-events/returned-records";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_returned_test";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((e) => e.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "t", content: "c",
    category: "general",
    is_current_version: true,
    event_date: "2026-05-01",
    status: "verified",
    ...overrides,
  });
}

describe("returned records queue", () => {
  beforeEach(() => clearAll());

  it("returns empty when nothing is returned", () => {
    seed({ status: "verified" });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.total).toBe(0);
    expect(s.rows).toEqual([]);
  });

  it("includes returned events only", () => {
    seed({ status: "returned", return_reason: "fix wording" });
    seed({ status: "verified" });
    seed({ status: "submitted" });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.total).toBe(1);
    expect(s.rows[0]!.return_reason).toBe("fix wording");
  });

  it("computes age bands from returned_at", () => {
    seed({ status: "returned", returned_at: isoDaysAgo(0) });
    seed({ status: "returned", returned_at: isoDaysAgo(2) });
    seed({ status: "returned", returned_at: isoDaysAgo(5) });
    seed({ status: "returned", returned_at: isoDaysAgo(15) });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.by_band.today).toBe(1);
    expect(s.by_band["1_3_days"]).toBe(1);
    expect(s.by_band["4_7_days"]).toBe(1);
    expect(s.by_band.over_7_days).toBe(1);
  });

  it("sorts most overdue first", () => {
    seed({ status: "returned", returned_at: isoDaysAgo(1), title: "fresh" });
    seed({ status: "returned", returned_at: isoDaysAgo(10), title: "old" });
    seed({ status: "returned", returned_at: isoDaysAgo(4), title: "mid" });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.rows.map((r) => r.title)).toEqual(["old", "mid", "fresh"]);
  });

  it("floats safeguarding-sensitive records up within an age band", () => {
    seed({
      status: "returned", returned_at: isoDaysAgo(2),
      title: "plain", is_safeguarding: false,
    });
    seed({
      status: "returned", returned_at: isoDaysAgo(2),
      title: "sensitive", is_safeguarding: true,
    });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.rows[0]!.title).toBe("sensitive");
    expect(s.safeguarding_sensitive_count).toBe(1);
  });

  it("groups by staff", () => {
    seed({ status: "returned", staff_id: "s_a" });
    seed({ status: "returned", staff_id: "s_a" });
    seed({ status: "returned", staff_id: "s_b" });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.by_staff["s_a"]).toBe(2);
    expect(s.by_staff["s_b"]).toBe(1);
  });

  it("flags reg40/reg45/annex_a as sensitive too", () => {
    seed({ status: "returned", contributes_to_reg45: true });
    seed({ status: "returned", contributes_to_annex_a: true });
    seed({ status: "returned", requires_reg40_triage: true });
    const s = loadReturnedRecordsQueue(HOME_ID);
    expect(s.safeguarding_sensitive_count).toBe(3);
  });

  it("returnedRecordsCount matches total", () => {
    seed({ status: "returned" });
    seed({ status: "returned" });
    expect(returnedRecordsCount(HOME_ID)).toBe(2);
  });
});
