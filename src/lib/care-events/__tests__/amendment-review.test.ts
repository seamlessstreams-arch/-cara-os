// ══════════════════════════════════════════════════════════════════════════════
// Amendment Review Queue — engine tests (Milestone 19)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadAmendmentReviewQueue,
  amendmentReviewCount,
} from "@/lib/care-events/amendment-review";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_amend_review_test";

function clearAll() {
  const all = db.careEvents.findAll();
  const mine = all.filter((e) => e.home_id === HOME_ID);
  for (const e of mine) {
    const idx = all.indexOf(e);
    if (idx >= 0) all.splice(idx, 1);
  }
}

function seed(opts: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "test",
    content: "x",
    category: "general",
    is_current_version: true,
    event_date: "2026-05-01",
    status: "verified",
    version: 1,
    ...opts,
  });
}

describe("amendment review queue", () => {
  beforeEach(() => clearAll());

  it("returns empty when no amendments exist", () => {
    const s = loadAmendmentReviewQueue(HOME_ID);
    expect(s.total).toBe(0);
    expect(s.rows).toEqual([]);
  });

  it("ignores first-version events (no amendment)", () => {
    seed({ is_safeguarding: true, status: "submitted", version: 1 });
    expect(loadAmendmentReviewQueue(HOME_ID).total).toBe(0);
  });

  it("ignores amendments without sensitive flags", () => {
    const prev = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2,
      previous_version_id: prev.id,
      status: "submitted",
      amended_at: "2026-05-10T10:00:00Z",
      amendment_reason: "typo",
    });
    expect(loadAmendmentReviewQueue(HOME_ID).total).toBe(0);
  });

  it("ignores already re-verified amendments", () => {
    const prev = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2,
      previous_version_id: prev.id,
      is_safeguarding: true,
      status: "verified",
      amended_at: "2026-05-10T10:00:00Z",
    });
    expect(loadAmendmentReviewQueue(HOME_ID).total).toBe(0);
  });

  it("surfaces sensitive amendment awaiting re-verification", () => {
    const prev = seed({ is_current_version: false, version: 1, title: "old" });
    const curr = seed({
      version: 2,
      previous_version_id: prev.id,
      is_safeguarding: true,
      status: "submitted",
      title: "new",
      amended_at: "2026-05-10T10:00:00Z",
      amendment_reason: "added context",
    });
    const s = loadAmendmentReviewQueue(HOME_ID);
    expect(s.total).toBe(1);
    expect(s.rows[0]!.care_event_id).toBe(curr.id);
    expect(s.rows[0]!.sensitive_flags).toContain("safeguarding");
    expect(s.rows[0]!.diff.find((d) => d.field === "title")).toBeDefined();
  });

  it("counts each sensitive flag separately", () => {
    const p1 = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: p1.id,
      contributes_to_reg45: true, contributes_to_annex_a: true,
      status: "submitted", amended_at: "2026-05-10T10:00:00Z",
    });
    const p2 = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: p2.id,
      requires_reg40_triage: true, is_safeguarding: true,
      status: "manager_review_required", amended_at: "2026-05-09T10:00:00Z",
    });
    const s = loadAmendmentReviewQueue(HOME_ID);
    expect(s.total).toBe(2);
    expect(s.by_flag.safeguarding).toBe(1);
    expect(s.by_flag.reg40).toBe(1);
    expect(s.by_flag.reg45).toBe(1);
    expect(s.by_flag.annex_a).toBe(1);
  });

  it("sorts most recently amended first", () => {
    const p1 = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: p1.id,
      is_safeguarding: true, status: "submitted",
      amended_at: "2026-05-08T10:00:00Z", title: "older amend",
    });
    const p2 = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: p2.id,
      is_safeguarding: true, status: "submitted",
      amended_at: "2026-05-10T10:00:00Z", title: "newer amend",
    });
    const s = loadAmendmentReviewQueue(HOME_ID);
    expect(s.rows[0]!.title).toBe("newer amend");
  });

  it("amendmentReviewCount matches summary total", () => {
    const p = seed({ is_current_version: false, version: 1 });
    seed({
      version: 2, previous_version_id: p.id,
      is_safeguarding: true, status: "submitted",
    });
    expect(amendmentReviewCount(HOME_ID)).toBe(1);
  });
});
