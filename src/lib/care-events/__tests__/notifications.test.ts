// ══════════════════════════════════════════════════════════════════════════════
// Notifications Center — engine tests (Milestone 27)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { loadNotifications, notificationCount } from "@/lib/care-events/notifications";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_notif_test";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((x) => x.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
  const t40 = db.ariaReg40Triages.findAll(HOME_ID);
  const all40 = db.ariaReg40Triages.findAll();
  for (const t of t40) {
    const i = all40.indexOf(t); if (i >= 0) all40.splice(i, 1);
  }
  const routes = db.careEventRoutes.findAll();
  for (const r of routes.filter((x) => x.home_id === HOME_ID)) {
    const i = routes.indexOf(r); if (i >= 0) routes.splice(i, 1);
  }
  const jobs = db.careEventJobs.findAll();
  for (const j of jobs.filter((x) => x.home_id === HOME_ID)) {
    const i = jobs.indexOf(j); if (i >= 0) jobs.splice(i, 1);
  }
}

function seedEvent(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "t",
    content: "c",
    category: "general",
    is_current_version: true,
    event_date: "2026-05-01",
    ...overrides,
  } as Parameters<typeof db.careEvents.create>[0]);
}

beforeEach(() => clearAll());

describe("loadNotifications", () => {
  it("returns empty stream when nothing pending", () => {
    const r = loadNotifications(HOME_ID);
    expect(r.total).toBe(0);
    expect(r.items).toEqual([]);
    expect(r.by_severity.critical).toBe(0);
    expect(r.for_managers).toBe(0);
    expect(r.for_staff).toBe(0);
  });

  it("creates a returned_record notification targeted at the staff author", () => {
    seedEvent({
      title: "needs fix",
      status: "returned",
      returned_at: new Date().toISOString(),
      return_reason: "missing detail",
      staff_id: "staff_x",
    });
    const r = loadNotifications(HOME_ID);
    expect(r.total).toBe(1);
    const n = r.items[0];
    expect(n.source).toBe("returned_record");
    expect(n.audience).toBe("staff");
    expect(n.target_staff_id).toBe("staff_x");
    expect(r.for_staff).toBe(1);
  });

  it("escalates returned safeguarding-sensitive records to critical", () => {
    seedEvent({
      title: "danger",
      status: "returned",
      returned_at: new Date().toISOString(),
      is_safeguarding: true,
      staff_id: "staff_y",
    });
    const r = loadNotifications(HOME_ID);
    expect(r.items[0].severity).toBe("critical");
  });

  it("creates manager_review_required notifications targeted at managers", () => {
    seedEvent({ title: "rev", status: "manager_review_required" });
    const r = loadNotifications(HOME_ID);
    expect(r.items[0].source).toBe("manager_review_required");
    expect(r.items[0].audience).toBe("manager");
    expect(r.items[0].target_staff_id).toBeNull();
    expect(r.for_managers).toBe(1);
  });

  it("creates reg40_triage_pending notifications", () => {
    db.ariaReg40Triages.create({
      home_id: HOME_ID,
      child_id: "yp_a",
      source_event_id: "src",
      source_category: "safeguarding",
      source_title: "x",
      source_event_date: "2026-05-01",
      suggested_category: "child_protection_concern",
      reasoning: "auto flag",
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      notification_ref: null,
    });
    const r = loadNotifications(HOME_ID);
    expect(r.items[0].source).toBe("reg40_triage_pending");
    expect(r.items[0].severity).toBe("critical");
  });

  it("orders critical → warning → info, then newest first", () => {
    // info: routine manager review
    seedEvent({ title: "routine", status: "manager_review_required" });
    // critical: safeguarding manager review
    seedEvent({ title: "danger", status: "manager_review_required", is_safeguarding: true });
    const r = loadNotifications(HOME_ID);
    expect(r.items[0].severity).toBe("critical");
    expect(r.items[r.items.length - 1].severity).not.toBe("critical");
  });

  it("excludes other homes", () => {
    seedEvent({ home_id: "other_home", status: "manager_review_required" });
    expect(notificationCount(HOME_ID)).toBe(0);
  });

  it("counts by_severity, for_managers and for_staff correctly", () => {
    seedEvent({
      title: "t1", status: "returned",
      returned_at: new Date().toISOString(), staff_id: "s1",
    });
    seedEvent({ title: "t2", status: "manager_review_required", is_safeguarding: true });
    seedEvent({ title: "t3", status: "manager_review_required" });
    const r = loadNotifications(HOME_ID);
    expect(r.total).toBe(3);
    expect(r.for_staff).toBe(1);
    expect(r.for_managers).toBe(2);
    expect(r.by_severity.critical).toBeGreaterThanOrEqual(1);
  });
});
