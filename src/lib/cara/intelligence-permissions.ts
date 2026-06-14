// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — RBAC PERMISSIONS
//
// Permission gates for the intelligence layer. These should be integrated
// with Cara's existing RBAC system.
// ══════════════════════════════════════════════════════════════════════════════

export const CARA_INTELLIGENCE_PERMISSIONS = {
  askCara: ["rsw", "senior", "deputy_manager", "registered_manager", "ri", "operations", "director"],
  viewEvidence: ["senior", "deputy_manager", "registered_manager", "ri", "operations", "director"],
  approveAiDraft: ["deputy_manager", "registered_manager", "ri", "operations", "director"],
  commitSuggestedUpdates: ["registered_manager", "ri", "operations", "director"],
  viewOfstedReadiness: ["deputy_manager", "registered_manager", "ri", "operations", "director"],
  runMockInspection: ["senior", "deputy_manager", "registered_manager", "ri", "operations", "director"],
  viewStaffSignals: ["registered_manager", "ri", "operations", "director"],
  manageAiGovernance: ["ri", "operations", "director", "system_admin"],
} as const;

export type CaraIntelligencePermission = keyof typeof CARA_INTELLIGENCE_PERMISSIONS;

/**
 * Check if a user role has access to a specific intelligence feature.
 */
export function hasIntelligencePermission(
  userRole: string,
  permission: CaraIntelligencePermission,
): boolean {
  const allowedRoles = CARA_INTELLIGENCE_PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(userRole);
}
