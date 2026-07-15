import { describe, it, expect, beforeEach } from "vitest";
import {
  recordAbacDivergence,
  summariseAbacDivergence,
  ABAC_DIVERGENCE_ENTITY,
} from "@/lib/permissions/abac-divergence";
import { getRecordAuditTrail, __resetRecordAuditTrail } from "@/lib/audit/audit-recorder";

// Divergence is the evidence for the enforcing flip: every entry here is an
// access that flipping ABAC to enforcing would REFUSE — for real staff, on a
// real shift. It used to be a console.warn that scrolled away.

beforeEach(() => __resetRecordAuditTrail());

const base = {
  userId: "staff_ryan",
  role: "residential_care_worker",
  resource: "allegation",
  action: "view",
  homeId: "home_oak",
  reason: "no_rule",
  contextReal: true,
};

describe("recordAbacDivergence", () => {
  it("lands on the existing audit spine under its own entityType", () => {
    recordAbacDivergence(base);
    const rows = getRecordAuditTrail({ entityType: ABAC_DIVERGENCE_ENTITY });
    expect(rows).toHaveLength(1);
    expect(rows[0].performedBy).toBe("staff_ryan");
    expect(rows[0].metadata).toMatchObject({ wouldDeny: true, reason: "no_rule", contextReal: true });
  });

  it("never throws — telemetry must not break the route it observes", () => {
    expect(() => recordAbacDivergence({ ...base, userId: undefined as unknown as string })).not.toThrow();
  });
});

describe("summariseAbacDivergence", () => {
  it("counts real-context divergence as evidence", () => {
    recordAbacDivergence(base);
    recordAbacDivergence({ ...base, userId: "staff_anna", reason: "shift_inactive" });
    const s = summariseAbacDivergence();
    expect(s.evidenceCount).toBe(2);
    expect(s.affectedUsers).toBe(2);
    expect(s.byReason.map((r) => r.reason)).toEqual(expect.arrayContaining(["no_rule", "shift_inactive"]));
  });

  it("does NOT launder fallback divergence into evidence", () => {
    // Decided on a fabricated context — proves nothing about a real flip.
    recordAbacDivergence({ ...base, contextReal: false });
    recordAbacDivergence({ ...base, contextReal: false });
    const s = summariseAbacDivergence();
    expect(s.evidenceCount).toBe(0);
    expect(s.fallbackCount).toBe(2);
    expect(s.total).toBe(2);
    expect(s.affectedUsers).toBe(0);
    expect(s.verdict).toMatch(/not evidence/i);
  });

  it("ranks reasons and resources commonest-first (real context only)", () => {
    recordAbacDivergence({ ...base, reason: "shift_inactive" });
    recordAbacDivergence({ ...base, reason: "shift_inactive", userId: "staff_anna" });
    recordAbacDivergence({ ...base, reason: "no_rule" });
    recordAbacDivergence({ ...base, reason: "ignored", contextReal: false });
    const s = summariseAbacDivergence();
    expect(s.byReason[0]).toEqual({ reason: "shift_inactive", count: 2 });
    expect(s.byReason.map((r) => r.reason)).not.toContain("ignored");
  });

  it("never claims silence proves safety", () => {
    const s = summariseAbacDivergence();
    expect(s.evidenceCount).toBe(0);
    // The honest reading: no data ≠ safe to flip.
    expect(s.verdict).toMatch(/not evidence the flip is safe/i);
  });

  it("says plainly what enforcing would do when evidence exists", () => {
    recordAbacDivergence(base);
    expect(summariseAbacDivergence().verdict).toMatch(/would deny exactly these/i);
  });
});
