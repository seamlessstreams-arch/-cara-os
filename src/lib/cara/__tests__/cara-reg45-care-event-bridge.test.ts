// ══════════════════════════════════════════════════════════════════════════════
// Direct Care Event → Reg 45 Evidence Bridge tests (Milestone 32)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  runReg45EvidenceBuild,
  upsertReg45EvidenceForCareEvent,
} from "@/lib/cara/cara-reg45-evidence";
import { verifyCareEventsBulk } from "@/lib/care-events/manager-bulk-actions";
import type { CareEvent, CareEventCategory } from "@/types/care-events";

const HOME_ID = "home_reg45_bridge";

function clear() {
  const evs = db.careEvents.findAll();
  for (const e of [...evs]) {
    if (e.home_id === HOME_ID) {
      const i = evs.indexOf(e); if (i >= 0) evs.splice(i, 1);
    }
  }
  const r45 = db.caraReg45EvidenceItems.findAll(HOME_ID);
  for (const r of [...r45]) {
    db.caraReg45EvidenceItems.patch(r.id, { status: "rejected" });
  }
}

function seedEvent(overrides: Partial<CareEvent> = {}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_a",
    title: "Verified incident",
    content: "A safeguarding concern that should appear in Reg 45 evidence.",
    category: "safeguarding" as CareEventCategory,
    is_current_version: true,
    event_date: new Date().toISOString().slice(0, 10),
    status: "manager_review_required",
    contributes_to_reg45: true,
    is_safeguarding: true,
    submitted_at: new Date().toISOString(),
    staff_id: "staff_x",
    ...overrides,
  } as Parameters<typeof db.careEvents.create>[0]);
}

function ownChips(careEventId: string) {
  return db.caraReg45EvidenceItems
    .findAll(HOME_ID)
    .filter((r) => r.source_table === "care_events" && r.source_id === careEventId);
}

describe("Care Event → Reg 45 direct evidence bridge (M32)", () => {
  beforeEach(() => clear());

  it("upsertReg45EvidenceForCareEvent creates a chip when verified + contributes_to_reg45", () => {
    const e = seedEvent();
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });

    const chip = upsertReg45EvidenceForCareEvent(HOME_ID, e.id);
    expect(chip).not.toBeNull();
    expect(chip!.source_table).toBe("care_events");
    expect(chip!.source_id).toBe(e.id);
    expect(chip!.theme).toBe("safeguarding");
    expect(chip!.status).toBe("ai_draft");
    expect(chip!.title.startsWith("Verified care event"));
  });

  it("returns null when the event is not yet verified", () => {
    const e = seedEvent();
    expect(upsertReg45EvidenceForCareEvent(HOME_ID, e.id)).toBeNull();
  });

  it("returns null when contributes_to_reg45 is false", () => {
    const e = seedEvent({ contributes_to_reg45: false });
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });
    expect(upsertReg45EvidenceForCareEvent(HOME_ID, e.id)).toBeNull();
  });

  it("returns null for wrong home", () => {
    const e = seedEvent();
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });
    expect(upsertReg45EvidenceForCareEvent("home_other", e.id)).toBeNull();
  });

  it("is idempotent — repeated calls do not create duplicate chips", () => {
    const e = seedEvent();
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });
    upsertReg45EvidenceForCareEvent(HOME_ID, e.id);
    upsertReg45EvidenceForCareEvent(HOME_ID, e.id);
    upsertReg45EvidenceForCareEvent(HOME_ID, e.id);
    expect(ownChips(e.id).length).toBe(1);
  });

  it("themes by category — health event maps to health theme", () => {
    const e = seedEvent({ category: "health", is_safeguarding: false });
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });
    const chip = upsertReg45EvidenceForCareEvent(HOME_ID, e.id);
    expect(chip!.theme).toBe("health");
    expect(chip!.sentiment).toBe("neutral");
  });

  it("runReg45EvidenceBuild picks up verified care events as their own chips", () => {
    const e = seedEvent({ category: "complaint", is_safeguarding: false });
    db.careEvents.patch(e.id, { status: "verified", verified_at: new Date().toISOString() });

    runReg45EvidenceBuild(HOME_ID);
    const chips = ownChips(e.id);
    expect(chips.length).toBe(1);
    expect(chips[0].theme).toBe("complaints_voice");
  });

  it("manager bulk verify auto-creates AND auto-accepts the chip", () => {
    const e = seedEvent();
    const result = verifyCareEventsBulk(HOME_ID, [e.id], "manager_1");
    expect(result.success).toBe(1);

    const chips = ownChips(e.id);
    expect(chips.length).toBe(1);
    expect(chips[0].status).toBe("accepted");
    expect(chips[0].decided_by).toBe("manager_1");
  });
});
