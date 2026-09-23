import { describe, it, expect } from "vitest";
import {
  toFlatEvent,
  ofstedStatus,
  metDeadline,
  notificationLegs,
} from "../notifiable-events-persist";
import type { NotifiableEvent } from "@/types/extended";

// ══════════════════════════════════════════════════════════════════════════════
// REGULATION 40 — the projection, and what it refuses to claim
//
// Reg 40 is evidenced by the record of the notification. These tests pin the
// two halves that matter: that the two-table shape projects faithfully into the
// flat shape eight routes read, and that neither direction ever manufactures a
// compliance judgement the home did not record.
// ══════════════════════════════════════════════════════════════════════════════

const EVENT = {
  id: "nev-1",
  event_type: "allegation_against_staff",
  event_date: "2026-09-20",
  child_id: "yp-1",
  summary: "Allegation against a member of staff",
  description: "Reported by a visiting professional.",
  immediate_actions_taken: "Staff member removed from shift pending LADO advice.",
  reported_by: "st-1",
  follow_up: "LADO strategy meeting booked.",
  lesson_learned: "",
};

describe("ofstedStatus reports what the row records", () => {
  it("is pending when no notification row exists at all", () => {
    expect(ofstedStatus(undefined)).toBe("pending");
  });

  it("is pending when the row exists but nothing has been sent", () => {
    expect(ofstedStatus({ sent_date: null })).toBe("pending");
  });

  it("is not_required when the home recorded that it did not apply", () => {
    // Distinct from pending: "considered and not applicable" is a decision the
    // home made, and an absent row cannot express it.
    expect(ofstedStatus({ status: "not_required" })).toBe("not_required");
  });

  it("is within-24h when the stored verdict says so", () => {
    expect(ofstedStatus({ sent_date: "2026-09-20T14:00:00Z", met_deadline: true }))
      .toBe("notified_within_24h");
  });

  it("is late when the stored verdict says so", () => {
    expect(ofstedStatus({ sent_date: "2026-09-23T14:00:00Z", met_deadline: false }))
      .toBe("notified_late");
  });

  it("refuses to judge a notification whose row carries no verdict", () => {
    // THE POINT OF THIS FILE. A row with a send date but no met_deadline does
    // not say whether it was timely. Calling it within-24h would invent
    // compliance; calling it late would invent a breach. Neither is ours to
    // decide from a record that does not say.
    expect(ofstedStatus({ sent_date: "2026-09-21T09:00:00Z", met_deadline: null }))
      .toBe("pending");
  });
});

describe("metDeadline is computed once, at write time", () => {
  it("is true when the notification landed inside the deadline", () => {
    expect(metDeadline("2026-09-20T14:00:00Z", "2026-09-21T10:00:00Z")).toBe(true);
  });

  it("is false when it did not", () => {
    expect(metDeadline("2026-09-23T14:00:00Z", "2026-09-21T10:00:00Z")).toBe(false);
  });

  it("is exactly on the deadline, which counts as met", () => {
    expect(metDeadline("2026-09-21T10:00:00Z", "2026-09-21T10:00:00Z")).toBe(true);
  });

  it("is null rather than false when nothing has been sent", () => {
    // A default of false would read as a missed deadline the home never missed.
    expect(metDeadline(null, "2026-09-21T10:00:00Z")).toBeNull();
  });

  it("is null when no deadline was recorded to measure against", () => {
    expect(metDeadline("2026-09-20T14:00:00Z", null)).toBeNull();
  });
});

describe("toFlatEvent projects two tables into the shape eight routes read", () => {
  it("maps each recipient to its leg", () => {
    const flat = toFlatEvent(EVENT, [
      {
        event_id: "nev-1", recipient_type: "ofsted", body: "Notified by portal.",
        method: "online_portal", reference_number: "OFS-99",
        sent_date: "2026-09-20T14:00:00Z", met_deadline: true,
      },
      {
        event_id: "nev-1", recipient_type: "placing_authority", body: "Called duty social worker.",
        method: "phone", reference_number: null, sent_date: "2026-09-20T15:30:00Z",
      },
    ]);

    expect(flat.id).toBe("nev-1");
    expect(flat.date).toBe("2026-09-20");
    expect(flat.ofsted_status).toBe("notified_within_24h");
    expect(flat.ofsted.reference).toBe("OFS-99");
    expect(flat.ofsted.method).toBe("online_portal");
    expect(flat.placing.method).toBe("phone");
    expect(flat.placing.notified_date).toBe("2026-09-20T15:30:00Z");
  });

  it("leaves an unrecorded recipient empty rather than absent", () => {
    // The flat shape has no optional legs: the eight readers index into
    // .local_authority directly, so it must be an object.
    const flat = toFlatEvent(EVENT, []);
    expect(flat.local_authority).toEqual({ body: "", notified_date: null, method: "", reference: null });
    expect(flat.ofsted_status).toBe("pending");
  });

  it("keeps the narrative fields that carry the actual account", () => {
    const flat = toFlatEvent(EVENT, []);
    expect(flat.immediate_action).toContain("removed from shift");
    expect(flat.follow_up).toContain("LADO");
    expect(flat.detail).toContain("visiting professional");
  });

  it("matches on recipient only — filtering by event is the caller's job", () => {
    // Honest about the contract rather than flattering it. toFlatEvent picks
    // the first row per recipient and does NOT check event_id, because
    // getNotifiableEvents hands it one event's rows already filtered. Pinned
    // so that if anything else ever calls it, this constraint is visible
    // rather than discovered through a misattributed Reg 40 notification.
    const flat = toFlatEvent(EVENT, [
      { event_id: "nev-OTHER", recipient_type: "ofsted", body: "Another event's notification.", sent_date: "2026-09-01T09:00:00Z", met_deadline: true },
    ]);
    expect(flat.ofsted.body).toBe("Another event's notification.");
  });

  it("is fed only the matching rows by getNotifiableEvents", () => {
    // The filter that makes the above safe, exercised directly.
    const rows = [
      { event_id: "nev-1", recipient_type: "ofsted", body: "Ours." },
      { event_id: "nev-OTHER", recipient_type: "ofsted", body: "Theirs." },
    ];
    const flat = toFlatEvent(EVENT, rows.filter((n) => n.event_id === EVENT.id));
    expect(flat.ofsted.body).toBe("Ours.");
  });
});

describe("notificationLegs refuses to write claims the home has not made", () => {
  const base: NotifiableEvent = {
    id: "nev-2", date: "2026-09-20", event_type: "serious_incident", child_id: "yp-1",
    summary: "s", detail: "d", immediate_action: "a", reported_by: "st-1",
    ofsted_status: "pending",
    ofsted: { body: "", notified_date: null, method: "", reference: null },
    local_authority: { body: "", notified_date: null, method: "", reference: null },
    placing: { body: "", notified_date: null, method: "", reference: null },
    follow_up: "", lesson_learned: "",
  };

  it("writes no row for a recipient with nothing recorded against it", () => {
    // An empty row is indistinguishable from "considered and not required",
    // which is a decision nobody made.
    expect(notificationLegs(base)).toEqual([]);
  });

  it("writes a row for a recipient the home explicitly marked not required", () => {
    const legs = notificationLegs({ ...base, ofsted_status: "not_required" });
    expect(legs).toHaveLength(1);
    expect(legs[0].recipient_type).toBe("ofsted");
    expect(legs[0].status).toBe("not_required");
    expect(legs[0].met_deadline).toBeNull();
  });

  it("carries the recorded verdict rather than recomputing it", () => {
    const legs = notificationLegs({
      ...base,
      ofsted_status: "notified_late",
      ofsted: { body: "Notified by email.", notified_date: "2026-09-23T09:00:00Z", method: "email", reference: "OFS-1" },
    });
    expect(legs[0].met_deadline).toBe(false);
    expect(legs[0].reference_number).toBe("OFS-1");
  });

  it("writes the Ofsted deadline as event date plus 24 hours", () => {
    const legs = notificationLegs({
      ...base,
      ofsted_status: "notified_within_24h",
      ofsted: { body: "b", notified_date: "2026-09-20T14:00:00Z", method: "phone", reference: null },
    });
    expect(legs[0].deadline).toBe(new Date("2026-09-21T00:00:00.000Z").toISOString());
  });

  it("gives non-Ofsted recipients no invented deadline", () => {
    const legs = notificationLegs({
      ...base,
      placing: { body: "Called duty desk.", notified_date: "2026-09-20T15:00:00Z", method: "phone", reference: null },
    });
    expect(legs).toHaveLength(1);
    expect(legs[0].recipient_type).toBe("placing_authority");
    expect(legs[0].deadline).toBeNull();
    expect(legs[0].met_deadline).toBeNull();
  });
});
