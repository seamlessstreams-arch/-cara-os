// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/approve — Approve or Reject Generated Content
//
// Only authorised roles (manager, senior_practitioner) can approve.
// Statutory content requires Registered Manager sign-off.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { approvalRequestSchema } from "@/lib/cara-studio/schemas";
import { getUserIdFromRequest, getUserRoleFromRequest } from "@/lib/auth-guard";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeStudioAuditLog } from "@/lib/cara-studio/audit.service";

type SB = any;

// Roles permitted to approve content
const APPROVAL_ROLES = [
  "registered_manager",
  "deputy_manager",
  "senior_practitioner",
  "team_leader",
];

// Statutory types requiring Registered Manager specifically
const STATUTORY_TYPES = [
  "PLACEMENT_PLAN_DRAFT",
  "RISK_ASSESSMENT_DRAFT",
  "CARE_PLAN_DRAFT",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = getUserIdFromRequest(req);
    const role = getUserRoleFromRequest(req);
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";

    // ── Validate input ──────────────────────────────────────────────────────
    const parsed = approvalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { generationId, action, reason } = parsed.data;

    // ── Check role permissions ───────────────────────────────────────────────
    if (!APPROVAL_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and senior practitioners can approve/reject content." },
        { status: 403 },
      );
    }

    // ── Fetch generation record ─────────────────────────────────────────────
    const sb = createServerClient();
    if (!sb || !isSupabaseEnabled()) {
      // Demo mode — return success
      return NextResponse.json({
        success: true,
        generationId,
        action,
        status: action === "approve" ? "approved" : "rejected",
        message: `Content ${action}d successfully (demo mode)`,
      });
    }

    const { data: generation, error: fetchError } = await (sb.from("aria_studio_generations") as SB)
      .select("id, status, generation_type, created_by")
      .eq("id", generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 },
      );
    }

    // ── Validate current status allows approval ─────────────────────────────
    const approvableStatuses = ["draft", "pending_approval"];
    if (!approvableStatuses.includes(generation.status)) {
      return NextResponse.json(
        { error: `Cannot ${action} content with status "${generation.status}". Must be draft or pending_approval.` },
        { status: 409 },
      );
    }

    // ── Self-approval check ─────────────────────────────────────────────────
    if (action === "approve" && generation.created_by === userId) {
      return NextResponse.json(
        { error: "Cannot approve your own generated content. A different authorised user must approve." },
        { status: 403 },
      );
    }

    // ── Statutory content requires Registered Manager ───────────────────────
    if (action === "approve" && STATUTORY_TYPES.includes(generation.generation_type)) {
      if (role !== "registered_manager") {
        return NextResponse.json(
          { error: "Statutory content (placement plans, risk assessments, care plans) requires Registered Manager approval." },
          { status: 403 },
        );
      }
    }

    // ── Update status ───────────────────────────────────────────────────────
    const now = new Date().toISOString();
    const newStatus = action === "approve" ? "approved" : "rejected";

    await (sb.from("aria_studio_generations") as SB)
      .update({
        status: newStatus,
        approved_by: action === "approve" ? userId : null,
        approved_at: action === "approve" ? now : null,
        rejected_reason: action === "reject" ? reason : null,
        updated_at: now,
      })
      .eq("id", generationId);

    // ── Audit trail ─────────────────────────────────────────────────────────
    await writeStudioAuditLog({
      home_id: homeId,
      actor_id: userId,
      action_type: action === "approve" ? "artifact_approved" : "artifact_rejected",
      artifact_id: generationId,
      request_metadata: { action, reason: reason ?? null, role },
    });

    return NextResponse.json({
      success: true,
      generationId,
      action,
      status: newStatus,
      message: `Content ${action}d successfully`,
    });
  } catch (err) {
    console.error("[cara-studio/approve] Error:", err);
    return NextResponse.json(
      { error: "Approval action failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
