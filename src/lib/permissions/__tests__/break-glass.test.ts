// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Break-Glass Emergency Access Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  requestBreakGlass,
  isBreakGlassActive,
  expireBreakGlass,
  reviewBreakGlass,
  logBreakGlassAction,
  getBreakGlassReasonLabel,
  getUnreviewedEvents,
  getOverdueReviews,
} from "../break-glass";
import type { BreakGlassRequest, BreakGlassEvent } from "../break-glass";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<BreakGlassRequest> = {}): BreakGlassRequest {
  return {
    userId: "user-tl-1",
    userRole: "team_leader",
    reason: "child_safety_immediate",
    justification: "Jordan is showing signs of acute distress and we need to access their safeguarding history immediately.",
    resourceType: "safeguarding",
    childId: "child-jordan",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<BreakGlassEvent> = {}): BreakGlassEvent {
  return {
    id: "bg-1",
    userId: "user-tl-1",
    userRole: "team_leader",
    reason: "child_safety_immediate",
    justification: "Acute distress — need safeguarding history.",
    resourceType: "safeguarding",
    childId: "child-jordan",
    grantedAt: FIXED_NOW,
    expiresAt: "2026-05-16T13:00:00Z",
    status: "active",
    actionsPerformed: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// requestBreakGlass
// ══════════════════════════════════════════════════════════════════════════════

describe("requestBreakGlass", () => {
  describe("successful requests", () => {
    it("grants break-glass for team_leader", () => {
      const result = requestBreakGlass(makeRequest(), FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.event?.userId).toBe("user-tl-1");
      expect(result.event?.reason).toBe("child_safety_immediate");
      expect(result.event?.status).toBe("active");
      expect(result.event?.grantedAt).toBe(FIXED_NOW);
    });

    it("grants break-glass for deputy_manager", () => {
      const result = requestBreakGlass(
        makeRequest({ userRole: "deputy_manager" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(true);
    });

    it("grants break-glass for registered_manager", () => {
      const result = requestBreakGlass(
        makeRequest({ userRole: "registered_manager" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(true);
    });

    it("sets default duration of 60 minutes", () => {
      const result = requestBreakGlass(makeRequest(), FIXED_NOW);
      expect(result.event?.expiresAt).toBe("2026-05-16T13:00:00.000Z");
    });

    it("respects custom duration", () => {
      const result = requestBreakGlass(
        makeRequest({ durationMinutes: 30 }),
        FIXED_NOW,
      );
      expect(result.event?.expiresAt).toBe("2026-05-16T12:30:00.000Z");
    });

    it("caps duration at 240 minutes", () => {
      const result = requestBreakGlass(
        makeRequest({ durationMinutes: 500 }),
        FIXED_NOW,
      );
      expect(result.event?.expiresAt).toBe("2026-05-16T16:00:00.000Z");
    });

    it("generates notification targets for team_leader", () => {
      const result = requestBreakGlass(makeRequest(), FIXED_NOW);
      expect(result.notificationsRequired).toContain("deputy_manager");
      expect(result.notificationsRequired).toContain("registered_manager");
    });

    it("generates notification targets for registered_manager", () => {
      const result = requestBreakGlass(
        makeRequest({ userRole: "registered_manager" }),
        FIXED_NOW,
      );
      expect(result.notificationsRequired).toContain("responsible_individual");
      expect(result.notificationsRequired).toContain("operations_manager");
    });
  });

  describe("rejection cases", () => {
    it("rejects RSW (below team_leader)", () => {
      const result = requestBreakGlass(
        makeRequest({ userRole: "rsw" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot use break-glass");
    });

    it("rejects agency_staff", () => {
      const result = requestBreakGlass(
        makeRequest({ userRole: "agency_staff" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(false);
    });

    it("rejects empty justification", () => {
      const result = requestBreakGlass(
        makeRequest({ justification: "" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("justification");
    });

    it("rejects too-short justification", () => {
      const result = requestBreakGlass(
        makeRequest({ justification: "urgent" }),
        FIXED_NOW,
      );
      expect(result.success).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// isBreakGlassActive
// ══════════════════════════════════════════════════════════════════════════════

describe("isBreakGlassActive", () => {
  it("returns true within duration", () => {
    const event = makeEvent({
      grantedAt: "2026-05-16T12:00:00Z",
      expiresAt: "2026-05-16T13:00:00Z",
    });
    expect(isBreakGlassActive(event, "2026-05-16T12:30:00Z")).toBe(true);
  });

  it("returns false after expiry", () => {
    const event = makeEvent({
      grantedAt: "2026-05-16T12:00:00Z",
      expiresAt: "2026-05-16T13:00:00Z",
    });
    expect(isBreakGlassActive(event, "2026-05-16T13:01:00Z")).toBe(false);
  });

  it("returns false for expired status", () => {
    const event = makeEvent({ status: "expired" });
    expect(isBreakGlassActive(event, "2026-05-16T12:30:00Z")).toBe(false);
  });

  it("returns false for reviewed status", () => {
    const event = makeEvent({ status: "reviewed" });
    expect(isBreakGlassActive(event, "2026-05-16T12:30:00Z")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// reviewBreakGlass
// ══════════════════════════════════════════════════════════════════════════════

describe("reviewBreakGlass", () => {
  it("reviews as justified", () => {
    const event = makeEvent({ status: "expired" });
    const result = reviewBreakGlass(
      event,
      "user-dm-1",
      "deputy_manager",
      "justified",
      "Child was at immediate risk. Appropriate use.",
      FIXED_NOW,
    );
    expect(result.success).toBe(true);
    expect(result.event?.status).toBe("reviewed");
    expect(result.event?.reviewOutcome).toBe("justified");
    expect(result.event?.reviewedBy).toBe("user-dm-1");
  });

  it("flags unjustified use", () => {
    const event = makeEvent({ status: "expired" });
    const result = reviewBreakGlass(
      event,
      "user-dm-1",
      "deputy_manager",
      "unjustified",
      "No evidence of emergency. Staff should have waited for normal approval.",
      FIXED_NOW,
    );
    expect(result.success).toBe(true);
    expect(result.event?.status).toBe("flagged");
    expect(result.event?.reviewOutcome).toBe("unjustified");
  });

  it("rejects review from team_leader (requires deputy+)", () => {
    const event = makeEvent({ status: "expired" });
    const result = reviewBreakGlass(
      event,
      "user-tl-2",
      "team_leader",
      "justified",
      "Looks fine.",
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot review");
  });

  it("blocks self-review", () => {
    const event = makeEvent({ userId: "user-dm-1", status: "expired" });
    const result = reviewBreakGlass(
      event,
      "user-dm-1",
      "deputy_manager",
      "justified",
      "Was me, all fine.",
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot review your own");
  });

  it("blocks review of already-reviewed event", () => {
    const event = makeEvent({ status: "reviewed", reviewedBy: "user-dm-2" });
    const result = reviewBreakGlass(
      event,
      "user-dm-1",
      "deputy_manager",
      "justified",
      "Confirmed.",
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("already been reviewed");
  });

  it("requires review notes", () => {
    const event = makeEvent({ status: "expired" });
    const result = reviewBreakGlass(
      event,
      "user-dm-1",
      "deputy_manager",
      "justified",
      "",
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("notes are required");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// logBreakGlassAction
// ══════════════════════════════════════════════════════════════════════════════

describe("logBreakGlassAction", () => {
  it("appends action to event", () => {
    const event = makeEvent();
    const updated = logBreakGlassAction(event, "Viewed safeguarding referral SR-2026-001");
    expect(updated.actionsPerformed).toHaveLength(1);
    expect(updated.actionsPerformed[0]).toBe("Viewed safeguarding referral SR-2026-001");
  });

  it("preserves existing actions", () => {
    const event = makeEvent({ actionsPerformed: ["First action"] });
    const updated = logBreakGlassAction(event, "Second action");
    expect(updated.actionsPerformed).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getBreakGlassReasonLabel returns human-readable labels", () => {
    expect(getBreakGlassReasonLabel("child_safety_immediate")).toBe("Immediate Child Safety Risk");
    expect(getBreakGlassReasonLabel("missing_child")).toBe("Missing Child");
    expect(getBreakGlassReasonLabel("police_request")).toBe("Police Request");
  });

  it("getUnreviewedEvents returns active/expired without review", () => {
    const events = [
      makeEvent({ id: "bg-1", status: "active" }),
      makeEvent({ id: "bg-2", status: "expired" }),
      makeEvent({ id: "bg-3", status: "reviewed", reviewedBy: "user-dm-1" }),
      makeEvent({ id: "bg-4", status: "flagged", reviewedBy: "user-dm-2" }),
    ];
    const unreviewed = getUnreviewedEvents(events);
    expect(unreviewed).toHaveLength(2);
    expect(unreviewed.map(e => e.id)).toEqual(["bg-1", "bg-2"]);
  });

  it("getOverdueReviews finds events older than 24h without review", () => {
    const events = [
      makeEvent({ id: "bg-1", grantedAt: "2026-05-15T10:00:00Z" }), // > 24h ago
      makeEvent({ id: "bg-2", grantedAt: "2026-05-16T11:00:00Z" }), // < 24h ago
      makeEvent({ id: "bg-3", grantedAt: "2026-05-14T10:00:00Z", reviewedBy: "user-dm" }), // reviewed
    ];
    const overdue = getOverdueReviews(events, "2026-05-16T12:00:00Z");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe("bg-1");
  });
});
