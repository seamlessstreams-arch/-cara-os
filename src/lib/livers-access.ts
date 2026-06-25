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

/**
 * Resolve the caller's LIVERS workflow role.
 *
 * Activated mode (Supabase configured): the role comes from the validated session
 * — the client-supplied body.user_role and X-User-Role header are ignored, and a
 * missing session yields "unknown" (no privileges). Never defaults to manager.
 *
 * Demo mode: the body/header convention, unchanged (defaults to registered_manager).
 */
export async function resolveLiversRole(req: NextRequest, bodyRole?: string): Promise<LiversWorkflowRole> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");

  if (isSupabaseEnabled()) {
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(req);
    } catch {
      session = null;
    }
    if (!session) return "unknown";
    const raw = session.role.toLowerCase();
    return raw in ROLE_ALLOW ? (raw as LiversWorkflowRole) : "unknown";
  }

  // Demo mode: body/header convention.
  const headerRole = req.headers.get("x-user-role")?.trim();
  const raw = (bodyRole ?? headerRole ?? "registered_manager").toLowerCase();
  if (raw in ROLE_ALLOW) return raw as LiversWorkflowRole;
  return "unknown";
}

export function canPerformLiversAction(role: LiversWorkflowRole, action: LiversAction): boolean {
  return ROLE_ALLOW[role]?.includes(action) ?? false;
}
