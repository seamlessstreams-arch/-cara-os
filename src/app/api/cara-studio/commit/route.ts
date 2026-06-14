// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/commit — Commit Approved Content to Target Record
//
// CRITICAL: NEVER automatically overwrites statutory records.
// Creates a link between the approved generation and its target record.
// The actual writing to the target is done via a separate, explicit action.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { commitRequestSchema } from "@/lib/cara-studio/schemas";
import { getUserIdFromRequest, getUserRoleFromRequest } from "@/lib/auth-guard";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeStudioAuditLog } from "@/lib/cara-studio/audit.service";

type SB = any;

// Roles permitted to commit content to records
const COMMIT_ROLES = [
  "registered_manager",
  "deputy_manager",
  "senior_practitioner",
  "team_leader",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = getUserIdFromRequest(req);
    const role = getUserRoleFromRequest(req);
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";

    // ── Validate input ──────────────────────────────────────────────────────
    const parsed = commitRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { generationId, targetType, targetId } = parsed.data;

    // ── Check role permissions ───────────────────────────────────────────────
    if (!COMMIT_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only managers and senior practitioners can commit content to records." },
        { status: 403 },
      );
    }

    // ── Fetch generation record ─────────────────────────────────────────────
    const sb = createServerClient();
    if (!sb || !isSupabaseEnabled()) {
      // Demo mode
      return NextResponse.json({
        success: true,
        generationId,
        targetType,
        targetId: targetId ?? null,
        status: "committed",
        message: "Content committed to record (demo mode)",
      });
    }

    const { data: generation, error: fetchError } = await (sb.from("cara_studio_generations") as SB)
      .select("id, status, generation_type, output_json, approved_by")
      .eq("id", generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 },
      );
    }

    // ── Must be approved before committing ──────────────────────────────────
    if (generation.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot commit content with status "${generation.status}". Content must be approved first.` },
        { status: 409 },
      );
    }

    // ── Create commit link ──────────────────────────────────────────────────
    const now = new Date().toISOString();

    const { data: commitLink, error: linkError } = await (sb.from("cara_studio_commit_links") as SB)
      .insert({
        organisation_id: process.env.SUPABASE_ORG_ID ?? "org_default",
        home_id: homeId,
        generation_id: generationId,
        target_type: targetType,
        target_id: targetId ?? null,
        committed_by: userId,
        committed_at: now,
      })
      .select("id")
      .single();

    if (linkError) {
      console.error("[cara-studio/commit] Commit link insert failed:", linkError);
      return NextResponse.json(
        { error: "Failed to create commit link" },
        { status: 500 },
      );
    }

    // ── Update generation status to committed ───────────────────────────────
    await (sb.from("cara_studio_generations") as SB)
      .update({
        status: "committed",
        committed_by: userId,
        committed_at: now,
        updated_at: now,
      })
      .eq("id", generationId);

    // ── Audit trail ─────────────────────────────────────────────────────────
    await writeStudioAuditLog({
      home_id: homeId,
      actor_id: userId,
      action_type: "artifact_committed",
      artifact_id: generationId,
      request_metadata: {
        targetType,
        targetId: targetId ?? null,
        commitLinkId: commitLink?.id,
        role,
      },
    });

    return NextResponse.json({
      success: true,
      generationId,
      commitLinkId: commitLink?.id,
      targetType,
      targetId: targetId ?? null,
      status: "committed",
      message: "Content committed to record successfully. This does NOT overwrite existing statutory records — it creates a linked draft for professional review.",
    });
  } catch (err) {
    console.error("[cara-studio/commit] Error:", err);
    return NextResponse.json(
      { error: "Commit action failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
