// ══════════════════════════════════════════════════════════════════════════════
// Care Event → Annex A Bridge — engine tests (Milestone 21)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { promoteCareEventsToAnnexA } from "@/lib/care-events/care-event-annex-a-bridge";
import type { AnnexAEvidenceItem, CareEvent } from "@/types/care-events";

const HOME_ID = "home_anx_test";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (const e of evs.filter((e) => e.home_id === HOME_ID)) {
    const i = evs.indexOf(e);
    if (i >= 0) evs.splice(i, 1);
  }
  const queue = db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[];
  for (const q of queue.filter((q) => q.home_id === HOME_ID)) {
    const i = queue.indexOf(q);
    if (i >= 0) queue.splice(i, 1);
  }
}

function seed(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "t",
    content: "Detailed content for evidence.",
    category: "safeguarding",
    is_current_version: true,
    event_date: "2026-05-01",
    status: "verified",
    contributes_to_annex_a: true,
    ...overrides,
  });
}

describe("care event → Annex A bridge", () => {
  beforeEach(() => clearAll());

  it("returns empty result with no eligible events", () => {
    const r = promoteCareEventsToAnnexA(HOME_ID);
    expect(r.scanned).toBe(0);
    expect(r.created).toBe(0);
    expect(r.items).toEqual([]);
  });

  it("ignores non-verified/non-locked events", () => {
    seed({ status: "submitted" });
    seed({ status: "draft" });
    expect(promoteCareEventsToAnnexA(HOME_ID).created).toBe(0);
  });

  it("ignores events not contributing to Annex A", () => {
    seed({ contributes_to_annex_a: false });
    expect(promoteCareEventsToAnnexA(HOME_ID).created).toBe(0);
  });

  it("creates a pending evidence item per verified contributing event", () => {
    seed({ category: "safeguarding" });
    seed({ category: "education" });
    const r = promoteCareEventsToAnnexA(HOME_ID);
    expect(r.scanned).toBe(2);
    expect(r.created).toBe(2);
    expect(r.items.map((i) => i.annex_section).sort()).toEqual(["section_3", "section_5"]);
    expect(r.items.every((i) => i.manager_decision === "pending")).toBe(true);
  });

  it("maps categories to the correct Annex A sections", () => {
    seed({ category: "health" });
    seed({ category: "family_contact" });
    seed({ category: "complaint" });
    seed({ category: "physical_intervention" });
    const r = promoteCareEventsToAnnexA(HOME_ID);
    const sections = r.items.map((i) => i.annex_section).sort();
    expect(sections).toEqual(["section_3", "section_4", "section_6", "section_7"]);
  });

  it("is idempotent on (care_event_id + annex_section)", () => {
    seed({ category: "safeguarding" });
    promoteCareEventsToAnnexA(HOME_ID);
    const r2 = promoteCareEventsToAnnexA(HOME_ID);
    expect(r2.created).toBe(0);
    expect(r2.refreshed).toBe(1);
    const queue = (db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[])
      .filter((q) => q.home_id === HOME_ID);
    expect(queue.length).toBe(1);
  });

  it("preserves locked decisions (approved/accepted/rejected) and counts as skipped_locked", () => {
    const event = seed({ category: "safeguarding" });
    promoteCareEventsToAnnexA(HOME_ID);
    const queue = db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[];
    const chip = queue.find((q) => q.care_event_id === event.id)!;
    db.annexAEvidenceQueue.patch(chip.id, {
      manager_decision: "approved",
      manager_approved_text: "Manager-edited final wording",
    });
    db.careEvents.patch(event.id, { content: "RE-EDITED CONTENT" });

    const r = promoteCareEventsToAnnexA(HOME_ID);
    expect(r.skipped_locked).toBe(1);
    expect(r.created).toBe(0);
    expect(r.refreshed).toBe(0);

    const after = (db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[])
      .find((q) => q.id === chip.id)!;
    expect(after.manager_decision).toBe("approved");
    expect(after.manager_approved_text).toBe("Manager-edited final wording");
    expect(after.suggested_text).not.toContain("RE-EDITED CONTENT");
  });

  it("refreshes deferred chips with latest wording", () => {
    const event = seed({ category: "safeguarding", content: "v1" });
    promoteCareEventsToAnnexA(HOME_ID);
    const chip = (db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[])
      .find((q) => q.care_event_id === event.id)!;
    db.annexAEvidenceQueue.patch(chip.id, { manager_decision: "deferred" });
    db.careEvents.patch(event.id, { content: "v2 updated" });

    const r = promoteCareEventsToAnnexA(HOME_ID);
    expect(r.refreshed).toBe(1);
    const after = (db.annexAEvidenceQueue.findAll() as AnnexAEvidenceItem[])
      .find((q) => q.id === chip.id)!;
    expect(after.manager_decision).toBe("deferred");
    expect(after.suggested_text).toContain("v2 updated");
  });

  it("includes locked-status care events as eligible", () => {
    seed({ status: "locked", category: "education" });
    const r = promoteCareEventsToAnnexA(HOME_ID);
    expect(r.created).toBe(1);
    expect(r.items[0]!.annex_section).toBe("section_5");
  });
});
