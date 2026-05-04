import type { NextRequest } from "next/server";

export type LiversWorkflowRole =
  | "registered_manager"
  | "deputy_manager"
  | "team_leader"
  | "residential_care_worker"
  | "responsible_individual"
  | "admin"
  | "super_admin"
  | "unknown";

export type LiversAction =
  | "analysis:create"
  | "analysis:review"
  | "analysis:approve"
  | "analysis:audit_comment"
  | "session:create"
  | "session:patch"
  | "outcome:create";

const ROLE_ALLOW: Record<LiversWorkflowRole, LiversAction[]> = {
  super_admin: [
    "analysis:create",
    "analysis:review",
    "analysis:approve",
    "analysis:audit_comment",
    "session:create",
    "session:patch",
    "outcome:create",
  ],
  registered_manager: [
    "analysis:create",
    "analysis:review",
    "analysis:approve",
    "analysis:audit_comment",
    "session:create",
    "session:patch",
    "outcome:create",
  ],
  admin: [
    "analysis:create",
    "analysis:review",
    "analysis:approve",
    "analysis:audit_comment",
    "session:create",
    "session:patch",
    "outcome:create",
  ],
  deputy_manager: [
    "analysis:create",
    "analysis:review",
    "analysis:audit_comment",
    "session:create",
    "session:patch",
    "outcome:create",
  ],
  team_leader: ["analysis:create", "session:create", "session:patch", "outcome:create"],
  residential_care_worker: ["outcome:create"],
  responsible_individual: ["analysis:audit_comment"],
  unknown: [],
};

export function resolveLiversRole(req: NextRequest, bodyRole?: string): LiversWorkflowRole {
  const headerRole = req.headers.get("x-user-role")?.trim();
  const raw = (bodyRole ?? headerRole ?? "registered_manager").toLowerCase();
  if (raw in ROLE_ALLOW) return raw as LiversWorkflowRole;
  return "unknown";
}

export function canPerformLiversAction(role: LiversWorkflowRole, action: LiversAction): boolean {
  return ROLE_ALLOW[role]?.includes(action) ?? false;
}
