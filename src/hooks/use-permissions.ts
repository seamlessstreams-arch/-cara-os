"use client";

import { useCurrentRole } from "@/hooks/use-auth";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessModule,
  type Permission,
  type AppRole,
} from "@/lib/permissions";

export interface PermissionHelpers {
  /** True if the current role has this single permission */
  can: (permission: Permission) => boolean;
  /** True if the current role has at least one of the listed permissions */
  canAny: (permissions: Permission[]) => boolean;
  /** True if the current role has all of the listed permissions */
  canAll: (permissions: Permission[]) => boolean;
  /** True if the current role can access a named module (sidebar slug) */
  canAccess: (module: string) => boolean;
  /** The resolved AppRole string */
  role: AppRole;
}

export function usePermissions(): PermissionHelpers {
  const role = useCurrentRole();
  return {
    can: (p: Permission) => hasPermission(role, p),
    canAny: (ps: Permission[]) => hasAnyPermission(role, ps),
    canAll: (ps: Permission[]) => hasAllPermissions(role, ps),
    canAccess: (module: string) => canAccessModule(role, module),
    role,
  };
}
