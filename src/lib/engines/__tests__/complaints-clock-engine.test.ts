import { describe, it, expect } from "vitest";
import { computeComplaintsClock, type ComplaintInput } from "../complaints-clock-engine";

const TODAY = "2026-06-09";

// helper: ISO date N days from TODAY
function at(days: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function complaint(p: Partial<ComplaintInput> & { id: string }): ComplaintInput {
  return {
    reference: p.reference ?? p.id,
    complainant: p.complainant ?? "Parent",
    summary: p.summary ?? "A complaint",
    status_raw: p.status_raw ?? "open",
    date_received: p.date_received ?? at(-5),
    acknowledgement_due: p.acknowledgement_due ?? at(-2),
    response_due: p.response_due ?? at(5),
    acknowledged_at: p.acknowledged_at ?? null,
    response_sent_at: p.response_sent_at ?? null,
    is_closed: p.is_closed ?? false,
    id: p.id,
    child_id: p.child_id, child_name: p.child_name, category: p.category,
    stage: p.stage, assigned_to: p.assigned_to,
  };
}

describe("computeComplaintsClock", () => {
  it("empty → headline + zero summary", () => {
    const r = computeComplaintsClock({ today: TODAY, complaints: [] });
    expect(r.summary.total).toBe(0);
    expect(r.headline).toMatch(/No complaints/);
  });

  it("flags an open complaint with response past due as breached", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [complaint({ id: "a", acknowledged_at: at(-30), acknowledgement_due: at(-29), response_due: at(-10), response_sent_at: null })],
    });
    const c = r.complaints[0];
    expect(c.response.status).toBe("overdue");
    expect(c.urgency).toBe("breached");
    expect(c.active_stage).toBe("response");
    expect(c.next_due_in_days).toBe(-10);
    expect(r.summary.breached).toBe(1);
  });

  it("flags an open complaint whose response is within 3 days as due_soon", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [complaint({ id: "a", acknowledged_at: at(-4), acknowledgement_due: at(-3), response_due: at(2), response_sent_at: null })],
    });
    expect(r.complaints[0].urgency).toBe("due_soon");
    expect(r.summary.due_soon).toBe(1);
  });

  it("marks an open complaint with deadlines far out as on_track", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [complaint({ id: "a", acknowledged_at: at(-1), acknowledgement_due: at(1), response_due: at(9), response_sent_at: null })],
    });
    expect(r.complaints[0].urgency).toBe("on_track");
  });

  it("derives ack met vs met_late from acknowledged_at vs due", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [
        complaint({ id: "ontime", acknowledged_at: at(-5), acknowledgement_due: at(-3), is_closed: true, response_sent_at: at(-1), response_due: at(0) }),
        complaint({ id: "late", acknowledged_at: at(-1), acknowledgement_due: at(-3), is_closed: true, response_sent_at: at(2), response_due: at(0) }),
      ],
    });
    const byId = Object.fromEntries(r.complaints.map((c) => [c.id, c]));
    expect(byId["ontime"].acknowledgement.status).toBe("met");
    expect(byId["late"].acknowledgement.status).toBe("met_late");
  });

  it("treats closed complaints as resolved and computes response compliance", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [
        complaint({ id: "a", is_closed: true, response_sent_at: at(-2), response_due: at(0) }),   // on time
        complaint({ id: "b", is_closed: true, response_sent_at: at(3), response_due: at(0) }),     // late
      ],
    });
    expect(r.summary.open).toBe(0);
    expect(r.summary.closed).toBe(2);
    expect(r.complaints.every((c) => c.urgency === "resolved")).toBe(true);
    expect(r.summary.response_compliance_rate).toBe(50);
    expect(r.headline).toMatch(/All 2 complaints resolved/);
  });

  it("reports compliance rates as null (not a fabricated 0%) when nothing is acknowledged or responded", () => {
    // Complaints exist but none acknowledged/responded yet — the rates have no
    // denominator, so they are UNMEASURED, not 0% ("0% on time" is a false red).
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [complaint({ id: "a" }), complaint({ id: "b" })],
    });
    expect(r.summary.total).toBe(2);
    expect(r.summary.ack_compliance_rate).toBeNull();
    expect(r.summary.response_compliance_rate).toBeNull();
    expect(r.headline).not.toMatch(/0%/); // never claims a 0% timescale figure
  });

  it("ranks breached before due_soon before on_track before resolved", () => {
    const r = computeComplaintsClock({
      today: TODAY,
      complaints: [
        complaint({ id: "resolved", is_closed: true, response_sent_at: at(-1), response_due: at(0) }),
        complaint({ id: "ontrack", acknowledged_at: at(-1), acknowledgement_due: at(1), response_due: at(9) }),
        complaint({ id: "breached", acknowledged_at: at(-9), acknowledgement_due: at(-8), response_due: at(-3) }),
        complaint({ id: "duesoon", acknowledged_at: at(-2), acknowledgement_due: at(-1), response_due: at(1) }),
      ],
    });
    expect(r.complaints.map((c) => c.id)).toEqual(["breached", "duesoon", "ontrack", "resolved"]);
  });

  it("is deterministic for a fixed today", () => {
    const cs = [complaint({ id: "a", response_due: at(-3) })];
    expect(computeComplaintsClock({ today: TODAY, complaints: cs })).toEqual(computeComplaintsClock({ today: TODAY, complaints: cs }));
  });
});
