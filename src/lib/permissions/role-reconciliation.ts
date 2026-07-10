// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROLE VOCABULARY RECONCILIATION (Phase 1 · §10)
//
// Cara grew FOUR role vocabularies that never reconciled (audit finding):
//   1. Flat RBAC AppRole (src/lib/permissions.ts) — the ENFORCED, canonical one.
//   2. ABAC Role (src/lib/permissions/types.ts) — the rich (unwired) engine's roles.
//   3. x-user-role header strings (Cara HQ / Ask CARA).
//   4. Ask CARA's 3-tier collapse (everyone / care_team / management).
//
// Enforcement reads the FLAT AppRole, but identities can arrive labelled in any of
// these vocabularies — and `toAppRole` previously mapped every unrecognised string
// to residential_care_worker, so an ABAC "provider_owner" or "hr_admin" was
// silently demoted. This is the single source of truth that maps ANY role string
// to the canonical AppRole (+ a coarse access tier), so a role is never mis-read.
//
// PURE + additive. For strings already in APP_ROLES nothing changes; only the
// previously-unrecognised vocabularies are now mapped correctly.
// ══════════════════════════════════════════════════════════════════════════════

import { APP_ROLES, type AppRole } from "@/lib/permissions";

/** Non-AppRole role strings (ABAC Role, x-user-role variants, common aliases)
 *  → canonical AppRole. Keys are normalised (lower_snake_case). */
const ROLE_ALIASES: Record<string, AppRole> = {
  // ── ABAC Role (permissions/types.ts) ─────────────────────────────────────────
  provider_owner: "organisation_director",
  operations_manager: "registered_manager",
  senior_rsw: "residential_care_worker",
  rsw: "residential_care_worker",
  waking_night: "residential_care_worker",
  agency_staff: "bank_staff",
  hr_admin: "hr_recruitment",
  finance_admin: "finance_operations",
  reg44_visitor: "auditor",
  external_auditor: "auditor",
  ofsted_readonly_export: "auditor",
  // ── x-user-role / display variants seen across the app ───────────────────────
  platform_admin: "super_admin",
  org_director: "organisation_director",
  area_manager: "registered_manager",
  manager: "registered_manager",
  deputy: "deputy_manager",
  senior_residential_care_worker: "residential_care_worker",
  senior_residential_worker: "residential_care_worker",
  support_worker: "residential_care_worker",
  waking_night_worker: "residential_care_worker",
  care_worker: "residential_care_worker",
  residential_worker: "residential_care_worker",
  key_worker: "residential_care_worker",
  bank_worker: "bank_staff",
  social_worker: "external_partner",
  external_professional: "external_partner",
  external_visitor: "auditor",
  independent_visitor: "auditor",
  provider: "organisation_director",
  director: "organisation_director",
  hr: "hr_recruitment",
  finance: "finance_operations",
};

/** Normalise any role string from any vocabulary to the canonical AppRole. */
export function toCanonicalRole(role: string | null | undefined): AppRole {
  if (!role) return "residential_care_worker"; // safe least-privilege default
  const r = role.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((APP_ROLES as readonly string[]).includes(r)) return r as AppRole;
  return ROLE_ALIASES[r] ?? "residential_care_worker";
}

export type RoleAccessTier = "everyone" | "care_team" | "management";

// The canonical care-data tier (aligned with Ask CARA's roleTier so it can later
// delegate here). HR/finance/auditor/external/candidate are specialist or
// read-only — general "everyone" tier for CHILD/care data, regardless of the
// (separate) permission grants that let them reach their own domains.
const MANAGEMENT_ROLES: ReadonlySet<AppRole> = new Set<AppRole>([
  "super_admin", "admin", "organisation_director", "responsible_individual",
  "registered_manager", "deputy_manager",
]);
const CARE_TEAM_ROLES: ReadonlySet<AppRole> = new Set<AppRole>([
  ...MANAGEMENT_ROLES, "team_leader", "residential_care_worker", "bank_staff",
]);

/** Coarse care-data access tier for any role string from any vocabulary. */
export function roleAccessTier(role: string | null | undefined): RoleAccessTier {
  const canonical = toCanonicalRole(role);
  if (MANAGEMENT_ROLES.has(canonical)) return "management";
  if (CARE_TEAM_ROLES.has(canonical)) return "care_team";
  return "everyone";
}
