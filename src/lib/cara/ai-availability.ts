// ══════════════════════════════════════════════════════════════════════════════
// CARA — AI AVAILABILITY (the single source of truth for "may AI run at all?")
//
// Before this module, CARA_AI_ENABLED was read in five places with TWO opposite
// polarities — some sites required ="true" (opt-in), others only disabled on
// ="false" (opt-out). That meant flipping the flag had inconsistent effects.
//
// The canonical semantics are OPT-OUT, matching getCaraConfig().enabled (the
// authoritative config object): AI is available UNLESS CARA_AI_ENABLED is
// explicitly "false". Provider-key presence is a SEPARATE gate (no key → no AI
// regardless), so this flag is purely the operator's emergency kill-switch.
//
// Nothing in Cara should read process.env.CARA_AI_ENABLED directly — use these.
// ══════════════════════════════════════════════════════════════════════════════

import { PERMISSION_RULES } from "@/lib/permissions/role-rules";

/**
 * Is AI globally enabled? True unless CARA_AI_ENABLED is explicitly "false".
 * This is the kill-switch, NOT a key check — see getCaraProviderConfig().configured
 * for whether a provider key is actually present.
 */
export function isAiGloballyEnabled(): boolean {
  return (process.env.CARA_AI_ENABLED ?? "").toLowerCase() !== "false";
}

/** Convenience inverse: the operator has hard-disabled AI (CARA_AI_ENABLED=false). */
export function isAiKillSwitchOn(): boolean {
  return !isAiGloballyEnabled();
}

// ── Role-based AI permission (grounded in the existing RBAC matrix) ────────────
// Rather than invent a separate list, derive the AI-permitted roles from the
// `cara_intelligence` resource rules already defined in role-rules.ts. Roles with
// no `view` rule for cara_intelligence (agency_staff, hr_admin, finance_admin,
// reg44_visitor, external_auditor, ofsted_readonly_export) cannot trigger AI.
// If the matrix changes, this gate follows automatically.
const AI_PERMITTED_ROLES: ReadonlySet<string> = new Set<string>(
  PERMISSION_RULES
    .filter((r) => r.resourceType === "cara_intelligence" && r.actions.includes("view"))
    .flatMap((r) => r.role as string[]),
);

/**
 * May a caller with this role use AI assistance?
 *
 * Demo-safe default: when the role is unknown (identity is not yet threaded
 * through every call site — that adoption is a later phase), permit it, so this
 * never silently disables AI for callers that don't pass a role. Once identity
 * flows, external/read-only/back-office roles are denied per the matrix above.
 */
export function canRoleUseAi(role?: string | null): boolean {
  if (!role) return true;
  return AI_PERMITTED_ROLES.has(role);
}

/** The set of roles permitted to trigger AI (exposed for tests / introspection). */
export function aiPermittedRoles(): string[] {
  return [...AI_PERMITTED_ROLES];
}
