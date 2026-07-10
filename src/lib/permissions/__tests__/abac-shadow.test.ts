import { describe, it, expect } from "vitest";
import { toAbacRole } from "../role-reconciliation";
import { evaluateSensitiveAbac, entityToResourceType } from "../abac-shadow";

// Phase 1 · Module 5 — the rich ABAC engine (access-decision-service) had ZERO
// callers. These prove it now runs for the confidential resources (advisory).
describe("Phase 1 · Module 5 — ABAC engine wiring", () => {
  it("maps AppRole → the ABAC Role vocabulary", () => {
    expect(toAbacRole("registered_manager")).toBe("registered_manager");
    expect(toAbacRole("organisation_director")).toBe("provider_owner");
    expect(toAbacRole("residential_care_worker")).toBe("rsw");
    expect(toAbacRole("hr_recruitment")).toBe("hr_admin");
    expect(toAbacRole("finance_operations")).toBe("finance_admin");
    expect(toAbacRole("super_admin")).toBe("super_admin");
  });

  it("maps confidential entity types → ABAC resource types", () => {
    expect(entityToResourceType("allegation")).toBe("hr_file");
    expect(entityToResourceType("staff_disciplinary")).toBe("hr_file");
    expect(entityToResourceType("staff_payroll")).toBe("hr_file");
    expect(entityToResourceType("complaint_investigation")).toBe("complaint");
  });

  it("the (previously dead) engine now returns a well-formed decision", () => {
    for (const appRole of ["registered_manager", "residential_care_worker", "hr_recruitment"] as const) {
      const r = evaluateSensitiveAbac({ userId: "u", appRole, entityType: "allegation", action: "view" });
      expect(typeof r.allowed).toBe("boolean");
      expect(typeof r.reason).toBe("string");
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });

  it("super_admin is allowed and confidential hr_file access is audited-on-view", () => {
    const sa = evaluateSensitiveAbac({ userId: "u", appRole: "super_admin", entityType: "allegation", action: "view" });
    expect(sa.allowed).toBe(true);
    expect(sa.auditEventRequired).toBe(true); // hr_file ∈ the engine's AUDIT_ON_ACCESS set
  });
});
