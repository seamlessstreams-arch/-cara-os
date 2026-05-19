// ══════════════════════════════════════════════════════════════════════════════
// ARIA Reg 40 Triage — engine tests (Milestone 15)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  scanReg40Candidates,
  loadReg40Queue,
  decideReg40Triage,
} from "@/lib/aria/aria-reg40-triage";

const HOME_ID = "home_reg40_test";

function clearAll() {
  // Drop any care events for our test home from the underlying array.
  const events = db.careEvents.findAll().filter((e) => e.home_id === HOME_ID);
  const allEvents = db.careEvents.findAll();
  for (const e of events) {
    const idx = allEvents.indexOf(e);
    if (idx >= 0) allEvents.splice(idx, 1);
  }
  // Drop any triages for our test home.
  const triages = db.ariaReg40Triages.findAll(HOME_ID);
  for (const t of triages) {
    db.ariaReg40Triages.patch(t.id, { status: "dismissed" });
  }
  // Hard remove via array splice for cleanliness.
  // Underlying store array is the same reference as findAll() w/o homeId.
  const all = db.ariaReg40Triages.findAll();
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].home_id === HOME_ID) all.splice(i, 1);
  }
}

function seedReg40Event(opts: { title: string; category: string }) {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_alex",
    category: opts.category as never,
    title: opts.title,
    content: "Test body",
    requires_reg40_triage: true,
    is_current_version: true,
    status: "verified",
    event_date: "2026-05-10",
  });
}

describe("aria-reg40-triage engine", () => {
  beforeEach(() => clearAll());

  it("scans flagged events and creates pending triage rows", () => {
    seedReg40Event({ title: "Bedroom incident", category: "safeguarding" });
    seedReg40Event({ title: "Missing episode", category: "missing_episode" });
    const created = scanReg40Candidates(HOME_ID);
    expect(created).toHaveLength(2);
    expect(created.every((t) => t.status === "pending")).toBe(true);
  });

  it("is idempotent: running scan twice does not duplicate rows", () => {
    seedReg40Event({ title: "Bedroom incident", category: "safeguarding" });
    scanReg40Candidates(HOME_ID);
    const second = scanReg40Candidates(HOME_ID);
    expect(second).toHaveLength(0);
    expect(loadReg40Queue(HOME_ID)).toHaveLength(1);
  });

  it("maps care event category to suggested Reg 40 category", () => {
    seedReg40Event({ title: "Missing episode", category: "missing_episode" });
    const [t] = scanReg40Candidates(HOME_ID);
    expect(t.suggested_category).toBe("child_missing");
    seedReg40Event({ title: "Restraint", category: "restraint" });
    const created = scanReg40Candidates(HOME_ID);
    expect(created[0].suggested_category).toBe("serious_incident");
  });

  it("decide(notify) requires a notification reference", () => {
    seedReg40Event({ title: "X", category: "safeguarding" });
    const [t] = scanReg40Candidates(HOME_ID);
    const r = decideReg40Triage({
      triageId: t.id,
      action: "notify",
      actorId: "u_manager",
    });
    expect("code" in r && r.code).toBe("notification_ref_required");
  });

  it("decide(notify) succeeds with reference and locks row", () => {
    seedReg40Event({ title: "X", category: "safeguarding" });
    const [t] = scanReg40Candidates(HOME_ID);
    const r = decideReg40Triage({
      triageId: t.id,
      action: "notify",
      actorId: "u_manager",
      notificationRef: "OFS-2026-001",
      note: "Notified Ofsted via secure portal",
    });
    if ("code" in r) throw new Error("expected success");
    expect(r.status).toBe("notified");
    expect(r.notification_ref).toBe("OFS-2026-001");

    // Cannot decide again
    const r2 = decideReg40Triage({
      triageId: t.id,
      action: "dismiss",
      actorId: "u_manager",
      note: "trying again",
    });
    expect("code" in r2 && r2.code).toBe("not_pending");
  });

  it("decide(dismiss) requires a reason", () => {
    seedReg40Event({ title: "X", category: "safeguarding" });
    const [t] = scanReg40Candidates(HOME_ID);
    const r = decideReg40Triage({
      triageId: t.id,
      action: "dismiss",
      actorId: "u_manager",
    });
    expect("code" in r && r.code).toBe("reason_required");
  });

  it("decide(escalate) succeeds without reference and marks status", () => {
    seedReg40Event({ title: "X", category: "safeguarding" });
    const [t] = scanReg40Candidates(HOME_ID);
    const r = decideReg40Triage({
      triageId: t.id,
      action: "escalate",
      actorId: "u_manager",
      note: "Pass to RI",
    });
    if ("code" in r) throw new Error("expected success");
    expect(r.status).toBe("escalated");
  });

  it("loadReg40Queue can filter by status", () => {
    seedReg40Event({ title: "A", category: "safeguarding" });
    seedReg40Event({ title: "B", category: "missing_episode" });
    const [a] = scanReg40Candidates(HOME_ID);
    decideReg40Triage({
      triageId: a.id,
      action: "notify",
      actorId: "u_manager",
      notificationRef: "OFS-X",
    });
    const pending = loadReg40Queue(HOME_ID, "pending");
    const notified = loadReg40Queue(HOME_ID, "notified");
    expect(pending).toHaveLength(1);
    expect(notified).toHaveLength(1);
  });

  it("returns not_found for unknown triage id", () => {
    const r = decideReg40Triage({
      triageId: "reg40_nope",
      action: "notify",
      actorId: "u_manager",
      notificationRef: "x",
    });
    expect("code" in r && r.code).toBe("not_found");
  });
});
