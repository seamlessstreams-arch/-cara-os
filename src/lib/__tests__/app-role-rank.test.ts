// ══════════════════════════════════════════════════════════════════════════════
// ROLE SENIORITY — one vocabulary, exhaustively ranked, failing closed
//
// Three role vocabularies live in this codebase and only one governs a staff
// record. The Postgres enum system_role constrains staff_members.role to eight
// values, every one an AppRole; ROLE_HIERARCHY in lib/permissions/types.ts
// ranks a DIFFERENT set ("rsw", "provider_owner") used by the ABAC engine and
// never written to that column. Comparing across the two would invent a
// correspondence the data does not have.
//
// These pin the property that matters: every AppRole is ranked, the eight
// values the database can actually hold are among them, and anything
// unrecognised is refused rather than guessed.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  APP_ROLES,
  APP_ROLE_RANK,
  appRoleRank,
  canAssignRole,
  type AppRole,
} from "@/lib/permissions";

/** The live Postgres `system_role` enum, verified against production. */
const SYSTEM_ROLE_ENUM = [
  "registered_manager", "responsible_individual", "deputy_manager", "team_leader",
  "residential_care_worker", "bank_staff", "admin", "super_admin",
] as const;

describe("the rank order is complete", () => {
  it("ranks every AppRole", () => {
    for (const role of APP_ROLES) {
      expect(appRoleRank(role), `${role} is unranked`).not.toBeNull();
    }
  });

  it("ranks nothing that is not an AppRole", () => {
    expect(Object.keys(APP_ROLE_RANK).sort()).toEqual([...APP_ROLES].sort());
  });

  it("covers every value the database column can hold", () => {
    for (const role of SYSTEM_ROLE_ENUM) {
      expect(APP_ROLES).toContain(role as AppRole);
      expect(appRoleRank(role), `${role} is unranked`).not.toBeNull();
    }
  });

  it("does NOT rank the other vocabulary's names — they never reach this column", () => {
    for (const notAnAppRole of ["rsw", "senior_rsw", "provider_owner", "operations_manager", "waking_night"]) {
      expect(appRoleRank(notAnAppRole)).toBeNull();
    }
  });
});

describe("seniority reflects the statutory chain", () => {
  const rank = (r: string) => appRoleRank(r)!;

  it("puts the Responsible Individual above the Registered Manager", () => {
    expect(rank("responsible_individual")).toBeGreaterThan(rank("registered_manager"));
  });

  it("puts the manager above the deputy, and the deputy above the team leader", () => {
    expect(rank("registered_manager")).toBeGreaterThan(rank("deputy_manager"));
    expect(rank("deputy_manager")).toBeGreaterThan(rank("team_leader"));
  });

  it("treats the legacy 'admin' alias as a registered manager, as its comment claims", () => {
    expect(rank("admin")).toBe(rank("registered_manager"));
  });

  it("puts a candidate at the bottom", () => {
    for (const role of APP_ROLES) {
      if (role === "candidate") continue;
      expect(rank(role)).toBeGreaterThan(rank("candidate"));
    }
  });
});

describe("canAssignRole", () => {
  it("THE POINT: a deputy manager cannot mint a super_admin", () => {
    expect(canAssignRole("deputy_manager", "super_admin")).toBe(false);
  });

  it("nor a registered manager, nor a responsible individual", () => {
    expect(canAssignRole("deputy_manager", "registered_manager")).toBe(false);
    expect(canAssignRole("deputy_manager", "responsible_individual")).toBe(false);
  });

  it("allows appointing at your own level", () => {
    expect(canAssignRole("registered_manager", "registered_manager")).toBe(true);
  });

  it("allows appointing below your own level", () => {
    expect(canAssignRole("registered_manager", "deputy_manager")).toBe(true);
    expect(canAssignRole("deputy_manager", "residential_care_worker")).toBe(true);
  });

  it("lets HR onboard care staff but not appoint managers", () => {
    expect(canAssignRole("hr_recruitment", "residential_care_worker")).toBe(true);
    expect(canAssignRole("hr_recruitment", "team_leader")).toBe(true);
    expect(canAssignRole("hr_recruitment", "deputy_manager")).toBe(false);
    expect(canAssignRole("hr_recruitment", "super_admin")).toBe(false);
  });

  it("no role may appoint above itself — checked across every pair", () => {
    for (const actor of APP_ROLES) {
      for (const target of APP_ROLES) {
        const allowed = canAssignRole(actor, target);
        expect(allowed, `${actor} → ${target}`).toBe(APP_ROLE_RANK[target] <= APP_ROLE_RANK[actor]);
      }
    }
  });

  it("fails closed on an unrecognised actor", () => {
    expect(canAssignRole("not_a_role", "residential_care_worker")).toBe(false);
  });

  it("fails closed on an unrecognised target", () => {
    expect(canAssignRole("super_admin", "not_a_role")).toBe(false);
    // Including the other vocabulary's spellings, which are not this column's.
    expect(canAssignRole("super_admin", "rsw")).toBe(false);
  });

  it("is not fooled by inherited object properties", () => {
    expect(canAssignRole("super_admin", "constructor")).toBe(false);
    expect(canAssignRole("super_admin", "toString")).toBe(false);
  });
});
