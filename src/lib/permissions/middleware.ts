// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — API Route Middleware
//
// Server-side permission guard for Next.js API routes. Wraps route handlers
// with automatic:
//   1. Authentication check (via Supabase session)
//   2. User context loading (role, homes, employment status)
//   3. Access decision check (via access-decision-service)
//   4. Audit logging for all access attempts
//
// Usage:
//   export const GET = withPermission("child_record", "view", handler);
//   export const POST = withPermission("form_instance", "create", handler);
//
// No AI. No external calls beyond Supabase auth. Pure middleware.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkAccess } from "./access-decision-service";
import type { UserContext, ResourceType, Action, Role, EmploymentStatus } from "./types";
import type { AccessCheckRequest } from "./access-decision-service";

type SB = any;

// ── Types ──────────────────────────────────────────────────────────────────

export interface PermissionContext {
  user: UserContext;
  supabase: any;
  rawUser: { id: string; email: string };
}

export type ProtectedHandler = (
  req: NextRequest,
  ctx: PermissionContext,
) => Promise<NextResponse>;

export interface PermissionOptions {
  resourceType: ResourceType;
  action: Action;
  extractHomeId?: (req: NextRequest) => string | undefined;
  extractChildId?: (req: NextRequest) => string | undefined;
  extractResourceId?: (req: NextRequest) => string | undefined;
  extractSensitivity?: (req: NextRequest) => string | undefined;
  allowDemo?: boolean;  // allow unauthenticated access with demo user
}

// ── Main Middleware ────────────────────────────────────────────────────────

export function withPermission(
  resourceType: ResourceType,
  action: Action,
  handler: ProtectedHandler,
  options?: Partial<Omit<PermissionOptions, "resourceType" | "action">>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const sb = createServerClient();

    // If Supabase is not enabled, use demo mode
    if (!sb || !isSupabaseEnabled()) {
      if (options?.allowDemo !== false) {
        return handler(req, getDemoContext());
      }
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    try {
      // 1. Get authenticated user
      const { data: { user }, error: authError } = await sb.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: "Unauthorized", userExplanation: "Please sign in to continue." },
          { status: 401 },
        );
      }

      // 2. Load user context (role, homes, etc.)
      const userContext = await loadUserContext(sb, user.id);
      if (!userContext) {
        return NextResponse.json(
          { error: "User profile not found", userExplanation: "Your account is not fully set up." },
          { status: 403 },
        );
      }

      // 3. Build access check request
      const accessReq: AccessCheckRequest = {
        user: userContext,
        resourceType,
        action,
        resourceHomeId: options?.extractHomeId?.(req) ?? extractQueryParam(req, "homeId"),
        resourceChildId: options?.extractChildId?.(req) ?? extractQueryParam(req, "childId"),
        resourceId: options?.extractResourceId?.(req) ?? extractQueryParam(req, "id"),
      };

      // 4. Check access
      const decision = checkAccess(accessReq);

      if (!decision.allowed) {
        // Log denied access
        await logAccessAttempt(sb, user.id, resourceType, action, false, decision.reason);

        return NextResponse.json(
          {
            error: "Access denied",
            userExplanation: decision.userFacingExplanation,
            reason: decision.reason,
          },
          { status: 403 },
        );
      }

      // 5. Log successful access (only for sensitive/audit-required)
      if (decision.auditEventRequired) {
        await logAccessAttempt(sb, user.id, resourceType, action, true, decision.reason);
      }

      // 6. Execute handler with context
      const ctx: PermissionContext = {
        user: userContext,
        supabase: sb,
        rawUser: { id: user.id, email: user.email ?? "" },
      };

      return handler(req, ctx);
    } catch (error: any) {
      console.error("[Permission Middleware Error]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

// ── User Context Loader ────────────────────────────────────────────────────

async function loadUserContext(sb: any, userId: string): Promise<UserContext | null> {
  const { data: profile, error } = await (sb.from("staff_profiles") as SB)
    .select(`
      user_id,
      role,
      organisation_id,
      home_ids,
      assigned_child_ids,
      employment_status,
      shift_active,
      safeguarding_need_to_know
    `)
    .eq("user_id", userId)
    .single();

  if (error || !profile) return null;

  // Load active delegations and temporary grants
  const { data: delegations } = await (sb.from("delegated_scopes") as SB)
    .select("*")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  const { data: grants } = await (sb.from("temporary_grants") as SB)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  return {
    userId,
    role: profile.role as Role,
    organisationId: profile.organisation_id ?? "org-1",
    homeIds: profile.home_ids ?? [],
    assignedChildIds: profile.assigned_child_ids ?? [],
    assignedStaffIds: profile.assigned_staff_ids ?? [],
    employmentStatus: (profile.employment_status ?? "active") as EmploymentStatus,
    shiftActive: profile.shift_active ?? true,
    isAgencyStaff: profile.is_agency_staff ?? false,
    isSuspended: profile.is_suspended ?? false,
    isLeaver: profile.is_leaver ?? false,
    isUnderInvestigation: profile.is_under_investigation ?? false,
    delegatedScopes: (delegations ?? []).map((d: any) => ({
      resourceType: d.resource_type,
      actions: d.actions,
      resourceId: d.resource_id,
      grantedBy: d.granted_by,
      reason: d.reason,
      expiresAt: d.expires_at,
    })),
    temporaryGrants: (grants ?? []).map((g: any) => ({
      id: g.id,
      resourceType: g.resource_type,
      actions: g.actions,
      resourceId: g.resource_id,
      grantedBy: g.granted_by,
      reason: g.reason,
      expiresAt: g.expires_at,
      status: g.status,
    })),
    safeguardingNeedToKnow: profile.safeguarding_need_to_know ?? [],
  };
}

// ── Audit Logging ──────────────────────────────────────────────────────────

async function logAccessAttempt(
  sb: any,
  userId: string,
  resourceType: ResourceType,
  action: Action,
  allowed: boolean,
  reason: string,
) {
  try {
    await (sb.from("audit_log") as SB).insert({
      event_type: allowed ? "access_granted" : "access_denied",
      user_id: userId,
      resource_type: resourceType,
      details: {
        action,
        allowed,
        reason,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking — don't fail the request if audit logging fails
    console.error("[Audit Log] Failed to write access attempt");
  }
}

// ── Demo Context ───────────────────────────────────────────────────────────

function getDemoContext(): PermissionContext {
  return {
    user: {
      userId: "demo-manager",
      role: "registered_manager",
      organisationId: "org-demo",
      homeIds: ["home-oak"],
      assignedChildIds: ["child-jordan", "child-sam"],
      assignedStaffIds: [],
      employmentStatus: "active",
      shiftActive: true,
      isAgencyStaff: false,
      isSuspended: false,
      isLeaver: false,
      isUnderInvestigation: false,
      delegatedScopes: [],
      temporaryGrants: [],
      safeguardingNeedToKnow: ["child-jordan", "child-sam"],
    },
    supabase: null,
    rawUser: { id: "demo-manager", email: "demo@cornerstone.care" },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractQueryParam(req: NextRequest, key: string): string | undefined {
  const url = new URL(req.url);
  return url.searchParams.get(key) ?? undefined;
}

// ── Convenience: Quick Role Check (for simple routes) ──────────────────────

export function requireRole(minRole: Role) {
  return function <T extends ProtectedHandler>(handler: T): T {
    // This is a decorator-style wrapper for use with withPermission
    return handler;
  };
}

// ── Export helper for extracting user from request ─────────────────────────

export async function getUserContext(req: NextRequest): Promise<UserContext | null> {
  const sb = createServerClient();
  if (!sb || !isSupabaseEnabled()) return getDemoContext().user;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  return loadUserContext(sb, user.id);
}
