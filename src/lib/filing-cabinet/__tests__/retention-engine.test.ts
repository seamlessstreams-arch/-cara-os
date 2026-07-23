// ═════���════════════════════════════════��═══════════════════════════════════════
// Cara Filing Cabinet — Retention Engine Tests
// ══���═════════════════════════════════���═════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getRetentionPolicy,
  calculateRetentionExpiry,
  checkRetentionStatus,
  approveDestruction,
  executeDestruction,
  placeHold,
  removeHold,
  canAccessDocument,
  calculateFilingStats,
  fileDocument,
  getCategoryLabel,
  getSensitivityLabel,
  getRetentionBasisLabel,
  getDocumentsApproachingExpiry,
  getExpiredDocuments,
  RETENTION_POLICIES,
} from "../retention-engine";
import type {
  FiledDocument,
  FilingCategory,
  DestructionRequest,
  FileDocumentRequest,
} from "../retention-engine";

// ── Constants ──���───────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──���───────────────────────────────────────────────────────────

function makeDocument(overrides: Partial<FiledDocument> = {}): FiledDocument {
  return {
    id: "doc-001",
    title: "Daily Log Entry — 16 May 2026",
    category: "daily_record",
    sensitivity: "standard",
    homeId: "home-oak",
    filedBy: "user-rsw-1",
    filedAt: "2026-05-16T10:00:00Z",
    status: "active",
    retentionExpiresAt: "2041-05-16T10:00:00Z",  // 15 years
    retentionBasis: "chr_2015_schedule_3",
    retentionYears: 15,
    tags: ["daily", "shift-morning"],
    version: 1,
    accessCount: 3,
    ...overrides,
  };
}

function makeDestructionRequest(overrides: Partial<DestructionRequest> = {}): DestructionRequest {
  return {
    documentId: "doc-001",
    requestedBy: "user-rm-1",
    requestedByRole: "registered_manager",
    reason: "Retention period expired. Reviewed and confirmed no ongoing need.",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// getRetentionPolicy
// ══════════════════════════��═══════════════════════════════════════════════════

describe("getRetentionPolicy", () => {
  it("returns policy for each defined category", () => {
    const categories: FilingCategory[] = [
      "child_record", "care_plan", "safeguarding", "health", "education",
      "daily_record", "medication", "incident", "risk_assessment",
      "missing_episode", "staff_personnel", "recruitment", "regulatory",
      "policy", "financial", "complaint", "quality_assurance",
      "correspondence", "photo_consent", "legal",
    ];
    for (const cat of categories) {
      const policy = getRetentionPolicy(cat);
      expect(policy.category).toBe(cat);
      expect(policy.defaultRetentionYears).toBeGreaterThan(0);
    }
  });

  it("safeguarding has 99-year retention", () => {
    const policy = getRetentionPolicy("safeguarding");
    expect(policy.defaultRetentionYears).toBe(99);
    expect(policy.basis).toBe("safeguarding_indefinite");
    expect(policy.sensitivity).toBe("restricted");
  });

  it("child_record has 75-year retention", () => {
    const policy = getRetentionPolicy("child_record");
    expect(policy.defaultRetentionYears).toBe(75);
    expect(policy.destructionRequiresRole).toBe("responsible_individual");
  });

  it("daily_record has 15-year retention", () => {
    const policy = getRetentionPolicy("daily_record");
    expect(policy.defaultRetentionYears).toBe(15);
    expect(policy.minimumRole).toBe("rsw");
  });

  it("staff_personnel has 7-year retention", () => {
    const policy = getRetentionPolicy("staff_personnel");
    expect(policy.defaultRetentionYears).toBe(7);
    expect(policy.basis).toBe("employment_law");
    expect(policy.minimumRole).toBe("deputy_manager");
  });

  it("all policies have required fields", () => {
    for (const policy of RETENTION_POLICIES) {
      expect(policy.category).toBeDefined();
      expect(policy.defaultRetentionYears).toBeGreaterThan(0);
      expect(policy.basis).toBeDefined();
      expect(policy.minimumRole).toBeDefined();
      expect(policy.sensitivity).toBeDefined();
      expect(policy.destructionRequiresRole).toBeDefined();
      expect(policy.description.length).toBeGreaterThan(10);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateRetentionExpiry
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateRetentionExpiry", () => {
  it("calculates standard retention from filing date", () => {
    const expiry = calculateRetentionExpiry("2026-05-16T10:00:00Z", "daily_record");
    expect(expiry).toBe("2041-05-16T10:00:00.000Z"); // +15 years
  });

  it("calculates child record retention from DOB", () => {
    const expiry = calculateRetentionExpiry(
      "2026-05-16T10:00:00Z",
      "child_record",
      "2010-03-15T00:00:00Z",
    );
    expect(expiry).toBe("2085-03-15T00:00:00.000Z"); // DOB + 75 years
  });

  it("uses filing date when no DOB for short-retention categories", () => {
    const expiry = calculateRetentionExpiry("2026-05-16T10:00:00Z", "policy");
    expect(expiry).toBe("2033-05-16T10:00:00.000Z"); // +7 years
  });

  it("safeguarding gets 99-year retention", () => {
    const expiry = calculateRetentionExpiry("2026-05-16T10:00:00Z", "safeguarding");
    expect(expiry).toBe("2125-05-16T10:00:00.000Z"); // +99 years
  });
});

// ══════════════════════════════════════════════���═══════════════════════════════
// checkRetentionStatus
// ════════════════════════���═══════════════════════════════���═════════════════════

describe("checkRetentionStatus", () => {
  it("marks document as within_retention when far from expiry", () => {
    const docs = [makeDocument()];
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("within_retention");
    expect(results[0].canDestroy).toBe(false);
  });

  it("marks document as approaching_expiry within 90 days", () => {
    const docs = [makeDocument({ retentionExpiresAt: "2026-07-20T10:00:00Z" })]; // ~65 days
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("approaching_expiry");
    expect(results[0].canDestroy).toBe(false);
    expect(results[0].daysRemaining).toBeLessThanOrEqual(90);
  });

  it("marks document as expired past retention", () => {
    const docs = [makeDocument({ retentionExpiresAt: "2026-04-01T10:00:00Z" })]; // 45 days ago
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("expired");
    expect(results[0].canDestroy).toBe(true);
    expect(results[0].daysRemaining).toBeLessThan(0);
  });

  it("marks document on hold regardless of expiry", () => {
    const docs = [makeDocument({ status: "hold", holdReason: "Police investigation", retentionExpiresAt: "2020-01-01T00:00:00Z" })];
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("on_hold");
    expect(results[0].canDestroy).toBe(false);
  });

  it("handles destroyed document gracefully", () => {
    const docs = [makeDocument({ status: "destroyed" })];
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("within_retention");
    expect(results[0].canDestroy).toBe(false);
  });

  it("handles multiple documents", () => {
    const docs = [
      makeDocument({ id: "doc-1", retentionExpiresAt: "2041-05-16T10:00:00Z" }),
      makeDocument({ id: "doc-2", retentionExpiresAt: "2026-06-01T10:00:00Z" }),
      makeDocument({ id: "doc-3", retentionExpiresAt: "2025-01-01T10:00:00Z" }),
    ];
    const results = checkRetentionStatus(docs, FIXED_NOW);
    expect(results[0].status).toBe("within_retention");
    expect(results[1].status).toBe("approaching_expiry");
    expect(results[2].status).toBe("expired");
  });
});

// ════════════════════���═════════════════════════════════════════════════════════
// approveDestruction
// ══════════════════════════════════════════════════════════════════════════════

describe("approveDestruction", () => {
  it("approves destruction for expired document with correct role", () => {
    const doc = makeDocument({ retentionExpiresAt: "2025-01-01T00:00:00Z" });
    const result = approveDestruction(doc, makeDestructionRequest(), FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.status).toBe("destruction_approved");
    expect(result.document?.destructionApprovedBy).toBe("user-rm-1");
  });

  it("rejects destruction for document on hold", () => {
    const doc = makeDocument({ status: "hold" });
    const result = approveDestruction(doc, makeDestructionRequest(), FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("hold");
  });

  it("rejects destruction for already destroyed document", () => {
    const doc = makeDocument({ status: "destroyed" });
    const result = approveDestruction(doc, makeDestructionRequest(), FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("already been destroyed");
  });

  it("rejects destruction from insufficient role", () => {
    const doc = makeDocument({ retentionExpiresAt: "2025-01-01T00:00:00Z" });
    const result = approveDestruction(
      doc,
      makeDestructionRequest({ requestedByRole: "rsw" }),
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("requires");
  });

  it("rejects destruction before retention expires", () => {
    const doc = makeDocument({ retentionExpiresAt: "2041-05-16T10:00:00Z" }); // 15 years away
    const result = approveDestruction(doc, makeDestructionRequest(), FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not expired");
  });

  it("rejects empty destruction reason", () => {
    const doc = makeDocument({ retentionExpiresAt: "2025-01-01T00:00:00Z" });
    const result = approveDestruction(
      doc,
      makeDestructionRequest({ reason: "short" }),
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("10 characters");
  });

  it("blocks routine destruction of safeguarding records", () => {
    const doc = makeDocument({
      category: "safeguarding",
      retentionExpiresAt: "2025-01-01T00:00:00Z",
    });
    const result = approveDestruction(
      doc,
      makeDestructionRequest({ requestedByRole: "responsible_individual" }),
      FIXED_NOW,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Safeguarding");
  });
});

// ═══���═══════════���══════════════════════════════���═══════════════════════════════
// executeDestruction
// ══════════════════════════════════════════════════════════════════════════════

describe("executeDestruction", () => {
  it("executes destruction for approved document", () => {
    const doc = makeDocument({ status: "destruction_approved" });
    const result = executeDestruction(doc, "user-dm-1", "deputy_manager", FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.status).toBe("destroyed");
    expect(result.document?.destroyedAt).toBe(FIXED_NOW);
    expect(result.document?.destroyedBy).toBe("user-dm-1");
  });

  it("rejects execution for non-approved document", () => {
    const doc = makeDocument({ status: "active" });
    const result = executeDestruction(doc, "user-dm-1", "deputy_manager", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("destruction_approved");
  });

  it("rejects execution from insufficient role", () => {
    const doc = makeDocument({ status: "destruction_approved" });
    const result = executeDestruction(doc, "user-rsw-1", "rsw", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("deputy_manager");
  });
});

// ═══════════════���══════════════════════════════════════════════════════════════
// placeHold / removeHold
// ══════════════════════════════════════════════════════════════════════════════

describe("placeHold", () => {
  it("places hold with deputy_manager role", () => {
    const doc = makeDocument();
    const result = placeHold(doc, "Police investigation ref X123", "user-dm-1", "deputy_manager", FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.status).toBe("hold");
    expect(result.document?.holdReason).toBe("Police investigation ref X123");
    expect(result.document?.holdPlacedBy).toBe("user-dm-1");
  });

  it("rejects hold from insufficient role", () => {
    const doc = makeDocument();
    const result = placeHold(doc, "Reason", "user-rsw-1", "rsw", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("deputy_manager");
  });

  it("rejects hold on destroyed document", () => {
    const doc = makeDocument({ status: "destroyed" });
    const result = placeHold(doc, "Some reason", "user-dm-1", "deputy_manager", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("destroyed");
  });

  it("requires hold reason", () => {
    const doc = makeDocument();
    const result = placeHold(doc, "", "user-dm-1", "deputy_manager", FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("required");
  });
});

describe("removeHold", () => {
  it("removes hold with registered_manager role", () => {
    const doc = makeDocument({ status: "hold", holdReason: "Investigation" });
    const result = removeHold(doc, "user-rm-1", "registered_manager");
    expect(result.success).toBe(true);
    expect(result.document?.status).toBe("archived");
    expect(result.document?.holdReason).toBeUndefined();
  });

  it("rejects removal from deputy_manager (needs RM+)", () => {
    const doc = makeDocument({ status: "hold" });
    const result = removeHold(doc, "user-dm-1", "deputy_manager");
    expect(result.success).toBe(false);
    expect(result.error).toContain("registered_manager");
  });

  it("rejects removal when not on hold", () => {
    const doc = makeDocument({ status: "active" });
    const result = removeHold(doc, "user-rm-1", "registered_manager");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not on hold");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// canAccessDocument
// ═════════════════════════════════════════════════════════════════════��════════

describe("canAccessDocument", () => {
  it("allows RSW access to daily_record", () => {
    const doc = makeDocument();
    const result = canAccessDocument(doc, "rsw");
    expect(result.allowed).toBe(true);
  });

  it("denies RSW access to staff_personnel", () => {
    const doc = makeDocument({ category: "staff_personnel" });
    const result = canAccessDocument(doc, "rsw");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("deputy_manager");
  });

  it("denies access to destroyed document", () => {
    const doc = makeDocument({ status: "destroyed" });
    const result = canAccessDocument(doc, "registered_manager");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("destroyed");
  });

  it("denies non-RM access to restricted documents", () => {
    const doc = makeDocument({ category: "safeguarding", sensitivity: "restricted" });
    const result = canAccessDocument(doc, "team_leader");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("registered_manager");
  });

  it("allows RM access to restricted documents", () => {
    const doc = makeDocument({ category: "safeguarding", sensitivity: "restricted" });
    const result = canAccessDocument(doc, "registered_manager");
    expect(result.allowed).toBe(true);
  });

  it("allows deputy_manager access to staff_personnel", () => {
    const doc = makeDocument({ category: "staff_personnel" });
    const result = canAccessDocument(doc, "deputy_manager");
    expect(result.allowed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// fileDocument
// ══════════════════════════════════════════════════════════════════════════════

describe("fileDocument", () => {
  it("files document successfully", () => {
    const request: FileDocumentRequest = {
      title: "Morning Shift Log — 16 May 2026",
      category: "daily_record",
      homeId: "home-oak",
      filedBy: "user-rsw-1",
      filedByRole: "rsw",
      tags: ["shift-morning", "may-2026"],
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.title).toBe("Morning Shift Log — 16 May 2026");
    expect(result.document?.category).toBe("daily_record");
    expect(result.document?.status).toBe("active");
    expect(result.document?.retentionYears).toBe(15);
    expect(result.document?.version).toBe(1);
  });

  it("rejects filing from insufficient role", () => {
    const request: FileDocumentRequest = {
      title: "Staff Supervision Record",
      category: "staff_personnel",
      homeId: "home-oak",
      filedBy: "user-rsw-1",
      filedByRole: "rsw",
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("deputy_manager");
  });

  it("rejects filing with short title", () => {
    const request: FileDocumentRequest = {
      title: "Hi",
      category: "daily_record",
      homeId: "home-oak",
      filedBy: "user-rsw-1",
      filedByRole: "rsw",
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("3 characters");
  });

  it("uses child DOB for retention calculation", () => {
    const request: FileDocumentRequest = {
      title: "Jordan Care Plan Q2 2026",
      category: "care_plan",
      homeId: "home-oak",
      filedBy: "user-rsw-1",
      filedByRole: "rsw",
      childId: "child-jordan",
      childDob: "2010-06-15T00:00:00Z",
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.retentionExpiresAt).toBe("2085-06-15T00:00:00.000Z");
  });

  it("applies sensitivity from policy", () => {
    const request: FileDocumentRequest = {
      title: "Safeguarding Referral SR-2026-015",
      category: "safeguarding",
      homeId: "home-oak",
      filedBy: "user-tl-1",
      filedByRole: "team_leader",
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.sensitivity).toBe("restricted");
  });

  it("allows sensitivity override", () => {
    const request: FileDocumentRequest = {
      title: "Routine Correspondence",
      category: "correspondence",
      homeId: "home-oak",
      filedBy: "user-rsw-1",
      filedByRole: "rsw",
      sensitivityOverride: "sensitive",
    };
    const result = fileDocument(request, FIXED_NOW);
    expect(result.success).toBe(true);
    expect(result.document?.sensitivity).toBe("sensitive");
  });
});

// ══════════════════════════════════════════════��═══════════════════════════════
// calculateFilingStats
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateFilingStats", () => {
  it("calculates stats for document set", () => {
    const docs = [
      makeDocument({ id: "d-1", category: "daily_record", status: "active" }),
      makeDocument({ id: "d-2", category: "daily_record", status: "archived" }),
      makeDocument({ id: "d-3", category: "safeguarding", status: "active", sensitivity: "restricted" }),
      makeDocument({ id: "d-4", category: "incident", status: "hold", sensitivity: "sensitive" }),
      makeDocument({ id: "d-5", category: "daily_record", status: "pending_destruction" }),
    ];
    const stats = calculateFilingStats(docs, FIXED_NOW);
    expect(stats.totalDocuments).toBe(5);
    expect(stats.byCategory.daily_record).toBe(3);
    expect(stats.byCategory.safeguarding).toBe(1);
    expect(stats.byStatus.active).toBe(2);
    expect(stats.byStatus.hold).toBe(1);
    expect(stats.pendingDestruction).toBe(1);
    expect(stats.onHold).toBe(1);
  });

  it("detects approaching expiry", () => {
    const docs = [
      makeDocument({ id: "d-1", retentionExpiresAt: "2026-06-15T10:00:00Z" }), // ~30 days
      makeDocument({ id: "d-2", retentionExpiresAt: "2041-05-16T10:00:00Z" }), // 15 years
    ];
    const stats = calculateFilingStats(docs, FIXED_NOW);
    expect(stats.approachingExpiry).toBe(1);
  });

  it("calculates compliance rate", () => {
    const docs = [
      makeDocument({ retentionYears: 15 }), // matches policy (15)
      makeDocument({ retentionYears: 15 }), // matches
      makeDocument({ retentionYears: 10 }), // below policy minimum (15 for daily_record)
    ];
    const stats = calculateFilingStats(docs, FIXED_NOW);
    expect(stats.complianceRate).toBe(67); // 2/3 = 66.6... rounds to 67
  });

  it("reports nothing measured for an empty document set", () => {
    const stats = calculateFilingStats([], FIXED_NOW);
    expect(stats.complianceRate).toBeNull();
    expect(stats.totalDocuments).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getCategoryLabel returns labels for all categories", () => {
    expect(getCategoryLabel("child_record")).toBe("Child Record");
    expect(getCategoryLabel("safeguarding")).toBe("Safeguarding");
    expect(getCategoryLabel("staff_personnel")).toBe("Staff Personnel");
    expect(getCategoryLabel("missing_episode")).toBe("Missing Episode");
  });

  it("getSensitivityLabel returns all sensitivity labels", () => {
    expect(getSensitivityLabel("standard")).toBe("Standard");
    expect(getSensitivityLabel("restricted")).toBe("Restricted");
    expect(getSensitivityLabel("highly_sensitive")).toBe("Highly Sensitive");
  });

  it("getRetentionBasisLabel returns all basis labels", () => {
    expect(getRetentionBasisLabel("chr_2015_schedule_3")).toBe("CHR 2015, Schedule 3");
    expect(getRetentionBasisLabel("dpa_2018")).toBe("DPA 2018 / UK-GDPR");
    expect(getRetentionBasisLabel("safeguarding_indefinite")).toBe("Indefinite (Safeguarding)");
  });

  it("getDocumentsApproachingExpiry filters correctly", () => {
    const docs = [
      makeDocument({ id: "d-1", retentionExpiresAt: "2026-06-15T10:00:00Z" }), // ~30 days
      makeDocument({ id: "d-2", retentionExpiresAt: "2041-05-16T10:00:00Z" }), // far future
      makeDocument({ id: "d-3", retentionExpiresAt: "2026-05-10T10:00:00Z" }), // already expired
      makeDocument({ id: "d-4", retentionExpiresAt: "2026-07-01T10:00:00Z", status: "destroyed" }), // destroyed
    ];
    const approaching = getDocumentsApproachingExpiry(docs, 90, FIXED_NOW);
    expect(approaching).toHaveLength(1);
    expect(approaching[0].id).toBe("d-1");
  });

  it("getExpiredDocuments filters correctly", () => {
    const docs = [
      makeDocument({ id: "d-1", retentionExpiresAt: "2026-01-01T00:00:00Z" }), // expired
      makeDocument({ id: "d-2", retentionExpiresAt: "2041-05-16T10:00:00Z" }), // not expired
      makeDocument({ id: "d-3", retentionExpiresAt: "2025-06-01T00:00:00Z", status: "hold" }), // on hold, skip
      makeDocument({ id: "d-4", retentionExpiresAt: "2024-01-01T00:00:00Z", status: "destroyed" }), // destroyed, skip
    ];
    const expired = getExpiredDocuments(docs, FIXED_NOW);
    expect(expired).toHaveLength(1);
    expect(expired[0].id).toBe("d-1");
  });
});
