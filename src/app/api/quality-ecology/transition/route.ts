// ══════════════════════════════════════��═══════════════════════════════��═══════
// API: /api/quality-ecology/transition — Execute Lifecycle Transition
//
// POST: Attempts to transition an occurrence to a new status.
// Validates role, self-approval, approval level, and reason requirements.
// Returns success/failure with transition metadata or error explanation.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { attemptTransition, getValidTransitions } from "@/lib/quality-ecology";
import type { ScheduledOccurrence, LifecycleStatus } from "@/lib/quality-ecology";
import type { UserContext } from "@/lib/permissions/types";

type SB = any;

interface TransitionRequest {
  occurrenceId: string;
  targetStatus: LifecycleStatus;
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TransitionRequest = await req.json();
    const { occurrenceId, targetStatus, reason } = body;

    if (!occurrenceId || !targetStatus) {
      return NextResponse.json(
        { error: "occurrenceId and targetStatus are required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveTransition(sb, occurrenceId, targetStatus, reason);
    }

    return NextResponse.json(getDemoTransition(occurrenceId, targetStatus, reason));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── GET: Valid transitions for an occurrence ───────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const occurrenceId = url.searchParams.get("occurrenceId");

    if (!occurrenceId) {
      return NextResponse.json(
        { error: "occurrenceId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveValidTransitions(sb, occurrenceId);
    }

    return NextResponse.json(getDemoValidTransitions(occurrenceId));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Handlers ──────────────────────────────────────────────────────────

async function handleLiveTransition(
  sb: any,
  occurrenceId: string,
  targetStatus: LifecycleStatus,
  reason?: string,
) {
  // Get current user context
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's role and context
  const { data: profile } = await (sb.from("staff_profiles") as SB)
    .select("role, home_ids, assigned_child_ids, employment_status, shift_active")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const userContext: UserContext = {
    userId: user.id,
    role: profile.role,
    organisationId: "org-1",
    homeIds: profile.home_ids ?? [],
    assignedChildIds: profile.assigned_child_ids ?? [],
    assignedStaffIds: [],
    employmentStatus: profile.employment_status ?? "active",
    shiftActive: profile.shift_active ?? true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };

  // Get the occurrence
  const { data: occurrence, error: fetchError } = await (sb.from("scheduled_occurrences") as SB)
    .select("*")
    .eq("id", occurrenceId)
    .single();

  if (fetchError || !occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  // Attempt transition
  const now = new Date().toISOString();
  const result = attemptTransition(occurrence, targetStatus, userContext, reason, now);

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: result.error,
      userExplanation: result.userExplanation,
    }, { status: 403 });
  }

  // Apply transition to database
  const updatePayload: Record<string, any> = {
    status: result.newStatus,
    status_history: [...(occurrence.status_history ?? []), result.transition],
  };

  // Set specific fields based on transition target
  if (targetStatus === "in_progress") {
    updatePayload.completed_by = user.id;
  } else if (targetStatus === "submitted" || targetStatus === "resubmitted") {
    updatePayload.submitted_at = now;
    if (targetStatus === "resubmitted") {
      updatePayload.resubmitted_at = now;
      updatePayload.resubmission_count = (occurrence.resubmission_count ?? 0) + 1;
    }
  } else if (targetStatus === "checked") {
    updatePayload.checked_by = user.id;
    updatePayload.checked_at = now;
    updatePayload.check_outcome = "passed";
  } else if (targetStatus === "returned_for_improvement") {
    updatePayload.returned_at = now;
    updatePayload.return_reason = reason;
    updatePayload.returned_by = user.id;
    updatePayload.check_outcome = "returned";
  } else if (targetStatus === "approved") {
    updatePayload.approved_by = user.id;
    updatePayload.approved_at = now;
  } else if (targetStatus === "locked") {
    updatePayload.locked_at = now;
  } else if (targetStatus === "filed") {
    updatePayload.filed_at = now;
  } else if (targetStatus === "escalated") {
    updatePayload.escalated_at = now;
    updatePayload.escalation_level = (occurrence.escalation_level ?? 0) + 1;
    updatePayload.escalation_reason = reason ?? "Auto-escalated due to overdue";
  }

  const { error: updateError } = await (sb.from("scheduled_occurrences") as SB)
    .update(updatePayload)
    .eq("id", occurrenceId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update occurrence" }, { status: 500 });
  }

  // Log audit trail
  await (sb.from("audit_log") as SB).insert({
    event_type: "lifecycle_transition",
    user_id: user.id,
    resource_type: "scheduled_occurrence",
    resource_id: occurrenceId,
    details: {
      from: result.transition?.from,
      to: result.transition?.to,
      reason,
    },
    created_at: now,
  });

  return NextResponse.json({
    success: true,
    newStatus: result.newStatus,
    transition: result.transition,
  });
}

async function handleLiveValidTransitions(sb: any, occurrenceId: string) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await (sb.from("staff_profiles") as SB)
    .select("role, home_ids, assigned_child_ids, employment_status, shift_active")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const userContext: UserContext = {
    userId: user.id,
    role: profile.role,
    organisationId: "org-1",
    homeIds: profile.home_ids ?? [],
    assignedChildIds: profile.assigned_child_ids ?? [],
    assignedStaffIds: [],
    employmentStatus: profile.employment_status ?? "active",
    shiftActive: profile.shift_active ?? true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };

  const { data: occurrence, error } = await (sb.from("scheduled_occurrences") as SB)
    .select("*")
    .eq("id", occurrenceId)
    .single();

  if (error || !occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  const validTransitions = getValidTransitions(occurrence, userContext);

  return NextResponse.json({
    occurrenceId,
    currentStatus: occurrence.status,
    validTransitions,
  });
}

// ── Demo Handlers ──────────────────────────────────────────────────────────

function getDemoTransition(
  occurrenceId: string,
  targetStatus: LifecycleStatus,
  reason?: string,
) {
  const now = new Date().toISOString();

  // Simulate a team_leader user
  const demoUser: UserContext = {
    userId: "demo-user-tl",
    role: "team_leader",
    organisationId: "org-1",
    homeIds: ["home-oak"],
    assignedChildIds: [],
    assignedStaffIds: [],
    employmentStatus: "active",
    shiftActive: true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };

  // Find demo occurrence
  const demoOcc: ScheduledOccurrence = {
    id: occurrenceId,
    templateId: "demo-tpl",
    templateName: "Demo Task",
    homeId: "home-oak",
    dueDate: now.slice(0, 10),
    scheduledAt: now,
    status: "submitted" as LifecycleStatus,
    statusHistory: [],
    completedBy: "staff-sarah",
    approvalLevel: 1,
    resubmissionCount: 0,
    qaRequired: false,
    evidenceTags: [],
    escalationLevel: 0,
    ariaReviewed: false,
  };

  const result = attemptTransition(demoOcc, targetStatus, demoUser, reason, now);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      userExplanation: result.userExplanation,
    };
  }

  return {
    success: true,
    newStatus: result.newStatus,
    transition: result.transition,
  };
}

function getDemoValidTransitions(occurrenceId: string) {
  const demoUser: UserContext = {
    userId: "demo-user-tl",
    role: "team_leader",
    organisationId: "org-1",
    homeIds: ["home-oak"],
    assignedChildIds: [],
    assignedStaffIds: [],
    employmentStatus: "active",
    shiftActive: true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };

  const demoOcc: ScheduledOccurrence = {
    id: occurrenceId,
    templateId: "demo-tpl",
    templateName: "Demo Task",
    homeId: "home-oak",
    dueDate: new Date().toISOString().slice(0, 10),
    scheduledAt: new Date().toISOString(),
    status: "submitted" as LifecycleStatus,
    statusHistory: [],
    completedBy: "staff-sarah",
    approvalLevel: 1,
    resubmissionCount: 0,
    qaRequired: false,
    evidenceTags: [],
    escalationLevel: 0,
    ariaReviewed: false,
  };

  const validTransitions = getValidTransitions(demoOcc, demoUser);

  return {
    occurrenceId,
    currentStatus: demoOcc.status,
    validTransitions,
  };
}
