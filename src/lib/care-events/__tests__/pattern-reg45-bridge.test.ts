// ══════════════════════════════════════════════════════════════════════════════
// Pattern → Reg 45 bridge tests (Milestone 18)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { promoteCareEventPatternsToReg45 } from "@/lib/care-events/pattern-reg45-bridge";
import type { CareEvent, CareEventCategory } from "@/types/care-events";

const HOME_ID = "home_promote_test";

function clearAll() {
  // Care events
  const all = db.careEvents.findAll();
  const mine = all.filter((e) => e.home_id === HOME_ID);
  for (const e of mine) {
    const idx = all.indexOf(e);
    if (idx >= 0) all.splice(idx, 1);
  }
  // Reg 45 chips
  const chips = db.caraReg45EvidenceItems.findAll(HOME_ID);
  const allChips = db.caraReg45EvidenceItems.findAll();
  for (const c of chips) {
    const idx = allChips.indexOf(c);
    if (idx >= 0) allChips.splice(idx, 1);
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seed(opts: { child_id?: string; category?: CareEventCategory; daysBack?: number; status?: CareEvent["status"] } = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: opts.child_id ?? "yp_alex",
    category: opts.category ?? "behaviour",
    title: "test",
    content: "x",
    is_current_version: true,
    event_date: daysAgo(opts.daysBack ?? 1),
    status: opts.status ?? "verified",
  });
}

describe("promoteCareEventPatternsToReg45", () => {
  beforeEach(() => clearAll());

  it("returns zero counts when no patterns are detected", () => {
    const r = promoteCareEventPatternsToReg45(HOME_ID);
    expect(r.scanned).toBe(0);
    expect(r.created).toBe(0);
    expect(r.refreshed).toBe(0);
  });

  it("creates Reg 45 evidence chips from detected patterns", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const r = promoteCareEventPatternsToReg45(HOME_ID);
    expect(r.scanned).toBeGreaterThan(0);
    expect(r.created).toBe(r.scanned);
    expect(r.items.every((c) => c.status === "ai_draft")).toBe(true);
    expect(r.items.every((c) => c.source_table === "care_event_patterns")).toBe(true);
  });

  it("is idempotent — re-promoting refreshes the same chips, never duplicates", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const first = promoteCareEventPatternsToReg45(HOME_ID);
    const second = promoteCareEventPatternsToReg45(HOME_ID);
    expect(second.created).toBe(0);
    expect(second.refreshed).toBe(first.created);
    expect(db.caraReg45EvidenceItems.findAll(HOME_ID).length).toBe(first.created);
  });

  it("does not silently overwrite chips already included in a report", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const first = promoteCareEventPatternsToReg45(HOME_ID);
    // Lock the first chip into a report
    const chip = first.items[0]!;
    db.caraReg45EvidenceItems.patch(chip.id, { status: "included_in_report" });
    const second = promoteCareEventPatternsToReg45(HOME_ID);
    expect(second.skipped_locked).toBeGreaterThanOrEqual(1);
    const stillLocked = db.caraReg45EvidenceItems.findById(chip.id);
    expect(stillLocked?.status).toBe("included_in_report");
  });

  it("preserves accepted/rejected manager decisions when refreshing", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const first = promoteCareEventPatternsToReg45(HOME_ID);
    const chip = first.items[0]!;
    db.caraReg45EvidenceItems.patch(chip.id, { status: "accepted" });
    promoteCareEventPatternsToReg45(HOME_ID);
    const after = db.caraReg45EvidenceItems.findById(chip.id);
    expect(after?.status).toBe("accepted");
  });

  it("maps category to a finer Reg 45 theme", () => {
    seed({ child_id: "yp_a", category: "education", daysBack: 1 });
    seed({ child_id: "yp_a", category: "education", daysBack: 2 });
    seed({ child_id: "yp_a", category: "education", daysBack: 3 });
    const r = promoteCareEventPatternsToReg45(HOME_ID);
    const eduChip = r.items.find((c) => c.theme === "education");
    expect(eduChip).toBeDefined();
  });
});
