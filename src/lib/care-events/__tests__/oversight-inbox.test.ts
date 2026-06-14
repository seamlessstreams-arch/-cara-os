// ══════════════════════════════════════════════════════════════════════════════
// Manager Oversight Inbox — engine tests (Milestone 24)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadOversightInbox,
  oversightInboxCount,
} from "@/lib/care-events/oversight-inbox";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_oversight_test";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((e) => e.home_id === HOME_ID)) {
    const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
  }
  const triages = db.caraReg40Triages.findAll(HOME_ID);
  const all40 = db.caraReg40Triages.findAll();
  for (const t of triages) {
    const i = all40.indexOf(t); if (i >= 0) all40.splice(i, 1);
  }
  const r45 = db.caraReg45EvidenceItems.findAll(HOME_ID);
  const all45 = db.caraReg45EvidenceItems.findAll();
  for (const r of r45) {
    const i = all45.indexOf(r); if (i >= 0) all45.splice(i, 1);
  }
  const aae = db.annexAEvidenceQueue.findAll();
  for (const a of aae.filter((x) => x.home_id === HOME_ID)) {
    const i = aae.indexOf(a); if (i >= 0) aae.splice(i, 1);
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

describe("loadOversightInbox", () => {
  it("returns empty inbox when nothing pending", () => {
    const r = loadOversightInbox(HOME_ID);
    expect(r.total).toBe(0);
    expect(r.items).toEqual([]);
    expect(r.by_priority.critical).toBe(0);
    expect(r.by_source.manager_review).toBe(0);
  });

  it("includes manager_review_required care events", () => {
    seedEvent({
      title: "needs review",
      status: "manager_review_required",
      is_safeguarding: true,
    });
    const r = loadOversightInbox(HOME_ID);
    expect(r.total).toBe(1);
    expect(r.items[0].source).toBe("manager_review");
    expect(r.items[0].priority).toBe("critical");
    expect(r.items[0].is_safeguarding_sensitive).toBe(true);
    expect(r.by_source.manager_review).toBe(1);
  });

  it("includes pending reg40 triages with critical priority", () => {
    db.caraReg40Triages.create({
      home_id: HOME_ID,
      child_id: "yp_a",
      source_event_id: "src1",
      source_category: "safeguarding",
      source_title: "missing",
      source_event_date: "2026-05-01",
      suggested_category: "child_protection_concern",
      reasoning: "automatic flag",
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      notification_ref: null,
    });
    const r = loadOversightInbox(HOME_ID);
    expect(r.by_source.reg40_triage).toBe(1);
    expect(r.items[0].priority).toBe("critical");
  });

  it("includes Reg 45 ai_draft chips and Annex A pending items", () => {
    db.caraReg45EvidenceItems.create({
      home_id: HOME_ID,
      child_id: null,
      theme: "safeguarding",
      title: "Pattern detected",
      summary: "...",
      severity: "high",
      sentiment: "concern",
      source_type: "management_oversight",
      source_table: "x",
      source_id: "y",
      occurred_at: new Date().toISOString(),
      period_start: "2026-05-01",
      period_end: "2026-05-08",
      status: "ai_draft",
      is_ai_draft: true,
      generated_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      included_in_report_id: null,
    });
    const evt = seedEvent({ status: "verified", contributes_to_annex_a: true });
    db.annexAEvidenceQueue.upsert({
      care_event_id: evt.id,
      home_id: HOME_ID,
      annex_section: "section_3",
      suggested_text: "summary text",
      manager_decision: "pending",
      manager_approved_text: null,
      reviewed_by: null,
      reviewed_at: null,
    });
    const r = loadOversightInbox(HOME_ID);
    expect(r.by_source.reg45_chip).toBe(1);
    expect(r.by_source.annex_a_chip).toBe(1);
  });

  it("ranks critical before high before medium before low", () => {
    // medium
    seedEvent({ title: "routine", status: "manager_review_required" });
    // critical
    seedEvent({ title: "danger", status: "manager_review_required", is_safeguarding: true });
    const r = loadOversightInbox(HOME_ID);
    expect(r.items.length).toBe(2);
    expect(r.items[0].priority).toBe("critical");
    expect(r.items[1].priority).toBe("medium");
  });

  it("excludes other homes", () => {
    seedEvent({ home_id: "other_home", status: "manager_review_required" });
    expect(oversightInboxCount(HOME_ID)).toBe(0);
  });

  it("ignores Reg 45 chips that are not ai_draft", () => {
    db.caraReg45EvidenceItems.create({
      home_id: HOME_ID,
      child_id: null,
      theme: "health",
      title: "Already accepted",
      summary: "...",
      severity: "medium",
      sentiment: "concern",
      source_type: "management_oversight",
      source_table: "x",
      source_id: "y2",
      occurred_at: new Date().toISOString(),
      period_start: "2026-05-01",
      period_end: "2026-05-08",
      status: "accepted",
      is_ai_draft: false,
      generated_at: new Date().toISOString(),
      decided_by: "mgr",
      decided_at: new Date().toISOString(),
      decision_note: null,
      included_in_report_id: null,
    });
    expect(oversightInboxCount(HOME_ID)).toBe(0);
  });

  it("aggregates by_source counts correctly", () => {
    seedEvent({ status: "manager_review_required" });
    seedEvent({ status: "manager_review_required", title: "two" });
    db.caraReg40Triages.create({
      home_id: HOME_ID, child_id: null,
      source_event_id: "src", source_category: "x", source_title: "x",
      source_event_date: "2026-05-01",
      suggested_category: "child_protection_concern",
      reasoning: "r", status: "pending",
      created_at: new Date().toISOString(),
      decided_by: null, decided_at: null,
      decision_note: null, notification_ref: null,
    });
    const r = loadOversightInbox(HOME_ID);
    expect(r.by_source.manager_review).toBe(2);
    expect(r.by_source.reg40_triage).toBe(1);
    expect(r.total).toBe(3);
  });
});
