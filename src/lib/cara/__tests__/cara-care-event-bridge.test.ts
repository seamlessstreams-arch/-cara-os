// ══════════════════════════════════════════════════════════════════════════════
// Cara Care Event Bridge — engine tests (Milestone 12)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  proposeRecordsFromCareEvent,
  backfillSuggestedRecordsFromCareEvents,
} from "@/lib/cara/cara-care-event-bridge";
import type { CareEvent, CareEventCategory } from "@/types/care-events";

const HOME_ID = "home_bridge_test";

function makeEvent(extras: Partial<CareEvent> & { category: CareEventCategory; title: string }): CareEvent {
  const now = new Date().toISOString();
  const { category, title, ...rest } = extras;
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_alex",
    staff_id: "u_writer",
    content: "Free-text content from staff member.",
    status: "verified",
    event_date: "2026-05-11",
    is_current_version: true,
    verified_at: now,
    ...rest,
    category,
    title,
  }) as CareEvent;
}

function clearAll() {
  // Snapshot pending suggestions for this home and mark them superseded so
  // they fall out of pending lookups in the engine (no public delete).
  const pending = db.caraSuggestedRecords
    .findAll(HOME_ID)
    .filter((r) => r.status === "pending");
  for (const r of pending) {
    db.caraSuggestedRecords.patch(r.id, { status: "superseded" });
  }
  // Also remove the test care events from the global array so backfill stays
  // bounded.
  const events = db.careEvents.findAll().filter((e) => e.home_id === HOME_ID);
  for (const e of events) {
    const arr = db.careEvents.findAll();
    const idx = arr.indexOf(e);
    if (idx >= 0) arr.splice(idx, 1);
  }
}

describe("cara-care-event-bridge engine", () => {
  beforeEach(() => clearAll());

  it("proposeRecordsFromCareEvent maps safeguarding → incident_summary + risk_update", () => {
    const event = makeEvent({ category: "safeguarding", title: "Concern raised about peer" });
    const result = proposeRecordsFromCareEvent(event, "u_manager");
    expect(result.skipped).toBe(false);
    const types = result.proposed.map((r) => r.record_type).sort();
    expect(types).toEqual(["incident_summary", "risk_update"]);
    for (const rec of result.proposed) {
      expect(rec.status).toBe("pending");
      expect(rec.source_evidence[0].type).toBe("care_event");
      expect(rec.source_evidence[0].id).toBe(event.id);
      expect(rec.suggested_body).toContain(event.content);
    }
  });

  it("proposeRecordsFromCareEvent is idempotent for the same care event", () => {
    const event = makeEvent({ category: "behaviour", title: "Tense moment after dinner" });
    const first = proposeRecordsFromCareEvent(event, "u_manager");
    const second = proposeRecordsFromCareEvent(event, "u_manager");
    expect(first.proposed.length).toBeGreaterThan(0);
    expect(second.proposed.length).toBe(0);
    expect(second.reused.length).toBe(first.proposed.length);
    // Same suggestion ids returned the second time
    expect(second.reused.map((r) => r.id).sort()).toEqual(
      first.proposed.map((r) => r.id).sort(),
    );
  });

  it("proposeRecordsFromCareEvent skips categories with no mapping", () => {
    const event = makeEvent({ category: "general", title: "Quiet morning" });
    const result = proposeRecordsFromCareEvent(event, "u_manager");
    expect(result.skipped).toBe(true);
    expect(result.proposed).toHaveLength(0);
  });

  it("draft body includes completed evidence prompt answers", () => {
    const event = makeEvent({
      category: "physical_intervention",
      title: "Hold during dinner",
      evidence_prompts: [
        { id: "p1", question: "What hold was used?", required: true, answer: "Two-person guide", completed: true },
        { id: "p2", question: "Was the YP injured?", required: true, answer: "No", completed: true },
        { id: "p3", question: "Optional context?", required: false, completed: false },
      ],
    });
    const result = proposeRecordsFromCareEvent(event, "u_manager");
    const body = result.proposed[0].suggested_body;
    expect(body).toContain("What hold was used? Two-person guide");
    expect(body).toContain("Was the YP injured? No");
    expect(body).not.toContain("Optional context?");
  });

  it("backfillSuggestedRecordsFromCareEvents only bridges verified/locked events with mapped categories", () => {
    makeEvent({ category: "safeguarding", title: "Verified safeguarding", status: "verified" });
    makeEvent({ category: "behaviour", title: "Locked behaviour", status: "locked" });
    makeEvent({ category: "general", title: "Verified general (unmapped)", status: "verified" });
    makeEvent({ category: "safeguarding", title: "Draft safeguarding", status: "draft" });

    const results = backfillSuggestedRecordsFromCareEvents(HOME_ID, "u_manager");
    // Only the two verified/locked events with mapped categories should have proposals
    const withProposals = results.filter((r) => r.proposed.length > 0);
    expect(withProposals).toHaveLength(2);
  });

  it("backfill is idempotent across runs", () => {
    makeEvent({ category: "behaviour", title: "Repeat backfill check" });
    const first = backfillSuggestedRecordsFromCareEvents(HOME_ID, "u_manager");
    const second = backfillSuggestedRecordsFromCareEvents(HOME_ID, "u_manager");
    const firstProposed = first.reduce((n, r) => n + r.proposed.length, 0);
    const secondProposed = second.reduce((n, r) => n + r.proposed.length, 0);
    expect(firstProposed).toBeGreaterThan(0);
    expect(secondProposed).toBe(0);
  });

  it("includes home_id and child_id from the source event on the suggestion", () => {
    const event = makeEvent({ category: "safeguarding", title: "Scoping check", child_id: "yp_test" });
    const result = proposeRecordsFromCareEvent(event, "u_manager");
    for (const rec of result.proposed) {
      expect(rec.home_id).toBe(HOME_ID);
      expect(rec.child_id).toBe("yp_test");
    }
  });
});
