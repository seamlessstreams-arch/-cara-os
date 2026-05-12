// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria-studio/artifacts/[id] — Get, update, workflow, delete
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/auth-guard";
import { submitForReview, approveArtifact, commitArtifact, rejectArtifact, reviewArtifact } from "@/lib/aria-studio/approval.service";
import { writeStudioAuditLog } from "@/lib/aria-studio/audit.service";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sb = createServerClient();
    if (!sb) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artifact, error } = await (sb.from("aria_studio_artifacts") as any)
      .select("*").eq("id", id).single();
    if (error || !artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

    // Fetch related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sources, versions, reviews] = await Promise.all([
      (sb.from("aria_studio_artifact_sources") as any).select("*").eq("artifact_id", id),
      (sb.from("aria_studio_artifact_versions") as any).select("*").eq("artifact_id", id).order("version_number", { ascending: false }),
      (sb.from("aria_studio_artifact_reviews") as any).select("*").eq("artifact_id", id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      data: artifact,
      sources: sources.data ?? [],
      versions: versions.data ?? [],
      reviews: reviews.data ?? [],
    });
  } catch (err) {
    console.error("[aria-studio/artifacts/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to get artifact" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = getUserIdFromRequest(req);
    const sb = createServerClient();

    // Workflow actions
    if (body.action) {
      switch (body.action) {
        case "submit_for_review":
          await submitForReview(id, userId);
          return NextResponse.json({ success: true, status: "in_review" });
        case "approve":
          await approveArtifact(id, userId);
          return NextResponse.json({ success: true, status: "approved" });
        case "commit":
          await commitArtifact(id, userId);
          return NextResponse.json({ success: true, status: "committed" });
        case "reject":
          await rejectArtifact(id, userId, body.reason ?? "");
          return NextResponse.json({ success: true, status: "rejected" });
        case "request_changes":
          await reviewArtifact(id, userId, "changes_requested", body.changes ?? "");
          return NextResponse.json({ success: true, status: "changes_requested" });
        case "archive":
          if (sb) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (sb.from("aria_studio_artifacts") as any).update({
              status: "archived", archived_at: new Date().toISOString(),
            }).eq("id", id);
            await writeStudioAuditLog({ home_id: homeId(), actor_id: userId, action_type: "artifact_archived", artifact_id: id });
          }
          return NextResponse.json({ success: true, status: "archived" });
        default:
          return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
      }
    }

    // Simple content edit
    if (!sb) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const updates: Record<string, unknown> = {};
    if (body.title) updates.title = body.title;
    if (body.content !== undefined) {
      updates.generated_content = body.content;
      updates.plain_text_content = body.content;
    }

    if (Object.keys(updates).length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb.from("aria_studio_artifacts") as any)
        .update(updates).eq("id", id).select("*").single();
      if (error) throw error;

      await writeStudioAuditLog({
        home_id: homeId(), actor_id: userId, action_type: "artifact_edited", artifact_id: id,
      });

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  } catch (err) {
    console.error("[aria-studio/artifacts/[id]] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update artifact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(req);
    const sb = createServerClient();
    if (!sb) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    // Soft delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb.from("aria_studio_artifacts") as any).update({
      status: "deleted_recoverable",
    }).eq("id", id);

    await writeStudioAuditLog({
      home_id: homeId(), actor_id: userId, action_type: "artifact_deleted", artifact_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[aria-studio/artifacts/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete artifact" }, { status: 500 });
  }
}
