// ══════════════════════════════════════════════════════════════════════════════
// Inspection Snapshot — engine tests (Milestone 30)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { generateInspectionSnapshot } from "@/lib/care-events/inspection-snapshot";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_snapshot_test";

function clear() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((x) => x.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
  const t40 = db.caraReg40Triages.findAll();
  for (const t of t40.filter((x) => x.home_id === HOME_ID)) {
    const i = t40.indexOf(t); if (i >= 0) t40.splice(i, 1);
  }
  const r45 = db.caraReg45EvidenceItems.findAll();
  for (const r of r45.filter((x) => x.home_id === HOME_ID)) {
    const i = r45.indexOf(r); if (i >= 0) r45.splice(i, 1);
  }
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "t",
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

describe("generateInspectionSnapshot", () => {
  it("produces a snapshot with deterministic shape and headline counters", () => {
    const snap = generateInspectionSnapshot(HOME_ID);
    expect(snap.home_id).toBe(HOME_ID);
    expect(snap.schema_version).toBe(1);
    expect(snap.id).toMatch(/^snap_/);
    expect(snap).toHaveProperty("readiness");
    expect(snap).toHaveProperty("filing_cabinet");
    expect(snap).toHaveProperty("routing_health");
    expect(snap).toHaveProperty("job_queue");
    expect(snap).toHaveProperty("oversight_inbox");
    expect(snap).toHaveProperty("manager_verify_queue");
    expect(snap).toHaveProperty("returned_records");
    expect(snap).toHaveProperty("notifications");
    expect(snap).toHaveProperty("saved_time");
    expect(snap.headline.manager_verify_total).toBe(0);
  });

  it("counts manager_review_required events into the verify-queue headline", () => {
    seed({ title: "a" });
    seed({ title: "b", is_safeguarding: true });
    const snap = generateInspectionSnapshot(HOME_ID);
    expect(snap.headline.manager_verify_total).toBe(2);
    expect(snap.headline.manager_verify_sensitive).toBe(1);
    expect(snap.headline.manager_verify_critical).toBeGreaterThanOrEqual(1);
  });

  it("counts returned records into the returned headline", () => {
    seed({
      title: "r", status: "returned",
      returned_at: new Date().toISOString(),
      return_reason: "x",
      is_safeguarding: true,
    });
    const snap = generateInspectionSnapshot(HOME_ID);
    expect(snap.headline.returned_total).toBe(1);
    expect(snap.headline.returned_safeguarding_sensitive).toBe(1);
  });

  it("counts pending Reg 40 triages", () => {
    db.caraReg40Triages.create({
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
    const snap = generateInspectionSnapshot(HOME_ID);
    expect(snap.headline.open_reg40_triages).toBe(1);
  });

  it("excludes other homes from headline counters", () => {
    seed({ home_id: "other_home" });
    const snap = generateInspectionSnapshot(HOME_ID);
    expect(snap.headline.manager_verify_total).toBe(0);
  });

  it("records the actor in generated_by when supplied", () => {
    const snap = generateInspectionSnapshot(HOME_ID, { generatedBy: "mgr_42" });
    expect(snap.generated_by).toBe("mgr_42");
  });
});
