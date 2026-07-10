import { describe, it, expect } from "vitest";
import { APP_ROLES } from "@/lib/permissions";
import { toCanonicalRole, roleAccessTier } from "../role-reconciliation";

// The 16 ABAC roles (permissions/types.ts) — must each map to a valid AppRole.
const ABAC_ROLES = [
  "super_admin", "provider_owner", "responsible_individual", "operations_manager",
  "registered_manager", "deputy_manager", "team_leader", "senior_rsw", "rsw",
  "waking_night", "agency_staff", "hr_admin", "finance_admin", "reg44_visitor",
  "external_auditor", "ofsted_readonly_export",
];

describe("Phase 1 · Module 4 — role vocabulary reconciliation", () => {
  it("passes AppRole strings through unchanged", () => {
    for (const r of APP_ROLES) expect(toCanonicalRole(r)).toBe(r);
  });

  it("maps every ABAC role to a valid canonical AppRole (totality)", () => {
    for (const r of ABAC_ROLES) {
      const canonical = toCanonicalRole(r);
      expect((APP_ROLES as readonly string[]).includes(canonical)).toBe(true);
    }
  });

  it("maps the key ABAC/variant roles correctly (no silent care-worker demotion)", () => {
    expect(toCanonicalRole("provider_owner")).toBe("organisation_director");
    expect(toCanonicalRole("operations_manager")).toBe("registered_manager");
    expect(toCanonicalRole("rsw")).toBe("residential_care_worker");
    expect(toCanonicalRole("hr_admin")).toBe("hr_recruitment");
    expect(toCanonicalRole("finance_admin")).toBe("finance_operations");
    expect(toCanonicalRole("agency_staff")).toBe("bank_staff");
    expect(toCanonicalRole("reg44_visitor")).toBe("auditor");
    expect(toCanonicalRole("platform_admin")).toBe("super_admin");
  });

  it("normalises case / spaces / hyphens", () => {
    expect(toCanonicalRole("Registered Manager")).toBe("registered_manager");
    expect(toCanonicalRole("provider-owner")).toBe("organisation_director");
    expect(toCanonicalRole("  RSW  ")).toBe("residential_care_worker");
  });

  it("defaults unknown/empty to the least-privileged role", () => {
    expect(toCanonicalRole("wizard")).toBe("residential_care_worker");
    expect(toCanonicalRole("")).toBe("residential_care_worker");
    expect(toCanonicalRole(null)).toBe("residential_care_worker");
    expect(toCanonicalRole(undefined)).toBe("residential_care_worker");
  });

  it("tiers roles from any vocabulary consistently", () => {
    expect(roleAccessTier("registered_manager")).toBe("management");
    expect(roleAccessTier("provider_owner")).toBe("management"); // ABAC → org director
    expect(roleAccessTier("deputy_manager")).toBe("management");
    expect(roleAccessTier("rsw")).toBe("care_team"); // ABAC → care worker
    expect(roleAccessTier("team_leader")).toBe("care_team");
    expect(roleAccessTier("hr_admin")).toBe("everyone"); // specialist, not care-data
    expect(roleAccessTier("reg44_visitor")).toBe("everyone"); // read-only visitor
    expect(roleAccessTier("candidate")).toBe("everyone");
  });
});
