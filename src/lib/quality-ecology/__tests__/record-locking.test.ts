// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality Ecology — Record Locking & Amendment Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  checkLockStatus,
  createAmendment,
  approveAmendment,
  rejectAmendment,
  validateRecordIntegrity,
  getAmendmentTimeline,
  canModifyRecord,
  AMENDMENT_TYPE_LABELS,
} from "../record-locking";
import type {
  LockedRecord,
  Amendment,
  AmendmentRequest,
} from "../record-locking";
import type { UserContext } from "../../permissions/types";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: "user-1",
    role: "team_leader",
    organisationId: "org-1",
    homeIds: ["home-1"],
    assignedChildIds: [],
    assignedStaffIds: [],
    employmentStatus: "active",
    shiftActive: true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
    ...overrides,
  };
}

function makeLockedRecord(overrides: Partial<LockedRecord> = {}): LockedRecord {
  return {
    id: "rec-1",
    occurrenceId: "occ-1",
    templateId: "tpl-1",
    homeId: "home-1",
    status: "locked",
    lockedAt: "2026-05-16T10:00:00Z",
    lockedBy: "user-manager",
    contentHash: "abc123def456",
    amendments: [],
    ...overrides,
  };
}

function makeAmendment(overrides: Partial<Amendment> = {}): Amendment {
  return {
    id: "amend-1",
    recordId: "rec-1",
    type: "correction",
    status: "submitted",
    content: "The time should be 14:30, not 14:00.",
    reason: "Staff member confirmed the actual time of the incident.",
    createdBy: "user-2",
    createdAt: "2026-05-16T11:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// checkLockStatus
// ══════════════════════════════════════════════════════════════════════════════

describe("checkLockStatus", () => {
  it("detects locked record", () => {
    const record = makeLockedRecord({ status: "locked" });
    const user = makeUser({ role: "team_leader" });
    const result = checkLockStatus(record, user);
    expect(result.isLocked).toBe(true);
    expect(result.lockTimestamp).toBe("2026-05-16T10:00:00Z");
  });

  it("detects filed record as locked", () => {
    const record = makeLockedRecord({ status: "filed" });
    const user = makeUser({ role: "team_leader" });
    const result = checkLockStatus(record, user);
    expect(result.isLocked).toBe(true);
  });

  it("detects unlocked record", () => {
    const record = makeLockedRecord({ status: "approved" });
    const user = makeUser({ role: "team_leader" });
    const result = checkLockStatus(record, user);
    expect(result.isLocked).toBe(false);
    expect(result.canAmend).toBe(false);
  });

  it("allows team_leader to amend", () => {
    const record = makeLockedRecord();
    const user = makeUser({ role: "team_leader" });
    const result = checkLockStatus(record, user);
    expect(result.canAmend).toBe(true);
  });

  it("allows deputy_manager to amend", () => {
    const record = makeLockedRecord();
    const user = makeUser({ role: "deputy_manager" });
    const result = checkLockStatus(record, user);
    expect(result.canAmend).toBe(true);
  });

  it("allows registered_manager to amend", () => {
    const record = makeLockedRecord();
    const user = makeUser({ role: "registered_manager" });
    const result = checkLockStatus(record, user);
    expect(result.canAmend).toBe(true);
  });

  it("blocks rsw from amending", () => {
    const record = makeLockedRecord();
    const user = makeUser({ role: "rsw" });
    const result = checkLockStatus(record, user);
    expect(result.canAmend).toBe(false);
    expect(result.reason).toContain("team leader");
  });

  it("blocks agency_staff from amending", () => {
    const record = makeLockedRecord();
    const user = makeUser({ role: "agency_staff" });
    const result = checkLockStatus(record, user);
    expect(result.canAmend).toBe(false);
  });

  it("reports amendment count", () => {
    const record = makeLockedRecord({
      amendments: [makeAmendment(), makeAmendment({ id: "amend-2" })],
    });
    const user = makeUser({ role: "team_leader" });
    const result = checkLockStatus(record, user);
    expect(result.amendmentCount).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// createAmendment
// ══════════════════════════════════════════════════════════════════════════════

describe("createAmendment", () => {
  describe("successful creation", () => {
    it("creates a correction amendment", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "correction",
        content: "Time was 14:30 not 14:00.",
        reason: "Confirmed with staff member.",
        originalValue: "14:00",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.amendment?.type).toBe("correction");
      expect(result.amendment?.status).toBe("submitted");
      expect(result.amendment?.createdBy).toBe("user-1");
      expect(result.amendment?.createdAt).toBe(FIXED_NOW);
    });

    it("creates an addition amendment", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "deputy_manager" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "Social worker confirmed the placement review outcome on 17/05/2026.",
        reason: "Information received after record was filed.",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.amendment?.type).toBe("addition");
    });

    it("creates a clarification amendment", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "clarification",
        content: "To clarify — the behaviour described was in response to a phone call.",
        reason: "Ofsted inspector requested further context.",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.amendment?.type).toBe("clarification");
    });

    it("creates a late_entry amendment", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "late_entry",
        content: "Staff member was unable to enter this note at the time due to emergency.",
        reason: "Entry delayed due to on-call emergency.",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.amendment?.type).toBe("late_entry");
    });

    it("creates a regulatory amendment", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "registered_manager" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "regulatory",
        content: "Added Ofsted notification reference ON-2026-1234.",
        reason: "Required by Ofsted following inspection feedback.",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(true);
      expect(result.amendment?.type).toBe("regulatory");
    });

    it("generates sequential amendment ID", () => {
      const record = makeLockedRecord({
        amendments: [makeAmendment(), makeAmendment({ id: "amend-2" })],
      });
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "New info.",
        reason: "Found later.",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.amendment?.id).toBe("amend-rec-1-3");
    });

    it("includes field path when specified", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "correction",
        content: "Corrected to 3 staff present.",
        reason: "Headcount was wrong.",
        fieldPath: "staffing.count",
        originalValue: "2",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.amendment?.fieldPath).toBe("staffing.count");
      expect(result.amendment?.originalValue).toBe("2");
    });
  });

  describe("validation failures", () => {
    it("rejects amendment on unlocked record", () => {
      const record = makeLockedRecord({ status: "approved" });
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "test",
        reason: "test",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not locked");
    });

    it("rejects amendment from rsw", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "rsw" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "test",
        reason: "test",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot create amendments");
    });

    it("rejects empty content", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "",
        reason: "test",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("content is required");
    });

    it("rejects whitespace-only content", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "   ",
        reason: "test",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
    });

    it("rejects empty reason", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "addition",
        content: "Some content",
        reason: "",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("reason is required");
    });

    it("rejects correction without original value", () => {
      const record = makeLockedRecord();
      const user = makeUser({ role: "team_leader" });
      const request: AmendmentRequest = {
        recordId: "rec-1",
        type: "correction",
        content: "Fixed value",
        reason: "Was wrong",
      };
      const result = createAmendment(record, request, user, FIXED_NOW);
      expect(result.success).toBe(false);
      expect(result.error).toContain("original value");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// approveAmendment
// ══════════════════════════════════════════════════════════════════════════════

describe("approveAmendment", () => {
  it("approves a submitted amendment", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = approveAmendment(record, "amend-1", user, FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.amendment?.status).toBe("approved");
    expect(result.amendment?.approvedBy).toBe("user-1");
    expect(result.amendment?.approvedAt).toBe(FIXED_NOW);
  });

  it("rejects approval by team_leader (requires deputy+)", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "team_leader", userId: "user-1" });
    const result = approveAmendment(record, "amend-1", user, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot approve amendments");
  });

  it("blocks self-approval of amendment", () => {
    const amendment = makeAmendment({ createdBy: "user-1" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = approveAmendment(record, "amend-1", user, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot approve own");
  });

  it("rejects approval of already-approved amendment", () => {
    const amendment = makeAmendment({ status: "approved", approvedBy: "user-3" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = approveAmendment(record, "amend-1", user, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not 'submitted'");
  });

  it("rejects approval of non-existent amendment", () => {
    const record = makeLockedRecord({ amendments: [] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = approveAmendment(record, "amend-999", user, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("allows registered_manager to approve", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "registered_manager", userId: "user-1" });
    const result = approveAmendment(record, "amend-1", user, FIXED_NOW);
    expect(result.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// rejectAmendment
// ══════════════════════════════════════════════════════════════════════════════

describe("rejectAmendment", () => {
  it("rejects an amendment with reason", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = rejectAmendment(record, "amend-1", user, "Insufficient evidence for correction.", FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.amendment?.status).toBe("rejected");
    expect(result.amendment?.rejectedBy).toBe("user-1");
    expect(result.amendment?.rejectionReason).toBe("Insufficient evidence for correction.");
  });

  it("requires rejection reason", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = rejectAmendment(record, "amend-1", user, "", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Rejection reason");
  });

  it("requires deputy_manager role", () => {
    const amendment = makeAmendment({ createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "team_leader", userId: "user-1" });
    const result = rejectAmendment(record, "amend-1", user, "Not valid.", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot reject");
  });

  it("cannot reject already-approved amendment", () => {
    const amendment = makeAmendment({ status: "approved", createdBy: "user-2" });
    const record = makeLockedRecord({ amendments: [amendment] });
    const user = makeUser({ role: "deputy_manager", userId: "user-1" });
    const result = rejectAmendment(record, "amend-1", user, "Too late.", FIXED_NOW);
    expect(result.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// validateRecordIntegrity
// ══════════════════════════════════════════════════════════════════════════════

describe("validateRecordIntegrity", () => {
  it("validates matching hash", () => {
    const record = makeLockedRecord({ contentHash: "sha256-abc123" });
    const result = validateRecordIntegrity(record, "sha256-abc123");
    expect(result.isValid).toBe(true);
    expect(result.message).toContain("verified");
  });

  it("detects tampered record", () => {
    const record = makeLockedRecord({ contentHash: "sha256-abc123" });
    const result = validateRecordIntegrity(record, "sha256-xyz789");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("altered");
    expect(result.originalHash).toBe("sha256-abc123");
    expect(result.currentHash).toBe("sha256-xyz789");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getAmendmentTimeline
// ══════════════════════════════════════════════════════════════════════════════

describe("getAmendmentTimeline", () => {
  it("returns empty for no amendments", () => {
    const record = makeLockedRecord({ amendments: [] });
    const timeline = getAmendmentTimeline(record);
    expect(timeline).toHaveLength(0);
  });

  it("sorts amendments chronologically", () => {
    const record = makeLockedRecord({
      amendments: [
        makeAmendment({ id: "a-3", createdAt: "2026-05-16T14:00:00Z" }),
        makeAmendment({ id: "a-1", createdAt: "2026-05-16T10:00:00Z" }),
        makeAmendment({ id: "a-2", createdAt: "2026-05-16T12:00:00Z" }),
      ],
    });
    const timeline = getAmendmentTimeline(record);
    expect(timeline[0].id).toBe("a-1");
    expect(timeline[1].id).toBe("a-2");
    expect(timeline[2].id).toBe("a-3");
  });

  it("truncates long content in summary", () => {
    const longContent = "A".repeat(150);
    const record = makeLockedRecord({
      amendments: [makeAmendment({ content: longContent })],
    });
    const timeline = getAmendmentTimeline(record);
    expect(timeline[0].summary.length).toBeLessThanOrEqual(103); // 100 + "..."
    expect(timeline[0].summary.endsWith("...")).toBe(true);
  });

  it("does not truncate short content", () => {
    const record = makeLockedRecord({
      amendments: [makeAmendment({ content: "Short note." })],
    });
    const timeline = getAmendmentTimeline(record);
    expect(timeline[0].summary).toBe("Short note.");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// canModifyRecord
// ══════════════════════════════════════════════════════════════════════════════

describe("canModifyRecord", () => {
  it("allows modification of in_progress", () => {
    expect(canModifyRecord("in_progress")).toBe(true);
  });

  it("allows modification of submitted", () => {
    expect(canModifyRecord("submitted")).toBe(true);
  });

  it("allows modification of approved", () => {
    expect(canModifyRecord("approved")).toBe(true);
  });

  it("blocks modification of locked", () => {
    expect(canModifyRecord("locked")).toBe(false);
  });

  it("blocks modification of filed", () => {
    expect(canModifyRecord("filed")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AMENDMENT_TYPE_LABELS
// ══════════════════════════════════════════════════════════════════════════════

describe("AMENDMENT_TYPE_LABELS", () => {
  it("has label for each type", () => {
    expect(AMENDMENT_TYPE_LABELS.correction).toBe("Factual Correction");
    expect(AMENDMENT_TYPE_LABELS.addition).toBe("Additional Information");
    expect(AMENDMENT_TYPE_LABELS.clarification).toBe("Clarification");
    expect(AMENDMENT_TYPE_LABELS.late_entry).toBe("Late Entry");
    expect(AMENDMENT_TYPE_LABELS.regulatory).toBe("Regulatory Requirement");
  });
});
