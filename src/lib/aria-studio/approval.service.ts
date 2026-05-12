// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — APPROVAL WORKFLOW SERVICE
// draft → in_review → approved → committed (or rejected / changes_requested)
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { writeStudioAuditLog } from "./audit.service";
import type { AriaStudioReviewStatus } from "@/types/aria-studio";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any {
  const client = createServerClient();
  if (!client) throw new Error("Supabase not available — approval workflow requires database.");
  return client;
}

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function submitForReview(artifactId: string, submittedBy: string): Promise<void> {
  const client = sb();
  const now = new Date().toISOString();

  await client.from("aria_studio_artifacts").update({
    status: "in_review",
    submitted_for_review_at: now,
  }).eq("id", artifactId);

  await writeStudioAuditLog({
    home_id: homeId(), actor_id: submittedBy, action_type: "artifact_submitted",
    artifact_id: artifactId,
  });
}

export async function reviewArtifact(
  artifactId: string, reviewerId: string,
  decision: AriaStudioReviewStatus, comment?: string,
): Promise<void> {
  const client = sb();
  const now = new Date().toISOString();

  // Create review record
  await client.from("aria_studio_artifact_reviews").insert({
    artifact_id: artifactId,
    reviewer_id: reviewerId,
    review_status: decision,
    review_comment: comment ?? null,
    requested_changes: decision === "changes_requested" ? comment : null,
  });

  // Update artifact status
  const statusMap: Record<AriaStudioReviewStatus, string> = {
    approved: "approved",
    rejected: "rejected",
    changes_requested: "changes_requested",
  };

  const updates: Record<string, unknown> = {
    status: statusMap[decision],
    reviewed_by: reviewerId,
    reviewed_at: now,
  };

  if (decision === "approved") updates.approved_by = reviewerId;
  if (decision === "approved") updates.approved_at = now;
  if (decision === "rejected") updates.rejected_by = reviewerId;
  if (decision === "rejected") updates.rejected_at = now;

  await client.from("aria_studio_artifacts").update(updates).eq("id", artifactId);

  await writeStudioAuditLog({
    home_id: homeId(), actor_id: reviewerId,
    action_type: decision === "approved" ? "artifact_approved" : decision === "rejected" ? "artifact_rejected" : "changes_requested",
    artifact_id: artifactId,
  });
}

export async function approveArtifact(artifactId: string, approvedBy: string): Promise<void> {
  return reviewArtifact(artifactId, approvedBy, "approved");
}

export async function commitArtifact(artifactId: string, committedBy: string): Promise<void> {
  const client = sb();
  const now = new Date().toISOString();

  // Save current version before commit
  const { data: artifact } = await client.from("aria_studio_artifacts")
    .select("*").eq("id", artifactId).single();

  if (artifact) {
    await client.from("aria_studio_artifact_versions").insert({
      artifact_id: artifactId,
      version_number: artifact.version_number,
      title: artifact.title,
      content: artifact.generated_content,
      structured_content: artifact.structured_content,
      change_summary: "Committed to official record",
      changed_by: committedBy,
    });
  }

  await client.from("aria_studio_artifacts").update({
    status: "committed",
    committed_by: committedBy,
    committed_at: now,
  }).eq("id", artifactId);

  await writeStudioAuditLog({
    home_id: homeId(), actor_id: committedBy, action_type: "artifact_committed",
    artifact_id: artifactId,
  });
}

export async function rejectArtifact(artifactId: string, rejectedBy: string, reason: string): Promise<void> {
  return reviewArtifact(artifactId, rejectedBy, "rejected", reason);
}
