import { describe, it, expect } from "vitest";
import { canViewChannel, canPostChannel, isManagerRole, type CommsUser } from "@/lib/comms/comms-access";
import { db } from "@/lib/db/store";
import type { CommsChannel } from "@/types/comms";

function chan(partial: Partial<CommsChannel>): CommsChannel {
  return {
    id: "c1", home_id: "home_oak", type: "shift_handover", name: "Shift Handover", description: null,
    access: "on_shift", allowed_roles: [], linked_child_id: null, linked_incident_id: null,
    sensitivity: "internal", is_archived: false, created_by: "system",
    created_at: "2026-01-01", updated_at: "2026-01-01", ...partial,
  };
}
const manager: CommsUser = { id: "m", role: "registered_manager", home_id: "home_oak", shift_active: false };
const rswOn: CommsUser = { id: "r", role: "residential_care_worker", home_id: "home_oak", shift_active: true };
const rswOff: CommsUser = { id: "r2", role: "residential_care_worker", home_id: "home_oak", shift_active: false };

describe("comms-access — managers vs staff, on/off shift", () => {
  it("manager can view operational channels off shift (oversight)", () => {
    expect(canViewChannel(manager, chan({ access: "on_shift" })).allowed).toBe(true);
    expect(canViewChannel(manager, chan({ access: "managers" })).allowed).toBe(true);
  });

  it("on-shift staff can view operational channels; off-shift staff cannot", () => {
    expect(canViewChannel(rswOn, chan({ access: "on_shift", type: "medication_updates" })).allowed).toBe(true);
    const off = canViewChannel(rswOff, chan({ access: "on_shift", type: "medication_updates" }));
    expect(off.allowed).toBe(false);
    expect(off.reason).toBe("not_on_shift");
  });

  it("off-shift staff keep limited read access (announcements/rota/training)", () => {
    expect(canViewChannel(rswOff, chan({ access: "all_staff", type: "home_announcements" })).allowed).toBe(true);
    expect(canViewChannel(rswOff, chan({ access: "on_shift", type: "rota_cover" })).allowed).toBe(true);
  });

  it("managers-only channels block general staff", () => {
    expect(canViewChannel(rswOn, chan({ access: "managers" })).allowed).toBe(false);
    expect(canViewChannel(manager, chan({ access: "managers" })).allowed).toBe(true);
  });

  it("child-linked channel requires assignment (or manager)", () => {
    const c = chan({ access: "child_linked", linked_child_id: "child_x" });
    expect(canViewChannel(rswOn, c).allowed).toBe(false);
    expect(canViewChannel({ ...rswOn, assigned_child_ids: ["child_x"] }, c).allowed).toBe(true);
    expect(canViewChannel(manager, c).allowed).toBe(true);
  });

  it("safeguarding channel requires lead or manager", () => {
    expect(canViewChannel(rswOn, chan({ access: "safeguarding" })).allowed).toBe(false);
    expect(canViewChannel({ ...rswOn, safeguarding_lead: true }, chan({ access: "safeguarding" })).allowed).toBe(true);
    expect(canViewChannel(manager, chan({ access: "safeguarding" })).allowed).toBe(true);
  });

  it("home mismatch blocks non-managers", () => {
    expect(canViewChannel({ ...rswOn, home_id: "home_other" }, chan({ access: "all_staff" })).allowed).toBe(false);
  });

  it("emergency/announcement posting is manager-only; off-shift limited channels are read-only", () => {
    expect(canPostChannel(rswOn, chan({ access: "all_staff", type: "emergency_broadcast" })).allowed).toBe(false);
    expect(canPostChannel(manager, chan({ access: "all_staff", type: "emergency_broadcast" })).allowed).toBe(true);
    expect(canPostChannel(rswOff, chan({ access: "all_staff", type: "home_announcements" })).allowed).toBe(false);
    expect(canPostChannel(rswOn, chan({ access: "on_shift", type: "medication_updates" })).allowed).toBe(true);
  });

  it("isManagerRole recognises leadership roles", () => {
    expect(isManagerRole("registered_manager")).toBe(true);
    expect(isManagerRole("deputy_manager")).toBe(true);
    expect(isManagerRole("residential_care_worker")).toBe(false);
  });
});

describe("comms store helpers — messages, receipts, soft-delete, trust notice", () => {
  it("seeds the standard channel set for a home once", () => {
    const a = db.commsChannels.findForHome("home_test");
    const b = db.commsChannels.findForHome("home_test");
    expect(a.length).toBe(12);
    expect(b.length).toBe(12); // idempotent
    expect(a.map((c) => c.type)).toContain("safeguarding_alerts");
  });

  it("creates a message, marks read then acknowledges (idempotent receipt)", () => {
    const ch = db.commsChannels.findForHome("home_test")[0];
    const msg = db.commsMessages.create({ channel_id: ch.id, home_id: "home_test", author_id: "auth", body: "hello", requires_acknowledgement: true });
    db.commsMessageReceipts.mark(msg.id, ch.id, "reader", { read: true });
    let receipts = db.commsMessageReceipts.findByMessage(msg.id);
    expect(receipts.length).toBe(1);
    expect(receipts[0].read_at).toBeTruthy();
    expect(receipts[0].acknowledged_at).toBeNull();
    db.commsMessageReceipts.mark(msg.id, ch.id, "reader", { acknowledge: true });
    receipts = db.commsMessageReceipts.findByMessage(msg.id);
    expect(receipts.length).toBe(1); // same receipt, not duplicated
    expect(receipts[0].acknowledged_at).toBeTruthy();
  });

  it("soft-deletes a message (never hard-deleted) and hides it from default list", () => {
    const ch = db.commsChannels.findForHome("home_test")[0];
    const msg = db.commsMessages.create({ channel_id: ch.id, home_id: "home_test", author_id: "auth", body: "secret" });
    db.commsMessages.patch(msg.id, { is_deleted: true, deleted_by: "auth", deleted_at: new Date().toISOString() });
    const visible = db.commsMessages.findByChannel(ch.id);
    const withDeleted = db.commsMessages.findByChannel(ch.id, true);
    expect(visible.find((m) => m.id === msg.id)).toBeUndefined();
    expect(withDeleted.find((m) => m.id === msg.id)?.is_deleted).toBe(true); // still present (soft)
  });

  it("records a staff trust notice acknowledgement", () => {
    db.staffTrustNoticeAcks.create({ user_id: "staff_z", notice_version: "v1" });
    expect(db.staffTrustNoticeAcks.latestForUser("staff_z")?.notice_version).toBe("v1");
  });
});
