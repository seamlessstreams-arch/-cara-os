import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — INTELLIGENCE PERMISSIONS UNIT TESTS
//
// Tests for hasIntelligencePermission RBAC gating and the
// CARA_INTELLIGENCE_PERMISSIONS constant.
// ══════════════════════════════════════════════════════════════════════════════

import {
  hasIntelligencePermission,
  CARA_INTELLIGENCE_PERMISSIONS,
} from "../intelligence-permissions";

describe("CARA_INTELLIGENCE_PERMISSIONS", () => {
  it("defines all expected permission keys", () => {
    const keys = Object.keys(CARA_INTELLIGENCE_PERMISSIONS);
    expect(keys).toContain("askCara");
    expect(keys).toContain("viewEvidence");
    expect(keys).toContain("approveAiDraft");
    expect(keys).toContain("commitSuggestedUpdates");
    expect(keys).toContain("viewOfstedReadiness");
    expect(keys).toContain("runMockInspection");
    expect(keys).toContain("viewStaffSignals");
    expect(keys).toContain("manageAiGovernance");
  });

  it("has exactly 8 permission keys", () => {
    expect(Object.keys(CARA_INTELLIGENCE_PERMISSIONS)).toHaveLength(8);
  });
});

describe("hasIntelligencePermission", () => {
  // --- RSW role ---

  it("allows RSW to askCara", () => {
    expect(hasIntelligencePermission("rsw", "askCara")).toBe(true);
  });

  it("denies RSW from viewEvidence", () => {
    expect(hasIntelligencePermission("rsw", "viewEvidence")).toBe(false);
  });

  it("denies RSW from approveAiDraft", () => {
    expect(hasIntelligencePermission("rsw", "approveAiDraft")).toBe(false);
  });

  it("denies RSW from manageAiGovernance", () => {
    expect(hasIntelligencePermission("rsw", "manageAiGovernance")).toBe(false);
  });

  // --- Senior role ---

  it("allows senior to askCara", () => {
    expect(hasIntelligencePermission("senior", "askCara")).toBe(true);
  });

  it("allows senior to viewEvidence", () => {
    expect(hasIntelligencePermission("senior", "viewEvidence")).toBe(true);
  });

  it("allows senior to runMockInspection", () => {
    expect(hasIntelligencePermission("senior", "runMockInspection")).toBe(true);
  });

  it("denies senior from approveAiDraft", () => {
    expect(hasIntelligencePermission("senior", "approveAiDraft")).toBe(false);
  });

  it("denies senior from commitSuggestedUpdates", () => {
    expect(hasIntelligencePermission("senior", "commitSuggestedUpdates")).toBe(false);
  });

  // --- Deputy manager role ---

  it("allows deputy_manager to approveAiDraft", () => {
    expect(hasIntelligencePermission("deputy_manager", "approveAiDraft")).toBe(true);
  });

  it("allows deputy_manager to viewOfstedReadiness", () => {
    expect(hasIntelligencePermission("deputy_manager", "viewOfstedReadiness")).toBe(true);
  });

  it("denies deputy_manager from commitSuggestedUpdates", () => {
    expect(hasIntelligencePermission("deputy_manager", "commitSuggestedUpdates")).toBe(false);
  });

  // --- Registered manager role ---

  it("allows registered_manager to askCara", () => {
    expect(hasIntelligencePermission("registered_manager", "askCara")).toBe(true);
  });

  it("allows registered_manager to commitSuggestedUpdates", () => {
    expect(hasIntelligencePermission("registered_manager", "commitSuggestedUpdates")).toBe(true);
  });

  it("allows registered_manager to viewStaffSignals", () => {
    expect(hasIntelligencePermission("registered_manager", "viewStaffSignals")).toBe(true);
  });

  it("denies registered_manager from manageAiGovernance", () => {
    expect(hasIntelligencePermission("registered_manager", "manageAiGovernance")).toBe(false);
  });

  // --- Director role (full access) ---

  it("allows director to askCara", () => {
    expect(hasIntelligencePermission("director", "askCara")).toBe(true);
  });

  it("allows director to approveAiDraft", () => {
    expect(hasIntelligencePermission("director", "approveAiDraft")).toBe(true);
  });

  it("allows director to commitSuggestedUpdates", () => {
    expect(hasIntelligencePermission("director", "commitSuggestedUpdates")).toBe(true);
  });

  it("allows director to manageAiGovernance", () => {
    expect(hasIntelligencePermission("director", "manageAiGovernance")).toBe(true);
  });

  it("allows director for every permission", () => {
    const allPermissions = Object.keys(CARA_INTELLIGENCE_PERMISSIONS) as Array<
      keyof typeof CARA_INTELLIGENCE_PERMISSIONS
    >;
    for (const perm of allPermissions) {
      expect(hasIntelligencePermission("director", perm)).toBe(true);
    }
  });

  // --- Unknown and edge-case roles ---

  it("returns false for an unknown role", () => {
    expect(hasIntelligencePermission("visitor", "askCara")).toBe(false);
  });

  it("returns false for an empty string role", () => {
    expect(hasIntelligencePermission("", "askCara")).toBe(false);
  });

  it("returns false for unknown role across all permissions", () => {
    const allPermissions = Object.keys(CARA_INTELLIGENCE_PERMISSIONS) as Array<
      keyof typeof CARA_INTELLIGENCE_PERMISSIONS
    >;
    for (const perm of allPermissions) {
      expect(hasIntelligencePermission("intern", perm)).toBe(false);
    }
  });

  // --- system_admin role ---

  it("allows system_admin to manageAiGovernance", () => {
    expect(hasIntelligencePermission("system_admin", "manageAiGovernance")).toBe(true);
  });

  it("denies system_admin from askCara", () => {
    expect(hasIntelligencePermission("system_admin", "askCara")).toBe(false);
  });
});
