import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

// Phase 1 · Module 3 — staff payroll (MANAGE_FINANCE) + complaints-investigation
// (MANAGE_COMPLAINTS) reuse existing perms. Confirm the confidential gating holds
// and general care staff are excluded (demo default RM keeps access → unchanged).
describe("Phase 1 — Module 3 finance/complaints gating", () => {
  it("the reused perms are held by the right roles (existing matrix)", () => {
    // MANAGE_FINANCE guards staff payroll; MANAGE_COMPLAINTS guards complaint investigations.
    for (const p of [PERMISSIONS.MANAGE_FINANCE, PERMISSIONS.MANAGE_COMPLAINTS]) {
      expect(hasPermission("registered_manager", p)).toBe(true); // demo default → demo unchanged
      expect(hasPermission("super_admin", p)).toBe(true);
    }
    expect(hasPermission("finance_operations", PERMISSIONS.MANAGE_FINANCE)).toBe(true);
    expect(hasPermission("responsible_individual", PERMISSIONS.MANAGE_COMPLAINTS)).toBe(true);
    // NOTE: RI does not hold MANAGE_FINANCE in the current matrix — a role-policy
    // nuance to revisit when the four role vocabularies are reconciled (Module 4).
  });

  it("general care staff cannot reach staff payroll or complaint investigations", () => {
    for (const p of [PERMISSIONS.MANAGE_FINANCE, PERMISSIONS.MANAGE_COMPLAINTS]) {
      expect(hasPermission("residential_care_worker", p)).toBe(false);
      expect(hasPermission("bank_staff", p)).toBe(false);
    }
  });
});
