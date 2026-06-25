import { describe, it, expect, afterEach } from "vitest";
import {
  isAiGloballyEnabled,
  isAiKillSwitchOn,
  canRoleUseAi,
  aiPermittedRoles,
} from "../ai-availability";

// ── Global kill-switch — canonical OPT-OUT polarity ─────────────────────────────
// AI is available unless CARA_AI_ENABLED is explicitly "false". Before this module
// the flag was read with two opposite polarities across five sites; these tests
// pin the single agreed meaning so a regression can't silently reintroduce drift.

const ORIGINAL = process.env.CARA_AI_ENABLED;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CARA_AI_ENABLED;
  else process.env.CARA_AI_ENABLED = ORIGINAL;
});

describe("ai-availability — global kill-switch", () => {
  it("is enabled by default when the flag is unset", () => {
    delete process.env.CARA_AI_ENABLED;
    expect(isAiGloballyEnabled()).toBe(true);
    expect(isAiKillSwitchOn()).toBe(false);
  });

  it("is disabled ONLY when explicitly 'false'", () => {
    process.env.CARA_AI_ENABLED = "false";
    expect(isAiGloballyEnabled()).toBe(false);
    expect(isAiKillSwitchOn()).toBe(true);
  });

  it("stays enabled for 'true' and any other non-'false' value", () => {
    process.env.CARA_AI_ENABLED = "true";
    expect(isAiGloballyEnabled()).toBe(true);
    process.env.CARA_AI_ENABLED = "1";
    expect(isAiGloballyEnabled()).toBe(true);
    process.env.CARA_AI_ENABLED = "";
    expect(isAiGloballyEnabled()).toBe(true);
  });

  it("treats the kill value case-insensitively", () => {
    process.env.CARA_AI_ENABLED = "FALSE";
    expect(isAiGloballyEnabled()).toBe(false);
  });
});

// ── Role-based AI permission — grounded in the existing RBAC matrix ──────────────

describe("ai-availability — canRoleUseAi", () => {
  it("permits when the role is unknown (identity not yet threaded → demo-safe)", () => {
    expect(canRoleUseAi(undefined)).toBe(true);
    expect(canRoleUseAi(null)).toBe(true);
    expect(canRoleUseAi("")).toBe(true);
  });

  it("permits care staff and managers (they have cara_intelligence 'view')", () => {
    for (const role of [
      "rsw",
      "senior_rsw",
      "waking_night",
      "team_leader",
      "deputy_manager",
      "registered_manager",
      "responsible_individual",
      "operations_manager",
      "provider_owner",
      "super_admin",
    ]) {
      expect(canRoleUseAi(role)).toBe(true);
    }
  });

  it("denies external / read-only / back-office roles (no cara_intelligence rule)", () => {
    for (const role of [
      "agency_staff",
      "hr_admin",
      "finance_admin",
      "reg44_visitor",
      "external_auditor",
      "ofsted_readonly_export",
    ]) {
      expect(canRoleUseAi(role)).toBe(false);
    }
  });

  it("denies an unrecognised role", () => {
    expect(canRoleUseAi("intruder")).toBe(false);
  });

  it("derives the permitted set from the matrix (not a hardcoded list)", () => {
    const roles = aiPermittedRoles();
    expect(roles).toContain("registered_manager");
    expect(roles).not.toContain("external_auditor");
    expect(roles.length).toBeGreaterThan(0);
  });
});
