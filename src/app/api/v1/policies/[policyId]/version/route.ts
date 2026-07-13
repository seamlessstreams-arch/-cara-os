// CARA — POST /api/v1/policies/[policyId]/version (Doc-Version-Workflow · M3)
//
// Policies adopt the versioning spine — the FIRST consumer. Also closes a real
// gap: /policies had no dedicated write path at all (only the generic catch-all,
// which spreads whatever body arrives with no history — an update overwrote).
//
// Semantics (flag doc_versioning_write ON):
//   1. BACKFILL — if this policy has no spine rows yet, first record its
//      CURRENT state (existing version label, full JSON snapshot) so the
//      pre-change text is never lost when versioning begins.
//   2. RECORD — plan + apply the new version (append-only, supersedes exactly
//      the backfilled/current row), snapshotting the UPDATED policy.
//   3. UPDATE the living policy row: version label, last_reviewed, optional
//      next_review_date/description — through db.homePolicies.update.
// Flag OFF → no-op {enabled:false}; the policy is untouched (dark discipline).
// Gated MANAGE_DOCUMENTS. Human-initiated only — nothing versions automatically.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { planNewVersion } from "@/lib/doc-versioning/doc-versioning-engine";

export const dynamic = "force-dynamic";

const DOC_TYPE = "home_policy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ policyId: string }> },
) {
  const { policyId } = await params;

  if (!isFeatureEnabled("doc_versioning_write")) {
    return NextResponse.json({
      data: { enabled: false, recorded: false, reason: "doc_versioning_write is disabled" },
    });
  }
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_DOCUMENTS);
  if (auth instanceof NextResponse) return auth;

  const policy = db.homePolicies.getAll().find((p) => p.id === policyId);
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.data ?? {}) as {
    change_summary?: string;
    version_label?: string | null;
    next_review_date?: string | null;
    description?: string | null;
  };

  const now = new Date().toISOString();

  // 1) Backfill the pre-change state on first adoption.
  let existing = db.documentVersions.findByDoc(DOC_TYPE, policyId);
  if (existing.length === 0) {
    const backfill = planNewVersion([], {
      doc_type: DOC_TYPE,
      doc_id: policyId,
      version_label: policy.version || "1.0",
      content_snapshot: JSON.stringify(policy),
      change_summary: "State before versioned updates began (backfilled on adoption)",
      changed_by: auth.userId,
      nowIso: now,
    });
    if (backfill.ok) {
      db.documentVersions.create(backfill.record);
      existing = db.documentVersions.findByDoc(DOC_TYPE, policyId);
    }
  }

  // 3) is computed first so the snapshot in 2) is of the UPDATED policy.
  const updates: Record<string, unknown> = { last_reviewed: now.slice(0, 10) };
  if (body.next_review_date) updates.next_review_date = String(body.next_review_date).slice(0, 10);
  if (typeof body.description === "string" && body.description.trim()) updates.description = body.description.trim();

  // 2) Plan the new version against the (possibly just-backfilled) chain.
  const plan = planNewVersion(existing, {
    doc_type: DOC_TYPE,
    doc_id: policyId,
    version_label: body.version_label ?? null,
    content_snapshot: JSON.stringify({ ...policy, ...updates }),
    change_summary: String(body.change_summary ?? ""),
    changed_by: auth.userId,
    nowIso: now,
  });
  if (!plan.ok) {
    return NextResponse.json({ error: "Version refused", blockers: plan.errors }, { status: 422 });
  }

  db.documentVersions.supersede(plan.supersede_ids);
  const version = db.documentVersions.create(plan.record);
  const updated = db.homePolicies.update(policyId, { ...updates, version: version.version_label });

  return NextResponse.json(
    { data: { enabled: true, recorded: true, version, policy: updated } },
    { status: 201 },
  );
}
