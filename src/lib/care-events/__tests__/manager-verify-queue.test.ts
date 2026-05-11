// ══════════════════════════════════════════════════════════════════════════════
// Manager Verify Queue + bulk actions — engine tests (Milestone 29)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { loadManagerVerifyQueue } from "@/lib/care-events/manager-verify-queue";
import {
  verifyCareEventsBulk,
  returnCareEventsBulk,
} from "@/lib/care-events/manager-bulk-actions";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_verify_test";

function clear() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((x) => x.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "needs review",
    content: "c",
    category: "general",
    is_current_version: true,
    event_date: "2026-05-01",
    status: "manager_review_required",
    submitted_at: new Date().toISOString(),
    staff_id: "staff_x",
    ...overrides,
  } as Parameters<typeof db.careEvents.create>[0]);
}

beforeEach(() => clear());

describe("loadManagerVerifyQueue", () => {
  it("returns empty queue when nothing pending", () => {
    const q = loadManagerVerifyQueue(HOME_ID);
    expect(q.total).toBe(0);
    expect(q.rows).toEqual([]);
    expect(q.sensitive_count).toBe(0);
  });

  it("includes only manager_review_required and routing_failed events", () => {
    seed({ title: "a" });
    seed({ title: "b", status: "routing_failed" });
    seed({ title: "c", status: "verified" });
    seed({ title: "d", status: "draft" });
    const q = loadManagerVerifyQueue(HOME_ID);
    expect(q.total).toBe(2);
    expect(q.rows.map((r) => r.title).sort()).toEqual(["a", "b"]);
  });

  it("flags safeguarding-sensitive items and prioritises them as critical", () => {
    seed({ title: "routine" });
    seed({ title: "safeguarding", is_safeguarding: true });
    const q = loadManagerVerifyQueue(HOME_ID);
    expect(q.sensitive_count).toBe(1);
    expect(q.rows[0].title).toBe("safeguarding");
    expect(q.rows[0].priority).toBe("critical");
  });

  it("excludes other homes", () => {
    seed({ home_id: "other_home" });
    expect(loadManagerVerifyQueue(HOME_ID).total).toBe(0);
  });
});

describe("verifyCareEventsBulk", () => {
  it("verifies eligible events and reports failures for ineligible ones", () => {
    const a = seed({ title: "a" });
    const b = seed({ title: "b", status: "draft" });
    const r = verifyCareEventsBulk(HOME_ID, [a.id, b.id, "missing"], "mgr_1", {
      manager_notes: "ok",
    });
    expect(r.total).toBe(3);
    expect(r.success).toBe(1);
    expect(r.failed).toBe(2);
    const updated = db.careEvents.findById(a.id);
    expect(updated?.status).toBe("verified");
    expect(updated?.verified_by).toBe("mgr_1");
    expect(updated?.manager_signature).toBe(true);
  });

  it("rejects events that belong to another home", () => {
    const e = db.careEvents.create({
      home_id: "other_home", child_id: "yp_a", title: "x", content: "c",
      category: "general", is_current_version: true, event_date: "2026-05-01",
      status: "manager_review_required", staff_id: "s",
    } as Parameters<typeof db.careEvents.create>[0]);
    const r = verifyCareEventsBulk(HOME_ID, [e.id], "mgr_1");
    expect(r.success).toBe(0);
    expect(r.items[0].error).toBe("wrong_home");
  });
});

describe("returnCareEventsBulk", () => {
  it("returns eligible events with reason and records audit", () => {
    const a = seed({ title: "a" });
    const r = returnCareEventsBulk(HOME_ID, [a.id], "mgr_1", {
      return_reason: "needs detail",
    });
    expect(r.success).toBe(1);
    const updated = db.careEvents.findById(a.id);
    expect(updated?.status).toBe("returned");
    expect(updated?.return_reason).toBe("needs detail");
    expect(updated?.returned_by).toBe("mgr_1");
  });

  it("blocks return when reason is empty", () => {
    const a = seed({ title: "a" });
    const r = returnCareEventsBulk(HOME_ID, [a.id], "mgr_1", { return_reason: "" });
    expect(r.success).toBe(0);
    expect(r.items[0].error).toBe("return_reason_required");
  });

  it("rejects events whose status is not returnable", () => {
    const a = seed({ title: "a", status: "verified" });
    const r = returnCareEventsBulk(HOME_ID, [a.id], "mgr_1", { return_reason: "x" });
    expect(r.success).toBe(0);
    expect(r.items[0].error).toMatch(/^not_returnable:/);
  });
});
