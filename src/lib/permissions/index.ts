// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Public API
// ══════════════════════════════════════════════════════════════════════════════

export { checkAccess, canAccess, getAllowedActions } from "./access-decision-service";
export type { AccessCheckRequest } from "./access-decision-service";

export { withPermission, getUserContext } from "./middleware";
export type { PermissionContext, ProtectedHandler, PermissionOptions } from "./middleware";

export {
  getDashboardConfig,
  hasFeature,
  getNavSections,
  getAllWidgets,
  DASHBOARD_CONFIG,
} from "./dashboard-config";
export type {
  DashboardWidget,
  NavSection,
  RoleDashboardConfig,
} from "./dashboard-config";

export {
  ROLE_HIERARCHY,
  isAtLeast,
  MAX_APPROVAL_LEVEL,
  CONTROL_CENTRE_ROLES,
  DASHBOARD_BY_ROLE,
  PERMISSION_RULES,
  BLOCKED_STATUSES,
  RESTRICTED_STATUSES,
  SELF_APPROVAL_BLOCKED_ROLES,
} from "./role-rules";

export type {
  Role,
  EmploymentStatus,
  ResourceType,
  Action,
  Sensitivity,
  ApprovalLevel,
  DashboardType,
  UserContext,
  DelegatedScope,
  TemporaryGrant,
  AccessRequest,
  AccessDecision,
  PermissionRule,
  PermissionCondition,
  BreakGlassEvent,
} from "./types";
